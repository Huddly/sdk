import ITransport from '@huddly/sdk-interfaces/lib/interfaces/ITransport';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import IHuddlyDeviceAPI from '@huddly/sdk-interfaces/lib/interfaces/IHuddlyDeviceAPI';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import IDeviceFactory from '@huddly/sdk-interfaces/lib/interfaces/IDeviceFactory';
import IGrpcTransport from '@huddly/sdk-interfaces/lib/interfaces/IGrpcTransport';
import HuddlyHEX from '@huddly/sdk-interfaces/lib/enums/HuddlyHex';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

// Device Manager Imports
import HuddlyGo from './huddlygo';
import Boxfish from './boxfish';
import Dwarffish from './dwarffish';
import Clownfish from './clownfish';
import DartFish from './dartfish';
import Ace from './ace';
import See from './see';
import Smartbase from './smartbase';

import { EventEmitter } from 'events';
import SmartbaseAce from './smartbaseAce';
import SmartbaseSee from './smartbaseSee';

export function createFactory(): IDeviceFactory {
  return DeviceFactory;
}

/**
 * Factory class for controlling what device controller implementation is supported for the corresponding
 * device VendorID and ProductID.
 *
 * @export
 * @class DeviceFactory
 */
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
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>
  ): Promise<ITransport> {
    const mainTransport = await preferredDeviceApi.getValidatedTransport(device);
    if (mainTransport) {
      return mainTransport;
    }
    Logger.warn(
      'Transport init on main device api failed. Falling back to secondary device apis',
      'SDK DeviceFactory'
    );

    for (const deviceApi of secondaryDeviceApis) {
      const fallbackTransport = await deviceApi.getValidatedTransport(device);
      if (fallbackTransport) {
        return fallbackTransport;
      }
    }

    throw new Error(
      `Unable to find appropriate transport implementation for device: ${JSON.stringify(device)}`
    );
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
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>
  ): Promise<any> {
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
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>
  ): Promise<any> {
    if (await preferredDeviceApi.isHIDSupported(device)) {
      return preferredDeviceApi.getHIDAPIForDevice(device);
    }

    Logger.warn('Preferred device api does not support HID interface', 'SDK DeviceFactory');

    for (const deviceApi of secondaryDeviceApis) {
      if (await deviceApi.isHIDSupported(device)) {
        return deviceApi.getHIDAPIForDevice(device);
      }
    }
    throw new Error(
      `Unable to find appropriate HID interface for device: ${JSON.stringify(device)}`
    );
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
    cameraDiscoveryEmitter: EventEmitter
  ): Promise<IDeviceManager> {
    const transport = await this.getTransportImplementation(
      devInstance,
      preferredDeviceApi,
      secondaryDeviceApis
    );

    const uvcControlInterface = await this.getUVCControlInterface(
      devInstance,
      preferredDeviceApi,
      secondaryDeviceApis
    );

    let device: IDeviceManager;
    switch (productId) {
      case HuddlyHEX.GO_PID:
        const hidApi = await this.getHIDInterface(
          devInstance,
          preferredDeviceApi,
          secondaryDeviceApis
        );
        device = new HuddlyGo(
          devInstance,
          <IUsbTransport>transport,
          uvcControlInterface,
          hidApi,
          cameraDiscoveryEmitter
        );
        break;
      case HuddlyHEX.CLOWNFISH_PID:
        device = new Clownfish(
          devInstance,
          <IUsbTransport>transport,
          uvcControlInterface,
          cameraDiscoveryEmitter
        );
        break;
      case HuddlyHEX.BOXFISH_PID:
        device = new Boxfish(
          devInstance,
          <IUsbTransport>transport,
          uvcControlInterface,
          cameraDiscoveryEmitter
        );
        break;
      case HuddlyHEX.DWARFFISH_PID:
        device = new Dwarffish(
          devInstance,
          <IUsbTransport>transport,
          uvcControlInterface,
          cameraDiscoveryEmitter
        );
        break;
      case HuddlyHEX.DARTFISH_PID:
        device = new DartFish(
          devInstance,
          <IUsbTransport>transport,
          uvcControlInterface,
          cameraDiscoveryEmitter
        );
        break;
      case HuddlyHEX.L1_PID:
        device = new Ace(devInstance, <IGrpcTransport>transport, cameraDiscoveryEmitter);
        break;
      case HuddlyHEX.S1_PID:
        device = new See(devInstance, <IGrpcTransport>transport, cameraDiscoveryEmitter);
        break;
      case HuddlyHEX.SMARTBASE_PID:
        device = new Smartbase(devInstance, <IUsbTransport>transport, cameraDiscoveryEmitter);
      case HuddlyHEX.SMARTBASE_PID:
        device = new Smartbase(devInstance, <IUsbTransport>transport, cameraDiscoveryEmitter);
      case 0xa031:
        device = new SmartbaseAce(devInstance, <IUsbTransport>transport, cameraDiscoveryEmitter);
      case 0xa032:
        device = new SmartbaseSee(devInstance, <IUsbTransport>transport, cameraDiscoveryEmitter);
      default:
        throw new Error(`Unsupported Device. USB ProductId: ${productId}`);
    }
    return device;
  }
}
