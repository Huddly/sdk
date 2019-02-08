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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const sinon_1 = __importDefault(require("sinon"));
const chai_1 = __importStar(require("chai"));
const sinon_chai_1 = __importDefault(require("sinon-chai"));
const chai_as_promised_1 = __importDefault(require("chai-as-promised"));
const events_1 = require("events");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const hpkUpgrader_1 = __importDefault(require("./../../../src/components/upgrader/hpkUpgrader"));
const logger_1 = __importDefault(require("./../../../src/utilitis/logger"));
const boxfish_1 = __importDefault(require("./../../../src/components/device/boxfish"));
const events_2 = __importDefault(require("./../../../src/utilitis/events"));
const api_1 = __importDefault(require("./../../../src/components/api"));
chai_1.default.should();
chai_1.default.use(sinon_chai_1.default);
chai_1.default.use(chai_as_promised_1.default);
const dummyCameraManager = sinon_1.default.createStubInstance(boxfish_1.default);
dummyCameraManager._api = {
    sendAndReceiveMessagePack: () => { },
    withSubscribe: () => { },
};
const validHpkBuffer = fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../../testData/dummy.pkg'));
describe('HPKUpgrader', () => {
    let hpkUpgrader;
    let dummyEmitter;
    beforeEach(() => {
        dummyEmitter = new events_1.EventEmitter();
        dummyCameraManager.transport = new events_1.EventEmitter();
        dummyCameraManager.transport.close = () => { };
        hpkUpgrader = new hpkUpgrader_1.default(dummyCameraManager, dummyEmitter, new logger_1.default(false));
    });
    describe('#init', () => {
        it('should emit UPGRADE_REBOOT_COMPLETE on ATTACH', () => {
            hpkUpgrader.init({});
            const upgradeCompletePromise = new Promise(resolve => {
                hpkUpgrader.once('UPGRADE_REBOOT_COMPLETE', resolve);
            });
            dummyEmitter.emit(events_2.default.ATTACH, dummyCameraManager);
            return upgradeCompletePromise;
        });
        describe('DETACH', () => {
            beforeEach(() => {
                sinon_1.default.stub(dummyCameraManager.transport, 'close');
            });
            afterEach(() => {
                dummyCameraManager.transport.close.restore();
            });
            it('should close transport on DETACH', () => {
                hpkUpgrader.init({});
                dummyEmitter.emit(events_2.default.DETACH);
                chai_1.expect(dummyCameraManager.transport.close).to.have.been.calledOnce;
            });
            it('should emit UPGRADE_REBOOT on DETACH', () => {
                hpkUpgrader.init({});
                const upgradeRebootPromise = new Promise(resolve => {
                    hpkUpgrader.once('UPGRADE_REBOOT', resolve);
                });
                dummyEmitter.emit(events_2.default.DETACH);
                return upgradeRebootPromise;
            });
        });
    });
    describe('#start', () => {
        function mockSucessMessages() {
            dummyCameraManager.api.sendAndReceiveMessagePack.onCall(0).resolves({
                status: 0
            });
            dummyCameraManager.api.sendAndReceiveMessagePack.onCall(1).resolves({
                string: 'Success'
            });
            dummyCameraManager.api.sendAndReceiveMessagePack.onCall(2).resolves({
                status: 0
            });
            dummyCameraManager.api.sendAndReceiveMessagePack.onCall(3).resolves({
                string: 'Success'
            });
            dummyCameraManager.api.withSubscribe.callsArg(1);
            dummyCameraManager.transport.on.withArgs('upgrader/status').callsArgWith(1, {
                payload: api_1.default.encode({ operation: 'done' })
            });
        }
        beforeEach(() => {
            sinon_1.default.stub(dummyCameraManager.api, 'sendAndReceiveMessagePack');
            sinon_1.default.stub(dummyCameraManager.api, 'withSubscribe');
            sinon_1.default.stub(dummyCameraManager.transport, 'on');
        });
        afterEach(() => {
            dummyCameraManager.api.sendAndReceiveMessagePack.restore();
            dummyCameraManager.api.withSubscribe.restore();
            dummyCameraManager.transport.on.restore();
        });
        describe('upload hpk file', () => {
            it('should throw if status is not zero', () => {
                dummyCameraManager.api.sendAndReceiveMessagePack.resolves({
                    status: 1
                });
                return hpkUpgrader.start().should.be.rejectedWith(Error);
            });
            it('should emit UPGRADE_FAILED if status is not zero', () => {
                const upgradeFailedPromise = new Promise(resolve => {
                    hpkUpgrader.once('UPGRADE_FAILED', resolve);
                });
                dummyCameraManager.api.sendAndReceiveMessagePack.resolves({
                    status: 1
                });
                hpkUpgrader.start();
                return upgradeFailedPromise;
            });
        });
        describe('when uploaded run hpk', () => {
            it('should wait for run completion if return success', () => {
                mockSucessMessages();
                hpkUpgrader.init({
                    file: validHpkBuffer,
                });
                return hpkUpgrader.start();
            });
            it('should throw if run fails', () => {
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(0).resolves({
                    status: 0
                });
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(1).resolves({
                    string: 'Error'
                });
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(2).resolves({
                    status: 0
                });
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(3).resolves({
                    string: 'Success'
                });
                return hpkUpgrader.start().should.be.rejectedWith(Error);
            });
            it('should try again until MAX_UPLOAD_ATTEMPTS have been reached', () => __awaiter(this, void 0, void 0, function* () {
                dummyCameraManager.api.sendAndReceiveMessagePack.throws(new Error('upload failed'));
                hpkUpgrader.init({
                    file: validHpkBuffer,
                });
                try {
                    yield hpkUpgrader.start();
                }
                catch (e) {
                    // will fail
                }
                chai_1.expect(dummyCameraManager.api.sendAndReceiveMessagePack).to.have.callCount(6);
            }));
        });
        describe('running hpk', () => {
            it('should throw if run fails', () => {
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(0).resolves({
                    status: 0
                });
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(1).resolves({
                    string: 'Error'
                });
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(2).resolves({
                    status: 0
                });
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(3).resolves({
                    string: 'Success'
                });
                dummyCameraManager.api.withSubscribe.callsArg(1);
                dummyCameraManager.transport.on.withArgs('upgrader/status').callsArgWith(1, {
                    payload: api_1.default.encode({ operation: 'done' })
                });
                return hpkUpgrader.start().should.be.rejectedWith(Error);
            });
            it('should emit UPGRADE_PROGRESS with upgrade status as it progress', () => __awaiter(this, void 0, void 0, function* () {
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(0).resolves({
                    status: 0
                });
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(1).resolves({
                    string: 'Success'
                });
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(2).resolves({
                    status: 0
                });
                dummyCameraManager.api.sendAndReceiveMessagePack.onCall(3).resolves({
                    string: 'Success'
                });
                dummyCameraManager.api.withSubscribe.callsArg(1);
                dummyCameraManager.transport.on.callsFake((msg, fn) => {
                    if (msg === 'upgrader/status') {
                        fn({
                            payload: api_1.default.encode({
                                operation: 'starting upgrade',
                                total_points: 71739737.49,
                            })
                        });
                        fn({
                            payload: api_1.default.encode({ operation: 'read_flash', elapsed_points: 65852139.84000063 })
                        });
                    }
                });
                const upgradeProgressPromise = new Promise(resolve => {
                    hpkUpgrader.on('UPGRADE_PROGRESS', message => {
                        if (message.operation === 'read_flash') {
                            resolve(message);
                        }
                    });
                });
                hpkUpgrader.init({
                    file: validHpkBuffer,
                });
                hpkUpgrader.start();
                const { operation, progress } = yield upgradeProgressPromise;
                chai_1.expect(progress).to.equal(91.7931151465113);
            }));
        });
    });
    describe('#upgradeIsValid', () => {
        it('should be be true upgrade_status if status is 0', () => __awaiter(this, void 0, void 0, function* () {
            dummyCameraManager.getState.resolves({
                status: 0
            });
            const isValid = yield hpkUpgrader.upgradeIsValid();
            chai_1.expect(isValid).to.equal(true);
        }));
        it('should be be true upgrade_status if status is not 0', () => __awaiter(this, void 0, void 0, function* () {
            dummyCameraManager.getState.resolves({
                status: 12
            });
            const isValid = yield hpkUpgrader.upgradeIsValid();
            chai_1.expect(isValid).to.equal(false);
        }));
        it('should be be false if upgrade_status throws ', () => __awaiter(this, void 0, void 0, function* () {
            dummyCameraManager.getState.rejects({});
            const isValid = yield hpkUpgrader.upgradeIsValid();
            chai_1.expect(isValid).to.equal(false);
        }));
    });
});
//# sourceMappingURL=hpkUpgrader.spec.js.map