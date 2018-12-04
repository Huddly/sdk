import ITransport from './iTransport';
import Api from './../components/api';

/**
 * Class used to interact with specific Huddly Devices.
 *
 * @export
 * @interface IDeviceManager
 */
export default interface IDeviceManager {
  /**
   * The transport implementation used to communicate with the device.
   *
   * @type {ITransport}
   * @memberof IDeviceManager
   */
  transport: ITransport;

  /**
   * Utility class used to perform different actions on the device.
   *
   * @type {Api}
   * @memberof IDeviceManager
   */
  api: Api;

  /**
   * Device interface that is used to perform standard UVC-XU control actions on
   * the device such as Zoom, Pan, Tilt, Brightness etc.
   *
   * @type {*}
   * @memberof IDeviceManager
   */
  uvcControlInterface: any;

  /**
   * Utility class used to log messages (used for debugging purposes). Required
   * class/object methods are "info", "warn" and "error" with each method
   * having a string parameter that describes the log message!
   *
   * @type {any}
   * @memberof IDeviceManager
   */
  logger: any;

  /**
   * Class initialization function.
   *
   * @returns {Promise<void>}
   * @memberof IDeviceManager
   */
  initialize(): Promise<void>;

  /**
   * Retrieves camera information such as name, serial number, software version etc.
   *
   * @returns {Promise<any>} A JSON representation of the camera information.
   * @memberof IDeviceManager
   */
  getInfo(): Promise<any>;

  /**
   * Retrieves the camera log.
   *
   * @returns {Promise<any>} A UTF8 string representation of the camera log.
   * @memberof IDeviceManager
   */
  getErrorLog(): Promise<any>;

  /**
   * Perform an erase action on the camera log.
   *
   * @returns {Promise<void>}
   * @memberof IDeviceManager
   */
  eraseErrorLog(): Promise<void>;

  /**
   * Reboots the camera into a specific mode.
   *
   * @param {string} [mode] The desired mode used by the camera  after rebooting.
   * @returns {Promise<void>}
   * @memberof IDeviceManager
   */
  reboot(mode?: string): Promise<void>;
}
