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
   * Sends a sequence of commands to the camera to start autozoom
   * on the camera and register for detection events.
   *
   * @memberof IDetector
   */
  start(): Promise<void>;

  /**
   * Sends a sequence of commands to the camera to stop autozoom
   * and unregister from getting detection events.
   *
   * @memberof IDetector
   */
  stop(): Promise<void>;

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