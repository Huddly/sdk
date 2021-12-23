import { EventEmitter } from 'events';

import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import UpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import DetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import InterpolationParams from '@huddly/sdk-interfaces/lib/interfaces/IInterpolationParams';
import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import AutozoomControl from '../autozoomControl';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import HuddlyHEX from '@huddly/sdk-interfaces/lib/enums/HuddlyHex';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import Api from './../api';
import UvcBaseDevice from './uvcbase';
import Locksmith from './../locksmith';
import CameraEvents from './../../utilitis/events';
import Detector from './../detector';
import { MinMaxDiagnosticsMessage, DiagnosticsMessageData } from '../diagnosticsMessageData';
import DiagnosticsMessage from '@huddly/sdk-interfaces/lib/abstract_classes/DiagnosticsMessage';
import { createBoxfishUpgrader } from './../upgrader/boxfishUpgraderFactory';
import BoxfishUpgrader from './../upgrader/boxfishUpgrader';
import FaceBasedExposureControl from '../faceBasedExposureControl';

const MAX_UPGRADE_ATTEMPT = 3;

/**
 * Controller class for Boxfish/IQ camera.
 *
 * @export
 * @class Boxfish
 * @extends {UvcBaseDevice}
 * @implements {IDeviceManager}
 */
export default class Boxfish extends UvcBaseDevice implements IDeviceManager {
  /**
   * Transport instance for communicating with cameras (sending command and reading data)
   *
   * @type {IUsbTransport}
   * @memberof Boxfish
   */
  transport: IUsbTransport;
  /**
   * Common Api wrapper class for invoking common functionality across device controller classes.
   *
   * @type {Api}
   * @memberof Boxfish
   */
  _api: Api;
  /**
   * The uvc control interface for sending standard uvc commands to camera.
   *
   * @type {*}
   * @memberof Boxfish
   */
  uvcControlInterface: any;
  /** @ignore */
  locksmith: Locksmith;
  /**
   * Event emitter instance emitting attach and detach events for Huddly Cameras.
   *
   * @type {EventEmitter}
   * @memberof Boxfish
   */
  discoveryEmitter: EventEmitter;
  /**
   * Comercial product name for this controller class.
   *
   * @type {string}
   * @memberof Boxfish
   */
  productName: string = 'Huddly IQ';

  /**
   * Creates an instance of Boxfish.
   * @param {*} uvcCameraInstance Uvc camera instance acquired from device-api-uvc discovery manager.
   * @param {IUsbTransport} transport The transport instance for communicating with the camera.
   * @param {*} uvcControlInterface Uvc control interface for performing standard uvc control commands.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly cameras.
   * @memberof Boxfish
   */
  constructor(
    uvcCameraInstance: any,
    transport: IUsbTransport,
    uvcControlInterface: any,
    cameraDiscoveryEmitter: EventEmitter
  ) {
    super(uvcCameraInstance, uvcControlInterface);

    this.transport = transport;
    this.uvcControlInterface = uvcControlInterface;
    this.locksmith = new Locksmith();
    this.discoveryEmitter = cameraDiscoveryEmitter;
  }

  get api(): Api {
    return this._api;
  }

  /**
   * Initializes the controller class. Must be called before any other commands.
   *
   * @return {*}  {Promise<void>} Void function. Use `await` when calling this method.
   * @memberof Boxfish
   */
  async initialize(): Promise<void> {
    this._api = new Api(this.transport, this.locksmith);
    this.transport.init();
    try {
      this.transport.initEventLoop();
    } catch (e) {
      Logger.error('Failed to init event loop when transport reset', e, 'Boxfish API');
    }
  }

  /**
   * Teardown function for cleaning up the state.
   *
   * @return {*}  {Promise<any>} Promise that carries out the teardown step.
   * @memberof Boxfish
   */
  async closeConnection(): Promise<any> {
    return this.transport.close();
  }

