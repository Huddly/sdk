import { EventEmitter } from 'events';
import { TextDecoder } from 'util';

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
import Logger from './../../utilitis/logger';
import Locksmith from './../locksmith';
import IIpDeviceManager from './../../interfaces/iIpDeviceManager';
import IDeviceManager from './../../interfaces/iDeviceManager';
import ICnnControl from '../../interfaces/ICnnControl';
import AceUpgrader from './../upgrader/aceUpgrader';
import IpAutozoomControl from '../ipAutozoomControl';
import IpFaceBasedExposureControl from '../ipFaceBasedExposureControl';
import IpDetector from '../ipDetector';

import { HuddlyServiceClient } from '@huddly/camera-proto/lib/api/huddly_grpc_pb';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import * as grpc from '@grpc/grpc-js';
import { HUDDLY_VID } from './factory';

// TODO: Not just log status. Instead getMessage() etc.
interface ErrorInterface {
  message: String;
  stack?: String;
}

export default class Ace implements IIpDeviceManager, IUVCControls {
  transport: IGrpcTransport;
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

  constructor(wsdDevice: any, transport: IGrpcTransport, cameraDiscoveryEmitter: EventEmitter) {
    this.wsdDevice = wsdDevice;
    this.transport = transport;
    this.locksmith = new Locksmith();
    this.discoveryEmitter = cameraDiscoveryEmitter;

    const { equals, ...wsdDeviceProps } = wsdDevice; // Copy all wsdDevice props except "equals"
    Object.assign(this, wsdDeviceProps);
  }

  async initialize(developmentMode: boolean = false): Promise<void> {
    if (developmentMode) {
      this.devMode = true;
      Logger.debug('Initializing ACE in development mode!', Ace.name);
      const deadline = new Date();
      deadline.setSeconds(deadline.getSeconds() + this.GPRC_CONNECT_TIMEOUT);
      this.devModeGrpcClient = new HuddlyServiceClient(
        `${this.wsdDevice.ip}:${this.GRPC_PORT}`,
        grpc.ChannelCredentials.createInsecure()
      );

      return new Promise<void>((resolve, reject) =>
        this.devModeGrpcClient.waitForReady(deadline, (error) => {
          if (error) {
            Logger.error(`Connection failed with GPRC server on ACE. Reason: ${error}`, Ace.name);
            reject(error);
          } else {
            Logger.debug(`Connection established`, Ace.name);
            // Override transport service client
            this.transport.overrideGrpcClient(this.devModeGrpcClient);
            Logger.debug('Ace development initialization completed!', Ace.name);
            resolve();
          }
        })
      );
    }
    Logger.debug('Ace will run in production mode', Ace.name);
    return Promise.resolve();
  }

  async closeConnection(): Promise<any> {
    this.grpcClient.close();
    return this.transport.close();
  }

  handleError(msg: string, error: ErrorInterface, reject: any) {
    if (!error) {
      Logger.error(msg, '', Ace.name);
      reject(msg);
      return;
    }

    Logger.error(msg, error.stack, Ace.name);
    reject(error.message ? error.message : 'Unknown error');
  }

  getInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      const infoData = {
        ...this.wsdDevice.infoObject(),
        name: this.productName,
        vendorId: HUDDLY_VID,
      };
      // Get devive version
      this.grpcClient.getDeviceVersion(new Empty(), (err, deviceVersion: huddly.DeviceVersion) => {
        if (err != undefined) {
          Logger.error('Unable to get device version!', err.message, Ace.name);
          Logger.warn(err.stack, Ace.name);
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
            Logger.error('Unable to get device uptime!', uptimeErr.message, Ace.name);
            Logger.warn(uptimeErr.stack, Ace.name);
            reject(uptimeErr.message);
          });
      });
    });
  }

  getErrorLog(timeout?: number): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const logFile = new huddly.LogFile();
      logFile.setFile(huddly.LogFiles.APP);
      try {
        resolve(await this.getLogFiles(logFile));
      } catch (err) {
        this.handleError('Unable to get error log', err, reject);
      }
    });
  }

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

  eraseErrorLog(timeout?: number): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        const logFile = new huddly.LogFile();
        logFile.setFile(huddly.LogFiles.APP);
        resolve(await this.eraseLogFile(logFile));
      } catch (err) {
        this.handleError(`Unable to erase log file`, err, reject);
      }
    });
  }

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

  _getDefaultParams(): Object {
    return {
      suported: true,
      resolution: 1,
    };
  }

  getUpgrader(): Promise<IDeviceUpgrader> {
    return Promise.resolve(new AceUpgrader(this, this.discoveryEmitter));
  }

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

  getAutozoomControl(opts: IAutozoomControlOpts): ICnnControl {
    return new IpAutozoomControl(this, opts);
  }

  getFaceBasedExposureControl(): ICnnControl {
    return new IpFaceBasedExposureControl(this);
  }

  getDetector(opts: IDetectorOpts): IDetector {
    return new IpDetector(this, opts);
  }

  getDiagnostics(): Promise<diagnosticsMessage[]> {
    throw new Error('Method not implemented.');
  }

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

  getCnnFeatureStatus(cnnFeature: huddly.CnnFeature): Promise<huddly.CNNStatus> {
    return new Promise(async (resolve, reject) => {
      this.grpcClient.getCnnFeatureStatus(cnnFeature, (err, cnnStatus: huddly.CNNStatus) => {
        if (err != undefined) {
          this.handleError('Unable to get cnn feature status', err, reject);
        }
        resolve(cnnStatus);
      });
    });
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
          (key) => huddly.Slot[key] === slot.getSlot()
        );
        resolve(SlotStr);
      });
    });
  }

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
            Logger.warn(noSupportMsg, Ace.name);
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
            return;
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
          default: saturation.getDefaultSaturation(),
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
          Logger.info(deviceStatus.toString());
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

  setBrightness(value: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const brightness = new huddly.Brightness();
      brightness.setBrightness(value);
      this.grpcClient.setBrightness(brightness, (err, deviceStatus: huddly.DeviceStatus) => {
        if (err != undefined) {
          this.handleError('Unable to set brightness', err, reject);
        }
        Logger.info(deviceStatus.toString());
        resolve();
      });
    });
  }

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
        Logger.error('Unable to reset settings', e, Ace.name);
        rej(e);
      }
    });
  }

  _getPanTiltZoom(): Promise<huddly.PTZ> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getPTZ(new Empty(), (err, ptz: huddly.PTZ) => {
        if (err != undefined) {
          reject(err);
        }
        resolve(ptz);
      });
    });
  }

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
}
