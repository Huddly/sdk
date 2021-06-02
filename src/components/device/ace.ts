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
    cameraDiscoveryEmitter: EventEmitter) {

    this.wsdDevice = wsdDevuce;
    this.transport = transport;
    this.logger = logger;
    this.locksmith = new Locksmith();
    this.discoveryEmitter = cameraDiscoveryEmitter;
  }

  handleError(msg: String, error: { message: String, stack?: String }, reject: any) {
    this.logger.error(msg, error.message, Ace.name);
    this.logger.warn(error.stack, Ace.name);
    reject(error.message);
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
        ...this.wsdDevice.infoObject()
      };
      // Get devive version
      this.grpcClient.getDeviceVersion(this.GoogleProtoEmpty, (err, deviceVersion: huddly.DeviceVersion) => {
        if (err != undefined) {
          this.handleError('Unable to get device version!', err, reject);
          return;
        }
        infoData.version = deviceVersion.toObject().version;
        this.getUptime()
          .then((uptime) => {
            infoData.uptime = Number((uptime).toFixed(2));
          })
          .then(() => this.getSlot())
          .then((bootSlot) => {
            infoData.slot = bootSlot;
            resolve(infoData);
          })
          .catch((uptimeErr) => {
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
        const SlotStr: string = Object.keys(huddly.Slot).find(key => huddly.Slot[key] === slot.getSlot());
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
    throw new Error('Method not implemented.');
  }
  getSettings(forceRefresh?: Boolean): Promise<Object> {
    return new Promise(async (resolve, reject) => {
      try {
        const brightness = await this.getBrightness();
        // const saturation = await this.getSaturation();
        const ptz = await this.getPanTiltZoom();
        resolve({
          brightness,
          // saturation,
          ...ptz,
        });
      } catch (err) {
        reject(err);
      }

    });
    /* const settings = {
      brightness:
      {
        supported: true,
        value: 0,
        min: -600,
        max: 600,
        default: 0,
        resolution: 1
      },
      gain:
      {
        supported: true,
        value: 100,
        min: 100,
        max: 1200,
        default: 100,
        resolution: 1
      },
      pan:
      {
        supported: true,
        value: -14183,
        min: -216000,
        max: 216000,
        default: -14183,
        resolution: 1
      },
      powerLine:
      {
        supported: true,
        value: 1,
        min: 0,
        max: 2,
        default: 1,
        resolution: 1
      },
      saturation:
      {
        supported: true,
        value: 230,
        min: 1,
        max: 255,
        default: 230,
        resolution: 1
      },
      tilt:
      {
        supported: true,
        value: -18820,
        min: -162000,
        max: 162000,
        default: -18820,
        resolution: 1
      },
      zoom:
      {
        supported: true,
        value: 2127,
        min: 1000,
        max: 4000,
        default: 2127,
        resolution: 1
      }
    } */

  }


  /*   getSaturation(): Promise<Object> {
      return new Promise((resolve, reject) => {
        this.grpcClient.getSaturation(this.GoogleProtoEmpty, (err, saturation: huddly.Saturation) => {
          if (err !== undefined) {
            this.handleError('Unable to get saturation value', err, reject);
            return;
          };
          resolve(saturation.toOject());
        });
      });
    }

    setSaturation(value: number): Promise<void> {
      return new Promise((resolve, reject) => {
        const saturation = new huddly.Saturation();
        saturation.setSaturation(value);

        this.grpcClient.setSaturation(saturation, (err, deviceStatus: huddly.DeviceStatus) => {
          if (err != undefined) {
            this.handleError('Unable to set saturation', err, reject);
          }
          this.logger.info(deviceStatus);
          resolve();
        });
      });
    }; */

  getBrightness(): Promise<Object> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getBrightness(this.GoogleProtoEmpty, (err, brightness: huddly.Brightness) => {
        if (err != undefined) {
          this.handleError('Unable to get brightness value', err, reject);
          return;
        }
        resolve(brightness.toObject());
      });
    });
  }

  setBrightness(value: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const brightness = new huddly.Brightness();
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

  getPanTiltZoom(): Promise<Object> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getPTZ(this.GoogleProtoEmpty, (err, ptz: huddly.PTZ) => {
        if (err != undefined) {
          this.logger.error('Unable to get ptz values!', err.message, Ace.name);
          this.logger.warn(err.stack, Ace.name);
          reject(err.message);
          return;
        }
        resolve(ptz.toObject());
      });
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
      let zoom: number;
      try {
        const currentPtz = await this.getPanTiltZoom();
        zoom = currentPtz['zoom'];
      } catch (err) {
        zoom = 0;
      } finally {
        const ptz = {
          pan: panTilt['pan'],
          tilt: panTilt['tilt'],
          zoom,
        };

        try {
          await this.setPanTiltZoom(ptz);
        } catch (err) {
          reject(err);
        }
        resolve();
      }

    });
  }

  setPanTiltZoom(panTiltZoom: Object): Promise<void> {
    return new Promise(async (resolve, reject) => {
      const ptz = new huddly.PTZ();
      ptz.setPan(panTiltZoom['pan']);
      ptz.setTilt(panTiltZoom['tilt']);
      ptz.setZoom(panTiltZoom['zoom']);
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
    });
  }

  usbReEnumerate(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  isAlive(): Boolean {
    throw new Error('Method not implemented.');
  }
}
