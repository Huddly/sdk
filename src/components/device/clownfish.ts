import { EventEmitter } from 'events';

import Api from './../api';
import Locksmith from './../locksmith';
import Boxfish from './boxfish';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';

/**
 * Controller class for Huddly IQ/ONE camera.
 *
 * @export
 * @class ClownFish
 * @extends {Boxfish}
 */
export default class ClownFish extends Boxfish {
  /**
   * Transport instance for communicating with cameras (sending command and reading data)
   *
   * @type {IUsbTransport}
   * @memberof ClownFish
   */
  transport: IUsbTransport;
  /**
   * Common Api wrapper class for invoking common functionality across device controller classes.
   *
   * @type {Api}
   * @memberof ClownFish
   */
  _api: Api;
  /**
   * The uvc control interface for sending standard uvc commands to camera.
   *
   * @type {*}
   * @memberof ClownFish
   */
  uvcControlInterface: any;
  /** @ignore */
  locksmith: Locksmith;
  /**
   * Event emitter instance emitting attach and detach events for Huddly Cameras.
   *
   * @type {EventEmitter}
   * @memberof ClownFish
   */
  discoveryEmitter: EventEmitter;
  /**
   * Comercial product name for this controller class.
   *
   * @type {string}
   * @memberof ClownFish
   */
  productName: string = 'Huddly IQ';

  /**
   * Creates an instance of ClownFish.
   * @param {*} uvcCameraInstance Uvc camera instance acquired from device-api-uvc discovery manager.
   * @param {IUsbTransport} transport The transport instance for communicating with the camera.
   * @param {*} uvcControlInterface Uvc control interface for performing standard uvc control commands.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly cameras.
   * @memberof ClownFish
   */
  constructor(
    uvcCameraInstance: any,
    transport: IUsbTransport,
    uvcControlInterface: any,
    cameraDiscoveryEmitter: EventEmitter
  ) {
    super(uvcCameraInstance, transport, uvcControlInterface, cameraDiscoveryEmitter);
  }
}