  /**
   * Get device software and hardware information.
   *
   * @return {*}  {Promise<any>} Object representing software & hardware info of the camera. Function must be awaited.
   * @memberof Boxfish
   */
  async getInfo(): Promise<any> {
    const info = await this.api.getCameraInfo();
    const status = {
      id: this['id'],
      serialNumber: this['serialNumber'],
      vendorId: this['vendorId'] || HuddlyHEX.VID,
      productId: this['productId'],
      version: this.extractSemanticSoftwareVersion(info.softwareVersion),
      location: this['location'],
      name: this.productName,
      ...info,
    };
    if (this['pathName'] !== undefined) {
      status.pathName = this['pathName'];
    }
    return status;
  }

  /** @ignore */
  extractSemanticSoftwareVersion(appVer: string) {
    return appVer.replace(/\D+-/, '');
  }

  /**
   * Make sure the camera is running on application mode (which is the default mode).
   *
   * @param {string} currentMode Current mode on camera.
   * @return {*} Resolves when the camera boots in app mode.
   * @memberof Boxfish
   */
  async ensureAppMode(currentMode: string, timeout?: number) {
    if (!currentMode || currentMode === 'app') return Promise.resolve();
    else {
      throw new Error(`Cannot set camera to app mode from ${currentMode} mode!`);
    }
  }

  /**
   * Get application log.
   *
   * @param {number} [timeout=60000] Maximum allowed time (in milliseconds) for fetching the log.
   * @param {number} [retry=1] Number of retries to perform in case something goes wrong.
   * @param {boolean} [allowLegacy=true] Should allow legacy error log retrival in case the standard procedure fails.
   * @return {*}  {Promise<any>} A promise which when completed contains the camera application log.
   * @memberof Boxfish
   */
  async getErrorLog(
    timeout: number = 60000,
    retry: number = 1,
    allowLegacy: boolean = true
  ): Promise<any> {
    return this.api.getErrorLog(timeout, retry, allowLegacy);
  }

  /**
   * Erases the application log.
   *
   * @param {number} [timeout=60000] Maximum allowed time (in milliseconds) for erasing the log.
   * @return {*}  {Promise<void>} Resolves when the erase is completed.
   * @memberof Boxfish
   */
  async eraseErrorLog(timeout: number = 60000): Promise<void> {
    await this.api.eraseErrorLog(timeout);
  }

  /**
   * Get current power usage on the camera.
   *
   * @return {*}  {Promise<any>} An object containing voltage, current and power usage on camera. Method must be awaited.
   * @memberof Boxfish
   */
  async getPowerUsage(): Promise<any> {
    const response = await this.api.sendAndReceiveMessagePack('', {
      send: 'get_power',
      receive: 'get_power_reply',
    });
    return response;
  }

  /**
   * Get current temperature on the camera.
   *
   * @return {*}  {Promise<any>} An object containig internal and external temperature values.
   * @memberof Boxfish
   */
  async getTemperature(): Promise<any> {
    const response = await this.api.sendAndReceiveMessagePack('', {
      send: 'get_temperature',
      receive: 'get_temperature_reply',
    });
    return response;
  }

  /**
   * @ignore
   * Get power monitoring diagnostics (voltage and current).
   *
   * @param {*} powerUsage Power usage data retrieved from camera
   * @return {*}  {Array<DiagnosticsMessage>} Power usage data retrieved from camera
   * @memberof Boxfish
   */
  getPowerMonitorDiagnostics(powerUsage: any): Array<DiagnosticsMessage> {
    const minVoltage = 4.6;
    const maxVoltage = 5.25;
    const maxCurrent = 0.955;
    const minCurrent = 0;
    const voltageTip = 'Check your cables';

    let diagnostics = [];
    if (powerUsage.voltage) {
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

      diagnostics = [...diagnostics, voltage];
    }

    if (powerUsage.current) {
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

      diagnostics = [...diagnostics, current];
    }

    return diagnostics;
  }

