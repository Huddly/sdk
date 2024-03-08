import DiagnosticsMessage from '@huddly/sdk-interfaces/lib/abstract_classes/DiagnosticsMessage';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';
import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import DetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import UpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import Api from '../api';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import Locksmith from '../locksmith';
import EventEmitter from 'events';
import HuddlyHEX from '@huddly/sdk-interfaces/lib/enums/HuddlyHex';
import DirectorMode from '@huddly/sdk-interfaces/lib/enums/DirectorModes.ts';
import CameraEvents from '../../utilitis/events';
import { createBoxfishUpgrader } from '../upgrader/boxfishUpgraderFactory';
import HuddlyGrpcTunnelClient from './huddlyGrpcTunnelClient';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

const MAX_UPGRADE_ATTEMPT = 3;

const DirectorModeToStringMap = {
  [DirectorMode.Speaker]: 'speaker-centric',
  [DirectorMode.Collaboration]: 'default',
};

const ModeStringToDirectorMode = {
  'speaker-centric': DirectorMode.Speaker,
  default: DirectorMode.Collaboration,
};

export default class Crew implements IDeviceManager {
  transport: IUsbTransport;
  locksmith: Locksmith;
  deviceInstance: any;
  uvcControlInterface: any;
  productName: string = 'Huddly Crew';
  _grpcTunnel: HuddlyGrpcTunnelClient;
  _api: Api;

  /**
   * Event emitter instance emitting attach and detach events for Huddly Cameras.
   *
   * @type {EventEmitter}
   * @memberof Smartbase
   */
  discoveryEmitter: EventEmitter;

  /**
   * Creates an instance of Smartbase.
   * @param {IUsbTransport} transport The transport instance for communicating with the camera.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly cameras.
   * @memberof Smartbase
   */
  constructor(deviceInstance: any, transport: IUsbTransport, cameraDiscoveryEmitter: EventEmitter) {
    this.transport = transport;
    this.locksmith = new Locksmith();
    this.discoveryEmitter = cameraDiscoveryEmitter;
    this.deviceInstance = deviceInstance;
    this.uvcControlInterface = {};
    this.assignProductInfo();
    this._grpcTunnel = new HuddlyGrpcTunnelClient(transport, this.locksmith);
  }

  assignProductInfo() {
    this['id'] = this.deviceInstance['id'];
    this['serialNumber'] = this.deviceInstance['serialNumber'];
    this['productId'] = this.deviceInstance['productId'];
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
      Logger.error('Failed to init event loop when transport reset', e, 'Smartbase API');
    }
  }

  async closeConnection(): Promise<any> {
    return this.transport.close();
  }

  async getInfo(): Promise<any> {
    const prodInfo = await this.api.getProductInfo();
    const uptime = await this.api.getUptime();
    const info = {
      softwareVersion: prodInfo['camera-version'],
      uptime: Math.round(uptime * 100) / 100, // 2 floating point decimals
      ...prodInfo,
    };
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
   * Get application log.
   *
   * @param {number} [timeout=60000] Maximum allowed time (in milliseconds) for fetching the log.
   * @param {number} [retry=1] Number of retries to perform in case something goes wrong.
   * @return {*}  {Promise<any>} A promise which when completed contains the camera application log.
   * @memberof Smartbase
   */
  async getErrorLog(timeout: number = 60000, retry: number = 1): Promise<any> {
    return this.api.getErrorLog(timeout, retry);
  }

  async eraseErrorLog(timeout: number = 60000): Promise<void> {
    await this.api.eraseErrorLog(timeout);
  }

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

  getUpgrader(): Promise<IDeviceUpgrader> {
    return createBoxfishUpgrader(this, this.discoveryEmitter);
  }

  async uptime() {
    return this.api.getUptime();
  }

  upgrade(opts: UpgradeOpts): Promise<any> {
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
              'Crew API'
            );
            tryRunAgainOnFailure(e.deviceManager);
          } else {
            Logger.error('Failed performing a camera upgrade', e, 'Crew API');
            reject(e);
          }
        }
      };
      tryRunAgainOnFailure(this);
    });
  }

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
   * Gets supported director modes as a list
   * @returns
   */

  async getSupportedDirectorModes(): Promise<DirectorMode[]> {
    const reply = await this._grpcTunnel.normalRPC(
      'GetSupportedDirectorModes',
      new Empty().serializeBinary()
    );
    const error = this._grpcTunnel.getError(reply);
    if (error) {
      throw new Error(`Encountered issue getting supported director modes: ${error.message}`);
    }
    const modesList = huddly.DirectorModes.deserializeBinary(reply.response).getModesList();
    return modesList.map((directorMode) => ModeStringToDirectorMode[directorMode.getMode()]);
  }

  async getDirectorMode(): Promise<DirectorMode> {
    const reply = await this._grpcTunnel.normalRPC(
      'GetDirectorMode',
      new Empty().serializeBinary()
    );
    const error = this._grpcTunnel.getError(reply);
    if (error) {
      throw new Error(`Encountered issue getting director mode: ${error.message}`);
    }
    const mode = huddly.DirectorMode.deserializeBinary(reply.response).getMode();
    return ModeStringToDirectorMode[mode];
  }

  async setDirectorMode(mode: DirectorMode) {
    const directorModeString = DirectorModeToStringMap[mode];

    const directorModeGrpc = new huddly.DirectorMode();
    directorModeGrpc.setMode(directorModeString);

    const reply = await this._grpcTunnel.normalRPC(
      'SetDirectorMode',
      directorModeGrpc.serializeBinary()
    );
    const error = this._grpcTunnel.getError(reply);
    if (error) {
      throw new Error(`Encountered issue getting director mode: ${error.message}`);
    }
    return huddly.DeviceStatus.deserializeBinary(reply.response).toObject();
  }

  getAutozoomControl(opts: AutozoomControlOpts): ICnnControl {
    throw new Error('Not supported for Crew.');
  }

  getFaceBasedExposureControl(): ICnnControl {
    throw new Error('Not supported for Crew.');
  }

  getDetector(opts?: DetectorOpts): IDetector {
    throw new Error('Not supported for Crew.');
  }

  getDiagnostics(): Promise<DiagnosticsMessage[]> {
    throw new Error('Not supported for Crew.');
  }

  getState(): Promise<any> {
    throw new Error('Not supported for Crew.');
  }

  getPowerUsage(): Promise<any> {
    throw new Error('Not supported for Crew.');
  }

  getTemperature(): Promise<any> {
    throw new Error('Not supported for Crew.');
  }

  getLatestFirmwareUrl(releaseChannel: ReleaseChannel) {
    throw new Error('Not supported for Crew.');
  }
}
