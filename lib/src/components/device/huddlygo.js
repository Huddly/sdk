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
const api_1 = __importDefault(require("../api"));
const uvcbase_1 = __importDefault(require("./uvcbase"));
const locksmith_1 = __importDefault(require("./../locksmith"));
const events_1 = __importDefault(require("./../../utilitis/events"));
const huddlygoUpgrader_1 = __importDefault(require("./../upgrader/huddlygoUpgrader"));
const FETCH_UX_CONTROLS_ATTEMPTS = 10;
const round = (number, decimals) => {
    const factor = Math.pow(10, decimals);
    return Math.round(number * factor) / factor;
};
const parseSoftwareVersion = (versionInfo) => {
    if (versionInfo === null)
        return '0.0.4';
    const appVersionBuffer = versionInfo.slice(1, 4); // First byte is unused
    appVersionBuffer.reverse(); // Least signiticant first. ask Torleiv
    const appVersion = appVersionBuffer.join('.'); // Make it semver
    const bootVersionBuffer = versionInfo.slice(5, 8); // First byte is unused
    bootVersionBuffer.reverse();
    const bootVersion = bootVersionBuffer.join('.');
    return { mv2_boot: bootVersion, mv2_app: appVersion };
};
class HuddlyGo extends uvcbase_1.default {
    constructor(uvcCameraInstance, transport, uvcControlInterface, hidAPI, logger, cameraDiscoveryEmitter) {
        super(uvcCameraInstance, uvcControlInterface);
        this.transport = transport;
        this.uvcControlInterface = uvcControlInterface;
        this.hidApi = hidAPI;
        this.logger = logger;
        this.locksmith = new locksmith_1.default();
        this.discoveryEmitter = cameraDiscoveryEmitter;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this.api = new api_1.default(this.transport, this.logger, this.locksmith);
            this.softwareVersion = yield this.getSoftwareVersion();
        });
    }
    closeConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transport.close();
        });
    }
    getSoftwareVersion(retryAttempts = FETCH_UX_CONTROLS_ATTEMPTS) {
        return __awaiter(this, void 0, void 0, function* () {
            let fetchAttemts = 0;
            let err;
            do {
                try {
                    fetchAttemts += 1;
                    //
                    const versionInfo = yield this.getXUControl(19);
                    const softwareVersion = parseSoftwareVersion(versionInfo);
                    return softwareVersion;
                }
                catch (e) {
                    err = e;
                    this.logger.debug(e);
                }
            } while (fetchAttemts < retryAttempts);
            this.logger.error(err);
            throw new Error('Failed to retrieve software version from camera');
        });
    }
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const status = this.uvcCamera;
            status.softwareVersion = this.softwareVersion;
            status.temperature = yield this.getTemperature();
            status.powerUsage = yield this.getPowerUsage();
            status.version = this.softwareVersion.mv2_app;
            //    status.uptime = await this.uptime();
            return status;
        });
    }
    ensureAppMode(currentMode, timeout = 10000) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!currentMode || currentMode === 'app')
                return Promise.resolve();
            else {
                throw new Error(`Cannot set camera to app mode from ${currentMode} mode!`);
            }
        });
    }
    getErrorLog() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.api.getErrorLog();
        });
    }
    eraseErrorLog() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.api.eraseErrorLog();
        });
    }
    getPowerUsage() {
        return __awaiter(this, void 0, void 0, function* () {
            const buffVal = yield this.getXUControl(3);
            let ret;
            if (buffVal) {
                ret = {
                    voltage: {
                        min: round(buffVal.readFloatLE(0), 3),
                        curr: round(buffVal.readFloatLE(4), 3),
                        max: round(buffVal.readFloatLE(8), 3),
                    },
                    current: {
                        min: round(buffVal.readFloatLE(12), 3),
                        curr: round(buffVal.readFloatLE(16), 3),
                        max: round(buffVal.readFloatLE(20), 3),
                    },
                    power: {
                        min: round(buffVal.readFloatLE(24), 3),
                        curr: round(buffVal.readFloatLE(28), 3),
                        max: round(buffVal.readFloatLE(32), 3),
                    },
                };
            }
            return ret;
        });
    }
    getTemperature() {
        return __awaiter(this, void 0, void 0, function* () {
            const buffVal = yield this.getXUControl(2);
            let ret;
            if (buffVal) {
                ret = {
                    internal: {
                        curr: round(buffVal.readFloatLE(0), 2),
                        min: round(buffVal.readFloatLE(4), 2),
                        max: round(buffVal.readFloatLE(8), 2),
                    },
                    external: {
                        curr: round(buffVal.readFloatLE(12), 2),
                        min: round(buffVal.readFloatLE(16), 2),
                        max: round(buffVal.readFloatLE(20), 2),
                    },
                };
            }
            return ret;
        });
    }
    getWhitePointAdjust() {
        return __awaiter(this, void 0, void 0, function* () {
            const buffVal = yield this.getXUControl(4);
            let ret;
            if (buffVal) {
                ret = {
                    red: round(buffVal.readFloatLE(0), 3),
                    blue: round(buffVal.readFloatLE(4), 3),
                };
            }
            return ret;
        });
    }
    reboot(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            let bootValue;
            switch (mode) {
                case 'bl':
                    bootValue = 0x1399;
                    break;
                case 'app':
                default:
                    bootValue = 0x3;
                    break;
            }
            yield this.transport.stopEventLoop();
            yield this.setXUControl(17, 0x3974);
            yield this.setXUControl(17, bootValue);
        });
    }
    setCameraMode(mode) {
        return __awaiter(this, void 0, void 0, function* () {
            if (mode === undefined || mode === null) {
                throw new Error('camera mode undefined');
            }
            let cameraMode = 0;
            switch (mode) {
                case 'normal':
                    cameraMode = 0;
                    break;
                case 'dual':
                    cameraMode = 1;
                    break;
                case 'high-res':
                    cameraMode = 2;
                    break;
                default:
                    throw new Error(`Unknown camera mode ${mode}`);
            }
            yield this.setXUControl(1, 0x3974);
            yield this.setXUControl(1, 0x8eb0);
            yield this.setXUControl(1, cameraMode);
            yield this.reboot('app');
        });
    }
    getCameraMode() {
        return __awaiter(this, void 0, void 0, function* () {
            const xuCtrl = 1;
            const buffer = yield this.getXUControl(xuCtrl);
            if (!buffer) {
                return 'normal';
            }
            switch (buffer.readUIntLE(0, 2)) {
                case 0x00:
                    return 'normal';
                case 0x01:
                    return 'dual';
                case 0x02:
                    return 'high-res';
                default:
                    return 'unknown';
            }
        });
    }
    uptime() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.api.getUptime();
        });
    }
    getUpgrader() {
        return __awaiter(this, void 0, void 0, function* () {
            return new huddlygoUpgrader_1.default(this, this.discoveryEmitter, this.hidApi, this.logger);
        });
    }
    upgrade(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            const upgrader = yield this.getUpgrader();
            upgrader.init(opts);
            upgrader.start();
            return new Promise((resolve, reject) => {
                upgrader.once(events_1.default.UPGRADE_COMPLETE, () => {
                    resolve();
                });
                upgrader.once(events_1.default.UPGRADE_FAILED, (reason) => {
                    reject(reason);
                });
                upgrader.once(events_1.default.TIMEOUT, (reason) => {
                    reject(reason);
                });
            });
        });
    }
    getDetector() {
        throw new Error('Detections are not supported on Huddly GO camera!');
    }
    getState() {
        throw new Error('State is not supported on Huddly GO camera');
    }
}
exports.default = HuddlyGo;
//# sourceMappingURL=huddlygo.js.map