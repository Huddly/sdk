import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import AceUpgrader from '../upgrader/aceUpgrader';
import IDetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import IpDetector from '../ipDetector';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import EventEmitter from 'events';
import UsbAdapterCamera from './usbAdapterCamera';

export default class UsbAdapterAce extends UsbAdapterCamera {
  constructor(deviceInstance: any, transport: IUsbTransport, cameraDiscoveryEmitter: EventEmitter) {
    super(deviceInstance, transport, cameraDiscoveryEmitter, 'Huddly L1');
  }

  /**
   * Helper function for getting the respective upgrader controller class for upgrading Huddly Ip camera
   *
   * @return {*}  {Promise<IDeviceUpgrader>} The upgrader controll instance (AceUpgrader).
   * @memberof UsbAdapterAce
   */
  getUpgrader(): Promise<IDeviceUpgrader> {
    return Promise.resolve(new AceUpgrader(this, this.cameraDiscoveryEmitter));
  }

  /**
   * Get detector control class instance.
   *
   * @param {IDetectorOpts} opts Detector control options.
   * @return {*}  {IDetector} The instance of the detector control class.
   * @memberof UsbAdapterAce
   */
  getDetector(opts: IDetectorOpts): IDetector {
    return new IpDetector(this, { width: 832, height: 480 }, opts);
  }
}
