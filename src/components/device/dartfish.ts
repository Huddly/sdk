import { EventEmitter } from 'events';

import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import InterpolationParams from '@huddly/sdk-interfaces/lib/interfaces/IInterpolationParams';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import Api from './../api';
import Locksmith from './../locksmith';
import Boxfish from './boxfish';

/**
 * Controller class for Huddly Canvas camera.
 *
 * @export
 * @class DartFish
 * @extends {Boxfish}
 */
export default class DartFish extends Boxfish {
  /**
   * Transport instance for communicating with cameras (sending command and reading data)
   *
   * @type {IUsbTransport}
   * @memberof DartFish
   */
  transport: IUsbTransport;
  /**
   * Common Api wrapper class for invoking common functionality across device controller classes.
   *
   * @type {Api}
   * @memberof DartFish
   */
  _api: Api;
  /**
   * The uvc control interface for sending standard uvc commands to camera.
   *
   * @type {*}
   * @memberof DartFish
   */
  uvcControlInterface: any;
  /** @ignore */
  locksmith: Locksmith;
  /**
   * Event emitter instance emitting attach and detach events for Huddly Cameras.
   *
   * @type {EventEmitter}
   * @memberof DartFish
   */
  discoveryEmitter: EventEmitter;
  /**
   * Comercial product name for this controller class.
   *
   * @type {string}
   * @memberof DartFish
   */
  productName: string = 'Huddly Canvas';

  /**
   * Creates an instance of DartFish/Canvas.
   * * @param {*} uvcCameraInstance Uvc camera instance acquired from device-api-uvc discovery manager.
   * @param {IUsbTransport} transport The transport instance for communicating with the camera.
   * @param {*} uvcControlInterface Uvc control interface for performing standard uvc control commands.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly cameras.
   * @memberof DartFish
   */
  constructor(
    uvcCameraInstance: any,
    transport: IUsbTransport,
    uvcControlInterface: any,
    cameraDiscoveryEmitter: EventEmitter
  ) {
    super(uvcCameraInstance, transport, uvcControlInterface, cameraDiscoveryEmitter);
  }

  /**
   * @ignore
   * Not supprted.
   *
   * @memberof DartFish
   */
  async ensureAppMode() {
    Logger.warn('Attempting to call method [ensureAppMode] on Huddly Canvas', 'Huddly Canvas API');
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supprted.
   *
   * @memberof DartFish
   */
  getFaceBasedExposureControl(): ICnnControl {
    Logger.warn(
      'Attempting to call method [getFaceBasedExposureControl] on Huddly Canvas',
      'Huddly Canvas API'
    );
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supprted.
   *
   * @memberof DartFish
   */
  getAutozoomControl(): ICnnControl {
    Logger.warn(
      'Attempting to call method [getAutozoomControl] on Huddly Canvas',
      'Huddly Canvas API'
    );
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supprted.
   *
   * @memberof DartFish
   */
  getDetector(): IDetector {
    Logger.warn('Attempting to call method [getDetector] on Huddly Canvas', 'Huddly Canvas API');
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supprted.
   *
   * @memberof DartFish
   */
  getState(): Promise<any> {
    Logger.warn('Attempting to call method [getState] on Huddly Canvas', 'Huddly Canvas API');
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supprted.
   *
   * @memberof DartFish
   */
  async setInterpolationParams() {
    Logger.warn(
      'Attempting to call method [setInterpolationParams] on Huddly Canvas',
      'Huddly Canvas API'
    );
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supprted.
   *
   * @memberof DartFish
   */
  async getInterpolationParams(): Promise<InterpolationParams> {
    Logger.warn(
      'Attempting to call method [getInterpolationParams] on Huddly Canvas',
      'Huddly Canvas API'
    );
    throw new Error('Method not implemented/supported.');
  }

  /**
   * Disable canvas enhance mode feature on camera.
   *
   * @return {*} Resolves when the action is completed.
   * @memberof DartFish
   */
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

  /**
   * Enable canvas enahnce mode feature on camera.
   *
   * @return {*} Resolves when the action is completed.
   * @memberof DartFish
   */
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
