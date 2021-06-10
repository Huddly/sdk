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
    cameraDiscoveryEmitter: EventEmitter) {

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

      return new Promise<void>((resolve, reject) => this.devModeGrpcClient.waitForReady(deadline, error => {
        if (error) {
          this.logger.error(`Connection failed with GPRC server on ACE. Reason: ${error}`, Ace.name);
          reject(error);
        } else {
          this.logger.debug(`Connection established`, Ace.name);
          // Override transport service client
          this.transport.overrideGrpcClient(this.devModeGrpcClient);
          this.logger.debug('Ace development initialization completed!', Ace.name);
          resolve();
        }
      }));
    }

    this.logger.debug('Ace will run in production mode', Ace.name);
    return Promise.resolve();
  }

  async closeConnection(): Promise<any> {
    this.grpcClient.close();
    return this.transport.close();
  }

  getInfo(): Promise<any> {
    return new Promise((resolve, reject) => {
      const infoData = {
        ...this.wsdDevice.infoObject()
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
    throw new Error('Method not implemented.');
  }

  getUpgrader(): Promise<IDeviceUpgrader> {
    return Promise.resolve(new AceUpgrader(this, this.discoveryEmitter, this.logger));
  }

  upgrade(opts: IUpgradeOpts): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getUpgrader()
      .then((upgrader: AceUpgrader) => {
        upgrader.init(opts);
        upgrader.doUpgrade()
        .then(() => resolve(undefined))
        .catch((e) => reject(e));
      }).catch((e) => reject(e));
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

  getTemperature(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getLatestFirmwareUrl(releaseChannel: ReleaseChannel) {
    throw new Error('Method not implemented.');
  }

  getSlot(): Promise<string> {
    return new Promise((resolve, reject) => {
      this.grpcClient.getBootSlot(new Empty(), (err, slot: huddly.BootSlot) => {
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
      this.grpcClient.getUptime(new Empty(), (err, uptime: huddly.Uptime) => {
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
    throw new Error('Method not implemented.');
  }
  resetSettings(excludeList: String[]): Promise<void> {
    throw new Error('Method not implemented.');
  }
  getPanTilt(): Promise<Object> {
    throw new Error('Method not implemented.');
  }
  setPanTilt(panTilt: Object): Promise<void> {
    throw new Error('Method not implemented.');
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
