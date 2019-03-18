/// <reference types="node" />
import { EventEmitter } from 'events';
import IHuddlyDeviceAPI from './interfaces/iHuddlyDeviceAPI';
import DefaultLogger from './utilitis/logger';
/**
 * The SDK initialization options.
 *
 * @interface SDKOpts
 */
interface SDKOpts {
    /**
     * Logger instance used to log messages from the SDK.
     *
     * @type {*}
     * @memberof SDKOpts
     */
    logger?: any;
    /**
     * Optional event emitter instance used to catch
     * SDK events!
     * See `utilitis/events` class for all possible events.
     *
     * @type {EventEmitter}
     * @memberof SDKOpts
     */
    emitter?: EventEmitter;
    /**
     * @ignore
     *
     * @type {EventEmitter}
     * @memberof SDKOpts
     */
    apiDiscoveryEmitter?: EventEmitter;
}
/**
 * @export
 *
 * @class HuddlySdk
 * @implements {SDK}
 */
declare class HuddlySdk extends EventEmitter {
    /**
     * Event Emitter instance used to fire SDK events such as
     * ATTACH and DETACH camera events. For a full list of events
     * please see `events` class.
     *
     * @type {EventEmitter}
     * @memberof HuddlySdk
     */
    emitter: EventEmitter;
    /**
     * Logger instance used to log messages from the SDK.
     *
     * @type {DefaultLogger}
     * @memberof HuddlySdk
     */
    logger: DefaultLogger;
    /**
     * @ignore
     *
     * @type {EventEmitter}
     * @memberof HuddlySdk
     */
    deviceDiscovery: EventEmitter;
    /**
     * @ignore
     *
     * @type {IHuddlyDeviceAPI}
     * @memberof HuddlySdk
     */
    _mainDeviceApi: IHuddlyDeviceAPI;
    /**
     * @ignore
     *
     * @type {Array<IHuddlyDeviceAPI>}
     * @memberof HuddlySdk
     */
    _deviceApis: Array<IHuddlyDeviceAPI>;
    /**
     * @ignore
     *
     * @type {IHuddlyDeviceAPI}
     * @memberof HuddlySdk
     */
    _deviceDiscoveryApi: IHuddlyDeviceAPI;
    private locksmith;
    /**
     * Creates an instance of HuddlySdk.
     * @param {IHuddlyDeviceAPI} deviceDiscoveryApi The Huddly device-api used for discovering the device.
     * @param {Array<IHuddlyDeviceAPI>} [deviceApis] Optional list of device-apis used for communicating with the device.
     * By default it uses the `deviceDiscoveryApi` parameter as the device-api used for communication.
     * @param {SDKOpts} [opts] Options used for initializing the sdk. See `SDKOpts` interface.
     * @memberof HuddlySdk
     */
    constructor(deviceDiscoveryApi: IHuddlyDeviceAPI, deviceApis?: Array<IHuddlyDeviceAPI>, opts?: SDKOpts);
    /**
     * Sets up listeners for ATTACH and DETACH camera events on the
     * device discovery api. Will emit instances of `IDeviceManager`
     * when an ATTACH event occurs.
     *
     * @memberof HuddlySdk
     */
    setupDeviceDiscoveryListeners(): void;
    /**
     * Convenience function for setting the main device api
     * used for communicating with the camera.
     *
     * @memberof HuddlySdk
     */
    /**
    * Convenience function for getting the main device api
    * used for communicating with the camera.
    *
    * @type {IHuddlyDeviceAPI}
    * @memberof HuddlySdk
    */
    mainDeviceApi: IHuddlyDeviceAPI;
    /**
     * Convenience function for setting the list of
     * device apis which the SDK uses to establish
     * communication channels with the camera.
     *
     * @memberof HuddlySdk
     */
    /**
    * Convenience function for getting the list of
    * device apis used to establish communication with
    * the camera.
    *
    * @type {Array<IHuddlyDeviceAPI>}
    * @memberof HuddlySdk
    */
    deviceApis: Array<IHuddlyDeviceAPI>;
    /**
     * Convenience function for setting the device api
     * instance used for camera discovery.
     *
     * @memberof HuddlySdk
     */
    /**
    * Convenience function for getting the device api
    * instance used for camera discovery.
    *
    * @type {IHuddlyDeviceAPI}
    * @memberof HuddlySdk
    */
    deviceDiscoveryApi: IHuddlyDeviceAPI;
    /**
     * Initializes the device discovery api which in turn will fire
     * ATTACH events for all cameras attached to the system.
     *
     * @returns {Promise<any>} Returns a promise which resolves for
     * successful initialization or rejects otherwise.
     * @memberof HuddlySdk
     */
    init(): Promise<any>;
}
export default HuddlySdk;
