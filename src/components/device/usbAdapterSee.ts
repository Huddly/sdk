import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import SmartbaseCamera from './usbAdapterCamera';
import EventEmitter from 'events';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import SeeUpgrader from '../upgrader/seeUpgrader';
import IDetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import IpDetector from '../ipDetector';

export default class SmartbaseAce extends SmartbaseCamera {
  constructor(deviceInstance: any, transport: IUsbTransport, cameraDiscoveryEmitter: EventEmitter) {
    super(deviceInstance, transport, cameraDiscoveryEmitter);
    this.productName = 'Huddly L1';
  }

  /**
   * Helper function for getting the respective upgrader controller class for upgrading Huddly Ip camera
   *
   * @return {*}  {Promise<IDeviceUpgrader>} The upgrader controll instance (SeeUpgrader).
   * @memberof Ace
   */
  getUpgrader(): Promise<IDeviceUpgrader> {
    return Promise.resolve(new SeeUpgrader(this, this.cameraDiscoveryEmitter));
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
