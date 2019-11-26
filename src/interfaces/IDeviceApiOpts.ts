/**
 * Options passed when creating a new instance of
 * `IHuddlyDeviceApi`
 *
 * @ignore
 * @export
 * @interface DeviceApiOpts
 */
export default interface DeviceApiOpts {
  /**
   * Logger class used for logging varius levels of messages
   * like: warn, info or error!
   *
   * @type {*}
   * @memberof ApiOpts
   */
  logger?: any;
  /**
   * Low level device communication library wrapper used to
   * discover the physical camera connected to the operating
   * system!
   *
   * @type {*}
   * @memberof ApiOpts
   */
  manager?: any;

  /**
   * By default true, check if device api supports provided device,
   * if false best effort trying to map api on best effort basis, and might fail
   * @type {*}
   * @memberof ApiOpts
   */
  enforceSupport?: boolean;

  /**
   * @ignore
   * Amount of attemts seraching for provided device in LIBUSB
   * if undefined default value of 10 will be used
   * @type {*}
   * @memberof ApiOpts
   */
  maxSearchRetries?: Number;

  /**
   * @ignore
   * If true it will continue to search for device until it is found
   * or process is aborted, if false maxSearchRetries will be use
   * @type {*}
   * @memberof ApiOpts
   */
  alwaysRetry?: boolean;
}
