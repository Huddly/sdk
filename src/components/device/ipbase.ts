import { EventEmitter } from 'events';
import { TextDecoder } from 'util';

import IAutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import IDetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import IGrpcTransport from '@huddly/sdk-interfaces/lib/interfaces/IGrpcTransport';
import IUpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';
import IUVCControls from '@huddly/sdk-interfaces/lib/interfaces/IUVCControlApi';
import IIpDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IIpDeviceManager';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import HuddlyHEX from '@huddly/sdk-interfaces/lib/enums/HuddlyHex';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import Api from '../api';
import DiagnosticsMessage from '@huddly/sdk-interfaces/lib/abstract_classes/DiagnosticsMessage';
import Locksmith from './../locksmith';
import AceUpgrader from './../upgrader/aceUpgrader';
import IpAutozoomControl from '../ipAutozoomControl';
import IpFaceBasedExposureControl from '../ipFaceBasedExposureControl';
import IpDetector from '../ipDetector';

import { HuddlyServiceClient } from '@huddly/camera-proto/lib/api/huddly_grpc_pb';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import * as grpc from '@grpc/grpc-js';

/**
 * @ignore
 * @interface ErrorInterface
 */
interface ErrorInterface {
  message: String;
  stack?: String;
}

/**
 * Controller class for Huddly IP/Network cameras.
 *
 * @export
 * @class IpBaseDevice
 * @implements {IIpDeviceManager}
 * @implements {IUVCControls}
 */
export default class IpBaseDevice implements IIpDeviceManager, IUVCControls {
  /**
   * @ignore
   *
   * @private
   * @type {string}
   * @memberof IpBaseDevice
   */
  private className: string = 'IpBaseDevice';
  /**
   * @ignore
   * Communication with camera takes place here. Transport instance is there
   * for api conformance reasons.
   * @type {IGrpcTransport}
   * @memberof IpBaseDevice
   */
  transport: IGrpcTransport;
  /** @ignore */
  locksmith: Locksmith;
  /**
   * Comercial product name for this controller class.
   *
   * @type {string}
   * @memberof Ace
   */
  productName: string = 'Huddly L1';

  /**
   * Event emitter instance emitting attach and detach events for Huddly Cameras.
   *
   * @type {EventEmitter}
   * @memberof IpBaseDevice
   */
  discoveryEmitter: EventEmitter;
  /**
   * Device instance retrieved from doing WSDD probing. Take a look at the NetworkDevice
   * class on device-api-ip module.
   *
   * @type {*}
   * @memberof IpBaseDevice
   */
  wsdDevice: any;

  /**
   * Number representing the connection timeout when connecting to grpc server on the network device
   *
   * @private
   * @type {number}
   * @memberof IpBaseDevice
   */
  private readonly GPRC_CONNECT_TIMEOUT: number = 1; // seconds
  /**
   * Port number for connecting to grpc server on the network device
   *
   * @private
   * @type {number}
   * @memberof IpBaseDevice
   */
  private readonly GRPC_PORT: number = 50051;
  /**
   * Grpc client instance for communicating with the grpc server running on the network device
   *
   * @private
   * @type {HuddlyServiceClient}
   * @memberof IpBaseDevice
   */
  private huddlyGrpcClient: HuddlyServiceClient;

  /**
   * @ignore
   * Not applicable
   *
   * @readonly
   * @type {Api}
   * @memberof IpBaseDevice
   */
  get api(): Api {
    throw new Error('Not Supported.');
  }

  /**
   * @ignore
   * Not applicable
   *
   * @readonly
   * @memberof IpBaseDevice
   */
  get uvcControlInterface() {
    throw new Error('Not Supported');
  }

  get grpcClient(): HuddlyServiceClient {
    return this.huddlyGrpcClient;
  }

  set grpcClient(client: HuddlyServiceClient) {
    this.huddlyGrpcClient = client;
  }

