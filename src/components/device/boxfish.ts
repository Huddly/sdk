import Api from './../api';
import DefaultLogger from './../../utilitis/logger';
import UvcBaseDevice from './uvcbase';
import ITransport from './../../interfaces/iTransport';
import IDeviceManager from './../../interfaces/iDeviceManager';
import IDetector from './../../interfaces/IDetector';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import Locksmith from './../locksmith';
import CameraEvents from './../../utilitis/events';
import Detector from './../detector';
import { EventEmitter } from 'events';
import BoxfishUpgrader from './../upgrader/boxfishUpgrader';

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
    return new BoxfishUpgrader(this, this.discoveryEmitter, this.logger);
  }

  async upgrade(opts: UpgradeOpts): Promise<any> {
    const upgrader = await this.getUpgrader();
    upgrader.init(opts);
    upgrader.start();
    return new Promise((resolve, reject) => {
      upgrader.once(CameraEvents.UPGRADE_COMPLETE, () => {
        resolve();
      });
      upgrader.once(CameraEvents.UPGRADE_FAILED, (reason) => {
        reject(reason);
      });
      upgrader.once(CameraEvents.TIMEOUT, (reason) => {
        reject(reason);
      });
    });
  }

  getDetector(): IDetector {
    return new Detector(this, this.logger);
  }
}
