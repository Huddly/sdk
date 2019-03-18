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
const api_1 = __importDefault(require("./../api"));
const uvcbase_1 = __importDefault(require("./uvcbase"));
const locksmith_1 = __importDefault(require("./../locksmith"));
const events_1 = __importDefault(require("./../../utilitis/events"));
const detector_1 = __importDefault(require("./../detector"));
const boxfishUpgraderFactory_1 = require("./../upgrader/boxfishUpgraderFactory");
const MAX_UPGRADE_ATTEMT = 3;
class Boxfish extends uvcbase_1.default {
    constructor(uvcCameraInstance, transport, uvcControlInterface, logger, cameraDiscoveryEmitter) {
        super(uvcCameraInstance, uvcControlInterface);
        this.transport = transport;
        this.uvcControlInterface = uvcControlInterface;
        this.logger = logger;
        this.locksmith = new locksmith_1.default();
        this.discoveryEmitter = cameraDiscoveryEmitter;
    }
    get api() {
        return this._api;
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            this._api = new api_1.default(this.transport, this.logger, this.locksmith);
            this.transport.init();
            try {
                this.transport.initEventLoop();
            }
            catch (e) {
                this.logger.warn('Failed to init event loop when transport reset');
            }
        });
    }
    closeConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.transport.close();
        });
    }
    getInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const info = yield this.api.getCameraInfo();
            const status = Object.assign({ id: this['id'], serialNumber: this['serialNumber'], vendorId: this['vendorId'], productId: this['productId'], version: this.extractSemanticSoftwareVersion(info.softwareVersion) }, info);
            if (this['pathName'] !== undefined) {
                status.pathName = this['pathName'];
            }
            return status;
        });
    }
    extractSemanticSoftwareVersion(appVer) {
        return appVer.replace(/\D+-/, '');
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
    reboot(mode = 'app') {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.locksmith.executeAsyncFunction(() => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.transport.clear();
                    if (mode === 'mvusb') {
                        yield this.api.sendAndReceiveWithoutLock('upgrader/mv_usb', { args: {} });
                    }
                    yield this.transport.write('camctrl/reboot');
                }
                catch (e) {
                    throw e;
                }
            }));
        });
    }
    uptime() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.api.getUptime();
        });
    }
    getUpgrader() {
        return __awaiter(this, void 0, void 0, function* () {
            return boxfishUpgraderFactory_1.createBoxfishUpgrader(this, this.discoveryEmitter, this.logger);
        });
    }
    createAndRunUpgrade(opts, deviceManager) {
        return __awaiter(this, void 0, void 0, function* () {
            const upgrader = yield boxfishUpgraderFactory_1.createBoxfishUpgrader(deviceManager, this.discoveryEmitter, this.logger);
            upgrader.init(opts);
            upgrader.start();
            return new Promise((resolve, reject) => {
                upgrader.once(events_1.default.UPGRADE_COMPLETE, (deviceManager) => __awaiter(this, void 0, void 0, function* () {
                    const upgradeIsOk = yield upgrader.upgradeIsValid();
                    if (upgradeIsOk) {
                        resolve();
                    }
                    else {
                        reject({
                            message: 'Upgrade status is not ok, run again',
                            runAgain: true,
                            deviceManager
                        });
                    }
                }));
                upgrader.once(events_1.default.UPGRADE_FAILED, (reason) => {
                    this.logger.error(`UPGRADE FAILED ${reason}`);
                    reject(reason);
                });
                upgrader.once(events_1.default.TIMEOUT, (reason) => {
                    reject(reason);
                });
            });
        });
    }
    upgrade(opts) {
        return __awaiter(this, void 0, void 0, function* () {
            let upgradeAttepmts = 0;
            return new Promise((resolve, reject) => {
                const tryRunAgainOnFailure = (deviceManager) => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield this.createAndRunUpgrade(opts, deviceManager);
                        resolve();
                    }
                    catch (e) {
                        if (e.runAgain && upgradeAttepmts < MAX_UPGRADE_ATTEMT) {
                            upgradeAttepmts += 1;
                            tryRunAgainOnFailure(e.deviceManager);
                        }
                        else {
                            reject(e);
                        }
                    }
                });
                tryRunAgainOnFailure(this);
            });
        });
    }
    getDetector(opts) {
        return new detector_1.default(this, this.logger, opts);
    }
    getState() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.api.sendAndReceiveMessagePack('', {
                send: 'camera/get_state',
                receive: 'camera/get_state_reply'
            });
            return response;
        });
    }
}
exports.default = Boxfish;
//# sourceMappingURL=boxfish.js.map