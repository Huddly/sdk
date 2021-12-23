import { EventEmitter } from 'events';

import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import InterpolationParams from '@huddly/sdk-interfaces/lib/interfaces/IInterpolationParams';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import Api from '../api';
import Locksmith from '../locksmith';
import Boxfish from './boxfish';

/**
 * Controller class for Huddly ONE camera.
 *
 * @export
 * @class Dwarffish
 * @extends {Boxfish}
 */
export default class Dwarffish extends Boxfish {
  /**
   * Transport instance for communicating with cameras (sending command and reading data)
   *
   * @type {IUsbTransport}
   * @memberof Dwarffish
   */
  transport: IUsbTransport;
  /**
   * Common Api wrapper class for invoking common functionality across device controller classes.
   *
   * @type {Api}
   * @memberof Dwarffish
   */
  _api: Api;
  /**
   * The uvc control interface for sending standard uvc commands to camera.
   *
   * @type {*}
   * @memberof Dwarffish
   */
  uvcControlInterface: any;
  /** @ignore */
  locksmith: Locksmith;
  /**
   * Event emitter instance emitting attach and detach events for Huddly Cameras.
   *
   * @type {EventEmitter}
   * @memberof Dwarffish
   */
  discoveryEmitter: EventEmitter;
  /**
   * Comercial product name for this controller class.
   *
   * @type {string}
   * @memberof Dwarffish
   */
  productName: string = 'Huddly ONE';

  /**
   * Creates an instance of Dwarffish/ONE.
   * @param {*} uvcCameraInstance Uvc camera instance acquired from device-api-uvc discovery manager.
   * @param {IUsbTransport} transport The transport instance for communicating with the camera.
   * @param {*} uvcControlInterface Uvc control interface for performing standard uvc control commands.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly cameras.
   * @memberof Dwarffish
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
   * Not supported
   *
   * @memberof Dwarffish
   */
  async ensureAppMode() {
    Logger.warn('Attempting to call method [ensureAppMode] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supported
   *
   * @memberof Dwarffish
   */
  getAutozoomControl(): ICnnControl {
    Logger.warn('Attempting to call method [getAutozoomControl] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supported
   *
   * @memberof Dwarffish
   */
  getDetector(): IDetector {
    Logger.warn('Attempting to call method [getDetector] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supported
   *
   * @memberof Dwarffish
   */
  getState(): Promise<any> {
    Logger.warn('Attempting to call method [getState] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supported
   *
   * @memberof Dwarffish
   */
  async setInterpolationParams() {
    Logger.warn(
      'Attempting to call method [setInterpolationParams] on Huddly ONE',
      'HuddlyONE API'
    );
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supported
   *
   * @memberof Dwarffish
   */
  async getInterpolationParams(): Promise<InterpolationParams> {
    Logger.warn(
      'Attempting to call method [getInterpolationParams] on Huddly ONE',
      'HuddlyONE API'
    );
    throw new Error('Method not implemented/supported.');
  }

  /**
   * @ignore
   * Not supported
   *
   * @memberof Dwarffish
   */
  async getLatestFirmwareUrl(
    releaseChannel: ReleaseChannel = ReleaseChannel.STABLE
  ): Promise<string> {
    Logger.warn('Attempting to call method [getLatestFirmwareUrl] on Huddly ONE', 'HuddlyONE API');
    throw new Error('Method not implemented/supported.');
  }
}
