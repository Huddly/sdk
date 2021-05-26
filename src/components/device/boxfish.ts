import { EventEmitter } from 'events';

import Api from './../api';
import DefaultLogger from './../../utilitis/logger';
import UvcBaseDevice from './uvcbase';
import IDeviceManager from './../../interfaces/iDeviceManager';
import IDetector from './../../interfaces/IDetector';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import DetectorOpts from './../../interfaces/IDetectorOpts';
import Locksmith from './../locksmith';
import CameraEvents from './../../utilitis/events';
import Detector from './../detector';
import { MinMaxDiagnosticsMessage, DiagnosticsMessageData } from '../diagnosticsMessageData';
import DiagnosticsMessage from '../diagnosticsMessage';
import { createBoxfishUpgrader } from './../upgrader/boxfishUpgraderFactory';
import BoxfishUpgrader from './../upgrader/boxfishUpgrader';
import InterpolationParams from './../../interfaces/InterpolationParams';
import AutozoomControlOpts from '../../interfaces/IAutozoomControlOpts';
import IAutozoomControl from '../../interfaces/IAutozoomControl';
import AutozoomControl from '../autozoomControl';
import ReleaseChannel from './../../interfaces/ReleaseChannelEnum';
import IUsbTransport from './../../interfaces/IUsbTransport';

const MAX_UPGRADE_ATTEMPT = 3;

export default class Boxfish extends UvcBaseDevice implements IDeviceManager {
  transport: IUsbTransport;
  _api: Api;
  uvcControlInterface: any;
  logger: DefaultLogger;
  locksmith: Locksmith;
  discoveryEmitter: EventEmitter;
  productName: string = 'Huddly IQ';

  constructor(
    uvcCameraInstance: any,
    transport: IUsbTransport,
    uvcControlInterface: any,
    logger: DefaultLogger,
    cameraDiscoveryEmitter: EventEmitter) {
    super(uvcCameraInstance, uvcControlInterface);

    this.transport = transport;
    this.uvcControlInterface = uvcControlInterface;
    this.logger = logger;
    this.locksmith = new Locksmith();
    this.discoveryEmitter = cameraDiscoveryEmitter;
  }

  get api(): Api {
    return this._api;
  }

  async initialize(): Promise<void> {
    this._api = new Api(this.transport, this.logger, this.locksmith);
    this.transport.init();
    try {
      this.transport.initEventLoop();
    } catch (e) {
      this.logger.error('Failed to init event loop when transport reset', e, 'Boxfish API');
    }
  }

  async closeConnection(): Promise<any> {
    return this.transport.close();
  }

  async getInfo(): Promise<any> {
    const info = await this.api.getCameraInfo();
    const status = {
      id: this['id'],
      serialNumber: this['serialNumber'],
      vendorId: this['vendorId'],
      productId: this['productId'],
      version: this.extractSemanticSoftwareVersion(info.softwareVersion),
      location: this['location'],
      ...info
    };
    if (this['pathName'] !== undefined) {
      status.pathName = this['pathName'];
    }
    return status;
  }

  extractSemanticSoftwareVersion(appVer: string) {
    return appVer.replace(/\D+-/, '');
  }

  async ensureAppMode(currentMode: string, timeout: number = 10000) {
    if (!currentMode || currentMode === 'app') return Promise.resolve();
    else {
      throw new Error(`Cannot set camera to app mode from ${currentMode} mode!`);
    }
  }

  async getErrorLog(timeout: number = 60000, retry: number = 1, allowLegacy: boolean = true): Promise<any> {
    return this.api.getErrorLog(timeout, retry, allowLegacy);
  }

  async eraseErrorLog(timeout: number = 60000): Promise<void> {
    await this.api.eraseErrorLog(timeout);
  }

  async getPowerUsage(): Promise<any> {
    const response = await this.api.sendAndReceiveMessagePack('',
      {
        send: 'get_power',
        receive: 'get_power_reply'
      }
    );
    return response;
  }

  async getTemperature(): Promise<any> {
    const response = await this.api.sendAndReceiveMessagePack('',
      {
        send: 'get_temperature',
        receive: 'get_temperature_reply'
      }
    );
    return response;
  }

  getPowerMonitorDiagnostics(powerUsage: any): Array<DiagnosticsMessage> {
    const minVoltage = 4.6;
    const maxVoltage = 5.25;
    const maxCurrent = 0.955;
    const minCurrent = 0;
    const voltageTip = 'Check your cables';


    let diagnostics = [];
    if (powerUsage.voltage) {
      const voltage = new MinMaxDiagnosticsMessage('Voltage',
        minVoltage, maxVoltage, powerUsage.voltage.min,
        powerUsage.voltage.max, powerUsage.voltage.curr, voltageTip, voltageTip);

      diagnostics  = [...diagnostics, voltage];
    }

    if (powerUsage.current) {
      const current = new MinMaxDiagnosticsMessage('Current',
        minCurrent, maxCurrent, powerUsage.current.min,
        powerUsage.current.max, powerUsage.current.curr, voltageTip, voltageTip);

        diagnostics  = [...diagnostics, current];
    }

    return diagnostics;
  }

