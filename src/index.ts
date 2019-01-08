import { EventEmitter } from 'events';
import IHuddlyDeviceAPI from './interfaces/iHuddlyDeviceAPI';
import DefaultLogger from './utilitis/logger';
import DeviceFactory from './components/device/factory';
import CameraEvents from './utilitis/events';
import { queue } from './utilitis/taskqueue';

/**
 * The SDK initialization options.
 *
 * @interface SDKOpts
 */
interface SDKOpts {
  /**
   * Logger instance used to log messages from the SDK.
   *
   * @type {*}
   * @memberof SDKOpts
   */
  logger?: any;
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
   *
   * @type {EventEmitter}
   * @memberof SDKOpts
   */
  apiDiscoveryEmitter?: EventEmitter;
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
   * Logger instance used to log messages from the SDK.
   *
   * @type {DefaultLogger}
   * @memberof HuddlySdk
   */
  logger: DefaultLogger;

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
   * @type {IHuddlyDeviceAPI}
   * @memberof HuddlySdk
   */
  _deviceDiscoveryApi: IHuddlyDeviceAPI;

  private taskRunner: any;

  /**
   * Creates an instance of HuddlySdk.
   * @param {IHuddlyDeviceAPI} deviceDiscoveryApi The Huddly device-api used for discovering the device.
   * @param {Array<IHuddlyDeviceAPI>} [deviceApis] Optional list of device-apis used for communicating with the device.
   * By default it uses the `deviceDiscoveryApi` parameter as the device-api used for communication.
   * @param {SDKOpts} [opts] Options used for initializing the sdk. See `SDKOpts` interface.
   * @memberof HuddlySdk
   */
  constructor(deviceDiscoveryApi: IHuddlyDeviceAPI, deviceApis?: Array<IHuddlyDeviceAPI>, opts?: SDKOpts) {
    super();
    if (!deviceDiscoveryApi) {
      throw new Error('A default device api should be provided to the sdk!');
    }

    if (!deviceApis || deviceApis.length === 0) {
      this.mainDeviceApi = deviceDiscoveryApi;
      this._deviceApis = new Array<IHuddlyDeviceAPI>();
      this._deviceApis.push(deviceDiscoveryApi);
    } else {
      this._mainDeviceApi = deviceApis[0];
      this._deviceApis = deviceApis;
    }

    this.taskRunner = queue(1);

    const options = opts ? opts : {};

    this.deviceDiscovery = options.apiDiscoveryEmitter || new EventEmitter();
    this.emitter = options.emitter || this;
    this._deviceDiscoveryApi = deviceDiscoveryApi;
    this.logger = options.logger || new DefaultLogger(true);

    this.setupDeviceDiscoveryListeners();
    this._deviceDiscoveryApi.registerForHotplugEvents(this.deviceDiscovery);
  }

  /**
   * Sets up listeners for ATTACH and DETACH camera events on the
   * device discovery api. Will emit instances of `IDeviceManager`
   * when an ATTACH event occurs.
   *
   * @memberof HuddlySdk
   */
  setupDeviceDiscoveryListeners(): void {
    this.deviceDiscovery.on(CameraEvents.ATTACH, async (d) => {
      if (d) {
        const attachTask = async done => {
          const cameraManager = await DeviceFactory.getDevice(d.productId,
            this.logger, this.mainDeviceApi, this.deviceApis, d, this.emitter);
          this.emitter.emit(CameraEvents.ATTACH, cameraManager);
          done();
        };
        this.taskRunner.push(attachTask);
      }
    });

    this.deviceDiscovery.on(CameraEvents.DETACH, async (d) => {
      if (d) {
        const detachTask = async done => {
          this.emitter.emit(CameraEvents.DETACH, d);
          done();
        };

        this.taskRunner.push(detachTask);
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
  set deviceDiscoveryApi(api: IHuddlyDeviceAPI) {
    this._deviceDiscoveryApi = api;
    this.deviceDiscoveryApi.registerForHotplugEvents(this.deviceDiscovery);
  }

  /**
   * Convenience function for getting the device api
   * instance used for camera discovery.
   *
   * @type {IHuddlyDeviceAPI}
   * @memberof HuddlySdk
   */
  get deviceDiscoveryApi(): IHuddlyDeviceAPI {
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
}

export default HuddlySdk;