  /**
   * @ignore
   * Get diagnostics info on camera
   *
   * @return {*}  {Promise<Array<DiagnosticsMessage>>} An array of data representing diagnostics information.
   * @memberof Boxfish
   */
  async getDiagnosticsInfo(): Promise<Array<DiagnosticsMessage>> {
    const message = await this.api.sendAndReceiveMessagePack(
      '',
      {
        send: 'diagnostics/get_info',
        receive: 'diagnostics/get_info_reply',
      },
      3000
    );

    return [new DiagnosticsMessageData('USBMODE', 'USB Ok', message.usb)];
  }

  /**
   * Get diagnostics for power usage on camera.
   *
   * @return {*}  {Promise<Array<DiagnosticsMessage>>} An array of data representing the power usage diagnostics.
   * @memberof Boxfish
   */
  async getDiagnostics(): Promise<Array<DiagnosticsMessage>> {
    const powerUsage = await this.getPowerUsage();

    const powerDiagnostics = this.getPowerMonitorDiagnostics(powerUsage);

    const infoDiagnostics = await this.getDiagnosticsInfo();

    return [...powerDiagnostics, ...infoDiagnostics];
  }

  /**
   * Soft boot camera.
   *
   * @param {string} [mode='app'] Tell the camera which mode to boot to.
   * @return {*}  {Promise<void>} Void function. Use `await` when calling this method.
   * @memberof Boxfish
   */
  async reboot(mode: string = 'app'): Promise<void> {
    await this.locksmith.executeAsyncFunction(async () => {
      await this.transport.clear();
      if (mode === 'mvusb') {
        this.transport.write('upgrader/mv_usb', Api.encode({}));
      } else {
        await this.transport.write('camctrl/reboot');
      }
    });
  }

  /**
   * Get camera uptime
   *
   * @return {*} Resolves with the uptime information (double in milliseconds)
   * @memberof Boxfish
   */
  async uptime() {
    return this.api.getUptime();
  }

  /**
   * Helper function for getting the respective upgrader controller class for upgrading Huddly Boxfish/IQ
   *
   * @return {*}  {Promise<IDeviceUpgrader>} The upgrader controll instance.
   * @memberof Boxfish
   */
  async getUpgrader(): Promise<IDeviceUpgrader> {
    return createBoxfishUpgrader(this, this.discoveryEmitter);
  }

  /**
   * @ignore
   * Internal API
   *
   * @memberof Boxfish
   */
  async createAndRunFsblUpgrade(opts: UpgradeOpts, deviceManager: IDeviceManager) {
    const upgrader = new BoxfishUpgrader(deviceManager, this.discoveryEmitter);
    const mvusbFile = opts.file;
    const timeoutMs = opts.bootTimeout * 1000;

    return new Promise<void>((resolve, reject) => {
      const bootTimeout = setTimeout(() => {
        clearTimeout(bootTimeout);
        reject('Fsbl upgrade timed out');
      }, timeoutMs);

      upgrader.flashFsbl(mvusbFile).then(() => {
        clearTimeout(bootTimeout);
        resolve();
      });
    });
  }

  /**
   * @ignore
   * Internal API
   *
   * @memberof Boxfish
   */
  async createAndRunUpgrade(
    opts: UpgradeOpts,
    deviceManager: IDeviceManager,
    createNewUpgrader: boolean
  ) {
    let upgrader: IDeviceUpgrader = opts.upgrader;
    if (!upgrader || createNewUpgrader) {
      upgrader = await createBoxfishUpgrader(deviceManager, this.discoveryEmitter);
    }
    upgrader.init(opts);
    upgrader.start();
    return new Promise<void>((resolve, reject) => {
      upgrader.once(CameraEvents.UPGRADE_COMPLETE, async (deviceManager) => {
        const upgradeIsOk = await upgrader.upgradeIsValid();
        if (upgradeIsOk) {
          resolve();
        } else {
          reject({
            message: 'Upgrade status is not ok, run again',
            runAgain: true,
            deviceManager,
          });
        }
      });
      upgrader.once(CameraEvents.UPGRADE_FAILED, (reason) => {
        Logger.error('Upgrade Failed', reason, 'Boxfish API');
        reject(reason);
      });
      upgrader.once(CameraEvents.TIMEOUT, (reason) => {
        Logger.error('Upgrader returned a timeout event', reason, 'Boxfish API');
        reject(reason);
      });
    });
  }

