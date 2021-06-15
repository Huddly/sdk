import EventEmitter from 'events';
import IHuddlyDeviceAPI from './iHuddlyDeviceAPI';
import IDeviceManager from './iDeviceManager';

/**
 * Factory that is used to create device
 * @ignore
 * @export
 * @interface iDeviceFactory
 */
export default interface IDeviceFactory {
  /**
   * Returns appropriate IDeviceManager with provided transport for the provided
   * devInstance object.
   * @param {number} productId A usb device product id to distinct betweern different huddly products
   * @param {IHuddlyDeviceAPI} preferredDeviceApi The main IHuddlyDeviceAPI used for communicating
   * with the camera
   * @param {Array<IHuddlyDeviceAPI>} secondaryDeviceApis Fallback IHuddlyDeviceAPI-s in case the
   * main interface does not work
   * @param {*} devInstance  An object that represents the usb device which is discovered
   * on the concrete implementation of the IHuddlyDeviceApi
   * @returns {Promise<IDeviceManager>} Returns a concrete implementation of the IDeviceManger
   */
  getDevice(
    productId: number,
    preferredDeviceApi: IHuddlyDeviceAPI,
    secondaryDeviceApis: Array<IHuddlyDeviceAPI>,
    devInstance: any,
    cameraDiscoveryEmitter: EventEmitter
  ): Promise<IDeviceManager>;
}
