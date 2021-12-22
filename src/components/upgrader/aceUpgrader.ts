import { EventEmitter } from 'events';
import cpio from 'cpio-stream';

import IUpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';

import UpgradeStatus, { UpgradeStatusStep } from './upgradeStatus';
import AceUpgraderError from './../../error/AceUpgraderError';
import Logger from './../../utilitis/logger';
import CameraEvents from './../../utilitis/events';
import Ace from './../../components/device/ace';
import * as grpc from '@grpc/grpc-js';
import ErrorCodes from './../../../src/error/errorCodes';
import BufferStream from './../../utilitis/bufferStream';

import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

/**
 * Enum describing the different upgrade steps
 */
export enum UpgradeSteps {
  FLASH = 0,
  REBOOT = 1,
  COMMIT = 2,
}

/**
 * Ace upgrade helper class that implements IDeviceUpgrader.
 */
export default class AceUpgrader extends EventEmitter implements IDeviceUpgrader {
  /**
   * Camera manager instance for Ace
   *
   * @type {IDeviceManager}
   * @memberof AceUpgrader
   */
  _cameraManager: IDeviceManager;

  /**
   * Event emitter object that emits ATTACH & DETACH events for Ace devices on the network
   *
   * @type {EventEmitter}
   * @memberof AceUpgrader
   */
  _sdkDeviceDiscoveryEmitter: EventEmitter;

  /**
   * The upgrader options necessary to perform the firmware upgrade
   *
   * @type {IUpgradeOpts}
   * @memberof AceUpgrader
   */
  options: IUpgradeOpts;

  /**
   * Defines the maximum amount of time (in seconds) that the camera is allowed to use for
   * booting after firmware upgrade.
   *
   * @type {IUpgradeOpts}
   * @memberof AceUpgrader
   */
  bootTimeout: number = 30 * 1000; // 30 seconds

  /**
   * Upgrade status object used to emit upgrade progress throughout the whole upgrade process.
   *
   * @type {UpgradeStatus}
   * @memberof AceUpgrader
   */
  _upgradeStatus: UpgradeStatus;

  /**
   * Helper getter that typecasts the _cameraManager member which is of type IDeviceManager into its
   * concrete implementation Ace
   *
   * @type {Ace}
   * @memberof AceUpgrader
   */
  get aceManager(): Ace {
    if (this._cameraManager instanceof Ace) {
      return <Ace>this._cameraManager;
    }
    throw new Error(
      `Ace upgrader initialized with wrong camera manager! Manager is not instance of Ace but => ${this._cameraManager.constructor.name}`
    );
  }

  /**
   * Creates a new instance of AceUpgrader
   * @param manager An instance of IDeviceManager setup for an Ace network device
   * @param sdkDeviceDiscoveryEmitter Event emitter object that emits ATTACH & DETACH events for Ace devices on the network
   * @param logger Logger instance used to log messages in predefined format
   */
  constructor(manager: IDeviceManager, sdkDeviceDiscoveryEmitter: EventEmitter) {
    super();
    this._cameraManager = manager;
    this._sdkDeviceDiscoveryEmitter = sdkDeviceDiscoveryEmitter;
  }

  /**
   * Method for initializing the upgrade and setting up the proper callbacks and event listeners.
   * @param opts Options required to carry out and facilitate the upgrade process
   */
  init(opts: IUpgradeOpts): void {
    this.options = opts;

    if (opts.bootTimeout) {
      this.bootTimeout = opts.bootTimeout * 1000;
    }

    this.registerHotPlugEvents();
  }

  /**
   * Sets up event listeners for ATTACH & DETACH for when the device under upgrade
   * is rebooted as part of the process itself. This method helps indetify when the
   * booted camera comes up so that the upgrade process can continue to completion.
   */
  registerHotPlugEvents(): void {
    this._sdkDeviceDiscoveryEmitter.on(CameraEvents.ATTACH, async (devManager) => {
      if (devManager && devManager instanceof Ace) {
        const aceDeviceMng: Ace = <Ace>devManager;
        if (aceDeviceMng.equals(this._cameraManager)) {
          this._cameraManager = devManager;
          this.emit('UPGRADE_REBOOT_COMPLETE');
        }
      }
    });

    this._sdkDeviceDiscoveryEmitter.on(CameraEvents.DETACH, async (d) => {
      if (d && this.aceManager.wsdDevice.serialNumber === d.serialNumber) {
        this.aceManager.closeConnection();
        this.emit('UPGRADE_REBOOT');
      }
    });
  }

