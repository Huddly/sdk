import ITransport from './../../interfaces/iTransport';
import IUsbTransport from './../../interfaces/IUsbTransport';
import IHuddlyDeviceAPI from './../../interfaces/iHuddlyDeviceAPI';
import Logger from './../../utilitis/logger';
import IDeviceManager from './../../interfaces/iDeviceManager';
import IDeviceFactory from './../../interfaces/iDeviceFactory';
import IGrpcTransport from './../../interfaces/IGrpcTransport';
import HuddlyGo from './huddlygo';
import Boxfish from './boxfish';
import Dwarffish from './dwarffish';
import Clownfish from './clownfish';
import Ace from './ace';
import { EventEmitter } from 'events';

export const HUDDLY_VID = 0x2bd9;
export const HUDDLY_GO_PID = 0x11;
export const HUDDLY_BOXFISH_PID = 0x21;
export const HUDDLY_CLOWNFISH_PID = 0x31;
export const HUDDLY_DWARFFISH_PID = 0x51;
export const HUDDLY_L1_PID = 0x3E9; // 1001 for L1/Ace
export const HUDDLY_BASE_PID = 0xBA5E;

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
   * @returns {Promise<ITransportable>} Returns the transport implementation for the device used to talk
   * to the device
   * @memberof DeviceFactory
   */
  static async getTransportImplementation(
    device: any,
    preferredDeviceApi: IHuddlyDeviceAPI,
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>): Promise<ITransport> {
    const mainTransport = await preferredDeviceApi.getValidatedTransport(device);
    if (mainTransport) {
      return mainTransport;
    }
    Logger.warn('Transport init on main device api failed. Falling back to secondary device apis', 'SDK DeviceFactory');

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
   * @returns {Promise<any>} Returns the device class that is used for UVC controls
   * @memberof DeviceFactory
   */
  static async getUVCControlInterface(
    device: any,
    preferredDeviceApi: IHuddlyDeviceAPI,
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>): Promise<any> {

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
   * @returns {Promise<any>}  Returns the device class that is used for UVC controls
   * @memberof DeviceFactory
   */
  static async getHIDInterface(
    device: any,
    preferredDeviceApi: IHuddlyDeviceAPI,
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>): Promise<any> {
    if (await preferredDeviceApi.isHIDSupported(device)) {
      return preferredDeviceApi.getHIDAPIForDevice(device);
    }

    Logger.warn('Preferred device api does not support HID interface', 'SDK DeviceFactory');

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
    preferredDeviceApi: IHuddlyDeviceAPI,
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>,
    devInstance: any,
    cameraDiscoveryEmitter: EventEmitter): Promise<IDeviceManager> {
    const transport = await this.getTransportImplementation(
      devInstance,
      preferredDeviceApi,
      secondaryDeviceApis);

    const uvcControlInterface = await this.getUVCControlInterface(
      devInstance,
      preferredDeviceApi,
      secondaryDeviceApis);

    let device: IDeviceManager;
    switch (productId) {
      case HUDDLY_GO_PID:
        const hidApi = await this.getHIDInterface(devInstance, preferredDeviceApi, secondaryDeviceApis);
        device = new HuddlyGo(devInstance, <IUsbTransport>transport, uvcControlInterface, hidApi, cameraDiscoveryEmitter);
        break;
      case HUDDLY_CLOWNFISH_PID:
        device = new Clownfish(devInstance, <IUsbTransport>transport, uvcControlInterface, cameraDiscoveryEmitter);
        break;
      case HUDDLY_BOXFISH_PID:
        device = new Boxfish(devInstance, <IUsbTransport>transport, uvcControlInterface, cameraDiscoveryEmitter);
        break;
      case HUDDLY_DWARFFISH_PID:
        device = new Dwarffish(devInstance, <IUsbTransport>transport, uvcControlInterface, cameraDiscoveryEmitter);
        break;
      case HUDDLY_L1_PID:
        device = new Ace(devInstance, <IGrpcTransport>transport, cameraDiscoveryEmitter);
        break;
      default:
        throw new Error(`Unsupported Device. USB ProductId: ${productId}`);
    }
    return device;
  }
}
