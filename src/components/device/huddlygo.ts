import { EventEmitter } from 'events';

import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import UpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import InterpolationParams from '@huddly/sdk-interfaces/lib/interfaces/IInterpolationParams';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';
import HuddlyHEX from '@huddly/sdk-interfaces/lib/enums/HuddlyHex';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import Api from '../api';
import UvcBaseDevice from './uvcbase';
import Locksmith from './../locksmith';
import CameraEvents from './../../utilitis/events';
import HuddlyGoUpgrader from './../upgrader/huddlygoUpgrader';
import DiagnosticsMessage from '@huddly/sdk-interfaces/lib/abstract_classes/DiagnosticsMessage';
import { MinMaxDiagnosticsMessage } from '../diagnosticsMessageData';

const FETCH_UX_CONTROLS_ATTEMPTS = 10;

/**
 * @ignore
 */
const round = (number: number, decimals: number): number => {
  const factor: number = 10 ** decimals;
  return Math.round(number * factor) / factor;
};

/**
 * @ignore
 */
const parseSoftwareVersion = (versionInfo) => {
  if (versionInfo === null) return '0.0.4';
  const appVersionBuffer = versionInfo.slice(1, 4); // First byte is unused
  appVersionBuffer.reverse(); // Least signiticant first. ask Torleiv
  const appVersion = appVersionBuffer.join('.'); // Make it semver
  const bootVersionBuffer = versionInfo.slice(5, 8); // First byte is unused
  bootVersionBuffer.reverse();
  const bootVersion = bootVersionBuffer.join('.');
  return { mv2_boot: bootVersion, mv2_app: appVersion };
};

/**
 * Controller class for HuddlyGO camera.
 *
 * @export
 * @class HuddlyGo
 * @extends {UvcBaseDevice}
 * @implements {IDeviceManager}
 */
export default class HuddlyGo extends UvcBaseDevice implements IDeviceManager {
  /**
   * Transport instance for communicating with cameras (sending command and reading data)
   *
   * @type {IUsbTransport}
   * @memberof HuddlyGo
   */
  transport: IUsbTransport;
  /**
   * Common Api wrapper class for invoking common functionality across device controller classes.
   *
   * @type {Api}
   * @memberof HuddlyGo
   */
  api: Api;
  /**
   * The uvc control interface for sending standard uvc commands to camera.
   *
   * @type {*}
   * @memberof HuddlyGo
   */
  uvcControlInterface: any;
  /**
   * Node HID API used aiding the upgrade process on Huddly GO.
   *
   * @type {*}
   * @memberof HuddlyGo
   */
  hidApi: any;
  /**
   * @ignore
   * @type {Locksmith}
   * @memberof HuddlyGo
   */
  locksmith: Locksmith;
  /**
   * Camera software version.
   *
   * @type {*}
   * @memberof HuddlyGo
   */
  softwareVersion: any;
  /**
   * Event emitter instance emitting attach and detach events for Huddly Cameras.
   *
   * @type {EventEmitter}
   * @memberof HuddlyGo
   */
  discoveryEmitter: EventEmitter;
  /**
   * Comercial product name for this controller class.
   *
   * @type {string}
   * @memberof HuddlyGo
   */
  productName: string = 'Huddly GO';

  /**
   * Creates an instance of HuddlyGo.
   * @param {*} uvcCameraInstance Uvc camera instance acquired from device-api-uvc discovery manager.
   * @param {IUsbTransport} transport The transport instance for communicating with the camera.
   * @param {*} uvcControlInterface Uvc control interface for performing standard uvc control commands.
   * @param {*} hidAPI HID instance used for performing sw upgrade.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly cameras.
   * @memberof HuddlyGo
   */
  constructor(
    uvcCameraInstance: any,
    transport: IUsbTransport,
    uvcControlInterface: any,
    hidAPI: any,
    cameraDiscoveryEmitter: EventEmitter
  ) {
    super(uvcCameraInstance, uvcControlInterface);

    this.transport = transport;
    this.uvcControlInterface = uvcControlInterface;
    this.hidApi = hidAPI;
    this.locksmith = new Locksmith();
    this.discoveryEmitter = cameraDiscoveryEmitter;
  }

  /**
   * Initializes the controller class. Must be called before any other commands.
   *
   * @return {*}  {Promise<void>} Void function. Use `await` when calling this method.
   * @memberof HuddlyGo
   */
  async initialize(): Promise<void> {
    this.api = new Api(this.transport, this.locksmith);
    this.softwareVersion = await this.getSoftwareVersion();
  }

