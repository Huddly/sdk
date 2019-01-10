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
const events_1 = require("events");
const logger_1 = __importDefault(require("./utilitis/logger"));
const factory_1 = __importDefault(require("./components/device/factory"));
const events_2 = __importDefault(require("./utilitis/events"));
const locksmith_1 = __importDefault(require("./components/locksmith"));
/**
 * @export
 *
 * @class HuddlySdk
 * @implements {SDK}
 */
class HuddlySdk extends events_1.EventEmitter {
    /**
     * Creates an instance of HuddlySdk.
     * @param {IHuddlyDeviceAPI} deviceDiscoveryApi The Huddly device-api used for discovering the device.
     * @param {Array<IHuddlyDeviceAPI>} [deviceApis] Optional list of device-apis used for communicating with the device.
     * By default it uses the `deviceDiscoveryApi` parameter as the device-api used for communication.
     * @param {SDKOpts} [opts] Options used for initializing the sdk. See `SDKOpts` interface.
     * @memberof HuddlySdk
     */
    constructor(deviceDiscoveryApi, deviceApis, opts) {
        super();
        if (!deviceDiscoveryApi) {
            throw new Error('A default device api should be provided to the sdk!');
        }
        if (!deviceApis || deviceApis.length === 0) {
            this.mainDeviceApi = deviceDiscoveryApi;
            this._deviceApis = new Array();
            this._deviceApis.push(deviceDiscoveryApi);
        }
        else {
            this._mainDeviceApi = deviceApis[0];
            this._deviceApis = deviceApis;
        }
        this.locksmith = new locksmith_1.default();
        const options = opts ? opts : {};
        this.deviceDiscovery = options.apiDiscoveryEmitter || new events_1.EventEmitter();
        this.emitter = options.emitter || this;
        this._deviceDiscoveryApi = deviceDiscoveryApi;
        this.logger = options.logger || new logger_1.default(true);
        this.setupDeviceDiscoveryListeners();
        this._deviceDiscoveryApi.registerForHotplugEvents(this.deviceDiscovery);
    }
    /**
     * Sets up listeners for ATTACH and DETACH camera events on the
     * device discovery api. Will emit instances of `IDeviceManager`
     * when an ATTACH event occurs.
     *
     * @memberof HuddlySdk
     */
    setupDeviceDiscoveryListeners() {
        this.deviceDiscovery.on(events_2.default.ATTACH, (d) => __awaiter(this, void 0, void 0, function* () {
            if (d) {
                yield this.locksmith.executeAsyncFunction(() => new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                    const cameraManager = yield factory_1.default.getDevice(d.productId, this.logger, this.mainDeviceApi, this.deviceApis, d, this.emitter);
                    this.emitter.emit(events_2.default.ATTACH, cameraManager);
                    resolve();
                })));
            }
        }));
        this.deviceDiscovery.on(events_2.default.DETACH, (d) => __awaiter(this, void 0, void 0, function* () {
            if (d) {
                yield this.locksmith.executeAsyncFunction(() => new Promise((resolve) => {
                    this.emitter.emit(events_2.default.DETACH, d);
                    resolve();
                }));
            }
        }));
    }
    /**
     * Convenience function for setting the main device api
     * used for communicating with the camera.
     *
     * @memberof HuddlySdk
     */
    set mainDeviceApi(mainApi) {
        this._mainDeviceApi = mainApi;
    }
    /**
     * Convenience function for getting the main device api
     * used for communicating with the camera.
     *
     * @type {IHuddlyDeviceAPI}
     * @memberof HuddlySdk
     */
    get mainDeviceApi() {
        return this._mainDeviceApi;
    }
    /**
     * Convenience function for setting the list of
     * device apis which the SDK uses to establish
     * communication channels with the camera.
     *
     * @memberof HuddlySdk
     */
    set deviceApis(deviceApis) {
        this._deviceApis = deviceApis;
    }
    /**
     * Convenience function for getting the list of
     * device apis used to establish communication with
     * the camera.
     *
     * @type {Array<IHuddlyDeviceAPI>}
     * @memberof HuddlySdk
     */
    get deviceApis() {
        return this._deviceApis;
    }
    /**
     * Convenience function for setting the device api
     * instance used for camera discovery.
     *
     * @memberof HuddlySdk
     */
    set deviceDiscoveryApi(api) {
        this._deviceDiscoveryApi = api;
        this.deviceDiscoveryApi.registerForHotplugEvents(this.deviceDiscovery);
    }
    /**
     * Convenience function for getting the device api
     * instance used for camera discovery.
     *
     * @type {IHuddlyDeviceAPI}
     * @memberof HuddlySdk
     */
    get deviceDiscoveryApi() {
        return this._deviceDiscoveryApi;
    }
    /**
     * Initializes the device discovery api which in turn will fire
     * ATTACH events for all cameras attached to the system.
     *
     * @returns {Promise<any>} Returns a promise which resolves for
     * successful initialization or rejects otherwise.
     * @memberof HuddlySdk
     */
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.deviceDiscoveryApi.initialize();
        });
    }
}
exports.default = HuddlySdk;
//# sourceMappingURL=index.js.map