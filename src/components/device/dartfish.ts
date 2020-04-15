import { EventEmitter } from 'events';

import Api from './../api';
import DefaultLogger from './../../utilitis/logger';
import ITransport from './../../interfaces/iTransport';
import Locksmith from './../locksmith';
import Boxfish from './boxfish';
import IDetector from '../../interfaces/IDetector';
import IAutozoomControl from '../../interfaces/IAutozoomControl';
import InterpolationParams from './../../interfaces/InterpolationParams';

export default class DartFish extends Boxfish {
  transport: ITransport;
  _api: Api;
  uvcControlInterface: any;
  logger: DefaultLogger;
  locksmith: Locksmith;
  discoveryEmitter: EventEmitter;
  productName: string = 'Huddly Canvas';

  constructor(
    uvcCameraInstance: any,
    transport: ITransport,
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
}
