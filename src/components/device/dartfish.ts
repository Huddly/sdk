import { EventEmitter } from 'events';

import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import InterpolationParams from '@huddly/sdk-interfaces/lib/interfaces/IInterpolationParams';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import Api from './../api';
import Locksmith from './../locksmith';
import Boxfish from './boxfish';

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
    cameraDiscoveryEmitter: EventEmitter
  ) {
    super(uvcCameraInstance, transport, uvcControlInterface, cameraDiscoveryEmitter);
  }

  async ensureAppMode() {
    Logger.warn('Attempting to call method [ensureAppMode] on Huddly Canvas', 'Huddly Canvas API');
    throw new Error('Method not implemented/supported.');
  }

  getFaceBasedExposureControl(): ICnnControl {
    Logger.warn(
      'Attempting to call method [getFaceBasedExposureControl] on Huddly Canvas',
      'Huddly Canvas API'
    );
    throw new Error('Method not implemented/supported.');
  }

  getAutozoomControl(): ICnnControl {
    Logger.warn(
      'Attempting to call method [getAutozoomControl] on Huddly Canvas',
      'Huddly Canvas API'
    );
    throw new Error('Method not implemented/supported.');
  }

  getDetector(): IDetector {
    Logger.warn('Attempting to call method [getDetector] on Huddly Canvas', 'Huddly Canvas API');
    throw new Error('Method not implemented/supported.');
  }

  getState(): Promise<any> {
    Logger.warn('Attempting to call method [getState] on Huddly Canvas', 'Huddly Canvas API');
    throw new Error('Method not implemented/supported.');
  }

  async setInterpolationParams() {
    Logger.warn(
      'Attempting to call method [setInterpolationParams] on Huddly Canvas',
      'Huddly Canvas API'
    );
    throw new Error('Method not implemented/supported.');
  }

  async getInterpolationParams(): Promise<InterpolationParams> {
    Logger.warn(
      'Attempting to call method [getInterpolationParams] on Huddly Canvas',
      'Huddly Canvas API'
    );
    throw new Error('Method not implemented/supported.');
  }

  disableCanvasEnhanceMode() {
    const payload = {
      'camera-mode': 'canvas-no-enhance',
    };
    return new Promise<void>(async (resolve, reject) => {
      await this.api.setProductInfo(payload);
      const newState = await this.api.getProductInfo();
      if (newState['camera-mode'] == 'canvas-no-enhance') {
        resolve();
      } else {
        reject('Unable to turn off canvas enhance mode!');
      }
    });
  }

  enableCanvasEnhanceMode() {
    const payload = {
      'camera-mode': 'canvas',
    };
    return new Promise<void>(async (resolve, reject) => {
      await this.api.setProductInfo(payload);
      const newState = await this.api.getProductInfo();
      if (newState['camera-mode'] == 'canvas') {
        resolve();
      } else {
        reject('Unable to turn on canvas enhance mode!');
      }
    });
  }
}
