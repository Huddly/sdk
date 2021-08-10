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
   * @deprecated
   * Logger class used for logging varius levels of messages
   * like: warn, info or error!
   *
   * @type {*}
   * @memberof DeviceApiOpts
   */
  logger?: any;
  /**
   * Low level device communication library wrapper used to
   * discover the physical camera connected to the operating
   * system!
   *
   * @type {*}
   * @memberof DeviceApiOpts
   */
  manager?: any;

  /**
   * By default true, check if device api supports provided device,
   * if false best effort trying to map api on best effort basis, and might fail
   * @type {*}
   * @memberof DeviceApiOpts
   */
  enforceSupport?: boolean;

  /**
   * @ignore
   * Amount of attemts seraching for provided device in LIBUSB
   * if undefined default value of 10 will be used
   * @type {*}
   * @memberof DeviceApiOpts
   */
  maxSearchRetries?: Number;

  /**
   * @ignore
   * If true it will continue to search for device until it is found
   * or process is aborted, if false maxSearchRetries will be use
   * @type {*}
   * @memberof DeviceApiOpts
   */
  alwaysRetry?: boolean;

  /**
   * Note: this option applies to device-api-ip module.
   * If provided, it sets the default outgoing multicast interface of
   * the socket to a specific interface. Must be a valid string
   * representation of an IP from the socket's family.
   * @type {*}
   * @memberof DeviceApiOpts
   */
  targetInterfaceAddr?: string;

  /**
   * Note: this option applies to device-api-ip module.
   * Similar to [targetInterfaceAddr] option, except
   * that here you provide the name of the interface
   * instead of it's ip address.
   * @type {*}
   * @memberof DeviceApiOpts
   */
  targetInterfaceName?: string;
}
