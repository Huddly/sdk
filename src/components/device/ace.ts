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
import ICnnControl from '../../interfaces/ICnnControl';
import AceUpgrader from './../upgrader/aceUpgrader';

import { HuddlyServiceClient } from '@huddly/huddlyproto/lib/proto/huddly_grpc_pb';
import * as huddly from '@huddly/huddlyproto/lib/proto/huddly_pb';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import * as grpc from '@grpc/grpc-js';

interface ErrorInterface {
  message: String;
  stack?: String;
}

export const minMax = {
  pan: {
    min: -216000,
    max: 216000,
  },
  tilt: {
    min: -162000,
    max: 162000,
  },
  zoom: {
    min: 1000,
    max: 4000,
    default: 2127,
  },
};

export default class Ace implements IDeviceManager, IUVCControls {
  transport: IGrpcTransport;
  logger: any;
  locksmith: Locksmith;
  productName: string = 'Huddly L1';
  discoveryEmitter: EventEmitter;
  wsdDevice: any;

  private readonly GPRC_CONNECT_TIMEOUT: number = 1; // seconds
  private readonly GRPC_PORT: number = 50051;
  private devMode: boolean = false;
  private devModeGrpcClient?: HuddlyServiceClient;

  get api(): Api {
    throw new Error('Not Supported.');
  }
  get uvcControlInterface() {
    throw new Error('Not Supported');
  }

  get grpcClient(): HuddlyServiceClient {
    if (this.devMode && this.devModeGrpcClient) {
      return this.devModeGrpcClient;
    }
    return this.transport.grpcClient;
  }

  constructor(
    wsdDevice: any,
    transport: IGrpcTransport,
    logger: DefaultLogger,
    cameraDiscoveryEmitter: EventEmitter
  ) {
    this.wsdDevice = wsdDevice;
    this.transport = transport;
    this.logger = logger;
    this.locksmith = new Locksmith();
    this.discoveryEmitter = cameraDiscoveryEmitter;
  }

  async initialize(developmentMode: boolean = false): Promise<void> {
    if (developmentMode) {
      this.logger.debug('Initializing ACE in development mode!', Ace.name);
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + this.GPRC_CONNECT_TIMEOUT);
      this.devModeGrpcClient = new HuddlyServiceClient(
        `${this.wsdDevice.ip}:${this.GRPC_PORT}`,
        grpc.credentials.createInsecure()
      );

      return new Promise<void>((resolve, reject) =>
        this.devModeGrpcClient.waitForReady(deadline, error => {
          if (error) {
            this.logger.error(
              `Connection failed with GPRC server on ACE. Reason: ${error}`,
              Ace.name
            );
            reject(error);
          } else {
            this.logger.debug(`Connection established`, Ace.name);
            // Override transport service client
            this.transport.overrideGrpcClient(this.devModeGrpcClient);
            this.logger.debug('Ace development initialization completed!', Ace.name);
            resolve();
          }
        })
      );
    }

