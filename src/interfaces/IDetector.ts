/**
 * Interface used to configure, load and get detections from the camera.
 *
 * @export
 * @interface IDetector
 */
export default interface IDetector {
  /**
   * Convenience function for setting up the camera
   * for starting/stopping genius framing. Should be
   * called before any other methods.
   *
   * @returns {Promise<any>} Returns a promise which
   * resolves in case the detector init is completed
   * otherwise it rejects with a rejection message!
   * @memberof IDetector
   */
  init(): Promise<any>;

  /**
   * Enables the autozoom feature persistently. The enable state
   * is persistent on camera reboot/power cycle.
   *
   * @param {number} [idleTimeMs] The amount of milliseconds to wait for
   * the network to load into the camera after having enabled autozoom.
   * Default (5000ms)
   * @memberof IDetector
   */
  enable(idleTimeMs?: number): Promise<void>;

  /**
   * Disables the autozoom feature persistently. The disabled state
   * is persistent on camera reboot/power cycle.
   *
   * @param {number} [idleTimeMs] The amount of milliseconds to wait for
   * the network to unload on the camera after having disabled autozoom.
   * Default (5000ms)
   * @memberof IDetector
   */
  disable(idleTimeMs?: number): Promise<void>;

  /**
   * Checks if autozoom is enabled on the camera. Returns true if yes, false if no
   *
   * @returns {Promise<Boolean} Returns a promise which resolves to true if autozoom is enabled
   * false if disabled.
   */
  isEnabled(): Promise<Boolean>;

  /**
   * Starts autozoom feature on the camera and sets up
   * detection and framing events that can be used to
   * subscribe to for getting people count and framing
   * data.
   * NOTE: For persistent enable of autozoom feature you
   * need to call the `enable` method.
   *
   * @memberof IDetector
   */
  start(): Promise<void>;

  /**
   * Stops genius framing on the camera and unregisters
   * the listeners for detection and framing information.
   * NOTE: For persistent disable of autozoom feature you
   * need to call the `disable` method.
   *
   * @memberof IDetector
   */
  stop(): Promise<void>;

  /**
   * Checks if autozoom is running on the camera. Returns true if yes, false if no
   *
   * @returns {Promise<Boolean>} Returns true if autozoom is running,
   * false if autozoom is disabled
   */
  isRunning(): Promise<Boolean>;

  /**
   * @ignore
   * Uploads the CNN blob used for detecting people and other
   * objects in the field of view on to the camera.
   *
   * @param {Buffer} blobBuffer The Cnn blob as a Buffer
   * @returns {Promise<void>}
   * @memberof IDetector
   */
  uploadBlob(blobBuffer: Buffer): Promise<void>;

  /**
   * @ignore
   * Uploads the detector configuration.
   *
   * @param {JSON} config JSON representation of the detector configuration file.
   * @returns {Promise<void>}
   * @memberof IDetector
   */
  setDetectorConfig(config: JSON): Promise<void>;

  /**
   * @ignore
   * Uploads the framing configuration file on to the camera.
   *
   * @param {JSON} config JSON representation of the framing configuration file.
   * @returns {Promise<void>}
   * @memberof IDetector
   */
  uploadFramingConfig(config: JSON): Promise<void>;

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
   * @param {*} callback A callback used to perform actions on the caught event
   * @memberof IDetector
   */
  once(message: string, callback: any);
}
