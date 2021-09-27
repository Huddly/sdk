import { EventEmitter } from 'events';

import Api from '../api';
import IUsbTransport from '../../interfaces/IUsbTransport';
import Locksmith from '../locksmith';
import Boxfish from './boxfish';
import IDetector from '../../interfaces/IDetector';
import ICnnControl from '../../interfaces/ICnnControl';
import InterpolationParams from '../../interfaces/InterpolationParams';
import ReleaseChannel from './../../interfaces/ReleaseChannelEnum';
import Logger from './../../utilitis/logger';

export default class Dwarffish extends Boxfish {
  transport: IUsbTransport;
  _api: Api;
  uvcControlInterface: any;
  locksmith: Locksmith;
  discoveryEmitter: EventEmitter;
  productName: string = 'Huddly ONE';

  constructor(
    uvcCameraInstance: any,
    transport: IUsbTransport,
    uvcControlInterface: any,
    cameraDiscoveryEmitter: EventEmitter) {
    super(uvcCameraInstance, transport, uvcControlInterface, cameraDiscoveryEmitter);
  }

  async ensureAppMode() {
    Logger.warn('Attempting to call method [ensureAppMode] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }

  getAutozoomControl(): ICnnControl {
    Logger.warn('Attempting to call method [getAutozoomControl] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }

  getDetector(): IDetector {
    Logger.warn('Attempting to call method [getDetector] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }

  getState(): Promise<any> {
    Logger.warn('Attempting to call method [getState] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }

  async setInterpolationParams() {
    Logger.warn('Attempting to call method [setInterpolationParams] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }

  async getInterpolationParams(): Promise<InterpolationParams> {
    Logger.warn('Attempting to call method [getInterpolationParams] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }

  async getLatestFirmwareUrl(releaseChannel: ReleaseChannel = ReleaseChannel.STABLE) {
    Logger.warn('Attempting to call method [getLatestFirmwareUrl] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }
}
