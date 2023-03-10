import DiagnosticsMessage from '@huddly/sdk-interfaces/lib/abstract_classes/DiagnosticsMessage';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';
import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import DetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import UpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import { createBoxfishUpgrader } from '../upgrader/boxfishUpgraderFactory';
import CameraEvents from '../../utilitis/events';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';
import EventEmitter from 'events';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import Api from '../api';
import Locksmith from '../locksmith';
import HuddlyHEX from '@huddly/sdk-interfaces/lib/enums/HuddlyHex';
import AutozoomControl from '../autozoomControl';
import Detector from '../detector';

const MAX_UPGRADE_ATTEMPT = 3;

export default class Smartbase implements IDeviceManager {
  transport: IUsbTransport;
  locksmith: Locksmith;
  deviceInstance: any;
  uvcControlInterface: any;
  productName: string = 'Huddly Smartbase';
  _api: Api;
  /**
   * Event emitter instance emitting attach and detach events for Huddly Cameras.
   *
   * @type {EventEmitter}
   * @memberof Smartbase
   */
  discoveryEmitter: EventEmitter;

  /**
   * Creates an instance of Smartbase.
   * @param {IUsbTransport} transport The transport instance for communicating with the camera.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly cameras.
   * @memberof Smartbase
   */
  constructor(deviceInstance: any, transport: IUsbTransport, cameraDiscoveryEmitter: EventEmitter) {
    this.transport = transport;
    this.locksmith = new Locksmith();
    this.discoveryEmitter = cameraDiscoveryEmitter;
    this.deviceInstance = deviceInstance;
    this.uvcControlInterface = {};
    this.assignProductInfo();
  }

  assignProductInfo() {
    this['id'] = this.deviceInstance['id'];
    this['serialNumber'] = this.deviceInstance['serialNumber'];
    this['productId'] = this.deviceInstance['productId'];
  }

  get api(): Api {
    return this._api;
  }

  /**
   * Initializes the controller class. Must be called before any other commands.
   *
   * @return {*}  {Promise<void>} Void function. Use `await` when calling this method.
   * @memberof Boxfish
   */
  async initialize(): Promise<void> {
    this._api = new Api(this.transport, this.locksmith);
    this.transport.init();
    try {
      this.transport.initEventLoop();
    } catch (e) {
      Logger.error('Failed to init event loop when transport reset', e, 'Smartbase API');
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
      vendorId: this['vendorId'] || HuddlyHEX.VID,
      productId: this['productId'],
      version: this.extractSemanticSoftwareVersion(info.softwareVersion),
      location: this['location'],
      name: this.productName,
      ...info,
    };
    if (this['pathName'] !== undefined) {
      status.pathName = this['pathName'];
    }
    return status;
  }
  /** @ignore */
  extractSemanticSoftwareVersion(appVer: string) {
    return appVer.replace(/\D+-/, '');
  }

  /**
   * Get application log.
   *
   * @param {number} [timeout=60000] Maximum allowed time (in milliseconds) for fetching the log.
   * @param {number} [retry=1] Number of retries to perform in case something goes wrong.
   * @return {*}  {Promise<any>} A promise which when completed contains the camera application log.
   * @memberof Smartbase
   */
  async getErrorLog(timeout: number = 60000, retry: number = 1): Promise<any> {
    return this.api.getErrorLog(timeout, retry);
  }

  async eraseErrorLog(timeout: number = 60000): Promise<void> {
    await this.api.eraseErrorLog(timeout);
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

  getUpgrader(): Promise<IDeviceUpgrader> {
    throw new Error('Not supported for Smartbase.');
  }

  async uptime() {
    return this.api.getUptime();
  }

  upgrade(opts: UpgradeOpts): Promise<any> {
    let upgradeAttempts = 0;
    return new Promise<void>((resolve, reject) => {
      const tryRunAgainOnFailure = async (deviceManager: IDeviceManager) => {
        try {
          await this.createAndRunUpgrade(opts, deviceManager, upgradeAttempts > 0);
          resolve();
        } catch (e) {
          if (e.runAgain && upgradeAttempts < MAX_UPGRADE_ATTEMPT) {
            upgradeAttempts += 1;
            Logger.warn(
              `Upgrade failure! Retrying upgrade process nr ${upgradeAttempts}`,
              'Smartbase API'
            );
            tryRunAgainOnFailure(e.deviceManager);
          } else {
            Logger.error('Failed performing a camera upgrade', e, 'Smartbase API');
            reject(e);
          }
        }
      };
      tryRunAgainOnFailure(this);
    });
  }

  async createAndRunUpgrade(
    opts: UpgradeOpts,
    deviceManager: IDeviceManager,
    createNewUpgrader: boolean
  ) {
    let upgrader: IDeviceUpgrader = opts.upgrader;
    if (!upgrader || createNewUpgrader) {
      upgrader = await createBoxfishUpgrader(deviceManager, this.discoveryEmitter);
    }
    upgrader.init(opts);
    upgrader.start();
    return new Promise<void>((resolve, reject) => {
      upgrader.once(CameraEvents.UPGRADE_COMPLETE, async (deviceManager) => {
        const upgradeIsOk = await upgrader.upgradeIsValid();
        if (upgradeIsOk) {
          resolve();
        } else {
          reject({
            message: 'Upgrade status is not ok, run again',
            runAgain: true,
            deviceManager,
          });
        }
      });
      upgrader.once(CameraEvents.UPGRADE_FAILED, (reason) => {
        Logger.error('Upgrade Failed', reason, 'Boxfish API');
        reject(reason);
      });
      upgrader.once(CameraEvents.TIMEOUT, (reason) => {
        Logger.error('Upgrader returned a timeout event', reason, 'Boxfish API');
        reject(reason);
      });
    });
  }

  getAutozoomControl(opts: AutozoomControlOpts): ICnnControl {
    return new AutozoomControl(this, opts);
  }

  getFaceBasedExposureControl(): ICnnControl {
    throw new Error('Not supported for Smartbase.');
  }

  getDetector(opts?: DetectorOpts): IDetector {
    return new Detector(this, opts);
  }

  getDiagnostics(): Promise<DiagnosticsMessage[]> {
    throw new Error('Not supported for Smartbase.');
  }
  getState(): Promise<any> {
    throw new Error('Not supported for Smartbase.');
  }
  getPowerUsage(): Promise<any> {
    throw new Error('Not supported for Smartbase.');
  }
  getTemperature(): Promise<any> {
    throw new Error('Not supported for Smartbase.');
  }
  getLatestFirmwareUrl(releaseChannel: ReleaseChannel) {
    throw new Error('Not supported for Smartbase.');
  }
}
