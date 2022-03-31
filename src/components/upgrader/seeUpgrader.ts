import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import { EventEmitter } from 'stream';
import IpCameraUpgrader from './ipUpgrader';

/**
 * Controller class for instrumenting the upgrade process on Huddly S1 camera.
 *
 * @export
 * @class SeeUpgrader
 * @extends {IpCameraUpgrader}
 */
export default class SeeUpgrader extends IpCameraUpgrader {
  className: string = 'SeeUpgrader';

  /**
   * Creates a new instance of SeeUpgrader.
   * @param {IDeviceManager} manager An instance of IDeviceManager setup for an See/S1 device.
   * @param {EventEmitter} sdkDeviceDiscoveryEmitter Event emitter object that emits ATTACH & DETACH events for See/S1 devices on the network
   * @memberof SeeUpgrader
   */
  constructor(manager: IDeviceManager, sdkDeviceDiscoveryEmitter: EventEmitter) {
    super(manager, sdkDeviceDiscoveryEmitter);
  }
}
