import { EventEmitter } from 'events';
import cpio from 'cpio-stream';
import fs from 'fs';

import IUpgradeOpts from './../../interfaces/IUpgradeOpts';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import IDeviceManager from './../../interfaces/iDeviceManager';
import IGrpcTransport from './../../interfaces/IGrpcTransport';
import UpgradeStatus, { UpgradeStatusStep } from './upgradeStatus';
import AceUpgraderError from './../../error/AceUpgraderError';
import TypeHelper from './../../utilitis/typehelper';
import CpioReader from './cpio';
import CameraEvents from './../../utilitis/events';
import Ace from './../../components/device/ace';
import * as huddly from './../../proto/huddly_pb';
import * as grpc from '@grpc/grpc-js';
import ErrorCodes from './../../../src/error/errorCodes';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

export default class AceUpgrader extends EventEmitter implements IDeviceUpgrader {
  _cameraManager: IDeviceManager;
  _sdkDeviceDiscoveryEmitter: EventEmitter;
  _logger: any;
  options: IUpgradeOpts;
  bootTimeout: number = (30 * 1000); // 30 seconds
  verboseStatusLog: boolean = true;
  private _upgradeStatus: UpgradeStatus;
  private _cpioReader: CpioReader;
  private readonly GRPC_STREAM_CHUNK_SIZE = 1024;

  get transport(): IGrpcTransport {
    if (TypeHelper.instanceOfGrpcTransport(this._cameraManager.transport)) {
      return <IGrpcTransport>this._cameraManager.transport;
    }
    throw new Error('Unable to talk to device. Tarnsport must be GrpcTransport compatible');
  }

  get aceManager(): Ace {
    if (this._cameraManager instanceof Ace) {
      return <Ace> this._cameraManager;
    }
    throw new Error(`Ace upgrader initialized with wrong camera manager! Manager is not instance of Ace but => ${typeof this._cameraManager}`);
  }

  constructor(manager: IDeviceManager, sdkDeviceDiscoveryEmitter: EventEmitter, logger: any) {
    super();
    this._cameraManager = manager;
    this._sdkDeviceDiscoveryEmitter = sdkDeviceDiscoveryEmitter;
    this._logger = logger;
  }

  init(opts: IUpgradeOpts): void {
    if (!opts.cpioFilePath) {
      throw new Error('UpgraderOpts parameter [cpioFilePath] was not provided');
    }
    this.options = opts;

    if (opts.bootTimeout) {
      this.bootTimeout = opts.bootTimeout * 1000;
    }

    if (opts.verboseStatusLog !== undefined) {
      this.verboseStatusLog = opts.verboseStatusLog;
    }
    this.registerHotPlugEvents();
  }

  registerHotPlugEvents(): void {
    this._sdkDeviceDiscoveryEmitter.on(CameraEvents.ATTACH, async (devManager) => {
      if (devManager && devManager instanceof Ace) {
        const aceDeviceMng: Ace = <Ace> devManager;
        if (aceDeviceMng.equals(this._cameraManager)) {
          this._cameraManager = devManager;
          this.emit('UPGRADE_REBOOT_COMPLETE');
        }
      }
    });

    this._sdkDeviceDiscoveryEmitter.on(CameraEvents.DETACH, async (d) => {
      if (d && this.aceManager.wsdDevice.serialNumber === d.serialNumber) {
        this.transport.close();
        this.emit('UPGRADE_REBOOT');
      }
    });
  }

  emitProgressStatus(statusString?: string) {
    if (statusString) this._upgradeStatus.statusString = statusString;
    this.emit(CameraEvents.UPGRADE_PROGRESS, this._upgradeStatus.getStatus());
  }

