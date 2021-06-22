import IDeviceUpgrader from './IDeviceUpgrader';

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
   * @type {number}
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

  /**
   * A boolean option which is used to printout the upgrade progress
   * status for all the individual steps included in performing the whole
   * upgrade process.
   *
   * @type {boolean}
   * @memberof UpgradeOpts
   */
  verboseStatusLog?: boolean;

  /**
   * Optional parameter to specify how long to wait for a status message before timing out
   *
   * @type {number}
   * @memberof UpgradeOpts
   */
  statusMessageTimeout?: number;

  /**
   * Optional parameter providing upgrdare instance to be used for upgrade
   *
   * @type {IDeviceUpgrader}
   * @memberof UpgradeOpts
   */
  upgrader?: IDeviceUpgrader;

  /**
   * A boolean option which is used only in production of camera.
   * Changes the criterias when an upgrade has been completed successfully.
   *
   * @type {boolean}
   * @memberof UpgradeOpts
   */
  production_upgrade?: boolean;
}