  /**
   * Helper function for emitting upgrade progress events
   * @param statusString A message accompanying the progress event
   */
  emitProgressStatus(statusString?: string) {
    if (statusString) this._upgradeStatus.statusString = statusString;
    this.emit(CameraEvents.UPGRADE_PROGRESS, this._upgradeStatus.getStatus());
  }

  /**
   * Performs the complete upgrade process synchronously
   */
  async start(): Promise<void> {
    const firstUploadStatusStep = new UpgradeStatusStep('Executing software upgrade', 30);
    const rebootStep = new UpgradeStatusStep('Rebooting camera', 60);
    const verificationStep = new UpgradeStatusStep('Verifying new software', 10);

    this._upgradeStatus = new UpgradeStatus([firstUploadStatusStep, rebootStep, verificationStep]);

    try {
      // Check that camera is running in Normal/Verified state
      await this.verifyVersionState(huddly.VersionState.VERIFIED);

      Logger.debug('Starting Upgrade', AceUpgrader.name);
      this.emitProgressStatus('Starting upgrade');
      this.emit(CameraEvents.UPGRADE_START);

      firstUploadStatusStep.progress = 50;
      this.emitProgressStatus();
      Logger.debug('Flashing firmware ...', AceUpgrader.name);
      await this.flash();
      firstUploadStatusStep.progress = 100;
      Logger.debug('Flash completed!', AceUpgrader.name);

      rebootStep.progress = 1;
      this.emitProgressStatus('Rebooting camera');
      await this.reboot();

      // Start interval for emitting upgrade progress events while camera is booting up
      const rebootUpgradeProgress = setInterval(() => {
        if (rebootStep.progress >= 95) {
          // Last 5% will be completed upon camera coming up after reboot
          clearInterval(rebootUpgradeProgress);
          return;
        }
        rebootStep.progress += 5;
        this.emitProgressStatus();
      }, 1000);

      // Timeout if the camera does not come back up after bootTimeout seconds have passed!
      const bootTimeout = setTimeout(() => {
        clearTimeout(bootTimeout);
        clearInterval(rebootUpgradeProgress);
        this.emit(CameraEvents.TIMEOUT, 'Camera did not come back up after upgrade!');
      }, this.bootTimeout);

      this.once('UPGRADE_REBOOT_COMPLETE', async () => {
        Logger.debug('Camera successfully booted after upgrade', AceUpgrader.name);
        clearInterval(rebootUpgradeProgress);
        try {
          rebootStep.progress = 100;
          this.emitProgressStatus();

          // Check that camera comes up in Unverified state
          await this.verifyVersionState(huddly.VersionState.UNVERIFIED);

          // Check that the camera comes up with expected version
          await this.verifyVersion();

          verificationStep.progress = 50;
          Logger.debug('Verifying new software', AceUpgrader.name);
          this.emitProgressStatus('Verifying new software');
          await this.commit();

          // Check that camera comes up in Committed state
          await this.verifyVersionState(huddly.VersionState.VERIFIED);
          verificationStep.progress = 100;

          Logger.debug('Upgrade Completed', AceUpgrader.name);
          this.emitProgressStatus('Upgrade complete');
          clearTimeout(bootTimeout);
          this.emit(CameraEvents.UPGRADE_COMPLETE, this._cameraManager);
        } catch (e) {
          clearTimeout(bootTimeout);
          // Upgrade fail event is already emitted
        }
      });
    } catch {
      // Exeption handling and error event emitting is done on the individual steps within the try block
      // Ignore errors here
    }
  }

  /**
   * Does a verification of the current version state of the camera. It does a version state fetch
   * and matches that with the one given as parameter.
   * @param expectedState The expected state that the camera should be in.
   * @throws {AceUpgraderError} Device not running in expected state.
   */
  async verifyVersionState(expectedState: number): Promise<void> {
    const currentState: number = await this.getVersionState();
    if (currentState !== expectedState) {
      const currentStateStr: string = Object.keys(huddly.VersionState).find(
        (key) => huddly.VersionState[key] === currentState
      );
      const expectedStateStr: string = Object.keys(huddly.VersionState).find(
        (key) => huddly.VersionState[key] === expectedState
      );
      const errMsg = `Device not running in expected state. Expected ${expectedStateStr} | Got ${currentStateStr}`;
      Logger.error(errMsg, undefined, AceUpgrader.name);
      this.emit(CameraEvents.UPGRADE_FAILED, errMsg);
      throw new AceUpgraderError(errMsg, ErrorCodes.UPGRADE_FAILED);
    }
  }

