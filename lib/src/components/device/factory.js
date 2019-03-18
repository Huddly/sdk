"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const huddlygo_1 = __importDefault(require("./huddlygo"));
const boxfish_1 = __importDefault(require("./boxfish"));
exports.HUDDLY_GO_PID = 0x11;
exports.HUDDLY_BOXFISH_PID = 0x21;
class DeviceFactory {
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
    static getTransportImplementation(device, preferredDeviceApi, secondaryDeviceApis) {
        return __awaiter(this, void 0, void 0, function* () {
            const mainTransport = yield preferredDeviceApi.getValidatedTransport(device);
            if (mainTransport) {
                return mainTransport;
            }
            for (const deviceApi of secondaryDeviceApis) {
                const fallbackTransport = yield deviceApi.getValidatedTransport(device);
                if (fallbackTransport) {
                    return fallbackTransport;
                }
            }
            throw new Error(`Unable to find appropriate transport implementation for device: ${JSON.stringify(device)}`);
        });
    }
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
    static getUVCControlInterface(device, preferredDeviceApi, secondaryDeviceApis) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield preferredDeviceApi.isUVCControlsSupported(device)) {
                return preferredDeviceApi.getUVCControlAPIForDevice(device);
            }
            for (const deviceApi of secondaryDeviceApis) {
                if (yield deviceApi.isUVCControlsSupported(device)) {
                    return deviceApi.getUVCControlAPIForDevice(device);
                }
            }
            // throw new Error(`Unable to find appropriate uvc control api for ${device}`);
            // TODO: Log a warning that none of device api-s support uvc control interface
            // Boxfish.ts should handle to not use uvc commands when device-api is usb
            return undefined;
        });
    }
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
    static getHIDInterface(device, preferredDeviceApi, secondaryDeviceApis) {
        return __awaiter(this, void 0, void 0, function* () {
            if (yield preferredDeviceApi.isHIDSupported(device)) {
                return preferredDeviceApi.getHIDAPIForDevice(device);
            }
            for (const deviceApi of secondaryDeviceApis) {
                if (yield deviceApi.isHIDSupported(device)) {
                    return deviceApi.getHIDAPIForDevice(device);
                }
            }
            throw new Error(`Unable to find appropriate HID interface for device: ${JSON.stringify(device)}`);
        });
    }
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
    static getDevice(productId, logger, preferredDeviceApi, secondaryDeviceApis, devInstance, cameraDiscoveryEmitter, doInitialize = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const transport = yield this.getTransportImplementation(devInstance, preferredDeviceApi, secondaryDeviceApis);
            const uvcControlInterface = yield this.getUVCControlInterface(devInstance, preferredDeviceApi, secondaryDeviceApis);
            let device;
            switch (productId) {
                case exports.HUDDLY_GO_PID:
                    const hidApi = yield this.getHIDInterface(devInstance, preferredDeviceApi, secondaryDeviceApis);
                    device = new huddlygo_1.default(devInstance, transport, uvcControlInterface, hidApi, logger, cameraDiscoveryEmitter);
                    break;
                case exports.HUDDLY_BOXFISH_PID:
                    device = new boxfish_1.default(devInstance, transport, uvcControlInterface, logger, cameraDiscoveryEmitter);
                    break;
                default:
                    throw new Error(`Unsupported Device. USB ProductId: ${productId}`);
            }
            if (doInitialize)
                yield device.initialize();
            return device;
        });
    }
}
exports.default = DeviceFactory;
//# sourceMappingURL=factory.js.map