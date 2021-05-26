import { EventEmitter } from 'events';

import Api from '../api';
import DefaultLogger from '../../utilitis/logger';
import IUsbTransport from '../../interfaces/IUsbTransport';
import Locksmith from '../locksmith';
import Boxfish from './boxfish';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import IDetector from '../../interfaces/IDetector';
import IAutozoomControl from '../../interfaces/IAutozoomControl';
import InterpolationParams from '../../interfaces/InterpolationParams';
import ReleaseChannel from './../../interfaces/ReleaseChannelEnum';

export default class Dwarffish extends Boxfish {
  transport: IUsbTransport;
  _api: Api;
  uvcControlInterface: any;
  logger: DefaultLogger;
  locksmith: Locksmith;
  discoveryEmitter: EventEmitter;
  productName: string = 'Huddly IQ Lite';

  constructor(
    uvcCameraInstance: any,
    transport: IUsbTransport,
    uvcControlInterface: any,
    logger: DefaultLogger,
    cameraDiscoveryEmitter: EventEmitter) {
    super(uvcCameraInstance, transport, uvcControlInterface, logger, cameraDiscoveryEmitter);
  }

  async ensureAppMode() {
    throw new Error('ensureAppMode not implemented');
  }

  getAutozoomControl(): IAutozoomControl {
    throw new Error('getAutozoomControl not implemented');
  }

  getDetector(): IDetector {
    throw new Error('getDetector not implemented');
  }

  getState(): Promise<any> {
    throw new Error('getState not implemented');
  }

  async setInterpolationParams() {
    throw new Error('setInterpolationParams not implemented');
  }

  async getInterpolationParams(): Promise<InterpolationParams> {
    throw new Error('getInterpolationParams not implemented');
  }

  async upgrade(opts: UpgradeOpts): Promise<any> {
    throw new Error('upgrade not implemented');
  }

  async getLatestFirmwareUrl(releaseChannel: ReleaseChannel = ReleaseChannel.STABLE) {
    throw new Error('getLatestFirmwareUrl not implemented');
  }
}
