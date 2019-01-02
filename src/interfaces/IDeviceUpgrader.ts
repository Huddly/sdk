import UpgradeOpts from './IUpgradeOpts';

/**
 * Interface used to perform software upgrades.
 *
 * @interface IDeviceUpgrader
 */
export default interface IDeviceUpgrader {

  /**
   * Initializes the upgrader with all the necessary upgrade options such as filepath,
   * verbose level etc.
   *
   * @param {*} opts Upgrade options
   * @memberof IDeviceUpgrader
   */
  init(opts: UpgradeOpts): void;

  /**
   * Initiate the upgrade process on the target device.
   * Use event handlers to track the upgrade progress.
   *
   * @memberof IDeviceUpgrader
   */
  start(): Promise<void>;

  /**
   * EventEmitter `on` listener
   *
   * @param {string} message The message use to setup the listener for
   * @param {*} callback A callback used to perform actions on the caught event
   * @memberof Transportable
   */
  on(message: string, callback: any);

  /**
   * EventEmitter `once` listener
   *
   * @param {string} message The message use to setup the listener for
   * @param {*} callback A callback used to perform actions on the caught event
   * @memberof Transportable
   */
  once(message: string, callback: any);

  /**
   * Perform camera upgrade without event handlers. This is a
   * function which you call and await for completion. You can either
   * use `Promise await` style or `Promise then/catch` for handling
   * callbacks.
   *
   * @returns {Promise<any>} A `Promise` that resolves when upgrade succeeds or rejects
   * when uprade fails.
   * @memberof IDeviceUpgrader
   */
  doUpgrade(): Promise<any>;

  /**
   * Verifies if camera performed a valid upgrade
   *
   * @returns {Promise<booleean>} A `Promise` that resolves when upgrade is valid
   * @memberof IDeviceUpgrader
   */
  upgradeIsValid(): Promise<boolean>;
}
