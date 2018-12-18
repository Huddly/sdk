import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import IDeviceManager from './../../interfaces/iDeviceManager';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import { EventEmitter } from 'events';
import CameraEvents from './../../utilitis/events';
import Api from '../api';
import Boxfish from './../device/boxfish';

export default class HPKUpgrader extends EventEmitter implements IDeviceUpgrader {
  verboseStatusLog: boolean;
  _cameraManager: IDeviceManager;
  _sdkDeviceDiscoveryEmitter: EventEmitter;
  _fileBuffer: Buffer;
  _logger: any;

  constructor(manager: IDeviceManager, sdkDeviceDiscoveryEmitter: EventEmitter, logger: any) {
    super();

    this._logger = logger;
    this._cameraManager = manager;
    this._sdkDeviceDiscoveryEmitter = sdkDeviceDiscoveryEmitter;
  }

  init(opts: UpgradeOpts) {
    if (opts.verboseStatusLog !== undefined) {
      this.verboseStatusLog = opts.verboseStatusLog;
    }
    this._fileBuffer = opts.file;
    this.registerHotPlugEvents();
  }

  registerHotPlugEvents() {
    this._sdkDeviceDiscoveryEmitter.on(CameraEvents.ATTACH, (devManager) => {
      if (devManager && devManager instanceof Boxfish
        && this._cameraManager['serialNumber'] === devManager['serialNumber']) {
        this._cameraManager = devManager;
        this.emit('UPGRADE_REBOOT_COMPLETE');
      }
    });

    this._sdkDeviceDiscoveryEmitter.on(CameraEvents.DETACH, () => {
      this._cameraManager.transport.close();
      this.emit('UPGRADE_REBOOT');
    });
  }

  async upload(hpkBuffer: Buffer) {
    try {
      const m = await this._cameraManager.api.sendAndReceiveMessagePack(
        { name: 'upgrade.hpk', file_data: hpkBuffer },
        {
          send: 'hcp/write',
          receive: 'hcp/write_reply'
        }, 10000
      );
      const { status } = m;
      if (status !== 0) {
        throw new Error(`Upload hpk failed with status ${status}`);
      }
    } catch (e) {
      this._logger.error(`Failed uploading hpk file ${e}`);
      throw new Error(`Failed uploading hpk file ${e}`);
    }
  }

  async start(): Promise<void> {
      this.emit(CameraEvents.UPGRADE_START);
      try {
        await this.doUpgrade();
      } catch (e) {
        this._logger.error('Upgrade failed', e);
        this.emit(CameraEvents.UPGRADE_FAILED, e);
        throw e;
      }

      this.once('UPGRADE_REBOOT_COMPLETE', async () => {
        try {
          await this.doUpgrade();
          this.emit(CameraEvents.UPGRADE_COMPLETE);
        } catch (e) {
          this.emit(CameraEvents.UPGRADE_FAILED, e);
          throw e;
        }
      });
  }

  async awaitHPKCompletion(): Promise<any> {
    return this._cameraManager.api.withSubscribe(['upgrader/status'], () => new Promise((resolve, reject) => {
        let totalProgressPoints = 1;
        this._cameraManager.transport.on('upgrader/status', async message => {
          const statusMessage =  Api.decode(message.payload, 'messagepack');
          totalProgressPoints = statusMessage.total_points || totalProgressPoints;
          if (statusMessage.operation === 'done') {
            if (statusMessage.reboot) {
              await this._cameraManager.reboot();
            }
            resolve();
          }
          if (statusMessage.error_count > 0) {
            return reject(statusMessage);
          }
          const elapsedPoints = statusMessage.elapsed_points || 0;
          const progressPercentage = (elapsedPoints / totalProgressPoints) * 100;
          this._logger.info(`Upgrading HPK: Status: ${Math.ceil(progressPercentage)}% step ${statusMessage.operation}\r`);
          this.emit(CameraEvents.UPGRADE_PROGRESS, {
            operation: statusMessage.operation,
            progress: progressPercentage
          });
        });
      })
    );
  }

  async runHPKScript(): Promise<void> {
    this._logger.debug('RUN hpk');
    const runMessage = await this._cameraManager.api.sendAndReceiveMessagePack(
      { filename: 'upgrade.hpk' },
      {
        send: 'hpk/run',
        receive: 'hpk/run_reply'
      },
      5000
    );
    if (runMessage.string === 'Success') {
      this._logger.debug('RUN hpk complete');
      return;
    } else {
      this._logger.error(`HPK run failed ${runMessage}`);
      throw new Error(`HPK run failed ${runMessage}`);
    }
  }

  async doUpgrade(): Promise<any> {
    this._logger.info('Upgrading HPK \n');
    const hpkBuffer = this._fileBuffer;
    await this.upload(hpkBuffer);
    const completedPromise = this.awaitHPKCompletion();
    await this.runHPKScript();
    await completedPromise;
    return;
  }
}
