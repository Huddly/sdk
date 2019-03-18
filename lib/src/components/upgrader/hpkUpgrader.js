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
const events_2 = __importDefault(require("./../../utilitis/events"));
const api_1 = __importDefault(require("../api"));
const boxfish_1 = __importDefault(require("./../device/boxfish"));
const boxfishhpk_1 = __importDefault(require("./boxfishhpk"));
const MAX_UPLOAD_ATTEMPTS = 5;
class HPKUpgrader extends events_1.EventEmitter {
    constructor(manager, sdkDeviceDiscoveryEmitter, logger) {
        super();
        this.onAttach = (devManager) => {
            if (devManager && devManager instanceof boxfish_1.default
                && this._cameraManager['serialNumber'] === devManager['serialNumber']) {
                this._cameraManager = devManager;
                this.emit('UPGRADE_REBOOT_COMPLETE');
            }
        };
        this.onDetach = () => {
            try {
                if (this._cameraManager) {
                    this._cameraManager.transport.close();
                }
            }
            catch (e) {
                // Error on close is ok
            }
            this.emit('UPGRADE_REBOOT');
        };
        this._logger = logger;
        this._cameraManager = manager;
        this._sdkDeviceDiscoveryEmitter = sdkDeviceDiscoveryEmitter;
    }
    init(opts) {
        if (opts.verboseStatusLog !== undefined) {
            this.verboseStatusLog = opts.verboseStatusLog;
        }
        this._fileBuffer = opts.file;
        this.registerHotPlugEvents();
    }
    registerHotPlugEvents() {
        this._sdkDeviceDiscoveryEmitter.on(events_2.default.ATTACH, this.onAttach);
        this._sdkDeviceDiscoveryEmitter.on(events_2.default.DETACH, this.onDetach);
    }
    deRegisterHotPlugEvents() {
        this._sdkDeviceDiscoveryEmitter.removeListener(events_2.default.ATTACH, this.onAttach);
        this._sdkDeviceDiscoveryEmitter.removeListener(events_2.default.DETACH, this.onDetach);
    }
    upload(hpkBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            let tryAgain = true;
            let attempt = 0;
            while (tryAgain && attempt < MAX_UPLOAD_ATTEMPTS) {
                try {
                    const m = yield this._cameraManager.api.sendAndReceiveMessagePack({ name: 'upgrade.hpk', file_data: hpkBuffer }, {
                        send: 'hcp/write',
                        receive: 'hcp/write_reply'
                    }, 10000);
                    const { status } = m;
                    if (status !== 0) {
                        throw new Error(`Upload hpk failed with status ${status}`);
                    }
                    tryAgain = false;
                }
                catch (e) {
                    this._logger.error(`Failed uploading hpk file ${e} attemt ${attempt}`);
                    attempt += 1;
                }
            }
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit(events_2.default.UPGRADE_START);
            this.once('UPGRADE_REBOOT_COMPLETE', () => __awaiter(this, void 0, void 0, function* () {
                try {
                    // Wait two seconds to allow drivers to attach properly to the USB endpoint
                    yield new Promise(resolve => setTimeout(resolve, 2000));
                    yield this.doUpgrade();
                    yield this.deRegisterHotPlugEvents();
                    this.emit(events_2.default.UPGRADE_COMPLETE);
                }
                catch (e) {
                    yield this.deRegisterHotPlugEvents();
                    this.emit(events_2.default.UPGRADE_FAILED, e);
                    throw e;
                }
            }));
            try {
                const rebooted = yield this.doUpgrade();
                if (!rebooted) {
                    this.emit(events_2.default.UPGRADE_COMPLETE);
                }
            }
            catch (e) {
                this._logger.error('Upgrade failed', e);
                this.emit(events_2.default.UPGRADE_FAILED, e);
                throw e;
            }
        });
    }
    awaitHPKCompletion() {
        return __awaiter(this, void 0, void 0, function* () {
            const reboot = yield this._cameraManager.api.withSubscribe(['upgrader/status'], () => new Promise((resolve, reject) => {
                const statusMessageTimoutTime = 10000;
                function startTimeout() {
                    return setTimeout(() => {
                        reject(`Upgrading HPK: no status message within ${statusMessageTimoutTime}`);
                    }, statusMessageTimoutTime);
                }
                let totalProgressPoints = 1;
                let elapsedPoints = 0;
                let messageTimoutIt = startTimeout();
                let lastTime = Date.now();
                let lastOperation = undefined;
                this._cameraManager.transport.on('upgrader/status', (message) => __awaiter(this, void 0, void 0, function* () {
                    clearTimeout(messageTimoutIt);
                    const statusMessage = api_1.default.decode(message.payload, 'messagepack');
                    totalProgressPoints = statusMessage.total_points || totalProgressPoints;
                    if (statusMessage.operation === 'done' && statusMessage.reboot) {
                        resolve(true);
                        return;
                    }
                    else if (statusMessage.operation === 'done') {
                        resolve(false);
                        return;
                    }
                    if (statusMessage.error_count > 0) {
                        return reject(statusMessage);
                    }
                    const now = Date.now();
                    const deltaT = now - lastTime;
                    lastTime = now;
                    elapsedPoints = statusMessage.elapsed_points || elapsedPoints;
                    const progressPercentage = (elapsedPoints / totalProgressPoints) * 100;
                    if (statusMessage.operation !== lastOperation || deltaT >= 1000) {
                        this._logger.info(`Upgrading HPK: Status: ${Math.round(progressPercentage)}% step ${statusMessage.operation}\r`);
                    }
                    lastOperation = statusMessage.operation;
                    this.emit(events_2.default.UPGRADE_PROGRESS, {
                        operation: statusMessage.operation,
                        progress: progressPercentage,
                    });
                    messageTimoutIt = startTimeout();
                }));
            }));
            if (reboot) {
                yield this._cameraManager.reboot();
                try {
                    yield this._cameraManager.transport.close();
                }
                catch (e) {
                    this._logger.info(`\nUpgrading HPK: failed closing device on reboot: ${e}\n`);
                }
            }
            return reboot;
        });
    }
    runHPKScript() {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.debug('RUN hpk');
            const runMessage = yield this._cameraManager.api.sendAndReceiveMessagePack({ filename: 'upgrade.hpk' }, {
                send: 'hpk/run',
                receive: 'hpk/run_reply'
            }, 15000);
            if (runMessage.string === 'Success') {
                this._logger.debug('RUN hpk complete');
                return;
            }
            else {
                this._logger.error(`HPK run failed ${JSON.stringify(runMessage)}`);
                throw new Error(`HPK run failed ${runMessage}`);
            }
        });
    }
    doUpgrade() {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.info('Upgrading HPK \n');
            const hpkBuffer = this._fileBuffer;
            if (!boxfishhpk_1.default.isHpk(this._fileBuffer)) {
                throw new Error('HPK upgrader file is not a valid hpk file');
            }
            yield this.upload(hpkBuffer);
            const completedPromise = this.awaitHPKCompletion();
            yield this.runHPKScript();
            return yield completedPromise;
        });
    }
    upgradeIsValid() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this._cameraManager.getState();
                this._logger.info(`Upgrade status ${response.string}`);
                return response.status === 0;
            }
            catch (e) {
                return false;
            }
        });
    }
}
exports.default = HPKUpgrader;
//# sourceMappingURL=hpkUpgrader.js.map