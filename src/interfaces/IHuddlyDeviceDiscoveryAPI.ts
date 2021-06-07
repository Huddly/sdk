import EventEmitter from 'events';

/**
 * Interface used to manage, operate and communicate with a Huddly device.
 *
 * @ignore
 * @interface IHuddlyDeviceAPI
 */
export default interface IHuddlyDeviceDiscoveryAPI {
  /**
   * Sets up the device discovery manager so that ATTACH and DETACH events are
   * fired immediately for the corresponding Huddly devices attached on (or being
   * detached from) the host machine.
   *
   * @memberof IHuddlyDeviceAPI
   */
  initialize(): void;

  /**
   * Sets up the event listeners for ATTACH and DETACH on the `DeviceDiscovery`
   * class.
   *
   * @param {EventEmitter} eventEmitter The emitter that is used to delegate
   * the ATTACH/DETACH events.
   * @memberof IHuddlyDeviceAPI
   */
  registerForHotplugEvents(eventEmitter: EventEmitter): void;
}