  async start(): Promise<void> {
    const firstUploadStatusStep = new UpgradeStatusStep('Executing software upgrade', 80);
    const rebootStep = new UpgradeStatusStep('Rebooting camera', 3);
    const verificationStep = new UpgradeStatusStep('Verifying new software', 3);

    this._upgradeStatus = new UpgradeStatus([
      firstUploadStatusStep,
      rebootStep,
      verificationStep,
    ]);

    try {
      this._logger.debug('Starting Upgrade', AceUpgrader.name);
      this.emitProgressStatus('Starting upgrade');
      this.emit(CameraEvents.UPGRADE_START);

      firstUploadStatusStep.progress = 1;
      this._logger.debug('Flashing firmware ...', AceUpgrader.name);
      await this.flash();
      firstUploadStatusStep.progress = 100;
      this.emitProgressStatus();
      this._logger.debug('Flash completed!', AceUpgrader.name);

      rebootStep.progress = 1;
      this.emitProgressStatus('Rebooting camera');
      await this.reboot();

      // Timeout if the camera does not come back up after bootTimeout seconds have passed!
      const bootTimeout = setTimeout(() => {
        clearTimeout(bootTimeout);
        this.emit(CameraEvents.TIMEOUT, 'Camera did not come back up after upgrade!');
      }, this.bootTimeout);

      this.once('UPGRADE_REBOOT_COMPLETE', async () => {
        this._logger.debug('Camera successfully booted after upgrade', AceUpgrader.name);
        try {
          rebootStep.progress = 100;
          this.emitProgressStatus();

          const versionState: number = await new Promise((resolve) => {
            this.transport.grpcClient.getDeviceVersion(this.transport.empty, (err, deviceVersion: huddly.DeviceVersion) => {
              resolve(deviceVersion.getVersionState());
            });
          });
          if (versionState !== huddly.VersionState.UNVERIFIED) {
            const versionStateStr: string = Object.keys(huddly.VersionState).find(key => huddly.VersionState[key] === versionState);
            const errMsg = `Device did not come up with expected version state. Expected UNVERIFIED | Got ${versionStateStr}`;
            this._logger.error(errMsg, AceUpgrader.name);
            this.emit(CameraEvents.UPGRADE_FAILED, errMsg);
            throw new AceUpgraderError(errMsg, ErrorCodes.UPGRADE_FAILED);
          }
          verificationStep.progress = 1;

          this._logger.debug('Verifying new software', AceUpgrader.name);
          this.emitProgressStatus('Verifying new software');
          await this.commit();
          verificationStep.progress = 100;

          this._logger.debug('Upgrade Completed', AceUpgrader.name);
          this.emitProgressStatus('Upgrade complete');
          clearTimeout(bootTimeout);
          this.emit(CameraEvents.UPGRADE_COMPLETE, this._cameraManager);
        } catch (e) {
          clearTimeout(bootTimeout);
          // Upgrade fail event is already emitted
        }
      });
    } catch {
      return; // Do not proceed
    }
  }

  private peformUpgradeStep(upgradeFunc: (callback: any) => grpc.ClientWritableStream<huddly.Chunk>, stepName: string): Promise<string> {
    const extract = cpio.extract();

    return new Promise((resolve, reject) => {
      console.log(upgradeFunc);
      const stream: grpc.ClientWritableStream<huddly.Chunk> = upgradeFunc((err: grpc.ServiceError, deviceStatus: huddly.DeviceStatus) => {
       if (err !== null) {
        this._logger.error(`Unable to perform ${stepName} step on device!`, err.message, AceUpgrader.name);
        this._logger.warn(err.stack, AceUpgrader.name);
        reject(err.details);
        return;
       }
       this._logger.debug(`${stepName} step completed! Status ${JSON.stringify(deviceStatus.toObject())}`);
       resolve(`${stepName} step completed`);
      });

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
          const huddlyChunk = this.transport.chunk; // Workaround
          huddlyChunk.setContent(chunk);
          stream.write(huddlyChunk);
        });
        cpioStream.resume(); // auto drain
      });
      fs.createReadStream(this.options.cpioFilePath).pipe(extract);
     });
  }
  private async flash(): Promise<void> {
    await this.peformUpgradeStep(this.transport.grpcClient.upgradeDevice, 'FLASH')
    .catch((err) => {
      this.emit(CameraEvents.UPGRADE_FAILED, err);
      this._logger.error('Flashing device failed!', err, AceUpgrader.name);
      throw new AceUpgraderError(err, ErrorCodes.UPGRADE_FAILED);
    });
  }

  private reboot(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._logger.debug('Rebooting camera....', AceUpgrader.name);
      this.transport.grpcClient.reset(this.transport.empty, (err: grpc.ServiceError, status: huddly.DeviceStatus) => {
        if (err || status.getCode() !== huddly.StatusCode.OK) {
          this.emit(CameraEvents.UPGRADE_FAILED, err);
          this._logger.error(`Reboot failed!`, err, AceUpgrader.name);
          reject(`Reboot failed! DeviceStatus: code [${status.getCode()}] msg [${status.getMessage()}]`);
          return;
        }
        this.transport.close();
        resolve();
      });
    });
  }

  private async commit(): Promise<void> {
    await this.peformUpgradeStep(this.transport.grpcClient.upgradeDevice, 'COMMIT')
    .catch((err) => {
      this.emit(CameraEvents.UPGRADE_FAILED, err);
      this._logger.error(`Committing device failed!`, err, AceUpgrader.name);
      throw new AceUpgraderError(err, ErrorCodes.UPGRADE_FAILED);
    });
  }

  upgradeIsValid(): Promise<boolean> {
    throw new Error('Method not implemented.');
  }

  async doUpgrade(): Promise<any> {
    return new Promise<void>((resolve, reject) => {
      this.once(CameraEvents.UPGRADE_COMPLETE, () => resolve());
      this.once(CameraEvents.UPGRADE_FAILED, (e) => reject(e));
      this.start();
    });
  }
}