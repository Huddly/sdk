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
const IBoxfishUpgraderFile_1 = require("./../../interfaces/IBoxfishUpgraderFile");
const semver_1 = __importDefault(require("semver"));
const locksmith_1 = __importDefault(require("./../locksmith"));
const api_1 = __importDefault(require("../api"));
const crc32c_1 = require("./../../utilitis/crc32c");
const events_2 = __importDefault(require("./../../utilitis/events"));
const boxfish_1 = __importDefault(require("./../device/boxfish"));
const boxfishUpgraderFactory_1 = require("./../upgrader/boxfishUpgraderFactory");
const boxfishUpgraderFactory_2 = require("./../upgrader/boxfishUpgraderFactory");
class BoxfishUpgrader extends events_1.EventEmitter {
    constructor(manager, sdkDeviceDiscoveryEmitter, logger) {
        super();
        this.options = {};
        this.bootTimeout = (30 * 1000); // 30 seconds
        this.writeBufSupport = undefined;
        this.verboseStatusLog = true;
        this._cameraManager = manager;
        this._sdkDeviceDisoveryEmitter = sdkDeviceDiscoveryEmitter;
        this._logger = logger;
        this.locksmith = new locksmith_1.default();
    }
    init(opts) {
        this._boxfishPackage = boxfishUpgraderFactory_1.createBoxfishUpgraderFile(opts.file);
        this.options.flash_fsbl = opts.flash_fsbl;
        this.options.file = opts.file;
        if (opts.bootTimeout) {
            this.bootTimeout = opts.bootTimeout * 1000;
        }
        if (opts.verboseStatusLog !== undefined) {
            this.verboseStatusLog = opts.verboseStatusLog;
        }
        this.registerHotPlugEvents();
    }
    registerHotPlugEvents() {
        this._sdkDeviceDisoveryEmitter.on(events_2.default.ATTACH, (devManager) => __awaiter(this, void 0, void 0, function* () {
            if (devManager && devManager instanceof boxfish_1.default
                && this._cameraManager['serialNumber'] === devManager['serialNumber']) {
                this._cameraManager = devManager;
                this.emit('UPGRADE_REBOOT_COMPLETE');
            }
        }));
        this._sdkDeviceDisoveryEmitter.on(events_2.default.DETACH, (d) => __awaiter(this, void 0, void 0, function* () {
            if (d && this._cameraManager['serialNumber'] === d.serialNumber) {
                this._cameraManager.transport.close();
                this.emit('UPGRADE_REBOOT');
            }
        }));
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.emit(events_2.default.UPGRADE_START);
            const state = yield this.upgrade();
            // Timeout if the camera does not come back up after bootTimeout seconds have passed!
            const bootTimeout = setTimeout(() => {
                clearTimeout(bootTimeout);
                this.emit(events_2.default.TIMEOUT, 'Camera did not come back up after upgrade!');
            }, this.bootTimeout);
            this.once('UPGRADE_REBOOT_COMPLETE', () => __awaiter(this, void 0, void 0, function* () {
                try {
                    yield this.postUpgrade(state);
                    clearTimeout(bootTimeout);
                    this.emit(events_2.default.UPGRADE_COMPLETE, this._cameraManager);
                }
                catch (e) {
                    clearTimeout(bootTimeout);
                    this.emit(events_2.default.UPGRADE_FAILED, e);
                }
            }));
        });
    }
    doUpgrade() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this.once(events_2.default.UPGRADE_COMPLETE, () => resolve());
                this.once(events_2.default.UPGRADE_FAILED, (e) => reject(e));
                this.start();
            }));
        });
    }
    extractSofwareVersionFromProdInfo(prodInfo) {
        const appVer = prodInfo.app_version;
        return appVer.replace(/\D+-/, '');
    }
    getBootDecision(prodInfo) {
        const bac = prodInfo.bac_fsbl;
        if (!bac)
            return '';
        return bac.boot_decision;
    }
    allocateBuf(size) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.sendReceive('upgrader/allocate', { args: { size } });
        });
    }
    legacyWriteBuf(buf, offset = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.warn('Falling back to file transfer');
            const sendData = {
                size: buf.length,
                offset,
            };
            const command = {
                send: 'upgrader/write',
                send_data: api_1.default.encode(sendData),
                receive: 'upgrader/write_reply',
            };
            return this._cameraManager.api.asyncFileTransfer(command, buf);
        });
    }
    writeBuffProbe() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.sendReceive('upgrader/write_buf', {
                    args: { data: Buffer.alloc(1), offset: 0 },
                    receiveEncoding: 'string'
                });
                return true;
            }
            catch (e) {
                this._logger.warn(`Write buf not supported in this firmware! ${e}`);
                return false;
            }
        });
    }
    writeBuf(buf, offset = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.writeBufSupport === undefined) {
                this.writeBufSupport = yield this.writeBuffProbe();
            }
            if (this.writeBufSupport) {
                const result = yield this.sendReceive('upgrader/write_buf', {
                    args: { data: buf, offset },
                    receiveEncoding: 'messagepack',
                    timeout: 60000
                });
                return result;
            }
            return this.legacyWriteBuf(buf, offset);
        });
    }
    sendReceive(cmd, options = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.locksmith.executeAsyncFunction(() => __awaiter(this, void 0, void 0, function* () {
                const r = yield this._cameraManager.api.sendAndReceiveWithoutLock(cmd, options);
                return r;
            }));
            return res;
        });
    }
    postUpgrade(upgradeSelection) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.printBootInfo();
            yield this.setFlashBootState(upgradeSelection);
            yield this.setRamBootSelector(upgradeSelection);
            return true;
        });
    }
    checksumBuf(size, offset = 0, algorithm = 'crc32c') {
        return __awaiter(this, void 0, void 0, function* () {
            const cmd = 'upgrader/checksum';
            const cmdResult = `${cmd}_result`;
            const doReply = function (reply) {
                if (algorithm === 'crc32c') {
                    return reply.checksum.readUInt32LE();
                }
                return reply.checksum;
            };
            const result = yield this._cameraManager.api.withSubscribe([cmdResult], () => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                this._cameraManager.transport.receiveMessage(cmdResult, 5000)
                    .then((data) => {
                    const receivedCmd = data.message;
                    if (receivedCmd !== cmdResult) {
                        reject(`Received unexpected ${receivedCmd}. Expected ${cmdResult}.`);
                    }
                    else {
                        const args = api_1.default.decode(data.payload, 'messagepack');
                        const result = doReply(args);
                        resolve(result);
                    }
                })
                    .catch((e) => reject(e));
                const res = yield this.sendReceive(cmd, {
                    args: { size, offset, algorithm },
                    receiveEncoding: 'messagepack',
                });
                if (res.error !== 0) {
                    throw new Error(`Failed to retrieve checksum. Error: ${res.error}. Status: ${res.string}`);
                }
                if (res.checksum !== undefined) {
                    const result = doReply(res);
                    resolve(result);
                }
            })));
            return result;
        });
    }
    executeFlashCmdWaitForDoneWithStatus(cmd, cmdData, addr, size, statusFn) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmds = {
                cmd,
                done: `${cmd}_done`,
                status: `${cmd}_status`,
            };
            const subscribeMessages = statusFn ? [cmds.done, cmds.status] : [cmds.done];
            return this.locksmith.executeAsyncFunction(() => __awaiter(this, void 0, void 0, function* () {
                yield this._cameraManager.api.withSubscribe(subscribeMessages, () => new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                    this._cameraManager.transport.on(cmds.done, (data) => {
                        const args = api_1.default.decode(data.payload, 'messagepack');
                        if (args.error_count === 0) {
                            this._cameraManager.transport.removeAllListeners(cmds.done);
                            if (statusFn) {
                                statusFn(size, size);
                                this._cameraManager.transport.removeAllListeners(cmds.status);
                            }
                            else {
                                this._logger.info('Stage Completed!');
                            }
                            resolve();
                        }
                        else {
                            reject(`Flash command ${cmd} failed with ${args.error_count} errors`);
                        }
                    });
                    if (statusFn) {
                        this._cameraManager.transport.on(cmds.status, (data) => {
                            const args = api_1.default.decode(data.payload, 'messagepack');
                            statusFn(args.offset, size);
                        });
                    }
                    yield this._cameraManager.api.sendAndReceiveWithoutLock(cmds.cmd, { args: cmdData });
                })));
            }));
        });
    }
    eraseFlash(addr, size, statusFn) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmdData = { flash_addr: addr, size };
            return this.executeFlashCmdWaitForDoneWithStatus('upgrader/erase_flash', cmdData, addr, size, statusFn);
        });
    }
    writeFlash(addr, size, statusFn) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmdData = { flash_addr: addr, size, offset: 0 };
            return this.executeFlashCmdWaitForDoneWithStatus('upgrader/write_flash', cmdData, addr, size, statusFn);
        });
    }
    readFlashIntoBuf(addr, size, statusFn) {
        return __awaiter(this, void 0, void 0, function* () {
            const cmdData = { flash_addr: addr, size, offset: 0 };
            return this.executeFlashCmdWaitForDoneWithStatus('upgrader/read_flash', cmdData, addr, size, statusFn);
        });
    }
    doFlash(buffer, address) {
        return __awaiter(this, void 0, void 0, function* () {
            let lastTime = 0;
            let lastProgress = Number.POSITIVE_INFINITY;
            let status = undefined;
            if (this.verboseStatusLog) {
                status = (progress, total) => {
                    const now = Date.now();
                    if (progress < lastProgress || progress === total || now > lastTime + 1) {
                        this._logger.info(`Status: ${Math.ceil(100 * (progress / total))}%\r`);
                        lastTime = now;
                        lastProgress = progress;
                        if (progress === total) {
                            this._logger.info('');
                        }
                    }
                };
            }
            const addr = parseInt(address, 16);
            this._logger.info(`Allocating buf.. ${buffer.length}`);
            yield this.allocateBuf(buffer.length);
            this._logger.info('Uploading data to camera...');
            yield this.writeBuf(buffer);
            this._logger.info('Calculating checksum on target...');
            const expectedCrc = crc32c_1.calculate(buffer);
            const crc = yield this.checksumBuf(buffer.length);
            if (expectedCrc !== crc) {
                throw new Error(`Expected crc ${expectedCrc}, got crc ${crc}`);
            }
            const eraseLen = Math.ceil(buffer.length / 4096) * 4096;
            this._logger.info(`Erasing... addr: ${addr}`);
            yield this.eraseFlash(addr, eraseLen, status);
            this._logger.info('Writing...');
            yield this.writeFlash(addr, buffer.length, status);
            this._logger.info('Reading from flash to memory...');
            yield this.readFlashIntoBuf(addr, buffer.length, status);
            this._logger.info('Calculating checksum...');
            const flashCrc = yield this.checksumBuf(buffer.length);
            if (expectedCrc !== flashCrc) {
                throw new Error(`Expected crc ${expectedCrc}, got crc ${flashCrc}`);
            }
        });
    }
    flashFsbl(fsblMvcmd) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.info('Flashing fsbl');
            return this.doFlash(fsblMvcmd, '0x00');
        });
    }
    setFlashBootState(state) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.info(`set flash boot state ${state}`);
            return this._cameraManager.api.setProductInfo({ flash_boot_state: state });
        });
    }
    initFlash(fsblMvcmd, boxfishUpgraderFile) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.warn('Initializing flash');
            yield this.flashFsbl(fsblMvcmd);
            /* eslint-disable max-len */
            yield this.flashImage(IBoxfishUpgraderFile_1.IMAGE_TYPES.SSBL_HEADER, boxfishUpgraderFile, 'C');
            yield this.flashImage(IBoxfishUpgraderFile_1.IMAGE_TYPES.SSBL, boxfishUpgraderFile, 'C');
            yield this.flashImage(IBoxfishUpgraderFile_1.IMAGE_TYPES.APP_HEADER, boxfishUpgraderFile, 'C');
            yield this.flashImage(IBoxfishUpgraderFile_1.IMAGE_TYPES.APP, boxfishUpgraderFile, 'C');
            /* eslint-enable max-len */
            yield this.setFlashBootState('C');
            yield this.setRamBootSelector('C');
        });
    }
    flashImage(imageType, upgraderFile, location) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = upgraderFile.getData(imageType);
            if (data.length === 0) {
                throw new Error(`Error starting flashing of image ${IBoxfishUpgraderFile_1.IMAGE_TYPES} - could not get data from package`);
            }
            const address = upgraderFile.getFlashAddress(imageType, location);
            return this.doFlash(data, address);
        });
    }
    setRamBootSelector(selector) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.info(`set ram boot selector ${selector}`);
            return this._cameraManager.api.setProductInfo({ bac_fsbl: { ram_boot_selector: selector } });
        });
    }
    printBootInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            const prodInfo = yield this._cameraManager.api.getProductInfo();
            this._logger.info(`Current boot decision: ${prodInfo.bac_fsbl.boot_decision}`);
            this._logger.info(`Current flash boot selector: ${prodInfo.flash_boot_state}`);
            this._logger.info(`Current ram boot selector: ${prodInfo.bac_fsbl.ram_boot_selector}`);
        });
    }
    upgrade() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const startTime = new Date().getTime();
                const prodInfo = yield this._cameraManager.api.getProductInfo();
                const boxfishUpgraderFile = boxfishUpgraderFactory_1.createBoxfishUpgraderFile(this.options.file);
                yield boxfishUpgraderFile.init();
                this.emit(events_2.default.UPGRADE_PROGRESS);
                const currentSwVersion = this.extractSofwareVersionFromProdInfo(prodInfo);
                if (semver_1.default.gt(currentSwVersion, '0.0.7')) {
                    yield this.locksmith.executeAsyncFunction(() => __awaiter(this, void 0, void 0, function* () {
                        yield this._cameraManager.transport.clear();
                        yield this._cameraManager.transport.write('streaming/lock');
                    }));
                }
                if (prodInfo.bac_fsbl === false && !this.options.flash_fsbl) {
                    throw new Error('Unable to upgrade without first stage bootloader.\n' +
                        'No first stage bootloader provided');
                }
                else if (prodInfo.bac_fsbl === false && this.options.flash_fsbl) {
                    const fsblBuffer = boxfishUpgraderFile.getImage(IBoxfishUpgraderFile_1.IMAGE_TYPES.FSBL);
                    yield this.initFlash(fsblBuffer, boxfishUpgraderFile);
                    yield this._cameraManager.reboot();
                    return 'C';
                }
                const bootDecision = this.getBootDecision(prodInfo);
                this._logger.info(`Current boot decision ${bootDecision}`);
                const upgradeSelection = bootDecision === 'A' ? 'B' : 'A';
                /* eslint-disable max-len */
                yield this.flashImage(IBoxfishUpgraderFile_1.IMAGE_TYPES.SSBL_HEADER, boxfishUpgraderFile, upgradeSelection);
                yield this.flashImage(IBoxfishUpgraderFile_1.IMAGE_TYPES.SSBL, boxfishUpgraderFile, upgradeSelection);
                yield this.flashImage(IBoxfishUpgraderFile_1.IMAGE_TYPES.APP_HEADER, boxfishUpgraderFile, upgradeSelection);
                yield this.flashImage(IBoxfishUpgraderFile_1.IMAGE_TYPES.APP, boxfishUpgraderFile, upgradeSelection);
                /* eslint-enable max-len */
                if (semver_1.default.gt(currentSwVersion, '0.0.7')) {
                    yield this.locksmith.executeAsyncFunction(() => __awaiter(this, void 0, void 0, function* () {
                        yield this._cameraManager.transport.clear();
                        yield this._cameraManager.transport.write('streaming/unlock');
                    }));
                }
                yield this.setRamBootSelector(upgradeSelection);
                yield this.printBootInfo();
                yield this._cameraManager.reboot();
                yield this._cameraManager.transport.close();
                const finishTime = new Date().getTime();
                const flashTime = (finishTime - startTime) / 1000;
                this._logger.info(`Upgrade completed in ${flashTime} seconds`);
                return upgradeSelection;
            }
            catch (e) {
                this._logger.error('UPGRADE FAILED');
                this.emit(events_2.default.UPGRADE_FAILED, e);
                throw e;
            }
        });
    }
    upgradeIsValid() {
        return __awaiter(this, void 0, void 0, function* () {
            const prodInfo = yield this._cameraManager.api.getProductInfo();
            const currentSwVersion = this.extractSofwareVersionFromProdInfo(prodInfo);
            if (semver_1.default.lt(currentSwVersion, boxfishUpgraderFactory_2.HPK_SUPPORT_VERSION)) {
                return true;
            }
            try {
                const response = yield this._cameraManager.getState();
                this._logger.info(`Upgrade status ${JSON.stringify(response)}`);
                return response.status === 0;
            }
            catch (e) {
                return false;
            }
        });
    }
}
exports.default = BoxfishUpgrader;
//# sourceMappingURL=boxfishUpgrader.js.map