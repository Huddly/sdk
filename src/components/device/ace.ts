import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import IDetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import IGrpcTransport from '@huddly/sdk-interfaces/lib/interfaces/IGrpcTransport';
import { EventEmitter } from 'stream';
import IpDetector from '../ipDetector';
import AceUpgrader from '../upgrader/aceUpgrader';
import IpBaseDevice from './ipbase';

/**
 * Controller class for Huddly L1 camera.
 *
 * @export
 * @class Ace
 * @extends {IpBaseDevice}
 */
export default class Ace extends IpBaseDevice {
  /**
   * Comercial product name for this controller class.
   *
   * @type {string}
   * @memberof Ace
   */
  productName: string = 'Huddly L1';

  /**
   * Creates an instance of ACE/L1.
   * @param {*} wsdDevice The wsdd device instance retrieved during discovery.
   * @param {IGrpcTransport} transport Grpc transport instance.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly L1 cameras.
   * @memberof Ace
   */
  constructor(wsdDevice: any, transport: IGrpcTransport, cameraDiscoveryEmitter: EventEmitter) {
    super(wsdDevice, transport, cameraDiscoveryEmitter);
  }

  /**
   * Helper function for getting the respective upgrader controller class for upgrading Huddly Ip camera
   *
   * @return {*}  {Promise<IDeviceUpgrader>} The upgrader controll instance (AceUpgrader).
   * @memberof Ace
   */
  getUpgrader(): Promise<IDeviceUpgrader> {
    return Promise.resolve(new AceUpgrader(this, this.discoveryEmitter));
  }

  /**
   * Get detector control class instance.
   *
   * @param {IDetectorOpts} opts Detector control options.
   * @return {*}  {IDetector} The instance of the detector control class.
   * @memberof IpBaseDevice
   */
  getDetector(opts: IDetectorOpts): IDetector {
    return new IpDetector(this, { width: 832, height: 480 }, opts);
  }
}