  /**
   * Teardown function for cleaning up the state.
   *
   * @return {*}  {Promise<any>} Promise that carries out the teardown step.
   * @memberof HuddlyGo
   */
  async closeConnection(): Promise<any> {
    return this.transport.close();
  }

  /**
   * Fetches firmware version from target/camera.
   *
   * @param {*} [retryAttempts=FETCH_UX_CONTROLS_ATTEMPTS] Number of attemts to retry in case the command fails.
   * @return {*} The retrieved firmware version running on target.
   * @memberof HuddlyGo
   */
  async getSoftwareVersion(retryAttempts = FETCH_UX_CONTROLS_ATTEMPTS) {
    let fetchAttemts = 0;
    let err;
    do {
      try {
        fetchAttemts += 1;
        const versionInfo = await this.getXUControl(19);
        const softwareVersion = parseSoftwareVersion(versionInfo);
        return softwareVersion;
      } catch (e) {
        err = e;
        Logger.error(
          `Failed parsing/reading the software version on GO! Retry Attempts left: ${
            fetchAttemts - retryAttempts
          }`,
          e,
          'HuddlyGO API'
        );
      }
    } while (fetchAttemts < retryAttempts);
    Logger.error('Unable to retrieve software version from camera!', err, 'HuddlyGO API');
    throw new Error('Failed to retrieve software version from camera');
  }

  /**
   * Get device software and hardware information.
   *
   * @return {*}  {Promise<any>} Object representing software & hardware info of the camera. Function must be awaited.
   * @memberof HuddlyGo
   */
  async getInfo(): Promise<any> {
    const status = this.uvcCamera;
    status.softwareVersion = this.softwareVersion;
    status.temperature = await this.getTemperature();
    status.powerUsage = await this.getPowerUsage();
    status.version = this.softwareVersion.mv2_app;
    status.vendorId = this['vendorId'] || HuddlyHEX.VID;
    status.name = this.productName;
    status.productId = this['productId'] || HuddlyHEX.GO_PID;
    //    status.uptime = await this.uptime();
    return status;
  }

  /**
   * Make sure the camera is running on application mode (which is the default mode).
   *
   * @param {string} currentMode Current mode on camera.
   * @return {*}  {Promise<any>} Resolves when the camera boots in app mode.
   * @memberof HuddlyGo
   */
  async ensureAppMode(currentMode: string, timeout?: number): Promise<any> {
    if (!currentMode || currentMode === 'app') return Promise.resolve();
    else {
      throw new Error(`Cannot set camera to app mode from ${currentMode} mode!`);
    }
  }

  /**
   * Get application log.
   *
   * @param {number} [timeout=60000] Maximum allowed time (in milliseconds) for fetching the log.
   * @return {*}  {Promise<any>} A promise which when completed contains the camera application log.
   * @memberof HuddlyGo
   */
  async getErrorLog(timeout: number = 60000): Promise<any> {
    return this.api.getErrorLog(timeout);
  }

  /**
   * Erases the application log.
   *
   * @param {number} [timeout=60000] Maximum allowed time (in milliseconds) for erasing the log.
   * @return {*}  {Promise<void>} Resolves when the erase is completed.
   * @memberof HuddlyGo
   */
  async eraseErrorLog(timeout: number = 60000): Promise<void> {
    await this.api.eraseErrorLog(timeout);
  }

  /**
   * Get current power usage on the camera.
   *
   * @return {*} An object containing voltage, current and power usage on camera. Method must be awaited.
   * @memberof HuddlyGo
   */
  async getPowerUsage() {
    const buffVal = await this.getXUControl(3);
    let ret;
    if (buffVal) {
      ret = {
        voltage: {
          min: round(buffVal.readFloatLE(0), 3),
          curr: round(buffVal.readFloatLE(4), 3),
          max: round(buffVal.readFloatLE(8), 3),
        },
        current: {
          min: round(buffVal.readFloatLE(12), 3),
          curr: round(buffVal.readFloatLE(16), 3),
          max: round(buffVal.readFloatLE(20), 3),
        },
        power: {
          min: round(buffVal.readFloatLE(24), 3),
          curr: round(buffVal.readFloatLE(28), 3),
          max: round(buffVal.readFloatLE(32), 3),
        },
      };
    }
    return ret;
  }

