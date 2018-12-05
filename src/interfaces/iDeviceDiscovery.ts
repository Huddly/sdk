import EventEmitter from 'events';

/**
 * Interface used for discovering attached devices on the system.
 *
 * @ignore
 * @export
 * @interface IDeviceDiscovery
 */
export default interface IDeviceDiscovery {
  /**
   * Register and subscribe for device hot-plug events (ATTACH and DETACH). It is
   * used by the `Device APIs` to catch Attach and Detach events on the lower level
   * libraries (for example node-usb or chrome-usb).
   *
   * @param {EventEmitter} eventEmitter The event emitter used to propagate back the
   * hot-plug event.
   * @memberof IDeviceDiscovery
   */
  registerForHotplugEvents(eventEmitter: EventEmitter);
}
