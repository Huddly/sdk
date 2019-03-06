import Api from './../api';
import DefaultLogger from './../../utilitis/logger';
import UvcBaseDevice from './uvcbase';
import ITransport from './../../interfaces/iTransport';
import IDeviceManager from './../../interfaces/iDeviceManager';
import IDetector from './../../interfaces/IDetector';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import DetectorOpts from './../../interfaces/IDetectorOpts';
import Locksmith from './../locksmith';
import CameraEvents from './../../utilitis/events';
import Detector from './../detector';
import { MinMaxDiagnosticsMessage, DiagnosticsMessage  } from '../diagnosticsMessage';
import { EventEmitter } from 'events';
import { createBoxfishUpgrader } from './../upgrader/boxfishUpgraderFactory';

const MAX_UPGRADE_ATTEMT = 3;
export default class Boxfish extends UvcBaseDevice implements IDeviceManager {
  transport: ITransport;
  _api: Api;
  uvcControlInterface: any;
  logger: DefaultLogger;
  locksmith: Locksmith;
  discoveryEmitter: EventEmitter;

  constructor(
    uvcCameraInstance: any,
    transport: ITransport,
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
    this.transport.on('TRANSPORT_RESET', () => {
      this.transport.init();
      try {
        this.transport.initEventLoop();
      } catch (e) {
        this.logger.warn('Failed to init event loop when transport reset');
      }
    });
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

  async getErrorLog(): Promise<any> {
    return this.api.getErrorLog();
  }

  async eraseErrorLog(): Promise<void> {
    await this.api.eraseErrorLog();
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

    const voltage = new MinMaxDiagnosticsMessage('Voltage',
      minVoltage, maxVoltage, powerUsage.voltage.min,
      powerUsage.voltage.max, powerUsage.voltage.curr);
    return [voltage];
  }

  async getDiagnostics(): Promise<Array<DiagnosticsMessage>> {
    const powerUsage = await this.getPowerUsage();

    const powerDiagnostics = this.getPowerMonitorDiagnostics(powerUsage);

    return powerDiagnostics;
  }

  async reboot(mode: string = 'app'): Promise<void> {
    await this.locksmith.executeAsyncFunction(async () => {
      await this.transport.clear();
      if (mode === 'mvusb') {
        await this.api.sendAndReceiveWithoutLock('upgrader/mv_usb', { args: {} });
      }
      await this.transport.write('camctrl/reboot');
    });
  }

  async uptime() {
    return this.api.getUptime();
  }

  async getUpgrader(): Promise<IDeviceUpgrader> {
    return createBoxfishUpgrader(this, this.discoveryEmitter, this.logger);
  }

  async createAndRunUpgrade(opts: UpgradeOpts, deviceManager: IDeviceManager) {
    const upgrader = await createBoxfishUpgrader(deviceManager, this.discoveryEmitter, this.logger);
    upgrader.init(opts);
    upgrader.start();
    return new Promise((resolve, reject) => {
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
        this.logger.error(`UPGRADE FAILED ${reason}`);
        reject(reason);
      });
      upgrader.once(CameraEvents.TIMEOUT, (reason) => {
        reject(reason);
      });
    });
  }

  async upgrade(opts: UpgradeOpts): Promise<any> {
    let upgradeAttepmts = 0;
    return new Promise((resolve, reject) => {
      const tryRunAgainOnFailure = async (deviceManager: IDeviceManager) => {
        try {
          await this.createAndRunUpgrade(opts, deviceManager);
          resolve();
        } catch (e) {
          if (e.runAgain && upgradeAttepmts < MAX_UPGRADE_ATTEMT) {
            upgradeAttepmts += 1;
            tryRunAgainOnFailure(e.deviceManager);
          } else {
            reject(e);
          }
        }
      };
      tryRunAgainOnFailure(this);
    });
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
}
