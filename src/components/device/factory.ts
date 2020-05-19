import ITransport from './../../interfaces/iTransport';
import IHuddlyDeviceAPI from './../../interfaces/iHuddlyDeviceAPI';
import DefaultLogger from './../../utilitis/logger';
import IDeviceManager from './../../interfaces/iDeviceManager';
import IDeviceFactory from './../../interfaces/iDeviceFactory';
import HuddlyGo from './huddlygo';
import Boxfish from './boxfish';
import Dwarffish from './dwarffish';
import { EventEmitter } from 'events';

export const HUDDLY_GO_PID = 0x11;
export const HUDDLY_BOXFISH_PID = 0x21;
export const HUDDLY_DWARFFISH_PID = 0x51;

export function createFactory(): IDeviceFactory {
  return DeviceFactory;
}

export default class DeviceFactory {

  /**
   * Get a concrete transport implementation on the IHuddlyDeviceAPI
   *
   * @static
   * @param {*} device An object that reperesents the usb device which is discovered
   * on the concrete implementation of the IHuddlyDeviceAPI
   * @param {IHuddlyDeviceAPI} preferredDeviceApi The main IHuddlyDeviceAPI used for communicating
   * with the camera
   * @param {Array<IHuddlyDeviceAPI>} secondaryDeviceApis Fallback IHuddlyDeviceAPI-s in case the
   * main interface does not work
   * @param {DefaultLogger} logger The logger class used for logging messages on console
   * @returns {Promise<ITransportable>} Returns the transport implementation for the device used to talk
   * to the device
   * @memberof DeviceFactory
   */
  static async getTransportImplementation(
    device: any,
    preferredDeviceApi: IHuddlyDeviceAPI,
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>,
    logger: DefaultLogger): Promise<ITransport> {
    const mainTransport = await preferredDeviceApi.getValidatedTransport(device);
    if (mainTransport) {
      return mainTransport;
    }
    logger.warn('Transport init on main device api failed. Falling back to secondary device apis', 'SDK DeviceFactory');

    for (const deviceApi of secondaryDeviceApis) {
      const fallbackTransport = await deviceApi.getValidatedTransport(device);
      if (fallbackTransport) {
        return fallbackTransport;
      }
    }

    throw new Error(`Unable to find appropriate transport implementation for device: ${JSON.stringify(device)}`);
  }

  /**
   * Get an instance of the device which can be used to issue standard UVC control commands
   *
   * @static
   * @param {*} device An object that represents the usb device which is discovered
   * on the concrete implementation of the IHuddlyDeviceApi
   * @param {IHuddlyDeviceAPI} preferredDeviceApi The main IHuddlyDeviceAPI used for communicating
   * with the camera
   * @param {Array<IHuddlyDeviceAPI>} secondaryDeviceApis Fallback IHuddlyDeviceAPI-s in case the
   * main interface does not work
   * @param {DefaultLogger} logger The logger class used for logging messages on console
   * @returns {Promise<any>} Returns the device class that is used for UVC controls
   * @memberof DeviceFactory
   */
  static async getUVCControlInterface(
    device: any,
    preferredDeviceApi: IHuddlyDeviceAPI,
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>,
    logger: DefaultLogger): Promise<any> {

    if (await preferredDeviceApi.isUVCControlsSupported(device)) {
      return preferredDeviceApi.getUVCControlAPIForDevice(device);
    }

    /**
     * Main device api does not support uvc control interface
     */

    for (const deviceApi of secondaryDeviceApis) {
      if (await deviceApi.isUVCControlsSupported(device)) {
        return deviceApi.getUVCControlAPIForDevice(device);
      }
    }

    /**
     * None of the device api's support uvc control interface
     */
    return undefined;
  }

  /**
   * Get a HID api implementation for the device
   *
   * @static
   * @param {*} device An object that represents the usb device which is discovered
   * on the concrete implementation of the IHuddlyDeviceApi
   * @param {IHuddlyDeviceAPI} preferredDeviceApi  The main IHuddlyDeviceAPI used for communicating
   * with the camera
   * @param {Array<IHuddlyDeviceAPI>} secondaryDeviceApis Fallback IHuddlyDeviceAPI-s in case the
   * main interface does not work
   * @param {DefaultLogger} logger The logger class used for logging messages on console
   * @returns {Promise<any>}  Returns the device class that is used for UVC controls
   * @memberof DeviceFactory
   */
  static async getHIDInterface(
    device: any,
    preferredDeviceApi: IHuddlyDeviceAPI,
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>,
    logger: DefaultLogger): Promise<any> {
    if (await preferredDeviceApi.isHIDSupported(device)) {
      return preferredDeviceApi.getHIDAPIForDevice(device);
    }

    logger.warn('Preferred device api does not support HID interface', 'SDK DeviceFactory');

    for (const deviceApi of secondaryDeviceApis) {
      if (await deviceApi.isHIDSupported(device)) {
        return deviceApi.getHIDAPIForDevice(device);
      }
    }
    throw new Error(`Unable to find appropriate HID interface for device: ${JSON.stringify(device)}`);
  }

  /**
   * Function that selects the appropriate transport implementation and uvc control interface
   * and returns a concrete implementation of the IDeviceManager
   *
   * @static
   * @param {number} productId A usb device product id to distinct betweern different huddly products
   * @param {DefaultLogger} logger The logger class used for logging messages on console
   * @param {IHuddlyDeviceAPI} preferredDeviceApi The main IHuddlyDeviceAPI used for communicating
   * with the camera
   * @param {Array<IHuddlyDeviceAPI>} secondaryDeviceApis Fallback IHuddlyDeviceAPI-s in case the
   * main interface does not work
   * @param {*} devInstance  An object that represents the usb device which is discovered
   * on the concrete implementation of the IHuddlyDeviceApi
   * @returns {Promise<IDeviceManager>} Returns a concrete implementation of the IDeviceManger
   * @memberof DeviceFactory
   */
  static async getDevice(
    productId: number,
    logger: DefaultLogger,
    preferredDeviceApi: IHuddlyDeviceAPI,
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>,
    devInstance: any,
    cameraDiscoveryEmitter: EventEmitter,
    doInitialize: boolean = true): Promise<IDeviceManager> {
    const transport = await this.getTransportImplementation(
      devInstance,
      preferredDeviceApi,
      secondaryDeviceApis,
      logger);

    const uvcControlInterface = await this.getUVCControlInterface(
      devInstance,
      preferredDeviceApi,
      secondaryDeviceApis,
      logger);

    let device: IDeviceManager;
    switch (productId) {
      case HUDDLY_GO_PID:
        const hidApi = await this.getHIDInterface(devInstance, preferredDeviceApi, secondaryDeviceApis, logger);
        device = new HuddlyGo(devInstance, transport, uvcControlInterface, hidApi, logger, cameraDiscoveryEmitter);
        break;
      case HUDDLY_BOXFISH_PID:
        device = new Boxfish(devInstance, transport, uvcControlInterface, logger, cameraDiscoveryEmitter);
        break;
      case HUDDLY_DWARFFISH_PID:
        device = new Dwarffish(devInstance, transport, uvcControlInterface, logger, cameraDiscoveryEmitter);
        break;
      default:
        throw new Error(`Unsupported Device. USB ProductId: ${productId}`);
    }
    if (doInitialize) await device.initialize();
    return device;
  }
}
