import { EventEmitter } from 'events';

import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import UpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';

import CameraEvents from './../../utilitis/events';
import Logger from './../../utilitis/logger';
import Api from '../api';
import Boxfish from './../device/boxfish';
import BoxfishHpk from './boxfishhpk';
import UpgradeStatus, { UpgradeStatusStep } from './upgradeStatus';
import ErrorCodes from './../../error/errorCodes';
import HPKUpgradeError from './../../error/hpkUpgradeError';

const MAX_UPLOAD_ATTEMPTS = 5;
const REBOOT_TIMEOUT = 20000;

export default class HPKUpgrader extends EventEmitter implements IDeviceUpgrader {
  verboseStatusLog: boolean;
  _cameraManager: IDeviceManager;
  _sdkDeviceDiscoveryEmitter: EventEmitter;
  _fileBuffer: Buffer;
  _upgradeStatus: UpgradeStatus;
  _production_upgrade: boolean;
  private _statusMessageTimeout: number = 10000;

  constructor(manager: IDeviceManager, sdkDeviceDiscoveryEmitter: EventEmitter) {
    super();
    this._cameraManager = manager;
    this._sdkDeviceDiscoveryEmitter = sdkDeviceDiscoveryEmitter;
    this._production_upgrade = false;
  }

  init(opts: UpgradeOpts) {
    if (opts.verboseStatusLog !== undefined) {
      this.verboseStatusLog = opts.verboseStatusLog;
    }
    if (opts.statusMessageTimeout) {
      this._statusMessageTimeout = opts.statusMessageTimeout;
    }
    if (opts.production_upgrade) {
      this._production_upgrade = opts.production_upgrade;
    }

    this._fileBuffer = opts.file;
    this.registerHotPlugEvents();
  }

  onAttach = (devManager: IDeviceManager) => {
    if (
      devManager &&
      devManager instanceof Boxfish &&
      this._cameraManager['serialNumber'] === devManager['serialNumber']
    ) {
      this._cameraManager = devManager;
      this.emit('UPGRADE_REBOOT_COMPLETE');
    }
  };