  /**
   * Creates an instance of IpBaseDevice.
   * @param {*} wsdDevice The wsdd device instance retrieved during discovery.
   * @param {IGrpcTransport} transport Grpc transport instance.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly IP cameras.
   * @memberof IpBaseDevice
   */
  constructor(wsdDevice: any, transport: IGrpcTransport, cameraDiscoveryEmitter: EventEmitter) {
    this.wsdDevice = wsdDevice;
    this.transport = transport;
    this.locksmith = new Locksmith();
    this.discoveryEmitter = cameraDiscoveryEmitter;

    const { equals, ...wsdDeviceProps } = wsdDevice; // Copy all wsdDevice props except "equals"
    Object.assign(this, wsdDeviceProps);
  }

  /**
   * Initializes the controller class. Must be called before any other commands.
   *
   * @return {*}  {Promise<void>} Void function. Use `await` when calling this method.
   * @memberof IpBaseDevice
   */
  async initialize(): Promise<void> {
    const deadline = new Date();
    deadline.setSeconds(deadline.getSeconds() + this.GPRC_CONNECT_TIMEOUT);
    this.huddlyGrpcClient = new HuddlyServiceClient(
      `${this.wsdDevice.ip}:${this.GRPC_PORT}`,
      grpc.ChannelCredentials.createInsecure()
    );

    return new Promise<void>((resolve, reject) =>
      this.huddlyGrpcClient.waitForReady(deadline, (error) => {
        if (error) {
          Logger.error(
            `Connection failed with GPRC server on device. Reason: ${error}`,
            this.className
          );
          reject(error);
        } else {
          Logger.debug(`Connection established`, this.className);
          resolve();
        }
      })
    );
  }

  /**
   * Teardown function for cleaning up the state.
   *
   * @return {*}  {Promise<any>} Promise that carries out the teardown step.
   * @memberof IpBaseDevice
   */
  async closeConnection(): Promise<any> {
    this.grpcClient.close();
    return this.transport.close();
  }

  /**
   * @ignore
   *
   * @param {string} msg Error message
   * @param {ErrorInterface} error The error object
   * @param {*} reject Reject function.
   * @memberof IpBaseDevice
   */
  handleError(msg: string, error: ErrorInterface, reject: any): void {
    if (!error) {
      Logger.error(msg, '', this.className);
      reject(msg);
      return;
    }

    Logger.error(msg, error.stack, this.className);
    reject(error.message ? error.message : 'Unknown error');
  }

