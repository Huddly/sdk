import { EventEmitter } from 'events';
import IAutozoomControl from '../../interfaces/IAutozoomControl';
import IAutozoomControlOpts from '../../interfaces/IAutozoomControlOpts';
import IDetector from '../../interfaces/IDetector';
import IDetectorOpts from '../../interfaces/IDetectorOpts';
import IDeviceUpgrader from '../../interfaces/IDeviceUpgrader';
import IGrpcTransport from '../../interfaces/IGrpcTransport';
import IUpgradeOpts from '../../interfaces/IUpgradeOpts';
import ReleaseChannel from '../../interfaces/ReleaseChannelEnum';
import IUVCControls from './../../interfaces/iUVCControlApi';
import Api from '../api';
import diagnosticsMessage from '../diagnosticsMessage';
import DefaultLogger from './../../utilitis/logger';
import Locksmith from './../locksmith';
import IDeviceManager from './../../interfaces/iDeviceManager';

import { HuddlyServiceClient } from './../../proto/huddly_grpc_pb';
import * as huddly from './../../proto/huddly_pb';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

interface ErrorInterface {
  message: String;
  stack?: String;
}

export default class Ace implements IDeviceManager, IUVCControls {
  transport: IGrpcTransport;
  logger: any;
  locksmith: Locksmith;
  productName: string = 'Huddly L1';
  discoveryEmitter: EventEmitter;
  wsdDevice: any;

  get api(): Api {
    throw new Error('Not Supported.');
  }
  get uvcControlInterface() {
    throw new Error('Not Supported');
  }

  get grpcClient(): HuddlyServiceClient {
    return this.transport.grpcClient;
  }

  get GoogleProtoEmpty(): Empty {
    // TODO: make sure the sdk google.protobuf.Empty is the same as device-api-ip google.protobuf.Empty
    // This is a temporary workaround
    return this.transport.empty;
  }

  constructor(
    wsdDevuce: any,
    transport: IGrpcTransport,
    logger: DefaultLogger,
    cameraDiscoveryEmitter: EventEmitter
  ) {
    this.wsdDevice = wsdDevuce;
    this.transport = transport;
    this.logger = logger;
    this.locksmith = new Locksmith();
    this.discoveryEmitter = cameraDiscoveryEmitter;
  }

  handleError(msg: String, error: ErrorInterface, reject: any) {
    if (!error) {
      this.logger.error('Unknown error');
      reject('Unknown error');
    }
    if (error.message) {
      this.logger.error(msg, error.message, Ace.name);
    }
    if (error.stack) this.logger.warn(error.stack, Ace.name);

    reject(error.message ? error.message : 'Uknown error');
  }

  async initialize(): Promise<void> {
    return Promise.resolve();
  }

  async closeConnection(): Promise<any> {
    return this.transport.close();
  }

  getInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      const infoData = {
        ...this.wsdDevice.infoObject(),
      };
      // Get devive version
      this.grpcClient.getDeviceVersion(
        this.GoogleProtoEmpty,
        (err, deviceVersion: huddly.DeviceVersion) => {
          if (err != undefined) {
            this.handleError('Unable to get device version!', err, reject);
            return;
          }
          infoData.version = deviceVersion.toObject().version;
          this.getUptime()
            .then(uptime => {
              infoData.uptime = Number(uptime.toFixed(2));
            })
            .then(() => this.getSlot())
            .then(bootSlot => {
              infoData.slot = bootSlot;
              resolve(infoData);
            })
            .catch(uptimeErr => {
              this.logger.error('Unable to get device uptime!', uptimeErr.message, Ace.name);
              this.logger.warn(uptimeErr.stack, Ace.name);
              reject(uptimeErr.message);
            });
        }
      );
    });
  }

  getErrorLog(timeout: number): Promise<any> {
    throw new Error('Method not implemented.');
  }

  eraseErrorLog(timeout: number): Promise<void> {
    throw new Error('Method not implemented.');
  }

  reboot(mode?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.grpcClient.reset(this.GoogleProtoEmpty, (err, status: huddly.DeviceStatus) => {
        if (err != undefined) {
          this.handleError('Unable to reset camera', err, reject);
          return;
        }
        this.logger.info(status);
        resolve();
      });
    });
  }

  _getDefaultParams(): Object {
    return {
      suported: true,
      default: 0,
      resolution: 1,
    };
  }

  getUpgrader(): Promise<IDeviceUpgrader> {
    throw new Error('Method not implemented.');
  }

  upgrade(opts: IUpgradeOpts): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getAutozoomControl(opts: IAutozoomControlOpts): IAutozoomControl {
    throw new Error('Method not implemented.');
  }

  getDetector(opts: IDetectorOpts): IDetector {
    throw new Error('Method not implemented.');
  }

  getDiagnostics(): Promise<diagnosticsMessage[]> {
    throw new Error('Method not implemented.');
  }

  getState(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getPowerUsage(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getTemperature(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getLatestFirmwareUrl(releaseChannel: ReleaseChannel) {
    throw new Error('Method not implemented.');
  }

  getSlot(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getBootSlot(this.GoogleProtoEmpty, (err, slot: huddly.BootSlot) => {
        if (err != undefined) {
          this.logger.error('Unable to get device boot slot', err.message);
          this.logger.warn(err.stack);
          reject(err.message);
          return;
        }
        const SlotStr: string = Object.keys(huddly.Slot).find(
          key => huddly.Slot[key] === slot.getSlot()
        );
        resolve(SlotStr);
      });
    });
  }

  getUptime(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getUptime(this.GoogleProtoEmpty, (err, uptime: huddly.Uptime) => {
        if (err != undefined) {
          this.logger.error('Unable to get device uptime!', err.message, Ace.name);
          this.logger.warn(err.stack, Ace.name);
          reject(err.message);
          return;
        }
        resolve(uptime.getUptime());
      });
    });
  }

  /** UVC Controls to be supported */

  getXUControl(controlNumber: number): Promise<Buffer> {
    throw new Error('Method not implemented.');
  }
  setXUControl(controlNumber: number, value: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getSupportedSettings(): Promise<Object> {
    throw new Error('Method not implemented.');
  }
  getSetting(key: string, forceRefresh?: Boolean): Promise<Object> {
    throw new Error('Method not implemented.');
  }
  setSettingValue(key: string, value: any): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        switch (key) {
          case 'pan':
            this.setPanTiltZoom({ pan: value });
            break;
          case 'tilt':
            this.setPanTiltZoom({ tilt: value });
            break;
          case 'zoom':
            this.setPanTiltZoom({ zoom: value });
            break;
          case 'brightness':
            this.setBrightness(value);
            break;
          case 'saturation':
            this.setSaturation(value);
            break;
          default:
            this.logger.warn(`Value of type ${key} is not supported.`);
            break;
        }
      } catch (e) {
        reject(e);
      }
    });
  }

  getSettings(forceRefresh?: Boolean): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        const brightness = await this.getBrightness();
        const saturation = await this.getSaturation();
        const ptz = await this.getPanTiltZoom();
        resolve({
          ...brightness,
          ...saturation,
          ...ptz,
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  _getSaturation(): Promise<huddly.Saturation> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getSaturation(
        this.GoogleProtoEmpty,
        (err: ErrorInterface, saturation: huddly.Saturation) => {
          if (err != undefined) {
            reject(err);
          }
          resolve(saturation);
        }
      );
    });
  }

  getSaturation(): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        const saturation = await this._getSaturation();
        resolve({
          saturation: {
            ...this._getDefaultParams(),
            value: saturation.getSaturation(),
            min: saturation.getRange().getMin(),
            max: saturation.getRange().getMax(),
          },
        });
      } catch (e) {
        this.handleError('Unable to get saturation value', e, reject);
      }
    });
  }

  setSaturation(value: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const saturation = this.transport.saturation;
      saturation.setSaturation(value);

      this.grpcClient.setSaturation(
        saturation,
        (err: ErrorInterface, deviceStatus: huddly.DeviceStatus) => {
          if (err != undefined) {
            this.handleError('Unable to set saturation', err, reject);
            return;
          }
          this.logger.info(deviceStatus);
          resolve();
        }
      );
    });
  }

  _getBrightness(): Promise<huddly.Brightness> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getBrightness(this.GoogleProtoEmpty, (err, brightness: huddly.Brightness) => {
        if (err != undefined) {
          reject(err);
        }
        resolve(brightness);
      });
    });
  }

  getBrightness(): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        const brightness = await this._getBrightness();
        resolve({
          brightness: {
            ...this._getDefaultParams(),
            value: brightness.getBrightness(),
            min: brightness.getRange().getMin(),
            max: brightness.getRange().getMax(),
          },
        });
      } catch (e) {
        this.handleError('Unable to get brightness value', e, reject);
      }
    });
  }

  setBrightness(value: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const brightness = this.transport.brightness;
      brightness.setBrightness(value);
      this.grpcClient.setBrightness(brightness, (err, deviceStatus: huddly.DeviceStatus) => {
        if (err != undefined) {
          this.handleError('Unable to set brightness', err, reject);
          return;
        }
        this.logger.info(deviceStatus);
        resolve();
      });
    });
  }

  resetSettings(excludeList: String[]): Promise<void> {
    throw new Error('Method not implemented.');
  }

  _getPanTiltZoom(): Promise<huddly.PTZ> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getPTZ(this.GoogleProtoEmpty, (err, ptz: huddly.PTZ) => {
        if (err != undefined) {
          this.handleError('Unable to get ptz values!', err, reject);
          return;
        }
        resolve(ptz);
      });
    });
  }

  getPanTiltZoom(): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        const ptz = await this._getPanTiltZoom();
        resolve({
          pan: {
            ...this._getDefaultParams(),
            value: ptz.getPan(),
            min: -216000,
            max: 216000,
          },
          tilt: {
            ...this._getDefaultParams(),
            value: ptz.getTilt(),
            min: -162000,
            max: 162000,
          },
          zoom: {
            ...this._getDefaultParams(),
            value: ptz.getZoom(),
            min: 1000,
            max: 4000,
            default: 2127,
          },
        });
      } catch (e) {
        this.handleError('Unable to get ptz values', e, reject);
      }
    });
  }

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
      }
    });
  }
  setPanTilt(panTilt: Object): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        await this.setPanTiltZoom(panTilt);
      } catch (err) {
        reject(err);
      }
      resolve();
    });
  }

  setPanTiltZoom(panTiltZoom: Object): Promise<void> {
    let ptz;
    return new Promise(async (resolve, reject) => {
      try {
        ptz = await this._getPanTiltZoom();
      } catch (e) {
        ptz = new huddly.PTZ();
        this.logger.error(e);
      } finally {
        const paramKeys = Object.keys(panTiltZoom);
        if (paramKeys.includes('pan')) ptz.setPan(panTiltZoom['pan']);
        if (paramKeys.includes('tilt')) ptz.setTilt(panTiltZoom['tilt']);
        if (paramKeys.includes('zoom')) ptz.setZoom(panTiltZoom['zoom']);
        this.grpcClient.setPTZ(ptz, (err, status: huddly.DeviceStatus) => {
          if (err != undefined) {
            this.logger.error('Unable to set ptz values!', err.message, Ace.name);
            this.logger.warn(err.stack, Ace.name);
            reject(err.message);
            return;
          }
          this.logger.info(status);
        });
        resolve();
      }
    });
  }

  usbReEnumerate(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  isAlive(): Boolean {
    throw new Error('Method not implemented.');
  }
}