  onDetach = (deviceSerial) => {
    if (this._cameraManager && deviceSerial === this._cameraManager['serialNumber']) {
      try {
        this._cameraManager.transport.close();
      } catch (e) {
        // Error on close is ok
      }
    }
    this.emit('UPGRADE_REBOOT');
  };

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
            receive: 'hcp/write_reply',
          },
          10000
        );
        const { status } = m;
        if (status !== 0) {
          throw new HPKUpgradeError(
            `Upload hpk failed with status ${status}`,
            ErrorCodes.UPGRADE_UPLOAD
          );
        }
        uploadStatusStep.progress = 100;
        this.emitProgressStatus();
        tryAgain = false;
      } catch (e) {
        Logger.error(`Failed uploading hpk file ${e} attemt ${attempt}`, e, 'Boxfish HPK Upgrader');
        attempt += 1;
      }
    }
    if (tryAgain && attempt >= MAX_UPLOAD_ATTEMPTS) {
      throw new HPKUpgradeError('Upgrading HPK: Could not upload hpk', ErrorCodes.UPGRADE_UPLOAD);
    }
  }

  async start(): Promise<void> {
    const firstUploadStatusStep = new UpgradeStatusStep('Uploading software', 5);
    const executingHpkStep = new UpgradeStatusStep('Executing upgrade package', 1);
    const runningHpkStep = new UpgradeStatusStep('Running upgrade procedures', 80);
    const rebootStep = new UpgradeStatusStep('Rebooting camera', 3);
    const secondUploadStatusStep = new UpgradeStatusStep('Uploading software to verify', 3);
    const executingHpkVerificationStep = new UpgradeStatusStep(
      'Executing verification of new software',
      1
    );
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
    Logger.debug('Starting Upgrade', 'Boxfish HPK Upgrader');
    this.emit(CameraEvents.UPGRADE_START);
    let upgradeTimoutId: NodeJS.Timer;
    this.once('UPGRADE_REBOOT_COMPLETE', async () => {
      Logger.debug('Camera successfully booted after upgrade', 'Boxfish HPK Upgrader');
      rebootStep.progress = 100;
      clearTimeout(upgradeTimoutId);
      try {
        Logger.debug('Verifying new software', 'Boxfish HPK Upgrader');
        this.emitProgressStatus('Verifying new software');
        // Wait two seconds to allow drivers to attach properly to the USB endpoint
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await this.doUpgrade(
          secondUploadStatusStep,
          executingHpkVerificationStep,
          runningHpkVerificationStep,
          rebootStep
        );
        Logger.debug('Upgrade Completed', 'Boxfish HPK Upgrader');
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
      Logger.debug('Loading new sw to the camera', 'Boxfish HPK Upgrader');
      this.emitProgressStatus('Loading new software to camera');
      const rebooted = await this.doUpgrade(
        firstUploadStatusStep,
        executingHpkStep,
        runningHpkStep,
        rebootStep
      );
      upgradeTimoutId = setTimeout(
        () =>
          this.emit(
            CameraEvents.UPGRADE_FAILED,
            new HPKUpgradeError('Did not come back after reboot', ErrorCodes.UPGRADE_REBOOT_FAILED)
          ),
        REBOOT_TIMEOUT
      );
      if (!rebooted) {
        clearTimeout(upgradeTimoutId);
        this.emit(CameraEvents.UPGRADE_COMPLETE);
      }
    } catch (e) {
      Logger.error('Upgrade failed', e, 'Boxfish HPK Upgrader');
      this.emit(CameraEvents.UPGRADE_FAILED, e);
      throw e;
    }
  }

  emitProgressStatus(statusString?: string) {
    if (statusString) this._upgradeStatus.statusString = statusString;
    this.emit(CameraEvents.UPGRADE_PROGRESS, this._upgradeStatus.getStatus());
  }

  async awaitHPKCompletion(
    completionStatusStep: UpgradeStatusStep,
    rebootStatusStep: UpgradeStatusStep
  ): Promise<boolean> {
    const reboot = await this._cameraManager.api.withSubscribe<boolean>(
      ['upgrader/status'],
      () =>
        new Promise((resolve, reject) => {
          const startTimeout = () => {
            return setTimeout(() => {
              Logger.debug(
                `Upgrade failure: no status message within ${this._statusMessageTimeout}`,
                'Boxfish HPK Upgrader'
              );
              reject(
                new HPKUpgradeError(
                  `Upgrading HPK: no status message within ${this._statusMessageTimeout}`,
                  ErrorCodes.UPGRADE_STATUS_TIMEOUT
                )
              );
            }, this._statusMessageTimeout);
          };

          let totalProgressPoints = 1;
          let elapsedPoints = 0;
          let messageTimeoutIt = startTimeout();
          let lastTime = Date.now();
          let lastOperation: undefined | string = undefined;
          this._cameraManager.transport.on('upgrader/status', async (message) => {
            clearTimeout(messageTimeoutIt);
            const statusMessage = Api.decode(message.payload, 'messagepack');
            totalProgressPoints = statusMessage.total_points || totalProgressPoints;
            if (statusMessage.operation === 'done' && statusMessage.reboot) {
              resolve(true);
              return;
            } else if (statusMessage.operation === 'done') {
              resolve(false);
              return;
            }
            if (statusMessage.error_count > 0) {
              return reject(
                new HPKUpgradeError(
                  `Failed during upgrade ${statusMessage}`,
                  ErrorCodes.UPGRADE_FAILED
                )
              );
            }
            const now = Date.now();
            const deltaT = now - lastTime;
            lastTime = now;
            elapsedPoints = statusMessage.elapsed_points || elapsedPoints;
            const progressPercentage = (elapsedPoints / totalProgressPoints) * 100;
            if (statusMessage.operation !== lastOperation || deltaT >= 1000) {
              Logger.info(
                `Upgrading HPK: Status: ${Math.round(progressPercentage)}% step ${
                  statusMessage.operation
                }\r`,
                'Boxfish HPK Upgrader'
              );
            }
            lastOperation = statusMessage.operation;
            completionStatusStep.operation = statusMessage.operation;
            completionStatusStep.progress =
              Math.ceil(progressPercentage) > 100 ? 100 : Math.ceil(progressPercentage);
            this.emitProgressStatus();

            messageTimeoutIt = startTimeout();
          });
        })
    );

    if (reboot) {
      Logger.debug('Rebooting camera after upgrade', 'Boxfish HPK Upgrader');
      rebootStatusStep.progress = 1;
      rebootStatusStep.operation = 'Issuing reboot command';
      await this._cameraManager.reboot();
      try {
        await this._cameraManager.transport.close();
      } catch (e) {
        Logger.error('Failed while closing the device on reboot', e, 'Boxfish HPK Upgrader');
      }
    }

    return reboot;
  }

  async runHPKScript(runStatusStep: UpgradeStatusStep): Promise<void> {
    Logger.debug('RUN hpk');
    runStatusStep.progress = 1;
    try {
      const runMessage = await this._cameraManager.api.sendAndReceiveMessagePack(
        { filename: 'upgrade.hpk' },
        {
          send: 'hpk/run',
          receive: 'hpk/run_reply',
        },
        15000
      );
      if (runMessage.string === 'Success') {
        Logger.debug('RUN hpk complete', 'Boxfish HPK Upgrader');
        runStatusStep.progress = 100;
        this.emitProgressStatus();
        return;
      } else {
        Logger.error(`HPK run failed ${JSON.stringify(runMessage)}`, '', 'Boxfish HPK Upgrader');
        throw new HPKUpgradeError(`run failed ${runMessage}`, ErrorCodes.UPGRADE_RUN_FAILED);
      }
    } catch (e) {
      Logger.error('Unable to run the hpk script', e, 'Boxfish HPK Upgrader');
      throw new HPKUpgradeError(`Could not run hpk ${e}`, ErrorCodes.UPGRADE_RUN_FAILED);
    }
  }

  async doUpgrade(
    uploadStatusStep: UpgradeStatusStep,
    runStatusStep: UpgradeStatusStep,
    completionStatusStep: UpgradeStatusStep,
    rebootStatusStep: UpgradeStatusStep
  ): Promise<boolean> {
    Logger.info('Upgrading HPK', 'Boxfish HPK Upgrader');
    const hpkBuffer = this._fileBuffer;
    try {
      if (!BoxfishHpk.isHpk(this._fileBuffer)) {
        throw new HPKUpgradeError(
          'HPK upgrader file is not a valid hpk file',
          ErrorCodes.UPGRADE_INVALID_FILE
        );
      }
      await this.upload(hpkBuffer, uploadStatusStep);
      const completedPromise = this.awaitHPKCompletion(completionStatusStep, rebootStatusStep);
      await this.runHPKScript(runStatusStep);
      return await completedPromise;
    } catch (e) {
      Logger.error('Failed performing hpk upgrade on boxfish device', e, 'Boxfish HPK Upgrader');
      this.deRegisterHotPlugEvents();
      throw e;
    }
  }

  async upgradeIsValid(): Promise<boolean> {
    try {
      const response = await this._cameraManager.getState();

      Logger.info(`Upgrade status ${response.string}`, 'Boxfish HPK Upgrader');
      if (response.status === 10) {
        // EMMC is not ready lets wait and try again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await this.upgradeIsValid();
      }
      if (!this._production_upgrade) {
        return response.status === 0;
      } else {
        // When flashing the boxfish-prod.hpk we can ignore the cnn emmc error
        return response.status === 0 || response.status === 3;
      }
    } catch (e) {
      return false;
    }
  }
}
