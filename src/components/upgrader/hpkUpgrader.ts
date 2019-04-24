import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import IDeviceManager from './../../interfaces/iDeviceManager';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import { EventEmitter } from 'events';
import CameraEvents from './../../utilitis/events';
import Api from '../api';
import Boxfish from './../device/boxfish';
import BoxfishHpk from './boxfishhpk';
import UpgradeStatus, { UpgradeStatusStep } from './upgradeStatus';


const MAX_UPLOAD_ATTEMPTS = 5;
const REBOOT_TIMEOUT = 10000;

export class HPKUpgradeError extends Error {
  code: Number;
  constructor(message, code) {
    super(message);
    this.code = code;
  }

  toString(): String {
    return `Upgrade HPK: ${super.toString()}`;
  }
}

export default class HPKUpgrader extends EventEmitter implements IDeviceUpgrader {
  verboseStatusLog: boolean;
  _cameraManager: IDeviceManager;
  _sdkDeviceDiscoveryEmitter: EventEmitter;
  _fileBuffer: Buffer;
  _logger: any;
  _upgradeStatus: UpgradeStatus;
  private _statusMessageTimeout: number = 10000;

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
    if (opts.statusMessageTimeout) {
      this._statusMessageTimeout = opts.statusMessageTimeout;
    }
    this._fileBuffer = opts.file;
    this.registerHotPlugEvents();
  }

  onAttach = (devManager: IDeviceManager) => {
    if (devManager && devManager instanceof Boxfish
      && this._cameraManager['serialNumber'] === devManager['serialNumber']) {
      this._cameraManager = devManager;
      this.emit('UPGRADE_REBOOT_COMPLETE');
    }
  }

  onDetach = () => {
    if (this._cameraManager) {
      try {
        this._cameraManager.transport.close();
      } catch (e) {
        // Error on close is ok
      }
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

  async upload(hpkBuffer: Buffer, uploadStatusStep: UpgradeStatusStep) {
    let tryAgain = true;
    let attempt = 0;
    uploadStatusStep.progress = 1;
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
          throw new HPKUpgradeError(`Upload hpk failed with status ${status}`, 17);
        }
        uploadStatusStep.progress = 100;
        this.emitProgressStatus();
        tryAgain = false;
      } catch (e) {
        this._logger.error(`Failed uploading hpk file ${e} attemt ${attempt}`);
        attempt += 1;
      }
    }
    if (tryAgain && attempt >= MAX_UPLOAD_ATTEMPTS) {
      throw new HPKUpgradeError('Upgrading HPK: Could not upload hpk', 17);
    }
  }

  async start(): Promise<void> {
    const firstUploadStatusStep = new UpgradeStatusStep('Uploading software', 5);
    const executingHpkStep = new UpgradeStatusStep('Executing upgrade package', 1);
    const runningHpkStep = new UpgradeStatusStep('Running upgrade procedures', 80);
    const rebootStep = new UpgradeStatusStep('Rebooting camera', 3);
    const secondUploadStatusStep = new UpgradeStatusStep('Uploading software to verify', 3);
    const executingHpkVerificationStep = new UpgradeStatusStep('Executing verification of new software', 1);
    const runningHpkVerificationStep = new UpgradeStatusStep('Verifying new software', 3);

    this._upgradeStatus = new UpgradeStatus([
      firstUploadStatusStep,
      executingHpkStep,
      runningHpkStep,
      rebootStep,
      secondUploadStatusStep,
      executingHpkVerificationStep,
      runningHpkVerificationStep,
    ]);
    this.emitProgressStatus('Starting upgrade');
    this.emit(CameraEvents.UPGRADE_START);
    let upgradeTimoutId: NodeJS.Timer;
    this.once('UPGRADE_REBOOT_COMPLETE', async () => {
      rebootStep.progress = 100;
      clearTimeout(upgradeTimoutId);
      try {
        this.emitProgressStatus('Verifying new software');
        // Wait two seconds to allow drivers to attach properly to the USB endpoint
        await new Promise(resolve => setTimeout(resolve, 2000));
        await this.doUpgrade(secondUploadStatusStep,
          executingHpkVerificationStep,
          runningHpkVerificationStep,
          rebootStep);
        this.emitProgressStatus('Upgrade complete');
        await this.deRegisterHotPlugEvents();
        this.emit(CameraEvents.UPGRADE_COMPLETE);
      } catch (e) {
        await this.deRegisterHotPlugEvents();
        this.emit(CameraEvents.UPGRADE_FAILED, e);
        throw e;
      }
    });

    try {
      this.emitProgressStatus('Loading new software to camera');
      const rebooted = await this.doUpgrade(firstUploadStatusStep,
        executingHpkStep,
        runningHpkStep,
        rebootStep);
      upgradeTimoutId = setTimeout(() =>
        this.emit(CameraEvents.UPGRADE_FAILED, new HPKUpgradeError('Did not come back after reboot', 10))
        , REBOOT_TIMEOUT);
      if (!rebooted) {
        clearTimeout(upgradeTimoutId);
        this.emit(CameraEvents.UPGRADE_COMPLETE);
      }
    } catch (e) {
      this._logger.error('Upgrade failed', e);
      this.emit(CameraEvents.UPGRADE_FAILED, e);
      throw e;
    }
  }

  emitProgressStatus(statusString?: string) {
    if (statusString) this._upgradeStatus.statusString = statusString;
    this.emit(CameraEvents.UPGRADE_PROGRESS, this._upgradeStatus.getStatus());
  }

  async awaitHPKCompletion(completionStatusStep: UpgradeStatusStep, rebootStatusStep: UpgradeStatusStep): Promise<boolean> {
    const reboot = await this._cameraManager.api.withSubscribe<boolean>(['upgrader/status'], () => new Promise((resolve, reject) => {
      const startTimeout = () => {
        return setTimeout(() => {
        reject(new HPKUpgradeError(`Upgrading HPK: no status message within ${this._statusMessageTimeout}`, 12));
        }, this._statusMessageTimeout);
      };

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
          return reject(new HPKUpgradeError(`Failed during upgrade ${statusMessage}`, 14));
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
        completionStatusStep.operation = statusMessage.operation;
        completionStatusStep.progress = Math.ceil(progressPercentage) > 100 ? 100 : Math.ceil(progressPercentage);
        this.emitProgressStatus();

        messageTimeoutIt = startTimeout();
      });
    }));

    if (reboot) {
      rebootStatusStep.progress = 1;
      rebootStatusStep.operation = 'Issuing reboot command';
      await this._cameraManager.reboot();
      try {
        await this._cameraManager.transport.close();
      } catch (e) {
        this._logger.info(`\nUpgrading HPK: failed closing device on reboot: ${e}\n`);
      }
    }

    return reboot;
  }

  async runHPKScript(runStatusStep: UpgradeStatusStep): Promise<void> {
    this._logger.debug('RUN hpk');
    runStatusStep.progress = 1;
    try {
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
        runStatusStep.progress = 100;
        this.emitProgressStatus();
        return;
      } else {
        this._logger.error(`HPK run failed ${JSON.stringify(runMessage)}`);
        throw new HPKUpgradeError(`run failed ${runMessage}`, 15);
      }
    } catch (e) {
      throw new HPKUpgradeError(`Could not run hpk ${e}`, 15);
    }
  }

  async doUpgrade(uploadStatusStep: UpgradeStatusStep,
      runStatusStep: UpgradeStatusStep,
      completionStatusStep: UpgradeStatusStep,
      rebootStatusStep: UpgradeStatusStep): Promise<boolean> {
    this._logger.info('Upgrading HPK \n');
    const hpkBuffer = this._fileBuffer;
    try {
      if (!BoxfishHpk.isHpk(this._fileBuffer)) {
        throw new HPKUpgradeError('HPK upgrader file is not a valid hpk file', 16);
      }
      await this.upload(hpkBuffer, uploadStatusStep);
      const completedPromise = this.awaitHPKCompletion(completionStatusStep, rebootStatusStep);
      await this.runHPKScript(runStatusStep);
      return await completedPromise;
    } catch (e) {
      this.deRegisterHotPlugEvents();
      throw e;
    }
  }

  async upgradeIsValid(): Promise<boolean> {
    try {
      const response = await this._cameraManager.getState();

      this._logger.info(`Upgrade status ${response.string}`);
      if (response.status === 10) {
        // EMMC is not ready lets wait and try again
        await new Promise(resolve => setTimeout(resolve, 1000));
        return await this.upgradeIsValid();
      }
      return response.status === 0;
    } catch (e) {
      return false;
    }
  }
}
