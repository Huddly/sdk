import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import { EventEmitter } from 'stream';
import IpCameraUpgrader from './ipUpgrader';

/**
 * Controller class for instrumenting the upgrade process on Huddly L1 camera.
 *
 * @export
 * @class AceUpgrader
 * @extends {IpCameraUpgrader}
 */
export default class AceUpgrader extends IpCameraUpgrader {
  className: string = 'AceUpgrader';

  /**
   * Creates a new instance of AceUpgrader.
   * @param {IDeviceManager} manager An instance of IDeviceManager setup for an ACE/L1 device.
   * @param {EventEmitter} sdkDeviceDiscoveryEmitter Event emitter object that emits ATTACH & DETACH events for ACE/L1 devices on the network
   * @memberof AceUpgrader
   */
  constructor(manager: IDeviceManager, sdkDeviceDiscoveryEmitter: EventEmitter) {
    super(manager, sdkDeviceDiscoveryEmitter);
  }
}
