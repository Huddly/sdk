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
const jszip_1 = __importDefault(require("jszip"));
const BINARY_APPLICATION = 'huddly.bin';
const BINARY_BOOT = 'huddly_boot.bin';
const getBinaries = (pkgAsBuffer) => __awaiter(this, void 0, void 0, function* () {
    if (pkgAsBuffer === null)
        return {};
    const pkg = yield jszip_1.default.loadAsync(pkgAsBuffer);
    const mv2AppFile = pkg.files[BINARY_APPLICATION] ? BINARY_APPLICATION : `bin/${BINARY_APPLICATION}`;
    const mv2BootFile = pkg.files[BINARY_BOOT] ? BINARY_BOOT : `bin/${BINARY_BOOT}`;
    const mv2 = yield pkg.files[mv2AppFile].async('nodebuffer');
    const mv2_boot = yield pkg.files[mv2BootFile].async('nodebuffer');
    return {
        mv2,
        mv2_boot
    };
});
class HuddlyGoUpgrader extends events_1.EventEmitter {
    constructor(devInstance, cameraDiscovery, hidAPI, logger) {
        super();
        this.options = {};
        this.bootTimeout = (30 * 1000); // 30 seconds
        this._devInstance = devInstance;
        this._cameraDiscovery = cameraDiscovery;
        this._hidApi = hidAPI;
        this.logger = logger;
    }
    init(opts) {
        this.options.file = opts.file;
        if (opts.bootTimeout) {
            this.bootTimeout = opts.bootTimeout * 1000;
        }
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit(events_2.default.UPGRADE_START);
            this.doUpgrade();
        });
    }
    doUpgrade() {
        return __awaiter(this, void 0, void 0, function* () {
            const hidEventEmitter = new events_1.EventEmitter();
            let bootTimeout;
            this._hidApi.registerForHotplugEvents(hidEventEmitter);
            const upgradePromise = new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                const binaries = yield getBinaries(this.options.file);
                hidEventEmitter.on('HID_ATTACH', () => {
                    this.logger.debug('HID Device attached');
                    hidEventEmitter.removeAllListeners('HID_ATTACH');
                    this._hidApi.upgrade(binaries);
                });
                hidEventEmitter.on('UPGRADE_FAILED', (msg) => {
                    hidEventEmitter.removeAllListeners('UPGRADE_FAILED');
                    hidEventEmitter.removeAllListeners('UPGRADE_COMPLETE');
                    this.emit(events_2.default.UPGRADE_FAILED);
                    clearTimeout(bootTimeout);
                    return reject(msg);
                });
                hidEventEmitter.on('UPGRADE_PROGRESS', msg => {
                    this.logger.debug(msg);
                });
                hidEventEmitter.on('UPGRADE_COMPLETE', () => __awaiter(this, void 0, void 0, function* () {
                    bootTimeout = setTimeout(() => {
                        clearTimeout(bootTimeout);
                        this.emit(events_2.default.TIMEOUT, 'Camera did not come back up after upgrade!');
                    }, this.bootTimeout);
                    yield this._hidApi.rebootInAppMode();
                    this._hidApi.destruct();
                    hidEventEmitter.removeAllListeners('UPGRADE_FAILED');
                    hidEventEmitter.removeAllListeners('UPGRADE_COMPLETE');
                    clearTimeout(bootTimeout);
                    this.emit(events_2.default.UPGRADE_COMPLETE);
                    return resolve();
                }));
                // this.eventEmitter.emit(CameraEvents.UPGRADE_START);
                this._devInstance.reboot('bl');
                this._hidApi.startScanner(100); // set low scan interval
            }));
            yield upgradePromise;
        });
    }
    postUpgrade() {
        return __awaiter(this, void 0, void 0, function* () {
            // Huddly Go does not require any post upgrade checks!
            return Promise.resolve();
        });
    }
    upgradeIsValid() {
        return __awaiter(this, void 0, void 0, function* () {
            // Huddly Go does valid check works!
            return Promise.resolve(true);
        });
    }
}
exports.default = HuddlyGoUpgrader;
//# sourceMappingURL=huddlygoUpgrader.js.map