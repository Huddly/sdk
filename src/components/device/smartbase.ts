import DiagnosticsMessage from '@huddly/sdk-interfaces/lib/abstract_classes/DiagnosticsMessage';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';
import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import DetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import IDeviceCommonApi from '@huddly/sdk-interfaces/lib/interfaces/IDeviceCommonApi';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import ITransport from '@huddly/sdk-interfaces/lib/interfaces/ITransport';
import UpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import { createBoxfishUpgrader } from '../upgrader/boxfishUpgraderFactory';
import CameraEvents from '../../utilitis/events';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';
import EventEmitter from 'events';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import Api from '../api';
import Locksmith from '../locksmith';

const MAX_UPGRADE_ATTEMPT = 2;

class Smartbase implements IDeviceManager {
  transport: IUsbTransport;
  locksmith: Locksmith;
  _api: Api;
  uvcControlInterface: any;
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
   * @param {*} uvcControlInterface Uvc control interface for performing standard uvc control commands.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly cameras.
   * @memberof Smartbase
   */
  constructor(
    transport: IUsbTransport,
    uvcControlInterface: any,
    cameraDiscoveryEmitter: EventEmitter
  ) {
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

  closeConnection(): Promise<any> {
    throw new Error('Not supported for Smartbase.');
  }
  getInfo(): Promise<any> {
    throw new Error('Not supported for Smartbase.');
  }
  getErrorLog(timeout: number): Promise<any> {
    throw new Error('Not supported for Smartbase.');
  }
  eraseErrorLog(timeout: number): Promise<void> {
    throw new Error('Not supported for Smartbase.');
  }
  reboot(mode?: string): Promise<void> {
    throw new Error('Not supported for Smartbase.');
  }
  getUpgrader(): Promise<IDeviceUpgrader> {
    throw new Error('Not supported for Smartbase.');
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

  getAutozoomControl(opts: AutozoomControlOpts): ICnnControl {
    throw new Error('Not supported for Smartbase.');
  }
  getFaceBasedExposureControl(): ICnnControl {
    throw new Error('Not supported for Smartbase.');
  }
  getDetector(opts: DetectorOpts): IDetector {
    throw new Error('Not supported for Smartbase.');
  }
  getDiagnostics(): Promise<DiagnosticsMessage[]> {
    throw new Error('Not supported for Smartbase.');
  }
  getState(): Promise<any> {
    throw new Error('Not supported for Smartbase.');
  }
  getPowerUsage(): Promise<any> {
    throw new Error('Not supported for Smartbase.');
  }
  getTemperature(): Promise<any> {
    throw new Error('Not supported for Smartbase.');
  }
  getLatestFirmwareUrl(releaseChannel: ReleaseChannel) {
    throw new Error('Not supported for Smartbase.');
  }
}