  /**
   * Get device software and hardware information.
   *
   * @return {*}  {Promise<any>} Object representing software & hardware info of the camera. Function must be awaited.
   * @memberof IpBaseDevice
   */
  getInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      const infoData = {
        ...this.wsdDevice.infoObject(),
        name: this.productName,
        vendorId: HuddlyHEX.VID,
      };
      // Get devive version
      this.grpcClient.getDeviceVersion(new Empty(), (err, deviceVersion: huddly.DeviceVersion) => {
        if (err != undefined) {
          Logger.error('Unable to get device version!', err.message, this.className);
          Logger.warn(err.stack, this.className);
          reject(err.message);
          return;
        }
        infoData.version = deviceVersion.toObject().version;
        this.uptime()
          .then((uptime) => {
            infoData.uptime = Number(uptime.toFixed(2));
          })
          .then(() => this.getSlot())
          .then((bootSlot) => {
            infoData.slot = bootSlot;
            resolve(infoData);
          })
          .catch((uptimeErr) => {
            Logger.error('Unable to get device uptime!', uptimeErr.message, this.className);
            Logger.warn(uptimeErr.stack, this.className);
            reject(uptimeErr.message);
          });
      });
    });
  }

  /**
   * Get application log.
   *
   * @param {number} [timeout] Maximum allowed time (in milliseconds) for fetching the log.
   * @return {*}  {Promise<any>} A promise which when completed contains the camera application log.
   * @memberof IpBaseDevice
   */
  getErrorLog(timeout?: number): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const logFile = new huddly.LogFile();
      logFile.setFile(huddly.LogFiles.APP);
      try {
        resolve(await this.getLogFiles(logFile));
      } catch (err) {
        this.handleError('Unable to get error log', err, reject);
        return;
      }
    });
  }

  /**
   * @ignore
   * Function that reads the logfile stream from camera through grpc.
   *
   * @param {huddly.LogFile} logFile The type of the log to read
   * @return {*}  {Promise<any>} The log data
   * @memberof IpBaseDevice
   */
  getLogFiles(logFile: huddly.LogFile): Promise<any> {
    return new Promise((resolve, reject) => {
      logFile.setKeepLog(true);
      let data = '';

      const stream = this.grpcClient.getLogFiles(logFile);
      stream.on('data', (comment: huddly.Chunk) => {
        const string = new TextDecoder().decode(comment.getContent_asU8());
        data += string;
      });
      stream.on('end', () => resolve(data));
      stream.on('error', reject);
    });
  }

  /**
   * Erases the application log.
   *
   * @param {number} [timeout] Maximum allowed time (in milliseconds) for erasing the log.
   * @return {*}  {Promise<void>} Resolves when the erase is completed.
   * @memberof IpBaseDevice
   */
  eraseErrorLog(timeout?: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const logFile = new huddly.LogFile();
        logFile.setFile(huddly.LogFiles.APP);
        resolve(await this.eraseLogFile(logFile));
      } catch (err) {
        this.handleError(`Unable to erase log file`, err, reject);
        return;
      }
    });
  }

  /**
   * @ignore
   * Internal function for performing the error log erase through grpc on target.
   *
   * @param {huddly.LogFile} logFile The log type to be erased
   * @return {*}  {Promise<void>} Resolves when the erase is completed.
   * @memberof IpBaseDevice
   */
  eraseLogFile(logFile: huddly.LogFile): Promise<void> {
    return new Promise((resolve, reject) => {
      this.grpcClient.eraseLogFile(logFile, (err, status: huddly.DeviceStatus) => {
        if (err != undefined) {
          reject(err);
          return;
        }
        Logger.info(status.toString());
        resolve();
      });
    });
  }

  /**
   * Soft boot camera.
   *
   * @param {string} [mode] Tell the camera which mode to boot to.
   * @return {*}  {Promise<void>} Resolves when the action is completed.
   * @memberof IpBaseDevice
   */
  reboot(mode?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.grpcClient.reset(new Empty(), (err, status: huddly.DeviceStatus) => {
        if (err != undefined) {
          this.handleError('Unable to reset camera', err, reject);
          return;
        }
        Logger.info(status.toString());
        resolve();
      });
    });
  }

  /**
   * @ignore
   *
   * @return {*}  {Object}
   * @memberof IpBaseDevice
   */
  _getDefaultParams(): Object {
    return {
      suported: true,
      resolution: 1,
    };
  }

  /**
   * Helper function for getting the respective upgrader controller class for upgrading Huddly Ip camera
   *
   * @return {*}  {Promise<IDeviceUpgrader>} The upgrader controll instance.
   * @memberof IpBaseDevices
   */
  getUpgrader(): Promise<IDeviceUpgrader> {
    return Promise.resolve(new AceUpgrader(this, this.discoveryEmitter));
  }

  /**
   * Performs software upgrade (async) on Huddly Ip camera
   *
   * @param {IUpgradeOpts} opts Upgrade options for performing the upgrade
   * @return {*}  {Promise<any>} Resolves when the upgrade is completed. Rejects if something goes wrong.
   * @memberof IpBaseDevice
   */
  upgrade(opts: IUpgradeOpts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getUpgrader()
        .then((upgrader: AceUpgrader) => {
          upgrader.init(opts);
          upgrader
            .doUpgrade()
            .then(() => resolve(undefined))
            .catch((e) => reject(e));
        })
        .catch((e) => reject(e));
    });
  }

  /**
   * Get autozoom control class instance.
   *
   * @param {IAutozoomControlOpts} opts Autozoom control options.
   * @return {*}  {ICnnControl} The instance of the autozoom control class.
   * @memberof IpBaseDevice
   */
  getAutozoomControl(opts: IAutozoomControlOpts): ICnnControl {
    return new IpAutozoomControl(this, opts);
  }

  /**
   * Get face based exposure control class instance.
   *
   * @return {*}  {ICnnControl} The instance of the face-based exposure control class.
   * @memberof IpBaseDevice
   */
  getFaceBasedExposureControl(): ICnnControl {
    return new IpFaceBasedExposureControl(this);
  }

  /**
   * Get detector control class instance.
   *
   * @param {IDetectorOpts} opts Detector control options.
   * @return {*}  {IDetector} The instance of the detector control class.
   * @memberof IpBaseDevice
   */
  getDetector(opts: IDetectorOpts): IDetector {
    return new IpDetector(this, opts);
  }

  /**
   * @ignore
   *
   * @return {*}  {Promise<DiagnosticsMessage[]>}
   * @memberof IpBaseDevice
   */
  getDiagnostics(): Promise<DiagnosticsMessage[]> {
    throw new Error('Method not implemented.');
  }

  /**
   * Get Autozoom/GF state on target
   *
   * @return {*}  {Promise<any>} Resolves with information about the GF state when action is completed.
   * @memberof IpBaseDevice
   */
  getState(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const cnnFeature = new huddly.CnnFeature();
        cnnFeature.setFeature(huddly.Feature.AUTOZOOM);
        const azStatus = await this.getCnnFeatureStatus(cnnFeature);

        if (azStatus.hasAzStatus()) {
          resolve({
            autozoom_enabled: azStatus.getAzStatus().getAzEnabled(),
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Generic function for getting status for a specific CnnFeature
   *
   * @param {huddly.CnnFeature} cnnFeature The cnn feature type
   * @return {*}  {Promise<huddly.CNNStatus>} Resolves with the status of the cnn feature
   * @memberof IpBaseDevice
   */
  getCnnFeatureStatus(cnnFeature: huddly.CnnFeature): Promise<huddly.CNNStatus> {
    return new Promise(async (resolve, reject) => {
      this.grpcClient.getCnnFeatureStatus(cnnFeature, (err, cnnStatus: huddly.CNNStatus) => {
        if (err != undefined) {
          this.handleError('Unable to get cnn feature status', err, reject);
          return;
        }
        resolve(cnnStatus);
      });
    });
  }

  /**
   * @ignore
   *
   * @return {*}  {Promise<any>}
   * @memberof IpBaseDevice
   */
  getPowerUsage(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  /**
   * Get specfic temperature type on camera.
   *
   * @param {string} [key] The temperature key (internal, external etc.)
   * @return {*}  {Promise<any>} Resolves with temperature information when action completes.
   * @memberof IpBaseDevice
   */
  getTemperature(key?: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const _temperatures = await this._getTemperatures();
        const tempList = _temperatures.getTemperaturesList();
        if (key != undefined) {
          tempList.forEach((temp) => {
            if (temp.getName() === key) {
              resolve(temp.toObject());
            }
          });
        }
        const tempListSorted = tempList.sort((a, b) => a.getValue() - b.getValue());
        resolve(tempListSorted.pop().toObject());
      } catch (err) {
        this.handleError('Unable to get temperature!', err, reject);
        return;
      }
    });
  }

  /**
   * @ignore
   * Internal grpc request function.
   *
   * @return {*}  {Promise<huddly.Temperatures>}
   * @memberof IpBaseDevice
   */
  _getTemperatures(): Promise<huddly.Temperatures> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getTemperatures(new Empty(), (err, temperatures: huddly.Temperatures) => {
        if (err != undefined) {
          reject(err);
          return;
        }
        resolve(temperatures);
      });
    });
  }

  /**
   * Get temperature information on camera.
   *
   * @return {*}  {Promise<any>} Resolves with temperature data when action completes.
   * @memberof IpBaseDevice
   */
  getTemperatures(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const temperatures = await this._getTemperatures();
        resolve(temperatures.toObject()['temperaturesList']);
      } catch (e) {
        this.handleError('Unable to get temperatures!', e, reject);
        return;
      }
    });
  }

  /**
   * @ignore
   * Not applicable
   *
   * @param {ReleaseChannel} releaseChannel
   * @memberof IpBaseDevice
   */
  getLatestFirmwareUrl(releaseChannel: ReleaseChannel) {
    throw new Error('Method not implemented.');
  }

  /**
   * Get current camera slot.
   *
   * @return {*}  {Promise<string>} Resolves with slot information when action completes.
   * @memberof IpBaseDevice
   */
  getSlot(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getBootSlot(new Empty(), (err, slot: huddly.BootSlot) => {
        if (err != undefined) {
          this.handleError('Unable to get device boot slot', err, reject);
          return;
        }
        const SlotStr: string = Object.keys(huddly.Slot).find(
          (key) => huddly.Slot[key] === slot.getSlot()
        );
        resolve(SlotStr);
      });
    });
  }

  /**
   * Get camera uptime
   *
   * @return {*}  {Promise<number>} Resolves with uptime information when the action completes.
   * @memberof IpBaseDevice
   */
  uptime(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getUptime(new Empty(), (err, uptime: huddly.Uptime) => {
        if (err != undefined) {
          this.handleError('Unable to get device uptime!', err, reject);
          return;
        }
        resolve(uptime.getUptime());
      });
    });
  }

  /** UVC Controls to be supported */

  /**
   * @ignore
   * Not applicable!
   *
   * @param {number} controlNumber
   * @return {*}  {Promise<Buffer>}
   * @memberof IpBaseDevice
   */
  getXUControl(controlNumber: number): Promise<Buffer> {
    throw new Error('Method not implemented.');
  }

  /**
   * @ignore
   * Not applicable
   *
   * @param {number} controlNumber
   * @param {*} value
   * @return {*}  {Promise<any>}
   * @memberof IpBaseDevice
   */
  setXUControl(controlNumber: number, value: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  /**
   * Get supported settings on camera.
   *
   * @return {*}  {Promise<Object>} Resolves with supported settings data when action completes.
   * @memberof IpBaseDevice
   */
  getSupportedSettings(): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      // TODO: Get camera to report this
      resolve(['pan', 'tilt', 'zoom', 'brightness', 'saturation']);
    });
  }

  /**
   * Get specific setting information from camera.
   *
   * @param {string} key The setting key to be fetched.
   * @param {Boolean} [forceRefresh] Whether the camera should use the cached settings or not.
   * @return {*}  {Promise<Object>} The setting value for the requested setting key.
   * @memberof IpBaseDevice
   */
  getSetting(key: string, forceRefresh?: Boolean): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        switch (key.toLowerCase()) {
          case 'pan':
            resolve({ ...(await this.getPanTiltZoom())['pan'] });
            break;
          case 'tilt':
            resolve({ ...(await this.getPanTiltZoom())['tilt'] });
            break;
          case 'zoom':
            resolve({ ...(await this.getPanTiltZoom())['zoom'] });
            break;
          case 'brightness':
            resolve(await this.getBrightness());
            break;
          case 'saturation':
            resolve(await this.getSaturation());
            break;
          default:
            const noSupportMsg = `Value of type ${key} is not supported.`;
            Logger.warn(noSupportMsg);
            reject(noSupportMsg);
            break;
        }
      } catch (e) {
        reject(e);
        return;
      }
    });
  }

  /**
   * Sets specific setting value on camera.
   *
   * @param {string} key The setting key to be updated.
   * @param {*} value The new value to be applied.
   * @return {*}  {Promise<void>} Resolves when action is completed.
   * @memberof IpBaseDevice
   */
  setSettingValue(key: string, value: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        switch (key.toLowerCase()) {
          case 'pan':
            await this.setPanTiltZoom({ pan: value });
            resolve();
            break;
          case 'tilt':
            await this.setPanTiltZoom({ tilt: value });
            resolve();
            break;
          case 'zoom':
            await this.setPanTiltZoom({ zoom: value });
            resolve();
            break;
          case 'brightness':
            await this.setBrightness(value);
            resolve();
            break;
          case 'saturation':
            await this.setSaturation(value);
            resolve();
            break;
          default:
            const noSupportMsg = `Value of type ${key} is not supported.`;
            Logger.warn(noSupportMsg, this.className);
            reject(noSupportMsg);
            break;
        }
      } catch (e) {
        reject(e);
        return;
      }
    });
  }

  /**
   * Get all camera settings.
   *
   * @param {Boolean} [forceRefresh] Whether the camera should use the cached settings or not.
   * @return {*}  {Promise<Object>} Resolves with camera settings when action is completed.
   * @memberof IpBaseDevice
   */
  getSettings(forceRefresh?: Boolean): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        const brightness = await this.getBrightness();
        const saturation = await this.getSaturation();
        const ptz = await this.getPanTiltZoom();
        resolve({
          brightness,
          saturation,
          ...ptz,
        });
      } catch (err) {
        reject(err);
        return;
      }
    });
  }

  /**
   * @ignore
   * Internal grpc request function.
   *
   * @return {*}  {Promise<huddly.Saturation>}
   * @memberof IpBaseDevice
   */
  _getSaturation(): Promise<huddly.Saturation> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getSaturation(
        new Empty(),
        (err: ErrorInterface, saturation: huddly.Saturation) => {
          if (err != undefined) {
            reject(err);
            return;
          }
          resolve(saturation);
        }
      );
    });
  }

  /**
   * Get camera saturation setting.
   *
   * @return {*}  {Promise<Object>} Resolves with camera saturation settings when action is completed.
   * @memberof IpBaseDevice
   */
  getSaturation(): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        const saturation = await this._getSaturation();
        resolve({
          ...this._getDefaultParams(),
          default: saturation.getDefaultSaturation(),
          value: saturation.getSaturation(),
          min: saturation.getRange().getMin(),
          max: saturation.getRange().getMax(),
        });
      } catch (e) {
        this.handleError('Unable to get saturation value', e, reject);
        return;
      }
    });
  }

  /**
   * Update camera saturation setting.
   *
   * @param {number} value The new saturation value.
   * @return {*}  {Promise<void>} Resolves when the action is completed.
   * @memberof IpBaseDevice
   */
  setSaturation(value: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const saturation = new huddly.Saturation();
      saturation.setSaturation(value);

      this.grpcClient.setSaturation(
        saturation,
        (err: ErrorInterface, deviceStatus: huddly.DeviceStatus) => {
          if (err != undefined) {
            this.handleError('Unable to set saturation', err, reject);
            return;
          }
          Logger.info(deviceStatus.toString());
          resolve();
        }
      );
    });
  }

  /**
   * @ignore
   * Internal grpc request function.
   *
   * @return {*}  {Promise<huddly.Brightness>}
   * @memberof IpBaseDevice
   */
  _getBrightness(): Promise<huddly.Brightness> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getBrightness(new Empty(), (err, brightness: huddly.Brightness) => {
        if (err != undefined) {
          reject(err);
          return;
        }
        resolve(brightness);
      });
    });
  }

  /**
   * Get camera brightness setting.
   *
   * @return {*}  {Promise<Object>} Resolves with brightness information when action is completed.
   * @memberof IpBaseDevice
   */
  getBrightness(): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        const brightness = await this._getBrightness();
        resolve({
          ...this._getDefaultParams(),
          default: brightness.getDefaultBrightness(),
          value: brightness.getBrightness(),
          min: brightness.getRange().getMin(),
          max: brightness.getRange().getMax(),
        });
      } catch (e) {
        this.handleError('Unable to get brightness value', e, reject);
        return;
      }
    });
  }

  /**
   * Set brightness setting on the camera.
   *
   * @param {number} value The new brightness value
   * @return {*}  {Promise<void>} Resolves when the action is completed.
   * @memberof IpBaseDevice
   */
  setBrightness(value: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const brightness = new huddly.Brightness();
      brightness.setBrightness(value);
      this.grpcClient.setBrightness(brightness, (err, deviceStatus: huddly.DeviceStatus) => {
        if (err != undefined) {
          this.handleError('Unable to set brightness', err, reject);
          return;
        }
        Logger.info(deviceStatus.toString());
        resolve();
      });
    });
  }

  /**
   * Reset settings on the camera.
   *
   * @param {String[]} [excludeList=[]] Potential exclusion list
   * @return {*}  {Promise<any>} Resolves when the action is completed.
   * @memberof IpBaseDevice
   */
  resetSettings(excludeList: String[] = []): Promise<any> {
    // Reset brightness
    return new Promise<void>(async (res, rej) => {
      try {
        if (excludeList.indexOf('brightness') === -1) {
          await new Promise<void>((resolve, reject) => {
            this._getBrightness()
              .then((brightness: huddly.Brightness) => {
                this.setBrightness(brightness.getDefaultBrightness())
                  .then(() => resolve())
                  .catch((e) => reject(e));
              })
              .catch((e) => reject(e));
          });
        }

        if (excludeList.indexOf('saturation') === -1) {
          await new Promise<void>((resolve, reject) => {
            this._getSaturation()
              .then((saturation: huddly.Saturation) => {
                this.setSaturation(saturation.getDefaultSaturation())
                  .then(() => resolve())
                  .catch((e) => reject(e));
              })
              .catch((e) => reject(e));
          });
        }
        if (excludeList.indexOf('pan') === -1) {
          await new Promise<void>((resolve, reject) => {
            this.getSetting('pan')
              .then((pan: Object) => {
                this.setPanTiltZoom({ pan: pan['default'] })
                  .then(() => resolve())
                  .catch((e) => reject(e));
              })
              .catch((e) => reject(e));
          });
        }

        if (excludeList.indexOf('tilt') === -1) {
          await new Promise<void>((resolve, reject) => {
            this.getSetting('tilt')
              .then((tilt: Object) => {
                this.setPanTiltZoom({ tilt: tilt['default'] })
                  .then(() => resolve())
                  .catch((e) => reject(e));
              })
              .catch((e) => reject(e));
          });
        }

        if (excludeList.indexOf('zoom') === -1) {
          await new Promise<void>((resolve, reject) => {
            this.getSetting('zoom')
              .then((zoom: Object) => {
                this.setPanTiltZoom({ zoom: zoom['default'] })
                  .then(() => resolve())
                  .catch((e) => reject(e));
              })
              .catch((e) => reject(e));
          });
        }

        res();
      } catch (e) {
        Logger.error('Unable to reset settings', e, this.className);
        rej(e);
      }
    });
  }

  /**
   * @ignore
   * Internal grpc request function.
   *
   * @return {*}  {Promise<huddly.PTZ>}
   * @memberof IpBaseDevice
   */
  _getPanTiltZoom(): Promise<huddly.PTZ> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getPTZ(new Empty(), (err, ptz: huddly.PTZ) => {
        if (err != undefined) {
          reject(err);
          return;
        }
        resolve(ptz);
      });
    });
  }

  /**
   * Get pan, tilt and zoom settings from the camera.
   *
   * @return {*}  {Promise<Object>} Resolves wth ptz information when the action is completed.
   * @memberof IpBaseDevice
   */
  getPanTiltZoom(): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        const ptz = await this._getPanTiltZoom();
        const ptzObj = {
          pan: {
            ...this._getDefaultParams(),
            default: ptz.getDefaultpan(),
            value: ptz.getPan(),
            min: ptz.getRangepan().getMin(),
            max: ptz.getRangepan().getMax(),
          },
          tilt: {
            ...this._getDefaultParams(),
            default: ptz.getDefaulttilt(),
            value: ptz.getTilt(),
            min: ptz.getRangetilt().getMin(),
            max: ptz.getRangetilt().getMax(),
          },
          zoom: {
            ...this._getDefaultParams(),
            default: ptz.getDefaultzoom(),
            value: ptz.getZoom(),
            min: ptz.getRangedzoom().getMin(),
            max: ptz.getRangedzoom().getMax(),
          },
        };
        resolve(ptzObj);
      } catch (e) {
        this.handleError('Unable to get ptz values', e, reject);
        return;
      }
    });
  }

  /**
   * Get pan and tilt settings from the camera.
   *
   * @return {*}  {Promise<Object>} Resolves with pan and tilt data when the action is completed.
   * @memberof IpBaseDevice
   */
  getPanTilt(): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        const ptz = await this.getPanTiltZoom();
        resolve({
          pan: ptz['pan'],
          tilt: ptz['tilt'],
        });
      } catch (err) {
        reject(err);
        return;
      }
    });
  }

  /**
   * Update pan and tilt settings on camera.
   *
   * @param {Object} panTilt The new pan and tilt value to be updated.
   * @return {*}  {Promise<void>} Resolves when the action is completed.
   * @memberof IpBaseDevice
   */
  setPanTilt(panTilt: Object): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.setPanTiltZoom(panTilt);
      } catch (err) {
        reject(err);
        return;
      }
      resolve();
    });
  }

  /**
   * Update pan, tilt and zoom settings on the camera.
   *
   * @param {Object} panTiltZoom The new ptz value to be updated.
   * @return {*}  {Promise<void>} Resolves when the action is completed.
   * @memberof IpBaseDevice
   */
  setPanTiltZoom(panTiltZoom: Object): Promise<void> {
    const newPtz = new huddly.PTZ();
    return new Promise((resolve, reject) => {
      this._getPanTiltZoom()
        .then((currentPtz: huddly.PTZ) => {
          newPtz.setPan(currentPtz.getPan());
          newPtz.setZoom(currentPtz.getZoom());
          newPtz.setTilt(currentPtz.getTilt());
          newPtz.setTrans(currentPtz.getTrans());
        })
        .catch((e) => {
          const defaultPan = newPtz.getDefaultpan();
          const defaultTilt = newPtz.getDefaulttilt();
          const defaultZoom = newPtz.getDefaultzoom();
          newPtz.setPan(defaultPan);
          newPtz.setTilt(defaultTilt);
          newPtz.setZoom(defaultZoom);
          newPtz.setTrans(0);
        })
        .finally(() => {
          const paramKeys = Object.keys(panTiltZoom);
          if (paramKeys.includes('pan')) {
            newPtz.setPan(panTiltZoom['pan']);
          }
          if (paramKeys.includes('tilt')) {
            newPtz.setTilt(panTiltZoom['tilt']);
          }
          if (paramKeys.includes('zoom')) {
            newPtz.setZoom(panTiltZoom['zoom']);
          }
          this.grpcClient.setPTZ(newPtz, (err, status: huddly.DeviceStatus) => {
            if (err != undefined) {
              this.handleError('Unable to set PTZ values!', err, reject);
              return;
            }
            Logger.info(status.toString());
            resolve();
          });
        });
    });
  }

  /**
   * @ignore
   * Not applicable.
   *
   * @return {*}  {Promise<void>}
   * @memberof IpBaseDevice
   */
  usbReEnumerate(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * @ignore
   * Not applicable
   *
   * @return {*}  {Boolean}
   * @memberof IpBaseDevice
   */
  isAlive(): Boolean {
    throw new Error('Method not implemented.');
  }

  /**
   * Helper function for checking if two ACE instances are equal or not
   *
   * @param {IDeviceManager} manager The other ace instance
   * @return {*} A boolean representing whether the instance are equal or not.
   * @memberof IpBaseDevice
   */
  equals(manager: IDeviceManager): Boolean {
    if (manager instanceof IpBaseDevice) {
      const otherIpDevice = <IpBaseDevice>manager;
      return otherIpDevice.wsdDevice.equals(this.wsdDevice);
    }
    return false;
  }
}
