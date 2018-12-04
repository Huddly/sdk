import { EventEmitter } from 'events';
import IHuddlyDeviceAPI from './interfaces/iHuddlyDeviceAPI';
import DefaultLogger from './utilitis/logger';
import DeviceFactory from './components/device/factory';
import CameraEvents from './utilitis/events';
import IDeviceManager from './interfaces/iDeviceManager';
import IDeviceUpgrader from './interfaces/IDeviceUpgrader';
import IDetector from './interfaces/IDetector';
import Detector from './components/detector';

/**
 * @ignore
 *
 * @class HuddlySdk
 * @implements {SDK}
 */
class HuddlySdk extends EventEmitter {
  emitter: EventEmitter;
  deviceDiscovery: EventEmitter;
  _mainDeviceApi: IHuddlyDeviceAPI;
  _deviceApis: Array<IHuddlyDeviceAPI>;
  _deviceDiscoveryApi: IHuddlyDeviceAPI;
  logger: DefaultLogger;

  constructor(opts: any, deviceDiscoveryApi: IHuddlyDeviceAPI, deviceApis: Array<IHuddlyDeviceAPI>, discoveryEmitter?: EventEmitter) {
    super();
    if (deviceApis.length === 0) {
      throw new Error('At least one Huddly Device API implementation must be provided!');
    }
    this.deviceDiscovery = discoveryEmitter ? discoveryEmitter : new EventEmitter();
    this.emitter = opts.eventEmitter || this;
    this._deviceDiscoveryApi = deviceDiscoveryApi;
    this.logger = opts.logger || new DefaultLogger(true);
    this._mainDeviceApi = deviceApis[0];
    this._deviceApis = deviceApis;

    this.setupDeviceDiscoveryListeners();
    this._deviceDiscoveryApi.registerForHotplugEvents(this.deviceDiscovery);
  }

  setupDeviceDiscoveryListeners(): void {
    this.deviceDiscovery.on(CameraEvents.ATTACH, async (d) => {
      if (d) {
        const cameraManager = await DeviceFactory.getDevice(d.productId,
          this.logger, this.mainDeviceApi, this.deviceApis, d);
        this.emitter.emit(CameraEvents.ATTACH, cameraManager);
      }
    });

    this.deviceDiscovery.on(CameraEvents.DETACH, async (d) => {
      if (d) {
        this.emitter.emit(CameraEvents.DETACH, d);
      }
    });
  }

  set mainDeviceApi(mainApi: IHuddlyDeviceAPI) {
    this._mainDeviceApi = mainApi;
  }

  get mainDeviceApi(): IHuddlyDeviceAPI {
    return this._mainDeviceApi;
  }

  set deviceApis(deviceApis: Array<IHuddlyDeviceAPI>) {
    this._deviceApis = deviceApis;
  }

  get deviceApis(): Array<IHuddlyDeviceAPI> {
    return this._deviceApis;
  }

  set deviceDiscoveryApi(api: IHuddlyDeviceAPI) {
    this._deviceDiscoveryApi = api;
    this.deviceDiscoveryApi.registerForHotplugEvents(this.deviceDiscovery);
  }

  get deviceDiscoveryApi(): IHuddlyDeviceAPI {
    return this._deviceDiscoveryApi;
  }

  async initialize(): Promise<any> {
    await this.deviceDiscoveryApi.initialize();
  }

  async closeConnection(): Promise<any> {
    throw new Error('Not implemented!');
  }

  /**
   * Get an `IDeviceUpgrader` object for the given device manager which can
   * be used to perform camera upgrades on target.
   *
   * @param {IDeviceManager} cameraManager A concrete implementation of `IDeviceManager` initialized
   * and ready to communicate with the device.
   * @returns {Promise<IDeviceUpgrader>} Returns an `IDeviceUpgrader` object used for upgrading the camera device.
   * @memberof HuddlySdk
   */
  async getUpgrader(cameraManager: IDeviceManager): Promise<IDeviceUpgrader> {
    const upgrader = await DeviceFactory.getDeviceUpgrader(cameraManager,
      this.emitter, this._mainDeviceApi, this._deviceApis, this.logger);
    return upgrader;
  }

  /**
   * Helper function for performing upgrade on device
   *
   * @param {IDeviceManager} cameraManager Instance of the device manager (Boxfish or HuddlyGo)
   * @param {*} opts Upgrade options (upgrade file path etc)
   * @memberof HuddlySdk
   */
  async upgrade(cameraManager: IDeviceManager, opts: any) {
    const upgrader = await this.getUpgrader(cameraManager);
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

  getDetector(cameraManager: IDeviceManager): IDetector {
    return new Detector(cameraManager, this.logger);
  }
}

export default HuddlySdk;
