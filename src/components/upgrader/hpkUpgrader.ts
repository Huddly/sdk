import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import IDeviceManager from './../../interfaces/iDeviceManager';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import { EventEmitter } from 'events';
import CameraEvents from './../../utilitis/events';
import Api from '../api';
import Boxfish from './../device/boxfish';
import BoxfishHpk from './boxfishhpk';

const MAX_UPLOAD_ATTEMPTS = 5;

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

  onAttach = (devManager) => {
    if (devManager && devManager instanceof Boxfish
      && this._cameraManager['serialNumber'] === devManager['serialNumber']) {
      this._cameraManager = devManager;
      this.emit('UPGRADE_REBOOT_COMPLETE');
    }
  }

  onDetach = () => {
    try {
      if (this._cameraManager) {
        this._cameraManager.transport.close();
      }
    } catch (e) {
      // Error on close is ok
    }
    this.emit('UPGRADE_REBOOT');
  }

  registerHotPlugEvents() {
    this._sdkDeviceDiscoveryEmitter.on(CameraEvents.ATTACH, this.onAttach);

    this._sdkDeviceDiscoveryEmitter.on(CameraEvents.DETACH, this.onDetach);
  }

  deRegisterHotPlugEvents() {
    this._sdkDeviceDiscoveryEmitter.removeListener(CameraEvents.ATTACH, this.onAttach);
    this._sdkDeviceDiscoveryEmitter.removeListener(CameraEvents.DETACH, this.onDetach);
  }

  async upload(hpkBuffer: Buffer) {
    let tryAgain = true;
    let attempt = 0;
    while (tryAgain && attempt < MAX_UPLOAD_ATTEMPTS) {
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
        tryAgain = false;
      } catch (e) {
        this._logger.error(`Failed uploading hpk file ${e} attemt ${attempt}`);
        attempt += 1;
      }
    }
  }

  async start(): Promise<void> {
      this.emit(CameraEvents.UPGRADE_START);
      this.once('UPGRADE_REBOOT_COMPLETE', async () => {
        try {
          // Wait two seconds to allow drivers to attach properly to the USB endpoint
          await new Promise(resolve => setTimeout(resolve, 2000));
          await this.doUpgrade();
          await this.deRegisterHotPlugEvents();
          this.emit(CameraEvents.UPGRADE_COMPLETE);
        } catch (e) {
          await this.deRegisterHotPlugEvents();
          this.emit(CameraEvents.UPGRADE_FAILED, e);
          throw e;
        }
      });

      try {
        const rebooted = await this.doUpgrade();

        if (!rebooted) {
          this.emit(CameraEvents.UPGRADE_COMPLETE);
        }
      } catch (e) {
        this._logger.error('Upgrade failed', e);
        this.emit(CameraEvents.UPGRADE_FAILED, e);
        throw e;
      }


  }

  async awaitHPKCompletion(): Promise<boolean> {
    const reboot = await this._cameraManager.api.withSubscribe<boolean>(['upgrader/status'], () => new Promise((resolve, reject) => {
      const statusMessageTimoutTime = 10000;
      function startTimeout() {
        return setTimeout(() => {
          reject(`Upgrading HPK: no status message within ${statusMessageTimoutTime}`);
        }, statusMessageTimoutTime);
      }

      let totalProgressPoints = 1;
      let elapsedPoints = 0;
      let messageTimeoutIt = startTimeout();
      let lastTime = Date.now();
      let lastOperation: undefined | string = undefined;
      this._cameraManager.transport.on('upgrader/status', async message => {
        clearTimeout(messageTimeoutIt);
        const statusMessage =  Api.decode(message.payload, 'messagepack');
        totalProgressPoints = statusMessage.total_points || totalProgressPoints;
        if (statusMessage.operation === 'done' && statusMessage.reboot) {
          resolve(true);
          return;
        } else if (statusMessage.operation === 'done') {
          resolve(false);
          return;
        }
        if (statusMessage.error_count > 0) {
          return reject(statusMessage);
        }
        const now = Date.now();
        const deltaT = now - lastTime;
        lastTime = now;
        elapsedPoints = statusMessage.elapsed_points || elapsedPoints;
        const progressPercentage = (elapsedPoints / totalProgressPoints) * 100;
        if (statusMessage.operation !== lastOperation || deltaT >= 1000) {
          this._logger.info(`Upgrading HPK: Status: ${Math.round(progressPercentage)}% step ${statusMessage.operation}\r`);
        }
        lastOperation = statusMessage.operation;
        this.emit(CameraEvents.UPGRADE_PROGRESS, {
          operation: statusMessage.operation,
          progress: progressPercentage,
        });

        messageTimeoutIt = startTimeout();
      });
    }));

    if (reboot) {
      await this._cameraManager.reboot();
      try {
        await this._cameraManager.transport.close();
      } catch (e) {
        this._logger.info(`\nUpgrading HPK: failed closing device on reboot: ${e}\n`);
      }
    }

    return reboot;
  }

  async runHPKScript(): Promise<void> {
    this._logger.debug('RUN hpk');
    const runMessage = await this._cameraManager.api.sendAndReceiveMessagePack(
      { filename: 'upgrade.hpk' },
      {
        send: 'hpk/run',
        receive: 'hpk/run_reply'
      },
      15000
    );
    if (runMessage.string === 'Success') {
      this._logger.debug('RUN hpk complete');
      return;
    } else {
      this._logger.error(`HPK run failed ${JSON.stringify(runMessage)}`);
      throw new Error(`HPK run failed ${runMessage}`);
    }
  }

  async doUpgrade(): Promise<boolean> {
    this._logger.info('Upgrading HPK \n');
    const hpkBuffer = this._fileBuffer;
    if (!BoxfishHpk.isHpk(this._fileBuffer)) {
      throw new Error('HPK upgrader file is not a valid hpk file');
    }
    await this.upload(hpkBuffer);
    const completedPromise = this.awaitHPKCompletion();
    await this.runHPKScript();
    return await completedPromise;
  }

  async upgradeIsValid(): Promise<boolean> {
    try {
      const response = await this._cameraManager.getState();

      this._logger.info(`Upgrade status ${response.string}`);
      return response.status === 0;
    } catch (e) {
      return false;
    }
  }
}