  async getDiagnosticsInfo(): Promise<Array<DiagnosticsMessage>> {
    const message = await this.api.sendAndReceiveMessagePack('', {
      send: 'diagnostics/get_info',
      receive: 'diagnostics/get_info_reply',
    }, 3000);

    return [
      new DiagnosticsMessageData('USBMODE', 'USB Ok', message.usb),
    ];
  }

  async getDiagnostics(): Promise<Array<DiagnosticsMessage>> {
    const powerUsage = await this.getPowerUsage();

    const powerDiagnostics = this.getPowerMonitorDiagnostics(powerUsage);

    const infoDiagnostics = await this.getDiagnosticsInfo();

    return [...powerDiagnostics, ...infoDiagnostics];
  }

  async reboot(mode: string = 'app'): Promise<void> {
    await this.locksmith.executeAsyncFunction(async () => {
      await this.transport.clear();
      if (mode === 'mvusb') {
        this.transport.write('upgrader/mv_usb', Api.encode({}));
      } else {
        await this.transport.write('camctrl/reboot');
      }
    });
  }

  async uptime() {
    return this.api.getUptime();
  }

  async getUpgrader(): Promise<IDeviceUpgrader> {
    return createBoxfishUpgrader(this, this.discoveryEmitter, this.logger);
  }

  async createAndRunFsblUpgrade(opts: UpgradeOpts, deviceManager: IDeviceManager) {
    const upgrader = new BoxfishUpgrader(deviceManager, this.discoveryEmitter, this.logger);
    const mvusbFile = opts.file;
    const timeoutMs = opts.bootTimeout * 1000;

    return new Promise<void>((resolve, reject) => {
      const bootTimeout = setTimeout(() => {
        clearTimeout(bootTimeout);
        reject('Fsbl upgrade timed out');
      }, timeoutMs);

      upgrader.flashFsbl(mvusbFile).then(() => {
        clearTimeout(bootTimeout);
        resolve();
      });
    });
  }

  async createAndRunUpgrade(opts: UpgradeOpts, deviceManager: IDeviceManager, createNewUpgrader: boolean) {
    let upgrader: IDeviceUpgrader = opts.upgrader;
    if (!upgrader || createNewUpgrader) {
      upgrader = await createBoxfishUpgrader(deviceManager, this.discoveryEmitter, this.logger);
    }
    upgrader.init(opts);
    upgrader.start();
    return new Promise<void>((resolve, reject) => {
      upgrader.once(CameraEvents.UPGRADE_COMPLETE, async deviceManager => {
        const upgradeIsOk = await upgrader.upgradeIsValid();
        if (upgradeIsOk) {
          resolve();
        } else {
          reject({
            message: 'Upgrade status is not ok, run again',
            runAgain: true,
            deviceManager
          });
        }
      });
      upgrader.once(CameraEvents.UPGRADE_FAILED, (reason) => {
        this.logger.error('Upgrade Failed', reason, 'Boxfish API');
        reject(reason);
      });
      upgrader.once(CameraEvents.TIMEOUT, (reason) => {
        this.logger.error('Upgrader returned a timeout event', reason, 'Boxfish API');
        reject(reason);
      });
    });
  }

  async upgrade(opts: UpgradeOpts): Promise<any> {
    let upgradeAttempts = 0;
    return new Promise<void>((resolve, reject) => {
      const tryRunAgainOnFailure = async (deviceManager: IDeviceManager) => {
        try {
          await this.createAndRunUpgrade(opts, deviceManager, upgradeAttempts > 0);
          resolve();
        } catch (e) {
          if (e.runAgain && upgradeAttempts < MAX_UPGRADE_ATTEMPT) {
            upgradeAttempts += 1;
            this.logger.warn(`Upgrade failure! Retrying upgrade process nr ${upgradeAttempts}`, 'Boxfish API');
            tryRunAgainOnFailure(e.deviceManager);
          } else {
            this.logger.error('Failed performing a camera upgrade', e, 'Boxfish API');
            reject(e);
          }
        }
      };
      tryRunAgainOnFailure(this);
    });
  }

  async upgradeFsbl(opts: UpgradeOpts): Promise<any> {
      try {
        await this.createAndRunFsblUpgrade(opts, this);
        Promise.resolve();
      } catch (e) {
        this.logger.error('Failed performing a FSBL camera upgrade', e, 'Boxfish API');
        Promise.reject(e);
      }
  }

  getAutozoomControl(opts: AutozoomControlOpts): IAutozoomControl {
    return new AutozoomControl(this, this.logger, opts);
  }

  getDetector(opts?: DetectorOpts): IDetector {
    return new Detector(this, this.logger, opts);
  }

  async getState(): Promise<any> {
    const response = await this.api.sendAndReceiveMessagePack('',
      {
        send: 'camera/get_state',
        receive: 'camera/get_state_reply'
      }
    );
    return response;
  }

  async setInterpolationParams(params: InterpolationParams): Promise<any> {
    this.api.setInterpolationParameters(params);
  }

  async getInterpolationParams(): Promise<InterpolationParams> {
    return this.api.getInterpolationParameters();
  }

  async getLatestFirmwareUrl(releaseChannel: ReleaseChannel = ReleaseChannel.STABLE) {
    return this.api.getLatestFirmwareUrl('iq', releaseChannel);
  }
}