  /**
   * Performs software upgrade (async) on Huddly Boxfish/IQ
   *
   * @param {UpgradeOpts} opts Upgrade options for performing the upgrade
   * @return {*}  {Promise<any>} Resolves when the upgrade is completed. Rejects if something goes wrong.
   * @memberof Boxfish
   */
  async upgrade(opts: UpgradeOpts): Promise<any> {
    let upgradeAttempts = 0;
    return new Promise<void>((resolve, reject) => {
      const tryRunAgainOnFailure = async (deviceManager: IDeviceManager) => {
        try {
          await this.createAndRunUpgrade(opts, deviceManager, upgradeAttempts > 0);
          resolve();
        } catch (e) {
          if (e.runAgain && upgradeAttempts < MAX_UPGRADE_ATTEMPT) {
            upgradeAttempts += 1;
            Logger.warn(
              `Upgrade failure! Retrying upgrade process nr ${upgradeAttempts}`,
              'Boxfish API'
            );
            tryRunAgainOnFailure(e.deviceManager);
          } else {
            Logger.error('Failed performing a camera upgrade', e, 'Boxfish API');
            reject(e);
          }
        }
      };
      tryRunAgainOnFailure(this);
    });
  }

  /**
   * @ignore
   * Internal API
   *
   * @memberof Boxfish
   */
  async upgradeFsbl(opts: UpgradeOpts): Promise<any> {
    try {
      await this.createAndRunFsblUpgrade(opts, this);
      Promise.resolve();
    } catch (e) {
      Logger.error('Failed performing a FSBL camera upgrade', e, 'Boxfish API');
      Promise.reject(e);
    }
  }

  /**
   * Get autozoom control class instance.
   *
   * @param {AutozoomControlOpts} opts Autozoom control options.
   * @return {*}  {ICnnControl} The instance of the autozoom control class.
   * @memberof Boxfish
   */
  getAutozoomControl(opts: AutozoomControlOpts): ICnnControl {
    return new AutozoomControl(this, opts);
  }

  /**
   * Get face based exposure control class instance.
   *
   * @return {*}  {ICnnControl} The instance of the face-based exposure control class.
   * @memberof Boxfish
   */
  getFaceBasedExposureControl(): ICnnControl {
    return new FaceBasedExposureControl(this);
  }

  /**
   * Get detector control class instance.
   *
   * @param {DetectorOpts} [opts] Detector control options.
   * @return {*}  {IDetector} The instance of the detector control class.
   * @memberof Boxfish
   */
  getDetector(opts?: DetectorOpts): IDetector {
    return new Detector(this, opts);
  }

  /**
   * Get Autozoom/GF state on target
   *
   * @return {*}  {Promise<any>} Resolves with information about the GF state when action is completed.
   * @memberof Boxfish
   */
  async getState(): Promise<any> {
    const response = await this.api.sendAndReceiveMessagePack('', {
      send: 'camera/get_state',
      receive: 'camera/get_state_reply',
    });
    return response;
  }

  /**
   * Set interpolation curve parameter used to zoom on regions when GF is enabled
   *
   * @param {InterpolationParams} params The interpolation cruve parameters.
   * @return {*}  {Promise<any>} Resolves when the interpolation parameters are updated on target.
   * @memberof Boxfish
   */
  async setInterpolationParams(params: InterpolationParams): Promise<any> {
    this.api.setInterpolationParameters(params);
  }

  /**
   * Get interpolation curve parameters from target.
   *
   * @return {*}  {Promise<InterpolationParams>} Resolves with the interpolation curve parameters.
   * @memberof Boxfish
   */
  async getInterpolationParams(): Promise<InterpolationParams> {
    return this.api.getInterpolationParameters();
  }

  /**
   * @ignore
   * Internal API
   *
   * @memberof Boxfish
   */
  async getLatestFirmwareUrl(releaseChannel: ReleaseChannel = ReleaseChannel.STABLE) {
    return this.api.getLatestFirmwareUrl('iq', releaseChannel);
  }
}