  /**
   * Get current temperature on the camera.
   *
   * @return {*} An object containig internal and external temperature values.
   * @memberof HuddlyGo
   */
  async getTemperature() {
    const buffVal = await this.getXUControl(2);
    let ret;
    if (buffVal) {
      ret = {
        internal: {
          curr: round(buffVal.readFloatLE(0), 2),
          min: round(buffVal.readFloatLE(4), 2),
          max: round(buffVal.readFloatLE(8), 2),
        },
        external: {
          curr: round(buffVal.readFloatLE(12), 2),
          min: round(buffVal.readFloatLE(16), 2),
          max: round(buffVal.readFloatLE(20), 2),
        },
      };
    }
    return ret;
  }

  /**
   * @ignore
   * Get power monitoring diagnostics (voltage and current).
   *
   * @param {*} powerUsage Power usage data retrieved from camera
   * @return {*}  {Array<DiagnosticsMessage>} Diagnostics array.
   * @memberof HuddlyGo
   */
  getPowerMonitorDiagnostics(powerUsage: any): Array<DiagnosticsMessage> {
    const minVoltage = 4.6;
    const maxVoltage = 5.25;
    const maxCurrent = 0.955;
    const minCurrent = 0;
    const voltageTip = 'Check your cables';

    const voltage = new MinMaxDiagnosticsMessage(
      'Voltage',
      minVoltage,
      maxVoltage,
      powerUsage.voltage.min,
      powerUsage.voltage.max,
      powerUsage.voltage.curr,
      voltageTip,
      voltageTip
    );

    const current = new MinMaxDiagnosticsMessage(
      'Current',
      minCurrent,
      maxCurrent,
      powerUsage.current.min,
      powerUsage.current.max,
      powerUsage.current.curr,
      voltageTip,
      voltageTip
    );
    return [voltage, current];
  }

  /**
   * Get diagnostics for power usage on camera
   *
   * @return {*}  {Promise<Array<DiagnosticsMessage>>} An array of data representing the power usage diagnostics.
   * @memberof HuddlyGo
   */
  async getDiagnostics(): Promise<Array<DiagnosticsMessage>> {
    const powerUsage = await this.getPowerUsage();

    const powerDiagnostics = this.getPowerMonitorDiagnostics(powerUsage);

    return powerDiagnostics;
  }

  /**
   * Get white balance/point adjustment information.
   *
   * @return {*} An object representing the white balance/point adjustment for red and blue channels.
   * @memberof HuddlyGo
   */
  async getWhitePointAdjust() {
    const buffVal = await this.getXUControl(4);
    let ret;
    if (buffVal) {
      ret = {
        red: round(buffVal.readFloatLE(0), 3),
        blue: round(buffVal.readFloatLE(4), 3),
      };
    }
    return ret;
  }

  /**
   * Soft boot camera.
   *
   * @param {string} mode Tell the camera which mode to boot to.
   * @return {*}  {Promise<void>} Void function. Use `await` when calling this method.
   * @memberof HuddlyGo
   */
  async reboot(mode: string): Promise<void> {
    let bootValue;
    switch (mode) {
      case 'bl':
        bootValue = 0x1399;
        break;
      case 'app':
      default:
        bootValue = 0x3;
        break;
    }
    await this.transport.stopEventLoop();
    await this.setXUControl(17, 0x3974);
    await this.setXUControl(17, bootValue);
  }

  /**
   * @ignore
   * Sets camera mode on camera.
   *
   * @param {*} mode New mode
   * @memberof HuddlyGo
   */
  async setCameraMode(mode) {
    if (mode === undefined || mode === null) {
      throw new Error('camera mode undefined');
    }
    let cameraMode = 0;
    switch (mode) {
      case 'normal':
        cameraMode = 0;
        break;
      case 'dual':
        cameraMode = 1;
        break;
      case 'high-res':
        cameraMode = 2;
        break;
      default:
        throw new Error(`Unknown camera mode ${mode}`);
    }
    await this.setXUControl(1, 0x3974);
    await this.setXUControl(1, 0x8eb0);
    await this.setXUControl(1, cameraMode);
    await this.reboot('app');
  }

