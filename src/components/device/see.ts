import { EventEmitter } from 'events';
import IGrpcTransport from '@huddly/sdk-interfaces/lib/interfaces/IGrpcTransport';
import IpBaseDevice from './ipbase';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import SeeUpgrader from '../upgrader/seeUpgrader';
import IpDetector from '../ipDetector';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import IDetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';

/**
 * Controller class for Huddly S1 camera.
 *
 * @export
 * @class See
 * @extends {IpBaseDevice}
 */
export default class See extends IpBaseDevice {
  /**
   * Comercial product name for this controller class.
   *
   * @type {string}
   * @memberof See
   */
  productName: string = 'Huddly S1';

  /**
   * Creates an instance of SEE/S1.
   * @param {*} wsdDevice The wsdd device instance retrieved during discovery.
   * @param {IGrpcTransport} transport Grpc transport instance.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly SEE cameras.
   * @memberof See
   */
  constructor(wsdDevice: any, transport: IGrpcTransport, cameraDiscoveryEmitter: EventEmitter) {
    super(wsdDevice, transport, cameraDiscoveryEmitter);
  }

  /**
   * Helper function for getting the respective upgrader controller class for upgrading Huddly Ip camera
   *
   * @return {*} {Promise<IDeviceUpgrader>} The upgrader controll instance (SeeUpgrader).
   * @memberof See
   */
  getUpgrader(): Promise<IDeviceUpgrader> {
    return Promise.resolve(new SeeUpgrader(this, this.discoveryEmitter));
  }

  /**
   * Get detector control class instance.
   *
   * @param {IDetectorOpts} opts Detector control options.
   * @return {*}  {IDetector} The instance of the detector control class.
   * @memberof IpBaseDevice
   */
  getDetector(opts: IDetectorOpts): IDetector {
    return new IpDetector(this, { width: 832, height: 624 }, opts);
  }
}
