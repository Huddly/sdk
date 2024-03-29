import { EventEmitter } from 'events';

import IHuddlyDeviceAPI from '@huddly/sdk-interfaces/lib/interfaces/IHuddlyDeviceAPI';
import IHuddlyDeviceDiscoveryAPI from '@huddly/sdk-interfaces/lib/interfaces/IHuddlyDeviceDiscoveryAPI';
import IDeviceFactory from '@huddly/sdk-interfaces/lib/interfaces/IDeviceFactory';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import ILogger from '@huddly/sdk-interfaces/lib/interfaces/ILogger';
import IHuddlyService from '@huddly/sdk-interfaces/lib/interfaces/IHuddlyService';
import IServiceOpts from '@huddly/sdk-interfaces/lib/interfaces/IServiceOpts';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import { createFactory } from './components/device/factory';
import CameraEvents from './utilitis/events';
import Locksmith from './components/locksmith';
import Api from './components/api';
import sourceMapSupport from 'source-map-support';
import ErrorCodes from './error/errorCodes';
import AllDeviceDiscovery from './components/allDeviceDiscovery';
import ServiceFactory from './components/service/factory';
import AttachError from './error/AttachError';
import HuddlyHex from '@huddly/sdk-interfaces/lib/enums/HuddlyHex';

sourceMapSupport.install();

/**
 * The SDK initialization options.
 *
 * @interface SDKOpts
 */
interface SDKOpts {
  /**
   * Logger instance used to log messages from the SDK.
   *
   * @type {ILogger}
   * @memberof SDKOpts
   */
  logger?: ILogger;
  /**
   * Optional event emitter instance used to catch
   * SDK events!
   * See `utilitis/events` class for all possible events.
   *
   * @type {EventEmitter}
   * @memberof SDKOpts
   */
  emitter?: EventEmitter;

  /**
   * @ignore
   * @type {boolean}
   * @memberof SDKOpts
   */
  developmentMode?: boolean;

  /**
   * @ignore
   *
   * @type {EventEmitter}
   * @memberof SDKOpts
   */
  apiDiscoveryEmitter?: EventEmitter;

  /**
   * @ignore
   *
   * @type {string}
   * @memberof SDKOpts
   */
  serial?: string;

  /**
   * @ignore
   *
   * @returns {iDeviceFactory}
   * @memberof SDKOpts
   */
  createFactory?(): IDeviceFactory;
}

/**
 * @export
 *
 * @class HuddlySdk
 * @implements {SDK}
 */
class HuddlySdk extends EventEmitter {
  /**
   * Event Emitter instance used to fire SDK events such as
   * ATTACH and DETACH camera events. For a full list of events
   * please see `events` class.
   *
   * @type {EventEmitter}
   * @memberof HuddlySdk
   */
  emitter: EventEmitter;

  /**
   * @ignore
   *
   * @type {EventEmitter}
   * @memberof HuddlySdk
   */
  deviceDiscovery: EventEmitter;
  /**
   * @ignore
   *
   * @type {IHuddlyDeviceAPI}
   * @memberof HuddlySdk
   */
  _mainDeviceApi: IHuddlyDeviceAPI;

  /**
   * @ignore
   *
   * @type {Array<IHuddlyDeviceAPI>}
   * @memberof HuddlySdk
   */
  _deviceApis: Array<IHuddlyDeviceAPI>;

  /**
   * @ignore
   *
   * @type {IHuddlyDeviceDiscoveryAPI}
   * @memberof HuddlySdk
   */
  _deviceDiscoveryApi: IHuddlyDeviceDiscoveryAPI;

  /**
   * @ignore
   *
   * @type {any}
   * @memberof HuddlySdk
   */
  _deviceFactory;

  private locksmith: Locksmith;
  private targetSerial: string;
  private devMode: boolean;

  /**
   * Creates an instance of HuddlySdk.
   * @param {IHuddlyDeviceAPI} deviceDiscoveryApi The Huddly device-api used for discovering the device.
   * @param {Array<IHuddlyDeviceAPI>} [deviceApis] Optional list of device-apis used for communicating with the device.
   * By default it uses the `deviceDiscoveryApi` parameter as the device-api used for communication.
   * @param {SDKOpts} [opts] Options used for initializing the sdk. See `SDKOpts` interface.
   * @memberof HuddlySdk
   */
  constructor(
    deviceDiscoveryApi: IHuddlyDeviceDiscoveryAPI | Array<IHuddlyDeviceDiscoveryAPI>,
    deviceApis?: Array<IHuddlyDeviceAPI>,
    opts?: SDKOpts
  ) {
    super();
    if (!deviceDiscoveryApi) {
      throw new Error('A default device api should be provided to the sdk!');
    }

    if (Array.isArray(deviceDiscoveryApi)) {
      this._deviceDiscoveryApi = new AllDeviceDiscovery(deviceDiscoveryApi);
    } else {
      this._deviceDiscoveryApi = deviceDiscoveryApi;
    }

    if (!deviceApis || deviceApis.length === 0) {
      this.mainDeviceApi = deviceDiscoveryApi as IHuddlyDeviceAPI;
      this._deviceApis = new Array<IHuddlyDeviceAPI>();
      this._deviceApis.push(this.mainDeviceApi);
    } else {
      this._mainDeviceApi = deviceApis[0];
      this._deviceApis = deviceApis;
    }

    this.locksmith = new Locksmith();

    const options = {
      ...{
        apiDiscoveryEmitter: new EventEmitter(),
        emitter: this,
        createFactory: createFactory,
      },
      ...opts,
    };

    if (options.logger) {
      Logger.setLogger(options.logger);
    }

    this.deviceDiscovery = options.apiDiscoveryEmitter;
    this.emitter = options.emitter;
    this.targetSerial = options.serial;
    this._deviceFactory = options.createFactory();
    this.devMode = options.developmentMode;

    this.setupDeviceDiscoveryListeners();
    this._deviceDiscoveryApi.registerForHotplugEvents(this.deviceDiscovery);
  }

