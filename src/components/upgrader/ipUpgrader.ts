import { EventEmitter } from 'events';
import cpio from 'cpio-stream';

import IUpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import UpgradeStatus, { UpgradeStatusStep } from './upgradeStatus';
import AceUpgraderError from './../../error/AceUpgraderError';
import CameraEvents from './../../utilitis/events';
import * as grpc from '@grpc/grpc-js';
import ErrorCodes from './../../../src/error/errorCodes';
import BufferStream from './../../utilitis/bufferStream';

import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import IpBaseDevice from '../device/ipbase';

/**
 * Enum describing the different upgrade steps for L1.
 *
 * @export
 * @enum {number}
 */
export enum UpgradeSteps {
  FLASH = 0,
  REBOOT = 1,
  COMMIT = 2,
}

/**
 * Controller class for instrumenting the upgrade process on Huddly IP cameras.
 *
 * @export
 * @class IpCameraUpgrader
 * @extends {EventEmitter}
 * @implements {IDeviceUpgrader}
 */
export default class IpCameraUpgrader extends EventEmitter implements IDeviceUpgrader {
  className: string = 'IpCameraUpgrader';
  /**
   * @ignore
   * Camera manager instance for Ace
   *
   * @type {IDeviceManager}
   * @memberof IpCameraUpgrader
   */
  _cameraManager: IDeviceManager;

  /**
   * @ignore
   * Event emitter object that emits ATTACH & DETACH events for Ace devices on the network
   *
   * @type {EventEmitter}
   * @memberof IpCameraUpgrader
   */
  _sdkDeviceDiscoveryEmitter: EventEmitter;

  /**
   * The upgrader options necessary to perform the firmware upgrade
   *
   * @type {IUpgradeOpts}
   * @memberof IpCameraUpgrader
   */
  options: IUpgradeOpts;

  /**
   * Defines the maximum amount of time (in seconds) that the camera is allowed to use for
   * booting after firmware upgrade.
   *
   * @type {IUpgradeOpts}
   * @memberof IpCameraUpgrader
   */
  bootTimeout: number = 30 * 1000; // 30 seconds

  /**
   * @ignore
   * Upgrade status object used to emit upgrade progress throughout the whole upgrade process.
   *
   * @type {UpgradeStatus}
   * @memberof IpCameraUpgrader
   */
  _upgradeStatus: UpgradeStatus;

  /**
   * Helper getter that typecasts the _cameraManager member into a IPBaseDevice type
   *
   * @type {IpBaseDevice}
   * @memberof IpCameraUpgrader
   */
  get ipBaseManager(): IpBaseDevice {
    if (this._cameraManager instanceof IpBaseDevice) {
      return <IpBaseDevice>this._cameraManager;
    }
    throw new Error(
      `IP camera upgrader initialized with wrong camera manager! Manager is not instance of IpBaseDevice but => ${this._cameraManager.constructor.name}`
    );
  }

  /**
   * Creates a new instance of IpCameraUpgrader.
   * @param {IDeviceManager} manager An instance of IDeviceManager setup for an IpBaseDevice.
   * @param {EventEmitter} sdkDeviceDiscoveryEmitter Event emitter object that emits ATTACH & DETACH events for IP devices on the network
   * @memberof IpCameraUpgrader
   */
  constructor(manager: IDeviceManager, sdkDeviceDiscoveryEmitter: EventEmitter) {
    super();
    this._cameraManager = manager;
    this._sdkDeviceDiscoveryEmitter = sdkDeviceDiscoveryEmitter;
  }

  /**
   * Method for initializing the upgrade and setting up the proper callbacks and event listeners.
   *
   * @param {IUpgradeOpts} opts Options required to carry out and facilitate the upgrade process
   * @memberof IpCameraUpgrader
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
   *
   * @memberof IpCameraUpgrader
   */
  registerHotPlugEvents(): void {
    this._sdkDeviceDiscoveryEmitter.on(CameraEvents.ATTACH, async (devManager) => {
      if (devManager && devManager instanceof IpBaseDevice) {
        const ipDeviceMng: IpBaseDevice = <IpBaseDevice>devManager;
        if (ipDeviceMng.equals(this._cameraManager)) {
          this._cameraManager = devManager;
          this.emit('UPGRADE_REBOOT_COMPLETE');
        }
      }
    });

    this._sdkDeviceDiscoveryEmitter.on(CameraEvents.DETACH, async (d) => {
      if (d && this.ipBaseManager.wsdDevice.serialNumber === d.serialNumber) {
        this.ipBaseManager.closeConnection();
        this.emit('UPGRADE_REBOOT');
      }
    });
  }

