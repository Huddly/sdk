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
const api_1 = __importDefault(require("./../../src/components/api"));
const locksmith_1 = __importDefault(require("./../../src/components/locksmith"));
const msgpack = __importStar(require("msgpack-lite"));
const logger_1 = __importDefault(require("./../../src/utilitis/logger"));
chai_1.default.should();
chai_1.default.use(sinon_chai_1.default);
class NodeUsbTransport {
    init() { return Promise.resolve(); }
    read(receiveMsg, timeout) { return Promise.resolve(); }
    write(cmd, payload) { return Promise.resolve(); }
    subscribe(command) { return Promise.resolve(); }
    unsubscribe(command) { return Promise.resolve(); }
    clear() { return Promise.resolve(); }
    close() { return Promise.resolve(); }
    startListen() { return Promise.resolve(); }
    on(message, listener) { return Promise.resolve(); }
    removeListener(message, listener) { return Promise.resolve(); }
    removeAllListeners(message) { return Promise.resolve(); }
    receiveMessage(msg) { return Promise.resolve(); }
    initEventLoop() { }
    stopEventLoop() { return Promise.resolve(); }
    setEventLoopReadSpeed(timeout) { }
}
const createDummyTransport = () => {
    return sinon_1.default.createStubInstance(NodeUsbTransport);
};
const createDummyLogger = () => {
    return sinon_1.default.createStubInstance(logger_1.default);
};
describe('API', () => {
    let transport;
    let api;
    beforeEach(() => {
        transport = createDummyTransport();
        transport.clear.returns(Promise.resolve());
        transport.write.returns(Promise.resolve());
        transport.subscribe.returns(Promise.resolve());
        transport.unsubscribe.returns(Promise.resolve());
        api = new api_1.default(transport, createDummyLogger(), new locksmith_1.default());
    });
    describe('#sendAndReceiveMessagePack', () => {
        it('should encode message, perform sendAndRecieve and decode received message', () => __awaiter(this, void 0, void 0, function* () {
            const spy = sinon_1.default.spy(api, 'sendAndReceive');
            const readReply = { msg: 'hi', payload: msgpack.encode('Hello World') };
            transport.receiveMessage.returns(Promise.resolve(readReply));
            const res = yield api.sendAndReceiveMessagePack('hello', { receive: 'hi', send: 'hi/send' });
            chai_1.expect(res).to.equal('Hello World');
            chai_1.expect(spy.callCount).to.equals(1);
            chai_1.expect(spy.firstCall.args[0].compare(msgpack.encode('hello'))).to.equal(0);
            chai_1.expect(spy.firstCall.args[1]).to.deep.equals({ receive: 'hi', send: 'hi/send' });
        }));
    });
    describe('#sendAndReceive', () => {
        it('should call send a transfer on out endpoint and wait for a message to be received', () => __awaiter(this, void 0, void 0, function* () {
            const commands = {
                send: 'say_hello',
                receive: 'hello_back'
            };
            const payload = msgpack.encode('huddly');
            const expectedReply = { message: 'hello_back', payload: 'huddly' };
            transport.receiveMessage.returns(Promise.resolve(expectedReply));
            const reply = yield api.sendAndReceive(payload, commands);
            chai_1.expect(transport.clear.callCount).to.equal(2);
            chai_1.expect(transport.subscribe.firstCall.args[0]).to.equal(commands.receive);
            chai_1.expect(transport.write.firstCall.args[0]).to.equal(commands.send);
            chai_1.expect(transport.write.firstCall.args[1].compare(payload)).to.equal(0);
            chai_1.expect(reply).to.deep.equals(expectedReply);
            chai_1.expect(transport.unsubscribe.firstCall.args[0]).to.equal(commands.receive);
        }));
    });
    describe('#withSubscribe', () => {
        it('should subscribe, call argument function and unsubscribe', () => __awaiter(this, void 0, void 0, function* () {
            const commands = ['command1', 'command2', 'command3'];
            const fnSpy = sinon_1.default.spy();
            yield api.withSubscribe(commands, fnSpy);
            chai_1.expect(transport.subscribe.callCount).to.equal(3);
            chai_1.expect(transport.unsubscribe.callCount).to.equal(3);
            chai_1.expect(fnSpy.called).to.equal(true);
            chai_1.expect(transport.subscribe.getCall(0).args[0]).to.equals(commands[0]);
            chai_1.expect(transport.subscribe.getCall(1).args[0]).to.equals(commands[1]);
            chai_1.expect(transport.subscribe.getCall(2).args[0]).to.equals(commands[2]);
            chai_1.expect(transport.unsubscribe.getCall(0).args[0]).to.equals(commands[0]);
            chai_1.expect(transport.unsubscribe.getCall(1).args[0]).to.equals(commands[1]);
            chai_1.expect(transport.unsubscribe.getCall(2).args[0]).to.equals(commands[2]);
        }));
    });
    describe('#fileTransfer', () => {
        describe('on async_file_transfer/data', () => {
            const subscribeMsgs = ['async_file_transfer/data', 'async_file_transfer/done'];
            it('should write async_file_transfer/data_reply', () => __awaiter(this, void 0, void 0, function* () {
                transport.on.withArgs('async_file_transfer/data').onCall(0).callsFake((msg, cb) => cb({ payload: Buffer.from('Test') }));
                transport.on.withArgs('async_file_transfer/done').onCall(0).callsFake((msg, cb) => cb());
                yield api.fileTransfer(Buffer.from('123'), subscribeMsgs);
                chai_1.expect(transport.write.firstCall.args[0]).to.equals('async_file_transfer/data_reply');
            }));
            it('should concat current buffer with result payload and make recursive call', () => __awaiter(this, void 0, void 0, function* () {
                const payload = Buffer.from('Jimmy!');
                transport.on.withArgs('async_file_transfer/data').onCall(0).callsFake((msg, cb) => cb({ payload }));
                transport.on.withArgs('async_file_transfer/done').onCall(0).callsFake((msg, cb) => {
                    setTimeout(() => {
                        cb();
                    }, 100);
                });
                const res = yield api.fileTransfer(Buffer.from('Hello '), subscribeMsgs);
                chai_1.expect(res.toString('utf8')).to.equals('Hello Jimmy!');
            }));
        });
        describe('on async_file_transfer/receive', () => {
            const subscribeMsgs = ['async_file_transfer/receive', 'async_file_transfer/done'];
            it('should write async_file_transfer/receive_reply with header info', () => __awaiter(this, void 0, void 0, function* () {
                const payload = Buffer.alloc(4);
                payload.writeInt32LE(5, 0);
                transport.on.withArgs('async_file_transfer/receive').onCall(0).callsFake((msg, cb) => cb({ payload }));
                transport.on.withArgs('async_file_transfer/done').onCall(0).callsFake((msg, cb) => cb());
                yield api.fileTransfer(Buffer.concat([Buffer.alloc(5, 0x00), Buffer.from('Hello Huddly')]), subscribeMsgs);
                chai_1.expect(transport.write.firstCall.args[0]).to.equals('async_file_transfer/receive_reply');
            }));
            it('should make recursive call with buffer payload', () => __awaiter(this, void 0, void 0, function* () {
                const payload = Buffer.alloc(4);
                payload.writeInt32LE(5, 0);
                const expectedResult = 'Hello Huddly';
                transport.on.withArgs('async_file_transfer/receive').onCall(0).callsFake((msg, cb) => cb({ payload }));
                transport.on.withArgs('async_file_transfer/done').onCall(0).callsFake((msg, cb) => {
                    setTimeout(() => {
                        cb();
                    }, 100);
                });
                const res = yield api.fileTransfer(Buffer.concat([Buffer.alloc(5, 0x00), Buffer.from('Hello Huddly')]), subscribeMsgs);
                chai_1.expect(res.toString('utf8')).to.equals(expectedResult);
            }));
            it('should throw error when data length is not 4 on receive', () => __awaiter(this, void 0, void 0, function* () {
                const payload = Buffer.alloc(0);
                try {
                    transport.on.withArgs('async_file_transfer/receive').onCall(0).callsFake((msg, cb) => cb({ payload }));
                    yield api.fileTransfer(Buffer.alloc(5, 0x00), subscribeMsgs);
                    chai_1.expect(true).to.equals(false);
                }
                catch (e) {
                    chai_1.expect(e).to.equals('Data lenght is not 4, unable to proceed!');
                    chai_1.expect(transport.removeAllListeners.callCount).to.equals(2);
                    chai_1.expect(transport.removeAllListeners.getCall(0).args[0]).to.equals('async_file_transfer/receive');
                    chai_1.expect(transport.removeAllListeners.getCall(1).args[0]).to.equals('async_file_transfer/done');
                }
            }));
        });
        describe('on async_file_transfer/done', () => {
            const subscribeMsgs = ['async_file_transfer/done'];
            it('should return the accumulated buffer', () => __awaiter(this, void 0, void 0, function* () {
                const payload = Buffer.alloc(0);
                transport.on.withArgs('async_file_transfer/done').onCall(0).callsFake((msg, cb) => cb({ payload }));
                const res = yield api.fileTransfer(Buffer.from('Just a message'), subscribeMsgs);
                chai_1.expect(res.toString('utf8')).to.equals('Just a message');
            }));
        });
        describe('on async_file_transfer/timeout', () => {
            const subscribeMsgs = ['async_file_transfer/timeout'];
            it('should throw error with timeout message', () => __awaiter(this, void 0, void 0, function* () {
                const payload = Buffer.alloc(0);
                try {
                    transport.on.withArgs('async_file_transfer/timeout').onCall(0).callsFake((msg, cb) => cb({ payload }));
                    yield api.fileTransfer(Buffer.alloc(0), subscribeMsgs);
                    chai_1.expect(true).to.equals(false);
                }
                catch (e) {
                    chai_1.expect(e).to.equals('Error log transfer timed out');
                    chai_1.expect(transport.removeAllListeners.callCount).to.equals(1);
                    chai_1.expect(transport.removeAllListeners.getCall(0).args[0]).to.equals('async_file_transfer/timeout');
                }
            }));
        });
    });
    describe('#asyncFileTransfer', () => {
        let fileTransferStub;
        let sendReceiveStub;
        beforeEach(() => {
            fileTransferStub = sinon_1.default.stub(api, 'fileTransfer');
            sendReceiveStub = sinon_1.default.stub(api, 'sendAndReceive');
        });
        afterEach(() => {
            fileTransferStub.restore();
            sendReceiveStub.restore();
        });
        it('should subscribe/unsubscribe to async_file_transfer messages', () => __awaiter(this, void 0, void 0, function* () {
            const subscribeMsgs = ['async_file_transfer/data', 'async_file_transfer/receive', 'async_file_transfer/done', 'async_file_transfer/timeout'];
            const withSubscribySpy = sinon_1.default.spy(api, 'withSubscribe');
            fileTransferStub.resolves(Buffer.alloc(1, 0xa0));
            sendReceiveStub.returns(Promise.resolve({ message: '', payload: Buffer.alloc(1, 0x00) }));
            yield api.asyncFileTransfer({ send: 'hello/send', receive: 'hello/reply' });
            chai_1.expect(withSubscribySpy.firstCall.args[0]).to.deep.equals(subscribeMsgs);
        }));
        it('should make a sendAndReceive call to check status', () => __awaiter(this, void 0, void 0, function* () {
            fileTransferStub.resolves(Buffer.alloc(1, 0xa0));
            const msg = { send: 'hello/send', receive: 'hello/reply' };
            sendReceiveStub.returns(Promise.resolve({ message: '', payload: Buffer.alloc(1, 0xa0) }));
            const reply = yield api.asyncFileTransfer(msg);
            chai_1.expect(reply.compare(Buffer.alloc(1, 0xa0))).to.equals(0);
            chai_1.expect(sendReceiveStub.firstCall.args[0].compare(Buffer.alloc(0))).to.equals(0);
            chai_1.expect(sendReceiveStub.firstCall.args[1]).to.deep.equals(msg);
            chai_1.expect(sendReceiveStub.firstCall.args[2]).to.deep.equals(5000); // Default timeout on #asyncFileTransfer
        }));
    });
    describe('#getProductInfoLegacy', () => {
        let asyncFileTransferStub;
        beforeEach(() => { asyncFileTransferStub = sinon_1.default.stub(api, 'asyncFileTransfer'); });
        afterEach(() => { asyncFileTransferStub.restore(); });
        it('should call #asyncFileTransfer with prodinfo commands and decode result', () => __awaiter(this, void 0, void 0, function* () {
            asyncFileTransferStub.returns(Promise.resolve(msgpack.encode('Production Info: Test')));
            const prodinfo = yield api.getProductInfoLegacy();
            chai_1.expect(asyncFileTransferStub.callCount).to.equals(1);
            chai_1.expect(asyncFileTransferStub.firstCall.args[0]).to.deep.equals({ send: 'prodinfo/get', receive: 'prodinfo/get_status' });
            chai_1.expect(prodinfo).to.equals('Production Info: Test');
        }));
    });
    describe('#getProductionInfo', () => {
        let getProdLegacy;
        let sendAndReceiveMsgPackStub;
        beforeEach(() => {
            getProdLegacy = sinon_1.default.stub(api, 'getProductInfoLegacy');
            sendAndReceiveMsgPackStub = sinon_1.default.stub(api, 'sendAndReceiveMessagePack');
        });
        afterEach(() => {
            getProdLegacy.restore();
            sendAndReceiveMsgPackStub.restore();
        });
        it('should fallback to legacy when msgpack not supported', () => __awaiter(this, void 0, void 0, function* () {
            sendAndReceiveMsgPackStub.rejects('MessagePack not supported for GetProdInfo!');
            yield api.getProductInfo();
            chai_1.expect(getProdLegacy.called).to.equals(true);
            chai_1.expect(getProdLegacy.callCount).to.equals(1);
            chai_1.expect(api.setProdInfoMsgPackSupport).to.equals(false);
        }));
        it('should fallback to legacy when msgpack result is empty', () => __awaiter(this, void 0, void 0, function* () {
            sendAndReceiveMsgPackStub.resolves(undefined);
            yield api.getProductInfo();
            chai_1.expect(getProdLegacy.called).to.equals(true);
            chai_1.expect(getProdLegacy.callCount).to.equals(1);
            chai_1.expect(api.setProdInfoMsgPackSupport).to.equals(false);
        }));
        it('should retrieve prodinfo with one messagepack call to target', () => __awaiter(this, void 0, void 0, function* () {
            const prodInfoDummy = {
                appVersion: '1.1.1',
                product: 'Huddly IQ'
            };
            sendAndReceiveMsgPackStub.resolves(prodInfoDummy);
            const prodInfoResult = yield api.getProductInfo();
            chai_1.expect(prodInfoDummy).to.deep.equals(prodInfoResult);
            chai_1.expect(getProdLegacy.called).equals(false);
            chai_1.expect(sendAndReceiveMsgPackStub.firstCall.args[0].compare(Buffer.from(''))).to.equals(0);
            chai_1.expect(sendAndReceiveMsgPackStub.firstCall.args[1]).to.deep.equals({
                send: 'prodinfo/get_msgpack', receive: 'prodinfo/get_msgpack_reply'
            });
            chai_1.expect(sendAndReceiveMsgPackStub.firstCall.args[2]).to.equals(1000);
            chai_1.expect(api.setProdInfoMsgPackSupport).to.equals(true);
        }));
    });
    describe('#setProductInfo', () => {
        let setProdLegacy;
        let sendAndReceiveStub;
        beforeEach(() => {
            setProdLegacy = sinon_1.default.stub(api, 'setProductInfoLegacy');
            sendAndReceiveStub = sinon_1.default.stub(api, 'sendAndReceive');
        });
        afterEach(() => {
            setProdLegacy.restore();
            sendAndReceiveStub.restore();
        });
        it('should fallback to legacy when msgpack not supported', () => __awaiter(this, void 0, void 0, function* () {
            sendAndReceiveStub.rejects('MessagePack not supported for setProdInfo!');
            const prodinfoSet = { newValue: 'Hello' };
            yield api.setProductInfo(prodinfoSet);
            chai_1.expect(setProdLegacy.called).to.equals(true);
            chai_1.expect(setProdLegacy.callCount).to.equals(1);
            chai_1.expect(setProdLegacy.firstCall.args[0]).to.deep.equals(prodinfoSet);
            chai_1.expect(api.setProdInfoMsgPackSupport).to.equals(false);
        }));
        it('should set prodinfo using messagepack command', () => __awaiter(this, void 0, void 0, function* () {
            sendAndReceiveStub.resolves();
            const prodinfoSet = { newValue: 'Hello' };
            yield api.setProductInfo(prodinfoSet);
            chai_1.expect(sendAndReceiveStub.firstCall.args[0].compare(msgpack.encode(prodinfoSet))).to.equals(0);
            chai_1.expect(sendAndReceiveStub.firstCall.args[1]).to.deep.equals({
                send: 'prodinfo/set_msgpack',
                receive: 'prodinfo/set_msgpack_reply'
            });
            chai_1.expect(sendAndReceiveStub.firstCall.args[2]).to.equals(10000);
        }));
    });
    describe('#encode', () => {
        it('should encode payload argument', () => {
            const encoded = api_1.default.encode('Hello');
            chai_1.expect(encoded).to.be.instanceof(Buffer);
            chai_1.expect(encoded.compare(msgpack.encode('Hello'))).to.equals(0);
        });
        it('should return argument when given a buffer', () => {
            const buffer = Buffer.from('test');
            const encoded = api_1.default.encode(buffer);
            chai_1.expect(buffer.compare(encoded)).to.equals(0);
        });
    });
    describe('#decode', () => {
        it('should decode string', () => {
            const strBuffer = Buffer.from('A string!');
            chai_1.expect(api_1.default.decode(strBuffer, 'string')).to.equals('A string!');
        });
        it('should decode int', () => {
            const buffer = Buffer.alloc(4);
            buffer.writeInt32LE(5, 0);
            chai_1.expect(api_1.default.decode(buffer, 'int')).to.equals(5);
        });
        it('should decode messagepack', () => {
            const obj = { msg: 'hi' };
            const msgpackBuff = msgpack.encode(obj);
            chai_1.expect(api_1.default.decode(msgpackBuff, 'messagepack')).to.deep.equals(obj);
        });
        it('should decode double', () => {
            const buffer = Buffer.alloc(8);
            buffer.writeDoubleLE(123.456, 0);
            chai_1.expect(api_1.default.decode(buffer, 'double')).to.equals(123.456);
        });
        it('should throw error when decode type is not supported', () => {
            try {
                api_1.default.decode(new Buffer('foo'), 'bigint');
                chai_1.expect(true).to.equals(false);
            }
            catch (e) {
                chai_1.expect(e.message).to.equals('Cannot decode buffer for type: bigint');
            }
        });
        it('should return undefined when payload length is zero', () => {
            const decoded = api_1.default.decode(Buffer.alloc(0), 'messagepack');
            chai_1.expect(decoded).to.be.undefined;
        });
    });
    describe('#getUptime', () => {
        it('should perform a complete transfer-read process for uptime', () => __awaiter(this, void 0, void 0, function* () {
            const uptimeBuff = Buffer.alloc(8);
            uptimeBuff.writeDoubleLE(123.456, 0);
            transport.receiveMessage.resolves({ payload: uptimeBuff });
            const uptime = yield api.getUptime();
            chai_1.expect(transport.receiveMessage.firstCall.args[0]).to.equals('camctrl/uptime_reply');
            chai_1.expect(transport.write.firstCall.args[0]).to.equals('camctrl/uptime');
            chai_1.expect(uptime).to.equals(123.456);
        }));
    });
    describe('#getCameraInfo', () => {
        let prodInfoStub;
        let uptimeStub;
        beforeEach(() => {
            prodInfoStub = sinon_1.default.stub(api, 'getProductInfo');
            uptimeStub = sinon_1.default.stub(api, 'getUptime');
        });
        afterEach(() => {
            prodInfoStub.restore();
            uptimeStub.restore();
        });
        it('should call #getProdinfo and #getUptime and merge the result into an object', () => __awaiter(this, void 0, void 0, function* () {
            prodInfoStub.returns(Promise.resolve({ app_version: 'HuddlyIQ-123' }));
            uptimeStub.returns(Promise.resolve(123.456789));
            const cameraInfo = yield api.getCameraInfo();
            chai_1.expect(prodInfoStub.callCount).to.equals(1);
            chai_1.expect(uptimeStub.callCount).to.equals(1);
            chai_1.expect(cameraInfo).to.deep.equals({
                softwareVersion: 'HuddlyIQ-123',
                uptime: 123.46
            });
        }));
    });
    describe('#errorLog', () => {
        let fileTransferStub;
        beforeEach(() => { fileTransferStub = sinon_1.default.stub(api, 'fileTransfer'); });
        afterEach(() => { fileTransferStub.restore(); });
        describe('#getErrorLog', () => {
            it('should call #fileTransfer with error log commands and decode the result to ascii string', () => __awaiter(this, void 0, void 0, function* () {
                const logStr = 'Camera Log 12333123';
                fileTransferStub.returns(Promise.resolve(Buffer.from(logStr)));
                const log = yield api.getErrorLog();
                chai_1.expect(fileTransferStub.callCount).to.equals(1);
                chai_1.expect(transport.write.firstCall.args[0]).to.equals('error_logger/read');
                chai_1.expect(log).to.equals(logStr);
            }));
        });
        describe('#eraseErrorLog', () => {
            it('should call #fileTransfer with commands to erase error log', () => __awaiter(this, void 0, void 0, function* () {
                fileTransferStub.returns(Promise.resolve(Buffer.alloc(0)));
                transport.receiveMessage.resolves();
                yield api.eraseErrorLog();
                chai_1.expect(transport.receiveMessage.lastCall.args[0]).to.equals('error_logger/erase_done');
                chai_1.expect(transport.write.lastCall.args[0]).to.equals('error_logger/erase');
            }));
        });
    });
});
//# sourceMappingURL=api.spec.js.map