  /**
   * Sets up listeners for ATTACH and DETACH camera events on the
   * device discovery api.
   * Will emit instances of `IDeviceManager` when an ATTACH event occurs.
   * Will emit the device serial number when a DETACH event occurs.
   * @memberof HuddlySdk
   */
  setupDeviceDiscoveryListeners(): void {
    this.deviceDiscovery.on(CameraEvents.ATTACH, async (device) => {
      if (device && (!this.targetSerial || this.targetSerial === device.serialNumber)) {
        await this.locksmith.executeAsyncFunction(
          () =>
            new Promise<void>(async (resolve) => {
              try {
                const cameraManager: IDeviceManager = await this._deviceFactory.getDevice(
                  device.productId,
                  this.mainDeviceApi,
                  this.deviceApis,
                  device,
                  this.emitter
                );
                await cameraManager.initialize(this.devMode);
                this.emitter.emit(CameraEvents.ATTACH, cameraManager);
                resolve();
              } catch (error) {
                const errorMsg: string = `No transport implementation supported for ${JSON.stringify(
                  device
                )}`;
                Logger.warn(errorMsg, HuddlySdk.name);
                const eventPayload = {
                  device,
                  error: new AttachError(errorMsg, ErrorCodes.NO_TRANSPORT),
                  stack_trace: error,
                };
                this.emitter.emit(CameraEvents.ERROR, eventPayload);
                resolve();
              }
            })
        );
      }
    });

    this.deviceDiscovery.on(CameraEvents.DETACH, async (d) => {
      if (d !== undefined && (!this.targetSerial || this.targetSerial === d)) {
        await this.locksmith.executeAsyncFunction(
          () =>
            new Promise<void>((resolve) => {
              this.emitter.emit(CameraEvents.DETACH, d);
              resolve();
            })
        );
      }
    });
  }

  /**
   * Convenience function for setting the main device api
   * used for communicating with the camera.
   *
   * @memberof HuddlySdk
   */
  set mainDeviceApi(mainApi: IHuddlyDeviceAPI) {
    this._mainDeviceApi = mainApi;
  }

  /**
   * Convenience function for getting the main device api
   * used for communicating with the camera.
   *
   * @type {IHuddlyDeviceAPI}
   * @memberof HuddlySdk
   */
  get mainDeviceApi(): IHuddlyDeviceAPI {
    return this._mainDeviceApi;
  }

  /**
   * Convenience function for setting the list of
   * device apis which the SDK uses to establish
   * communication channels with the camera.
   *
   * @memberof HuddlySdk
   */
  set deviceApis(deviceApis: Array<IHuddlyDeviceAPI>) {
    this._deviceApis = deviceApis;
  }

  /**
   * Convenience function for getting the list of
   * device apis used to establish communication with
   * the camera.
   *
   * @type {Array<IHuddlyDeviceAPI>}
   * @memberof HuddlySdk
   */
  get deviceApis(): Array<IHuddlyDeviceAPI> {
    return this._deviceApis;
  }

  /**
   * Convenience function for setting the device api
   * instance used for camera discovery.
   *
   * @memberof HuddlySdk
   */
  set deviceDiscoveryApi(api: IHuddlyDeviceDiscoveryAPI) {
    this._deviceDiscoveryApi = api;
    this.deviceDiscoveryApi.registerForHotplugEvents(this.deviceDiscovery);
  }

  /**
   * Convenience function for getting the device api
   * instance used for camera discovery.
   *
   * @type { IHuddlyDeviceDiscoveryAPI}
   * @memberof HuddlySdk
   */
  get deviceDiscoveryApi(): IHuddlyDeviceDiscoveryAPI {
    return this._deviceDiscoveryApi;
  }

  /**
   * Initializes the device discovery api which in turn will fire
   * ATTACH events for all cameras attached to the system.
   *
   * @returns {Promise<any>} Returns a promise which resolves for
   * successful initialization or rejects otherwise.
   * @memberof HuddlySdk
   */
  async init(): Promise<any> {
    await this.deviceDiscoveryApi.initialize();
  }

  /**
   * Get a huddly service implementation class instance with communication channels already established and ready
   * to start sending and receiving information to/from.
   * @param {IServiceOpts} [serviceOpts] - Service options for initializing and setting up the service communication
   * @returns A the new instance of the huddly service implementation after the setup stage has been completed
   */
  static async getService(serviceOpts: IServiceOpts = {}): Promise<IHuddlyService> {
    const service: IHuddlyService = ServiceFactory.getService(serviceOpts);
    await service.init();
    return service;
  }

  /**
   * Get connected cameras using given device apis.
   *
   * Note that device apis might cache and control against already emitted cameras,
   * so if you're using one that already has emitted a connected camera it might not get emitted again.
   * @param discoveryApi Camera apis to use for discovery
   * @param excludeDevices Device exclusion list. Default is the Huddly poe-to-usb device
   * @returns A list of devices
   */
  static async getConnectedCameras(
    deviceApis: IHuddlyDeviceAPI[],
    excludeDevices: HuddlyHex[] = [HuddlyHex.BASE_PID]
  ): Promise<any[]> {
    return Promise.all(
      deviceApis.map(async (api: any) => {
        const cams = await api.deviceDiscoveryManager.deviceList(false, true);
        return cams.filter((device) => !excludeDevices.includes(device.productId));
      })
    );
  }
}

export { CameraEvents, Api };

export default HuddlySdk;