  /**
   * Helper function for reading the version string from the provided CPIO file
   * and matching that with whatever version the camera is currently running.
   */
  async verifyVersion(): Promise<void> {
    const extract = cpio.extract();
    const currentVersion: string = await this.getVersion();
    const expcetedVersion: string = await new Promise((resolve) => {
      let expcetedVersion: string = 'N/A';
      const readTimeout: NodeJS.Timeout = setTimeout(() => {
        Logger.warn('Unable to read version string from cpio file within 1s time frame', Ace.name);
        resolve('N/A');
      }, 1000);
      extract.on('entry', (header: any, stream: any, cb: any) => {
        stream.on('end', () => {
          cb();
          if (header.name === 'version') {
            extract.emit('finish');
          }
        });
        if (header.name == 'version') {
          stream.on('data', (verionStr: any) => {
            expcetedVersion = verionStr;
          });
        }
        stream.resume();
      });
      extract.on('finish', () => {
        extract.destroy();
        clearTimeout(readTimeout);
        resolve(expcetedVersion);
      });

      new BufferStream(this.options.file).pipe(extract);
    });

    if (currentVersion.toString() != expcetedVersion.toString()) {
      const errMsg: string = `Camera running wrong version! Expected ${expcetedVersion} but got ${currentVersion}`;
      this.emit(CameraEvents.UPGRADE_FAILED, errMsg);
      Logger.error(errMsg, undefined, AceUpgrader.name);
      throw new AceUpgraderError(errMsg, ErrorCodes.UPGRADE_VERSION_MISMATCH);
    }
  }

  /**
   * @ignore
   * @param curretSlot Slot from which the camera has booted
   * @returns Expected slot
   */
  calculateExpectedSlot(curretSlot: string): string {
    if (!['A', 'B', 'C'].includes(curretSlot)) {
      throw new AceUpgraderError(`Unexpected slot: ${curretSlot}`, 1);
    }

    if (['B', 'C'].includes(curretSlot)) {
      return 'A';
    }

    if (curretSlot === 'A') {
      return 'B';
    }
  }

  /**
   * @ignore
   * @param slotBeforeUpgrade Slot from which the camera booted before running upgrade
   */
  async verifySlot(slotBeforeUpgrade: string): Promise<void> {
    const expectedSlot: string = this.calculateExpectedSlot(slotBeforeUpgrade);
    const currentSlot: string = await this.aceManager.getSlot();
    if (expectedSlot !== currentSlot) {
      const errMsg: string = `Camera booted from wrong slot! Expected ${expectedSlot} but got ${currentSlot}`;
      this.emit(CameraEvents.UPGRADE_FAILED, errMsg);
      Logger.error(errMsg, undefined, AceUpgrader.name);
      throw new AceUpgraderError(errMsg, ErrorCodes.UPGRADE_WRONG_BOOT_SLOT);
    }
  }

  /**
   * Helper function that fetches the version state from the device
   * @returns A promise that completes when the version retrieval is successful
   * or rejects if not.
   */
  getVersionState(): Promise<number> {
    return new Promise((resolve) => {
      this.aceManager.grpcClient.getDeviceVersion(
        new Empty(),
        (err: grpc.ServiceError, deviceVersion: huddly.DeviceVersion) => {
          if (err) {
            Logger.error(
              `Unable to get device version state! Error msg: ${err.message}`,
              err.stack,
              AceUpgrader.name
            );
            resolve(undefined);
          }
          resolve(deviceVersion.getVersionState());
        }
      );
    });
  }

  /**
   * Helper function that fetches the firmware version string from the device
   * @returns A promise that completes when the firmware version retrieval is successful
   * or rejects if not.
   */
  getVersion(): Promise<string> {
    return new Promise((resolve) => {
      this.aceManager.grpcClient.getDeviceVersion(
        new Empty(),
        (err: grpc.ServiceError, deviceVersion: huddly.DeviceVersion) => {
          if (err) {
            Logger.error(
              `Unable to get device version! Error msg: ${err.message}`,
              err.stack,
              AceUpgrader.name
            );
            resolve(undefined);
          }
          resolve(deviceVersion.getVersion());
        }
      );
    });
  }