  /**
   * @ignore
   * Get the current camera mode on camera.
   *
   * @return {*} Current camera mode.
   * @memberof HuddlyGo
   */
  async getCameraMode() {
    const xuCtrl = 1;
    const buffer = await this.getXUControl(xuCtrl);
    if (!buffer) {
      return 'normal';
    }
    switch (buffer.readUIntLE(0, 2)) {
      case 0x00:
        return 'normal';
      case 0x01:
        return 'dual';
      case 0x02:
        return 'high-res';
      default:
        return 'unknown';
    }
  }

  /**
   * Get camera uptime
   *
   * @return {*}  {Promise<number>} Resolves with the uptime information (double in milliseconds)
   * @memberof HuddlyGo
   */
  async uptime(): Promise<number> {
    return this.api.getUptime();
  }

  /**
   * Helper function for getting the respective upgrader controller class for upgrading Huddly GO
   *
   * @return {*}  {Promise<IDeviceUpgrader>} The upgrader controll instance.
   * @memberof HuddlyGo
   */
  async getUpgrader(): Promise<IDeviceUpgrader> {
    return new HuddlyGoUpgrader(this, this.discoveryEmitter, this.hidApi);
  }

  /**
   * Performs software upgrade (async) on Huddly GO
   *
   * @param {UpgradeOpts} opts Upgrade options for performing the upgrade
   * @return {*}  {Promise<any>} Resolves when the upgrade is completed. Rejects if something goes wrong.
   * @memberof HuddlyGo
   */
  async upgrade(opts: UpgradeOpts): Promise<any> {
    const upgrader = await this.getUpgrader();
    upgrader.init(opts);
    upgrader.start();
    return new Promise<void>((resolve, reject) => {
      upgrader.once(CameraEvents.UPGRADE_COMPLETE, () => {
        resolve();
      });
      upgrader.once(CameraEvents.UPGRADE_FAILED, (reason) => {
        Logger.error('Upgrade Failed', reason, 'HuddlyGO API');
        reject(reason);
      });
      upgrader.once(CameraEvents.TIMEOUT, (reason) => {
        Logger.error('Upgrader returned a timeout event', reason, 'HuddlyGO API');
        reject(reason);
      });
    });
  }

  /**
   * @ignore
   * Not supported for Huddly GO
   *
   * @memberof HuddlyGo
   */
  getAutozoomControl(): ICnnControl {
    Logger.warn('Attempting to call method [getAutozoomControl] on HuddlyGO', 'HuddlyGO API');
    throw new Error('Autozoom is not supported on Huddly GO cameras!');
  }

  /**
   * @ignore
   * Not supported for Huddly GO
   *
   * @memberof HuddlyGo
   */
  getFaceBasedExposureControl(): ICnnControl {
    Logger.warn(
      'Attempting to call method [getFaceBasedExposureControl] on HuddlyGO',
      'HuddlyGO API'
    );
    throw new Error('FaceBased  is not supported on Huddly GO cameras!');
  }

  /**
   * @ignore
   * Not supported for Huddly GO
   *
   * @memberof HuddlyGo
   */
  getDetector(): IDetector {
    Logger.warn('Attempting to call method [getDetector] on HuddlyGO', 'HuddlyGO API');
    throw new Error('Detections are not supported on Huddly GO camera!');
  }

  /**
   * @ignore
   * Not supported for Huddly GO
   *
   * @memberof HuddlyGo
   */
  getState(): Promise<any> {
    Logger.warn('Attempting to call method [getState] on HuddlyGO', 'HuddlyGO API');
    throw new Error('State is not supported on Huddly GO camera');
  }

  /**
   * @ignore
   * Not supported for Huddly GO
   *
   * @memberof HuddlyGo
   */
  async setInterpolationParams(params: InterpolationParams): Promise<any> {
    Logger.warn('Attempting to call method [setInterpolationParams] on HuddlyGO', 'HuddlyGO API');
    throw new Error('Interpolation parameters are not supported on Huddly GO camera');
  }

  /**
   * @ignore
   * Not supported for Huddly GO
   *
   * @memberof HuddlyGo
   */
  async getInterpolationParams(): Promise<InterpolationParams> {
    Logger.warn('Attempting to call method [getInterpolationParams] on HuddlyGO', 'HuddlyGO API');
    throw new Error('Interpolation parameters are not supported on Huddly GO camera');
  }

  /**
   * @ignore
   * Not supported for Huddly GO
   *
   * @memberof HuddlyGo
   */
  async getLatestFirmwareUrl(releaseChannel: ReleaseChannel = ReleaseChannel.STABLE) {
    return this.api.getLatestFirmwareUrl('go', releaseChannel);
  }
}
