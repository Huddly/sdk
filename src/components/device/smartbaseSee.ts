import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import EventEmitter from 'events';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import SeeUpgrader from '../upgrader/seeUpgrader';
import IDetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import IpDetector from '../ipDetector';
import UsbAdapterCamera from './smartbaseCamera';

export default class UsbAdapterSee extends UsbAdapterCamera {
  constructor(deviceInstance: any, transport: IUsbTransport, cameraDiscoveryEmitter: EventEmitter) {
    super(deviceInstance, transport, cameraDiscoveryEmitter, 'Huddly S1');
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
   * @memberof UsbAdapterSee
   */
  getDetector(opts: IDetectorOpts): IDetector {
    return new IpDetector(this, { width: 832, height: 624 }, opts);
  }
}