  /**
   * A helper function that makes it possible to peform the upgrade substeps such as FLASH and COMMITT by
   * reading the cpio file and sending the data over to the camera using grpc streams.
   * @param step Represents the upgrade substep to be run on the device
   * @param stepName A string represnetation of the upgrade substep for debugging perpuses
   * @returns A promise that completes when the upgrade substep is successfully carried out
   * or rejects if not
   */
  performUpgradeStep(step: UpgradeSteps, stepName: string): Promise<string> {
    const extract = cpio.extract();

    return new Promise((resolve, reject) => {
      const readTimeout: NodeJS.Timeout = setTimeout(() => {
        const errMsg = `Unable to perform upgrade step ${step} within given time of 10 seconds`;
        Logger.warn(errMsg, Ace.name);
        this.emit(CameraEvents.UPGRADE_FAILED, errMsg);
        reject(errMsg);
      }, 10000);

      const upgradeStepCompleteCb = (err: grpc.ServiceError, deviceStatus: huddly.DeviceStatus) => {
        clearTimeout(readTimeout);
        if (err != undefined) {
          this.emit(CameraEvents.UPGRADE_FAILED, err);
          Logger.error(
            `Unable to perform ${stepName} step on device!`,
            err.message,
            AceUpgrader.name
          );
          reject(err.details);
          return;
        }
        resolve(
          `${stepName} step completed. Status code ${deviceStatus.getCode()}, message ${deviceStatus.getMessage()}`
        );
      };

      let stream: grpc.ClientWritableStream<huddly.Chunk>;
      switch (step) {
        case UpgradeSteps.FLASH:
          stream = this.aceManager.grpcClient.upgradeDevice(upgradeStepCompleteCb);
          break;
        case UpgradeSteps.COMMIT:
          stream = this.aceManager.grpcClient.upgradeVerify(upgradeStepCompleteCb);
          break;
        default:
          const upgradeStepStr: string = Object.keys(UpgradeSteps).find(
            (key) => UpgradeSteps[key] === step
          );
          clearTimeout(readTimeout);
          throw new AceUpgraderError(
            `Unknown upgrade step ${upgradeStepStr}`,
            ErrorCodes.UPGRADE_FAILED
          );
      }

      extract.on('entry', (header: any, cpioStream: any, cb: any) => {
        if (header.name !== 'image.itb') {
          return;
        }
        cpioStream.on('end', () => {
          cb();
          extract.destroy();
          stream.end();
        });
        cpioStream.on('data', (chunk: Buffer) => {
          const huddlyChunk = new huddly.Chunk();
          huddlyChunk.setContent(chunk);
          stream.write(huddlyChunk);
        });
        cpioStream.resume(); // auto drain
      });

      new BufferStream(this.options.file).pipe(extract);
    });
  }

  /**
   * Performs a firmware write/flash step using the provided cpio image
   * @returns A promise that completes when the flash step completes successfully
   * or rejects when the flash step fails.
   */
  async flash(): Promise<string> {
    return this.performUpgradeStep(UpgradeSteps.FLASH, 'FLASH');
  }

  /**
   * Performs a software reboot on the device
   * @returns A promise that completes when the device reboots successfully
   * or rejects if reboot fails.
   */
  reboot(): Promise<void> {
    return new Promise((resolve, reject) => {
      Logger.debug('Rebooting camera....', AceUpgrader.name);
      this.aceManager.grpcClient.reset(
        new Empty(),
        (err: grpc.ServiceError, status: huddly.DeviceStatus) => {
          if (err || status.getCode() !== huddly.StatusCode.OK) {
            this.emit(CameraEvents.UPGRADE_FAILED, err);
            Logger.error(`Reboot failed!`, err, AceUpgrader.name);
            if (status == undefined) {
              reject(`Reboot failed! Error: code [${err.code}] Details [${err.details}]`);
            } else {
              reject(
                `Reboot failed! DeviceStatus: code [${status.getCode()}] Msg [${status.getMessage()}]`
              );
            }
            return;
          }
          this.aceManager.closeConnection();
          resolve();
        }
      );
    });
  }

  /**
   * Performs a firmware verification step using the provided cpio image
   * @returns A promise that completes when the commit step completes successfully
   * or rejects when the commit step fails.
   */
  async commit(): Promise<string> {
    return this.performUpgradeStep(UpgradeSteps.COMMIT, 'COMMIT');
  }

  /**
   * @ignore
   */
  upgradeIsValid(): Promise<boolean> {
    throw new Error('Method not supported!');
  }

  /**
   * Performs the complete upgrade process asynchronously
   * @returns A promise that completes when the upgrade finishes successfully
   * or rejects when the upgrade fails.
   */
  doUpgrade(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.once(CameraEvents.UPGRADE_COMPLETE, () => resolve());
      this.once(CameraEvents.UPGRADE_FAILED, (e) => reject(e));
      this.start();
    });
  }
}