  /**
   * @ignore
   * Helper function for emitting upgrade progress events
   *
   * @param {string} [statusString] A message accompanying the progress event
   * @memberof IpCameraUpgrader
   */
  emitProgressStatus(statusString?: string) {
    if (statusString) this._upgradeStatus.statusString = statusString;
    this.emit(CameraEvents.UPGRADE_PROGRESS, this._upgradeStatus.getStatus());
  }

  /**
   * Perform the complete upgrade process synchronously
   *
   * @return {*}  {Promise<void>} Void function. Use `await` when calling this method.
   * @memberof IpCameraUpgrader
   */
  async start(): Promise<void> {
    const firstUploadStatusStep = new UpgradeStatusStep('Executing software upgrade', 30);
    const rebootStep = new UpgradeStatusStep('Rebooting camera', 60);
    const verificationStep = new UpgradeStatusStep('Verifying new software', 10);

    this._upgradeStatus = new UpgradeStatus([firstUploadStatusStep, rebootStep, verificationStep]);

    try {
      // Check that camera is running in Normal/Verified state
      await this.verifyVersionState(huddly.VersionState.VERIFIED);

      Logger.debug('Starting Upgrade', this.className);
      this.emitProgressStatus('Starting upgrade');
      this.emit(CameraEvents.UPGRADE_START);

      firstUploadStatusStep.progress = 50;
      this.emitProgressStatus();
      Logger.debug('Flashing firmware ...', this.className);
      await this.flash();
      firstUploadStatusStep.progress = 100;
      Logger.debug('Flash completed!', this.className);

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
        Logger.debug('Camera successfully booted after upgrade', this.className);
        clearInterval(rebootUpgradeProgress);
        try {
          rebootStep.progress = 100;
          this.emitProgressStatus();

          // Check that camera comes up in Unverified state
          await this.verifyVersionState(huddly.VersionState.UNVERIFIED);

          // Check that the camera comes up with expected version
          await this.verifyVersion();

          verificationStep.progress = 50;
          Logger.debug('Verifying new software', this.className);
          this.emitProgressStatus('Verifying new software');
          await this.commit();

          // Check that camera comes up in Committed state
          await this.verifyVersionState(huddly.VersionState.VERIFIED);
          verificationStep.progress = 100;

          Logger.debug('Upgrade Completed', this.className);
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
   * @ignore
   *
   * Does a verification of the current version state of the camera. It does a version state fetch
   * and matches that with the one given as parameter.
   *
   * @param {number} expectedState The expected state that the camera should be in.
   * @return {*}  {Promise<void>} Void function. Use `await` when calling this method.
   * @memberof IpCameraUpgrader
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
      Logger.error(errMsg, undefined, this.className);
      this.emit(CameraEvents.UPGRADE_FAILED, errMsg);
      throw new AceUpgraderError(errMsg, ErrorCodes.UPGRADE_FAILED);
    }
  }

  /**
   * @ignore
   * Helper function for reading the version string from the provided CPIO file
   * and matching that with whatever version the camera is currently running.
   *
   * @return {*}  {Promise<void>} Void function. Use `await` when calling this method.
   * @memberof IpCameraUpgrader
   */
  async verifyVersion(): Promise<void> {
    const extract = cpio.extract();
    const currentVersion: string = await this.getVersion();
    const expcetedVersion: string = await new Promise((resolve) => {
      let expcetedVersion: string = 'N/A';
      const readTimeout: NodeJS.Timeout = global.setTimeout(() => {
        Logger.warn(
          'Unable to read version string from cpio file within 1s time frame',
          this.className
        );
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
      Logger.error(errMsg, undefined, this.className);
      throw new AceUpgraderError(errMsg, ErrorCodes.UPGRADE_VERSION_MISMATCH);
    }
  }

  /**
   * @ignore
   * Calculate expected slot based on current slot.
   *
   * @param {string} curretSlot Current slot that the camera has booted from.
   * @return {*}  {string} The next slot the camera will boot after upgrade.
   * @memberof IpCameraUpgrader
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
   * Verify that the camera has booted from the expected slot after upgrade.
   *
   * @param {string} slotBeforeUpgrade The old slot that the camera started the upgrade from.
   * @return {*}  {Promise<void>} Void function. Use `await` when calling this method.
   * @memberof IpCameraUpgrader
   */
  async verifySlot(slotBeforeUpgrade: string): Promise<void> {
    const expectedSlot: string = this.calculateExpectedSlot(slotBeforeUpgrade);
    const currentSlot: string = await this.ipBaseManager.getSlot();
    if (expectedSlot !== currentSlot) {
      const errMsg: string = `Camera booted from wrong slot! Expected ${expectedSlot} but got ${currentSlot}`;
      this.emit(CameraEvents.UPGRADE_FAILED, errMsg);
      Logger.error(errMsg, undefined, this.className);
      throw new AceUpgraderError(errMsg, ErrorCodes.UPGRADE_WRONG_BOOT_SLOT);
    }
  }

  /**
   * Helper function that fetches the version state from the device.
   *
   * @return {*}  {Promise<number>} Resolves with the version state when the action is completed.
   * @memberof IpCameraUpgrader
   */
  getVersionState(): Promise<number> {
    return new Promise((resolve) => {
      this.ipBaseManager.grpcClient.getDeviceVersion(
        new Empty(),
        (err: grpc.ServiceError, deviceVersion: huddly.DeviceVersion) => {
          if (err) {
            Logger.error(
              `Unable to get device version state! Error msg: ${err.message}`,
              err.stack,
              this.className
            );
            resolve(undefined);
          }
          resolve(deviceVersion.getVersionState());
        }
      );
    });
  }

  /**
   * Helper function that fetches the firmware version string from the device.
   *
   * @return {*}  {Promise<string>} Resolves with the version straing when the action is completed.
   * @memberof IpCameraUpgrader
   */
  getVersion(): Promise<string> {
    return new Promise((resolve) => {
      this.ipBaseManager.grpcClient.getDeviceVersion(
        new Empty(),
        (err: grpc.ServiceError, deviceVersion: huddly.DeviceVersion) => {
          if (err) {
            Logger.error(
              `Unable to get device version! Error msg: ${err.message}`,
              err.stack,
              this.className
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
   *
   * @param {UpgradeSteps} step Represents the upgrade substep to be run on the device.
   * @param {string} stepName A string represnetation of the upgrade substep for debugging purposes.
   * @return {*}  {Promise<string>} Resolve with upgrade status message when the action is completed.
   * @memberof IpCameraUpgrader
   */
  performUpgradeStep(step: UpgradeSteps, stepName: string): Promise<string> {
    const extract = cpio.extract();

    return new Promise((resolve, reject) => {
      const readTimeout: NodeJS.Timeout = global.setTimeout(() => {
        const errMsg = `Unable to perform upgrade step ${step} within given time of 10 seconds`;
        Logger.warn(errMsg, this.className);
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
            this.className
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
          stream = this.ipBaseManager.grpcClient.upgradeDevice(upgradeStepCompleteCb);
          break;
        case UpgradeSteps.COMMIT:
          stream = this.ipBaseManager.grpcClient.upgradeVerify(upgradeStepCompleteCb);
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
   * @ignore
   * Performs a firmware write/flash step using the provided cpio image
   *
   * @return {*}  {Promise<string>} Resolves with flash status message when the action is completed.
   * @memberof IpCameraUpgrader
   */
  async flash(): Promise<string> {
    return this.performUpgradeStep(UpgradeSteps.FLASH, 'FLASH');
  }

  /**
   * @ignore
   * Performs a software reboot on the device.
   *
   * @return {*}  {Promise<void>} Void function. Use `await` when calling this method.
   * @memberof IpCameraUpgrader
   */
  reboot(): Promise<void> {
    return new Promise((resolve, reject) => {
      Logger.debug('Rebooting camera....', this.className);
      this.ipBaseManager.grpcClient.reset(
        new Empty(),
        (err: grpc.ServiceError, status: huddly.DeviceStatus) => {
          if (err || status.getCode() !== huddly.StatusCode.OK) {
            this.emit(CameraEvents.UPGRADE_FAILED, err);
            Logger.error(`Reboot failed!`, err, this.className);
            if (status == undefined) {
              reject(`Reboot failed! Error: code [${err.code}] Details [${err.details}]`);
            } else {
              reject(
                `Reboot failed! DeviceStatus: code [${status.getCode()}] Msg [${status.getMessage()}]`
              );
            }
            return;
          }
          this.ipBaseManager.closeConnection();
          resolve();
        }
      );
    });
  }

  /**
   * @ignore
   * Performs a firmware verification step using the provided cpio image.
   *
   * @return {*}  {Promise<string>} Resolves with commit status message when the action is completed.
   * @memberof IpCameraUpgrader
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
   * Perform the complete upgrade process asynchronously
   *
   * @return {*}  {Promise<void>} Resolves when the upgrade process is completed. Rejects if upgrade failes.
   * @memberof IpCameraUpgrader
   */
  doUpgrade(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.once(CameraEvents.UPGRADE_COMPLETE, () => resolve());
      this.once(CameraEvents.UPGRADE_FAILED, (e) => reject(e));
      this.start();
    });
  }
}
