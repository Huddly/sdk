import ICnnControl from './ICnnControl';

/**
 * Interface used to configure the autozoom (genius framing) feature on the IQ camera
 *
 * @export
 * @interface IAutozoomControl
 */
export default interface IAutozoomControl extends ICnnControl {
  /**
   * Convenience function for setting up the camera
   * for starting/stopping autozoom (genius framing).
   * Should be called before any other methods.
   *
   * @returns {Promise<any>} Returns a promise which
   * resolves in case the autozoom init is completed
   * otherwise it rejects with a rejection message!
   * @memberof IAutozoomControl
   */
  init(): Promise<any>;

  /**
   * Enables the autozoom feature persistently. The enable state
   * is persistent on camera reboot/power cycle.
   *
   * @param {number} [idleTimeMs=5000] The amount of milliseconds to wait for
   * the network to load into the camera after having enabled autozoom.
   * @returns {Promise<void>} A void function.
   * @memberof IAutozoomControl
   */
  enable(idleTimeMs?: number): Promise<void>;

  /**
   * Disables the autozoom feature persistently. The disabled state
   * is persistent on camera reboot/power cycle.
   *
   * @param {number} [idleTimeMs] The amount of milliseconds to wait for
   * the network to unload on the camera after having disabled autozoom.
   * Default (5000ms)
   * @returns {Promise<void>} A void function.
   * @memberof IAutozoomControl
   */
  disable(idleTimeMs?: number): Promise<void>;

  /**
   * Checks if autozoom is enabled on the camera. Returns true if yes, false otherwise.
   *
   * @returns {Promise<Boolean} Returns a promise which resolves to true if autozoom is enabled
   * false if disabled.
   */
  isEnabled(): Promise<Boolean>;

  /**
   * Starts autozoom feature on the camera. User `Detector` class
   * for setting up detections and/or framing event listeners.
   *
   * NOTE: For persistent enable of autozoom feature you
   * need to call the `enable` method.
   *
   * @memberof IAutozoomControl
   */
  start(): Promise<void>;

  /**
   * Stops autozoom feature on the camera.
   *
   * NOTE: For persistent disable of autozoom feature you
   * need to call the `disable` method.
   *
   * @returns {Promise<void>} A void function.
   * @memberof IAutozoomControl
   */
  stop(): Promise<void>;

  /**
   * Checks if autozoom is running on the camera. Returns true if yes, false otherwise.
   *
   * @returns {Promise<Boolean>} Boolean representation of the running state
   * of autozoom feature.
   */
  isRunning(): Promise<Boolean>;

  /**
   * @ignore
   * Uploads the CNN blob used for detecting people and other
   * objects in the field of view on to the camera.
   *
   * @param {Buffer} blobBuffer The Cnn blob as a Buffer
   * @returns {Promise<void>}
   * @memberof IAutozoomControl
   */
  uploadBlob(blobBuffer: Buffer): Promise<void>;

  /**
   * @ignore
   * Uploads the detector configuration on the camera.
   *
   * @param {JSON} config JSON representation of the detector configuration file.
   * @returns {Promise<void>}
   * @memberof IAutozoomControl
   */
  setDetectorConfig(config: JSON): Promise<void>;

  /**
   * @ignore
   * Uploads the framing configuration file on to the camera.
   *
   * @param {JSON} config JSON representation of the framing configuration file.
   * @returns {Promise<void>}
   * @memberof IAutozoomControl
   */
  uploadFramingConfig(config: JSON): Promise<void>;
}
