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
}
