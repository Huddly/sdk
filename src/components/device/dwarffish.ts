import { EventEmitter } from 'events';

import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import InterpolationParams from '@huddly/sdk-interfaces/lib/interfaces/IInterpolationParams';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';

import Api from '../api';
import Locksmith from '../locksmith';
import Boxfish from './boxfish';
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
    cameraDiscoveryEmitter: EventEmitter
  ) {
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
    Logger.warn(
      'Attempting to call method [setInterpolationParams] on Huddly ONE',
      'HuddlyONE API'
    );
    throw new Error('Method not implemented/supported.');
  }

  async getInterpolationParams(): Promise<InterpolationParams> {
    Logger.warn(
      'Attempting to call method [getInterpolationParams] on Huddly ONE',
      'HuddlyONE API'
    );
    throw new Error('Method not implemented/supported.');
  }

  async getLatestFirmwareUrl(
    releaseChannel: ReleaseChannel = ReleaseChannel.STABLE
  ): Promise<string> {
    Logger.warn('Attempting to call method [getLatestFirmwareUrl] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }
}
