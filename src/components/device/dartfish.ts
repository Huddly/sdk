import { EventEmitter } from 'events';

import Api from './../api';
import Locksmith from './../locksmith';
import Boxfish from './boxfish';
import IDetector from '../../interfaces/IDetector';
import IAutozoomControl from '../../interfaces/IAutozoomControl';
import ICnnControl from '../../interfaces/ICnnControl';
import InterpolationParams from './../../interfaces/InterpolationParams';
import IUsbTransport from './../../interfaces/IUsbTransport';

export default class DartFish extends Boxfish {
  transport: IUsbTransport;
  _api: Api;
  uvcControlInterface: any;
  locksmith: Locksmith;
  discoveryEmitter: EventEmitter;
  productName: string = 'Huddly Canvas';

  constructor(
    uvcCameraInstance: any,
    transport: IUsbTransport,
    uvcControlInterface: any,
    cameraDiscoveryEmitter: EventEmitter) {
    super(uvcCameraInstance, transport, uvcControlInterface, cameraDiscoveryEmitter);
  }

  async ensureAppMode() {
    throw new Error('ensureAppMode not implemented');
  }

  getFaceBasedExposureControl(): ICnnControl {
    throw new Error('Method not implemented.');
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
