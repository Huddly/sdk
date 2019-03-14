import ITransport from './iTransport';
import Api from './../components/api';
import IDeviceUpgrader from './IDeviceUpgrader';
import IDetector from './IDetector';
import UpgradeOpts from './IUpgradeOpts';
import DetectorOpts from './IDetectorOpts';
import { DiagnosticsMessage } from '../components/diagnosticsMessage';

/**
 * Interface used for performing actions on the camera.
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
   * Closes the communication channels with the camera in use.
   *
   * @returns {Promise<any>} Returns a promise which resolves for
   * successful connnection close or rejects otherwise.
   * @memberof IDeviceManager
   */
  closeConnection(): Promise<any>;

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

  /**
   * Get an `IDeviceUpgrader` object for the given device manager which can
   * be used to perform camera upgrades.
   *
   * @returns {Promise<IDeviceUpgrader>} Returns a promise with an instance of `IDeviceUpgrader` interface used for upgrading the camera.
   * @memberof HuddlySdk
   */
  getUpgrader(): Promise<IDeviceUpgrader>;

  /**
   * Convenience function for performing camera upgrade.
   *
   * @param {UpgradeOpts} opts Camera upgrade options
   * @returns {Promise <any>} Returns a promise which resolves for a
   * successful upgrade or rejects otherwise.
   * @memberof IDeviceManager
   */
  upgrade(opts: UpgradeOpts): Promise<any>;

  /**
   * Returns a new instance of the Detector class.
   * @param {DetectorOpts} opts Detector options
   * @returns {IDetector} Returns a new instance of the Detector class.
   * @memberof HuddlySdk
   */
  getDetector(opts: DetectorOpts): IDetector;


  /**
   * Reads data from camera and returns diagnostics information
   *
   * @returns an array of DiagnosticsMessages
   */
  getDiagnostics(): Promise<Array<DiagnosticsMessage>>;

  /**
   * Retrieves camera information such as name, serial number, software version etc.
   *
   * @returns {Promise<any>} A JSON representation of the camera state such as is genius framing enabled.
   * @memberof IDeviceManager
   */
  getState(): Promise<any>;
}
