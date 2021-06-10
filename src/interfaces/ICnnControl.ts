export default interface ICnnControl {
  /**
   * Enables the cnn feature persistently. The enable state
   * is persistent on camera reboot/power cycle.
   *
   * @returns {Promise<void>} A void function.
   * @memberof ICnnControl
   */
  enable(idleTimeMs?: number): Promise<void>;

  /**
   * Disables the cnn feature persistently. The disabled state
   * is persistent on camera reboot/power cycle.
   *
   * @returns {Promise<void>} A void function.
   * @memberof ICnnControl
   */
  disable(idleTimeMs?: number): Promise<void>;

  /**
   * Checks if cnn feature is enabled on the camera. Returns true if yes, false otherwise.
   *
   * @returns {Promise<Boolean} Returns a promise which resolves to true if cnn features is enabled
   * false if disabled.
   */
  isEnabled(): Promise<Boolean>;
}
