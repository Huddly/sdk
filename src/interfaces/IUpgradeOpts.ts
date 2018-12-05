/**
 * Options used for camera upgrade.
 *
 * @interface UpgradeOpts
 */
export default interface UpgradeOpts {
  /**
   * Buffer stream of the upgrade file.
   *
   * @type {Buffer}
   * @memberof UpgradeOpts
   */
  file: Buffer;

  /**
   * A timeout number which restricts the upgrader on
   * how long it should wait until the camera comes back
   * up after being rebooted during the upgrade process.
   * The number is specified in seconds!
   *
   * @type {number} Timeout number in seconds
   * @memberof UpgradeOpts
   */
  bootTimeout?: number;

  /**
   * @ignore
   *
   * @type {Buffer}
   * @memberof UpgradeOpts
   */
  flash_fsbl?: Buffer;
}