    this.logger.debug('Ace will run in production mode', Ace.name);
    return Promise.resolve();
  }

  async closeConnection(): Promise<any> {
    this.grpcClient.close();
    return this.transport.close();
  }

  handleError(msg: String, error: ErrorInterface, reject: any) {
    if (!error) {
      this.logger.error('Unknown error', '', Ace.name);
      reject('Unknown error');
    }
    if (error.message) {
      this.logger.error(msg, error.message, Ace.name);
    }
    if (error.stack) this.logger.warn(error.stack, Ace.name);

    reject(error.message ? error.message : 'Uknown error');
  }

  getInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      const infoData = {
        ...this.wsdDevice.infoObject(),
      };
      // Get devive version
      this.grpcClient.getDeviceVersion(new Empty(), (err, deviceVersion: huddly.DeviceVersion) => {
        if (err != undefined) {
          this.logger.error('Unable to get device version!', err.message, Ace.name);
          this.logger.warn(err.stack, Ace.name);
          reject(err.message);
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
      });
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
      this.grpcClient.reset(new Empty(), (err, status: huddly.DeviceStatus) => {
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
    return Promise.resolve(new AceUpgrader(this, this.discoveryEmitter, this.logger));
  }

  upgrade(opts: IUpgradeOpts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getUpgrader()
        .then((upgrader: AceUpgrader) => {
          upgrader.init(opts);
          upgrader
            .doUpgrade()
            .then(() => resolve(undefined))
            .catch(e => reject(e));
        })
        .catch(e => reject(e));
    });
  }

  getAutozoomControl(opts: IAutozoomControlOpts): IAutozoomControl {
    throw new Error('Method not implemented.');
  }

  getFaceBasedExposureControl(): ICnnControl {
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

  getTemperature(key?: string): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        const _temperatures = await this._getTemperatures();
        const tempList = _temperatures.getTemperaturesList();
        if (key != undefined) {
          tempList.forEach(temp => {
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

  _getTemperatures(): Promise<huddly.Temperatures> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getTemperatures(new Empty(), (err, temperatures: huddly.Temperatures) => {
        if (err != undefined) {
          reject(err);
        }
        resolve(temperatures);
      });
    });
  }

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

  getLatestFirmwareUrl(releaseChannel: ReleaseChannel) {
    throw new Error('Method not implemented.');
  }

  getSlot(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getBootSlot(new Empty(), (err, slot: huddly.BootSlot) => {
        if (err != undefined) {
          this.handleError('Unable to get device boot slot', err, reject);
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

  getXUControl(controlNumber: number): Promise<Buffer> {
    throw new Error('Method not implemented.');
  }
  setXUControl(controlNumber: number, value: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getSupportedSettings(): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      // TODO: Get camera to report this
      resolve(['pan', 'tilt', 'zoom', 'brightness', 'saturation']);
    });
  }
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
            this.logger.warn(noSupportMsg);
            reject(noSupportMsg);
            break;
        }
      } catch (e) {
        reject(e);
        return;
      }
    });
  }
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
            this.logger.warn(noSupportMsg, Ace.name);
            reject(noSupportMsg);
            break;
        }
      } catch (e) {
        reject(e);
        return;
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
  _getSaturation(): Promise<huddly.Saturation> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getSaturation(
        new Empty(),
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
          ...this._getDefaultParams(),
          value: saturation.getSaturation(),
          min: saturation.getRange().getMin(),
          max: saturation.getRange().getMax(),
        });
      } catch (e) {
        this.handleError('Unable to get saturation value', e, reject);
      }
    });
  }

  setSaturation(value: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const saturation = new huddly.Saturation();
      saturation.setSaturation(value);

      this.grpcClient.setSaturation(
        saturation,
        (err: ErrorInterface, deviceStatus: huddly.DeviceStatus) => {
          if (err != undefined) {
            this.handleError('Unable to set saturation', err, reject);
          }
          this.logger.info(deviceStatus);
          resolve();
        }
      );
    });
  }

  _getBrightness(): Promise<huddly.Brightness> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getBrightness(new Empty(), (err, brightness: huddly.Brightness) => {
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
          ...this._getDefaultParams(),
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

  setBrightness(value: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const brightness = new huddly.Brightness();
      brightness.setBrightness(value);
      this.grpcClient.setBrightness(brightness, (err, deviceStatus: huddly.DeviceStatus) => {
        if (err != undefined) {
          this.handleError('Unable to set brightness', err, reject);
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
      this.grpcClient.getPTZ(new Empty(), (err, _ptz: huddly.PTZ) => {
        if (err != undefined) {
          reject(err);
        }
        const ptz = new huddly.PTZ();
        ptz.setPan(_ptz.getPan());
        ptz.setTilt(_ptz.getTilt());
        ptz.setZoom(_ptz.getZoom());
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
            ...minMax['pan'],
          },
          tilt: {
            ...this._getDefaultParams(),
            value: ptz.getTilt(),
            ...minMax['tilt'],
          },
          zoom: {
            ...this._getDefaultParams(),
            value: ptz.getZoom(),
            ...minMax['zoom'],
            default: 2127,
          },
        });
      } catch (e) {
        this.handleError('Unable to get ptz values', e, reject);
        return;
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
        return;
      }
    });
  }
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

  setPanTiltZoom(panTiltZoom: Object): Promise<void> {
    let ptz: huddly.PTZ;
    return new Promise(async (resolve, reject) => {
      try {
        ptz = await this._getPanTiltZoom();
      } catch (e) {
        ptz = new huddly.PTZ();
        this.logger.error('Unable to get PTZ values from camera', e, 'L1 API');
      } finally {
        const paramKeys = Object.keys(panTiltZoom);
        if (paramKeys.includes('pan')) ptz.setPan(panTiltZoom['pan']);
        if (paramKeys.includes('tilt')) ptz.setTilt(panTiltZoom['tilt']);
        if (paramKeys.includes('zoom')) ptz.setZoom(panTiltZoom['zoom']);
        this.grpcClient.setPTZ(ptz, (err, status: huddly.DeviceStatus) => {
          if (err != undefined) {
            this.handleError('Unable to set PTZ values!', err, reject);
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

  equals(manager: IDeviceManager) {
    if (manager instanceof Ace) {
      const otherAce = <Ace>manager;
      return otherAce.wsdDevice.equals(this.wsdDevice);
    }
    return false;
  }
  setUVCParam(key, val): void {
    this.setSettingValue(key, val);
  }
}
