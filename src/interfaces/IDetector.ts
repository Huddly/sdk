/**
 * Interface used to configure, load and get detections from the camera.
 *
 * @export
 * @interface IDetector
 */
export default interface IDetector {
  /**
   * Convenience function for setting detection and/or
   * framing data event listeners.
   *
   * @returns {Promise<any>} A void function.
   * @memberof IDetector
   */
  init(): Promise<void>;

  /**
   * This function takes care of appropriately tearing down the
   * detector instance by unregistering all previously setup
   * subscriptions. In case the detector has been configured
   * to generate detection data without streaming main, then
   * this method will make sure the camera stops generating
   * detection events and stops it's internal streaming.
   *
   * @returns {Promise<void>} A void function.
   * @memberof IDetector
   */
  destroy(): Promise<void>;

  /**
   * EventEmitter `on` listener. It is used for emitting detector events
   * such as DETECTOR_START, DETECTOR_STOP, DETECTIONS etc. The list of
   * detector events together with all the other camera events can be found in the `Events.ts` class.
   *
   * @param {string} message The message use to setup the listener for.
   * @param {*} callback A callback used to perform actions on the caught event.
   * @memberof IDetector
   */
  on(message: string, callback: any);

  /**
   * EventEmitter `once` listener. Similar to the `#on` function,
   * instead here the listener is invoked only once and that is
   * the first time the message is emitted from the `Detector` implementation class.
   *
   * @param {string} message The message use to setup the listener for
   * @param {*} callback A callback used to perform actions on the caught event.
   * @memberof IDetector
   */
  once(message: string, callback: any);

  /**
   * EventEmitter `removeListener` method. Unregisters any event listeners
   * setup on the detector class (that is either the detection or framing
   * data event listeners).
   *
   * @param {string} message The message used to setup the listener
   * @param {*} callbackFn The callback function used to perform actions
   * on the caught event.
   * @memberof IDetector
   */
  removeListener(message: string, callbackFn: any);

  /**
   * EventEmitter `removeAllListeners` method. Unregisters all event
   * listeners setup on the given message name.
   *
   * @param {string} message The message used to setup the listeners
   * @memberof IDetector
   */
  removeAllListeners(message: string);
}
