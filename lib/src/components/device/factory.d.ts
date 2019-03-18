/// <reference types="node" />
import ITransport from './../../interfaces/iTransport';
import IHuddlyDeviceAPI from './../../interfaces/iHuddlyDeviceAPI';
import DefaultLogger from './../../utilitis/logger';
import IDeviceManager from './../../interfaces/iDeviceManager';
import { EventEmitter } from 'events';
export declare const HUDDLY_GO_PID = 17;
export declare const HUDDLY_BOXFISH_PID = 33;
export default class DeviceFactory {
    /**
     * Get a concrete transport implementation on the IHuddlyDeviceAPI
     *
     * @static
     * @param {*} device An object that reperesents the usb device which is discovered
     * on the concrete implementation of the IHuddlyDeviceAPI
     * @param {IHuddlyDeviceAPI} preferredDeviceApi The main IHuddlyDeviceAPI used for communicating
     * with the camera
     * @param {Array<IHuddlyDeviceAPI>} secondaryDeviceApis Fallback IHuddlyDeviceAPI-s in case the
     * main interface does not work
     * @returns {Promise<ITransportable>} Returns the transport implementation for the device used to talk
     * to the device
     * @memberof DeviceFactory
     */
    static getTransportImplementation(device: any, preferredDeviceApi: IHuddlyDeviceAPI, secondaryDeviceApis: Array<IHuddlyDeviceAPI>): Promise<ITransport>;
    /**
     * Get an instance of the device which can be used to issue standard UVC control commands
     *
     * @static
     * @param {*} device An object that represents the usb device which is discovered
     * on the concrete implementation of the IHuddlyDeviceApi
     * @param {IHuddlyDeviceAPI} preferredDeviceApi The main IHuddlyDeviceAPI used for communicating
     * with the camera
     * @param {Array<IHuddlyDeviceAPI>} secondaryDeviceApis Fallback IHuddlyDeviceAPI-s in case the
     * main interface does not work
     * @returns {Promise<any>} Returns the device class that is used for UVC controls
     * @memberof DeviceFactory
     */
    static getUVCControlInterface(device: any, preferredDeviceApi: IHuddlyDeviceAPI, secondaryDeviceApis: Array<IHuddlyDeviceAPI>): Promise<any>;
    /**
     * Get a HID api implementation for the device
     *
     * @static
     * @param {*} device An object that represents the usb device which is discovered
     * on the concrete implementation of the IHuddlyDeviceApi
     * @param {IHuddlyDeviceAPI} preferredDeviceApi  The main IHuddlyDeviceAPI used for communicating
     * with the camera
     * @param {Array<IHuddlyDeviceAPI>} secondaryDeviceApis Fallback IHuddlyDeviceAPI-s in case the
     * main interface does not work
     * @returns {Promise<any>}  Returns the device class that is used for UVC controls
     * @memberof DeviceFactory
     */
    static getHIDInterface(device: any, preferredDeviceApi: IHuddlyDeviceAPI, secondaryDeviceApis: Array<IHuddlyDeviceAPI>): Promise<any>;
    /**
     * Function that selects the appropriate transport implementation and uvc control interface
     * and returns a concrete implementation of the IDeviceManager
     *
     * @static
     * @param {number} productId A usb device product id to distinct betweern different huddly products
     * @param {DefaultLogger} logger The logger class used for logging messages on console
     * @param {IHuddlyDeviceAPI} preferredDeviceApi The main IHuddlyDeviceAPI used for communicating
     * with the camera
     * @param {Array<IHuddlyDeviceAPI>} secondaryDeviceApis Fallback IHuddlyDeviceAPI-s in case the
     * main interface does not work
     * @param {*} devInstance  An object that represents the usb device which is discovered
     * on the concrete implementation of the IHuddlyDeviceApi
     * @returns {Promise<IDeviceManager>} Returns a concrete implementation of the IDeviceManger
     * @memberof DeviceFactory
     */
    static getDevice(productId: number, logger: DefaultLogger, preferredDeviceApi: IHuddlyDeviceAPI, secondaryDeviceApis: Array<IHuddlyDeviceAPI>, devInstance: any, cameraDiscoveryEmitter: EventEmitter, doInitialize?: boolean): Promise<IDeviceManager>;
}
