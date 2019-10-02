import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import Api from './../../src/components/api';
import Locksmith from './../../src/components/locksmith';
import * as msgpack from 'msgpack-lite';
import ITransport from './../../src/interfaces/iTransport';
import DefaultLogger from './../../src/utilitis/logger';


chai.should();
chai.use(sinonChai);

class NodeUsbTransport implements ITransport {
  device: any;
  eventLoopSpeed: any;
  init(): Promise<void> { return Promise.resolve(); }
  read(receiveMsg?: string, timeout?: number): Promise<any> { return Promise.resolve(); }
  write(cmd: string, payload?: Buffer): Promise<void> { return Promise.resolve(); }
  subscribe(command: string): Promise<void> { return Promise.resolve(); }
  unsubscribe(command: string): Promise<void> { return Promise.resolve(); }
  clear(): Promise<void> { return Promise.resolve(); }
  close(): Promise<any> { return Promise.resolve(); }
  startListen(): Promise<void> { return Promise.resolve(); }
  on(message: string, listener: any): Promise<void> { return Promise.resolve(); }
  removeListener(message: string, listener: any): Promise<void> { return Promise.resolve(); }
  removeAllListeners(message: string): Promise<void> { return Promise.resolve(); }
  receiveMessage(msg: string) { return Promise.resolve(); }
  initEventLoop(): void { }
  stopEventLoop(): Promise<void> { return Promise.resolve(); }
  setEventLoopReadSpeed(timeout?: number): void { }
}

const createDummyTransport = () => {
  return sinon.createStubInstance(NodeUsbTransport);
};
const createDummyLogger = (): DefaultLogger => {
  return sinon.createStubInstance(DefaultLogger);
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
    api = new Api(transport, createDummyLogger(), new Locksmith());
  });
  describe('#sendAndReceiveMessagePack', () => {
    it('should encode message, perform sendAndRecieve and decode received message', async () => {
      const spy = sinon.spy(api, 'sendAndReceive');
      const readReply = { msg: 'hi', payload: msgpack.encode('Hello World') };
      transport.receiveMessage.returns(Promise.resolve(readReply));
      const res = await api.sendAndReceiveMessagePack('hello', { receive: 'hi', send: 'hi/send' });
      expect(res).to.equal('Hello World');
      expect(spy.callCount).to.equals(1);
      expect(spy.firstCall.args[0].compare(msgpack.encode('hello'))).to.equal(0);
      expect(spy.firstCall.args[1]).to.deep.equals({ receive: 'hi', send: 'hi/send' });
    });
  });

  describe('#sendAndReceive', () => {
    it('should call send a transfer on out endpoint and wait for a message to be received', async () => {
      const commands = {
        send: 'say_hello',
        receive: 'hello_back'
      };
      const payload = msgpack.encode('huddly');
      const expectedReply = { message: 'hello_back', payload: 'huddly' };
      transport.receiveMessage.returns(Promise.resolve(expectedReply));
      const reply = await api.sendAndReceive(payload, commands);
      expect(transport.clear.callCount).to.equal(2);
      expect(transport.subscribe.firstCall.args[0]).to.equal(commands.receive);
      expect(transport.write.firstCall.args[0]).to.equal(commands.send);
      expect(transport.write.firstCall.args[1].compare(payload)).to.equal(0);
      expect(reply).to.deep.equals(expectedReply);
      expect(transport.unsubscribe.firstCall.args[0]).to.equal(commands.receive);
    });
  });

  describe('#withSubscribe', () => {
    it('should subscribe, call argument function and unsubscribe', async () => {
      const commands = ['command1', 'command2', 'command3'];
      const fnSpy = sinon.spy();
      await api.withSubscribe(commands, fnSpy);
      expect(transport.subscribe.callCount).to.equal(3);
      expect(transport.unsubscribe.callCount).to.equal(3);
      expect(fnSpy.called).to.equal(true);
      expect(transport.subscribe.getCall(0).args[0]).to.equals(commands[0]);
      expect(transport.subscribe.getCall(1).args[0]).to.equals(commands[1]);
      expect(transport.subscribe.getCall(2).args[0]).to.equals(commands[2]);
      expect(transport.unsubscribe.getCall(0).args[0]).to.equals(commands[0]);
      expect(transport.unsubscribe.getCall(1).args[0]).to.equals(commands[1]);
      expect(transport.unsubscribe.getCall(2).args[0]).to.equals(commands[2]);
    });
  });

  describe('#fileTransfer', () => {
    describe('on async_file_transfer/data', () => {
      const subscribeMsgs = ['async_file_transfer/data', 'async_file_transfer/done'];
      it('should write async_file_transfer/data_reply', async () => {
        transport.on.withArgs('async_file_transfer/data').onCall(0).callsFake((msg, cb) => cb({ payload: Buffer.from('Test') }));
        transport.on.withArgs('async_file_transfer/done').onCall(0).callsFake((msg, cb) => cb());
        await api.fileTransfer(Buffer.from('123'), subscribeMsgs);
        expect(transport.write.firstCall.args[0]).to.equals('async_file_transfer/data_reply');
      });

      it('should concat current buffer with result payload and make recursive call', async () => {
        const payload = Buffer.from('Jimmy!');
        transport.on.withArgs('async_file_transfer/data').onCall(0).callsFake((msg, cb) => cb({ payload }));

        transport.on.withArgs('async_file_transfer/done').onCall(0).callsFake((msg, cb) => {
          setTimeout(() => { // Done should be called sometime after async_file_transfer/data
            cb();
          }, 100);
        });

        const res = await api.fileTransfer(Buffer.from('Hello '), subscribeMsgs);
        expect(res.toString('utf8')).to.equals('Hello Jimmy!');
      });
    });

    describe('on async_file_transfer/receive', () => {
      const subscribeMsgs = ['async_file_transfer/receive', 'async_file_transfer/done'];
      it('should write async_file_transfer/receive_reply with header info', async () => {
        const payload = Buffer.alloc(4);
        payload.writeInt32LE(5, 0);
        transport.on.withArgs('async_file_transfer/receive').onCall(0).callsFake((msg, cb) => cb({ payload }));
        transport.on.withArgs('async_file_transfer/done').onCall(0).callsFake((msg, cb) => cb());
        await api.fileTransfer(Buffer.concat([Buffer.alloc(5, 0x00), Buffer.from('Hello Huddly')]), subscribeMsgs);
        expect(transport.write.firstCall.args[0]).to.equals('async_file_transfer/receive_reply');
      });

      it('should make recursive call with buffer payload', async () => {
        const payload = Buffer.alloc(4);
        payload.writeInt32LE(5, 0);
        const expectedResult = 'Hello Huddly';
        transport.on.withArgs('async_file_transfer/receive').onCall(0).callsFake((msg, cb) => cb({ payload }));
        transport.on.withArgs('async_file_transfer/done').onCall(0).callsFake((msg, cb) => {
          setTimeout(() => { // Done should be called sometime after async_file_transfer/receive
            cb();
          }, 100);
        });
        const res = await api.fileTransfer(Buffer.concat([Buffer.alloc(5, 0x00), Buffer.from('Hello Huddly')]), subscribeMsgs);
        expect(res.toString('utf8')).to.equals(expectedResult);
      });

      it('should throw error when data length is not 4 on receive', async () => {
        const payload = Buffer.alloc(0);
        try {
          transport.on.withArgs('async_file_transfer/receive').onCall(0).callsFake((msg, cb) => cb({ payload }));
          await api.fileTransfer(Buffer.alloc(5, 0x00), subscribeMsgs);
          expect(true).to.equals(false);
        } catch (e) {
          expect(e.message).to.equals('Data length is not 4, unable to proceed!');
          expect(transport.removeAllListeners.callCount).to.equals(2);
          expect(transport.removeAllListeners.getCall(0).args[0]).to.equals('async_file_transfer/receive');
          expect(transport.removeAllListeners.getCall(1).args[0]).to.equals('async_file_transfer/done');
        }
      });
    });

    describe('on async_file_transfer/done', () => {
      const subscribeMsgs = ['async_file_transfer/done'];
      it('should return the accumulated buffer', async () => {
        const payload = Buffer.alloc(0);
        transport.on.withArgs('async_file_transfer/done').onCall(0).callsFake((msg, cb) => cb({ payload }));
        const res = await api.fileTransfer(Buffer.from('Just a message'), subscribeMsgs);
        expect(res.toString('utf8')).to.equals('Just a message');
      });
    });
    describe('on async_file_transfer/timeout', () => {
      const subscribeMsgs = ['async_file_transfer/timeout'];
      it('should throw error with timeout message', async () => {
        const payload = Buffer.alloc(0);
        try {
          transport.on.withArgs('async_file_transfer/timeout').onCall(0).callsFake((msg, cb) => cb({ payload }));
          await api.fileTransfer(Buffer.alloc(0), subscribeMsgs);
          expect(true).to.equals(false);
        } catch (e) {
          expect(e.message).to.equals('Timeout');
          expect(transport.removeAllListeners.callCount).to.equals(1);
          expect(transport.removeAllListeners.getCall(0).args[0]).to.equals('async_file_transfer/timeout');
        }
      });
    });

    describe('on no response', () => {
      it('should timeout if none of the filetransfer messages are resolved within given time limit', async () => {
        try {
          await api.fileTransfer(Buffer.alloc(0), [], 1000);
          expect(true).to.equals(false);
        } catch (e) {
          expect(e.message).to.equals('Timeout');
        }
      });
    });
  });

  describe('#asyncFileTransfer', () => {
    let fileTransferStub;
    let sendReceiveStub;
    beforeEach(() => {
      fileTransferStub = sinon.stub(api, 'fileTransfer');
      sendReceiveStub = sinon.stub(api, 'sendAndReceive');
    });
    afterEach(() => {
      fileTransferStub.restore();
      sendReceiveStub.restore();
    });
    it('should subscribe/unsubscribe to async_file_transfer messages', async () => {
      const subscribeMsgs = ['async_file_transfer/data', 'async_file_transfer/receive', 'async_file_transfer/done', 'async_file_transfer/timeout'];
      const withSubscribySpy = sinon.spy(api, 'withSubscribe');
      fileTransferStub.resolves(Buffer.alloc(1, 0xa0));
      sendReceiveStub.returns(Promise.resolve({ message: '', payload: Buffer.alloc(1, 0x00) }));
      await api.asyncFileTransfer({ send: 'hello/send', receive: 'hello/reply' });
      expect(withSubscribySpy.firstCall.args[0]).to.deep.equals(subscribeMsgs);
    });

    it('should make a sendAndReceive call to check status', async () => {
      fileTransferStub.resolves(Buffer.alloc(1, 0xa0));
      const msg = { send: 'hello/send', receive: 'hello/reply' };
      sendReceiveStub.returns(Promise.resolve({ message: '', payload: Buffer.alloc(1, 0xa0) }));
      const reply = await api.asyncFileTransfer(msg);
      expect(reply.compare(Buffer.alloc(1, 0xa0))).to.equals(0);
      expect(sendReceiveStub.firstCall.args[0].compare(Buffer.alloc(0))).to.equals(0);
      expect(sendReceiveStub.firstCall.args[1]).to.deep.equals(msg);
      expect(sendReceiveStub.firstCall.args[2]).to.deep.equals(5000); // Default timeout on #asyncFileTransfer
    });
  });

  describe('#getProductInfoLegacy', () => {
    let asyncFileTransferStub;
    beforeEach(() => { asyncFileTransferStub = sinon.stub(api, 'asyncFileTransfer'); });
    afterEach(() => { asyncFileTransferStub.restore(); });

    it('should call #asyncFileTransfer with prodinfo commands and decode result', async () => {
      asyncFileTransferStub.returns(Promise.resolve(msgpack.encode('Production Info: Test')));
      const prodinfo = await api.getProductInfoLegacy();
      expect(asyncFileTransferStub.callCount).to.equals(1);
      expect(asyncFileTransferStub.firstCall.args[0]).to.deep.equals({ send: 'prodinfo/get', receive: 'prodinfo/get_status' });
      expect(prodinfo).to.equals('Production Info: Test');
    });
  });

  describe('#getProductionInfo', () => {
    let getProdLegacy;
    let sendAndReceiveMsgPackStub;
    beforeEach(() => {
      getProdLegacy = sinon.stub(api, 'getProductInfoLegacy');
      sendAndReceiveMsgPackStub = sinon.stub(api, 'sendAndReceiveMessagePack');
    });
    afterEach(() => {
      getProdLegacy.restore();
      sendAndReceiveMsgPackStub.restore();
    });

    it('should fallback to legacy when msgpack not supported', async () => {
      sendAndReceiveMsgPackStub.rejects('MessagePack not supported for GetProdInfo!');
      await api.getProductInfo();
      expect(getProdLegacy.called).to.equals(true);
      expect(getProdLegacy.callCount).to.equals(1);
      expect(api.setProdInfoMsgPackSupport).to.equals(false);
    });

    it('should fallback to legacy when msgpack result is empty', async () => {
      sendAndReceiveMsgPackStub.resolves(undefined);
      await api.getProductInfo();
      expect(getProdLegacy.called).to.equals(true);
      expect(getProdLegacy.callCount).to.equals(1);
      expect(api.setProdInfoMsgPackSupport).to.equals(false);
    });

    it('should retrieve prodinfo with one messagepack call to target', async () => {
      const prodInfoDummy = {
        appVersion: '1.1.1',
        product: 'Huddly IQ'
      };
      sendAndReceiveMsgPackStub.resolves(prodInfoDummy);
      const prodInfoResult = await api.getProductInfo();
      expect(prodInfoDummy).to.deep.equals(prodInfoResult);
      expect(getProdLegacy.called).equals(false);
      expect(sendAndReceiveMsgPackStub.firstCall.args[0].compare(Buffer.from(''))).to.equals(0);
      expect(sendAndReceiveMsgPackStub.firstCall.args[1]).to.deep.equals({
        send: 'prodinfo/get_msgpack', receive: 'prodinfo/get_msgpack_reply'
      });
      expect(sendAndReceiveMsgPackStub.firstCall.args[2]).to.equals(1000);
      expect(api.setProdInfoMsgPackSupport).to.equals(true);
    });
  });

  describe('#setProductInfo', () => {
    let setProdLegacy;
    let sendAndReceiveStub;
    beforeEach(() => {
      setProdLegacy = sinon.stub(api, 'setProductInfoLegacy');
      sendAndReceiveStub = sinon.stub(api, 'sendAndReceive');
    });
    afterEach(() => {
      setProdLegacy.restore();
      sendAndReceiveStub.restore();
    });

    it('should fallback to legacy when msgpack not supported', async () => {
      sendAndReceiveStub.rejects('MessagePack not supported for setProdInfo!');
      const prodinfoSet = { newValue: 'Hello' };
      await api.setProductInfo(prodinfoSet);
      expect(setProdLegacy.called).to.equals(true);
      expect(setProdLegacy.callCount).to.equals(1);
      expect(setProdLegacy.firstCall.args[0]).to.deep.equals(prodinfoSet);
      expect(api.setProdInfoMsgPackSupport).to.equals(false);
    });

    it('should set prodinfo using messagepack command', async () => {
      sendAndReceiveStub.resolves();
      const prodinfoSet = { newValue: 'Hello' };
      await api.setProductInfo(prodinfoSet);
      expect(sendAndReceiveStub.firstCall.args[0].compare(msgpack.encode(prodinfoSet))).to.equals(0);
      expect(sendAndReceiveStub.firstCall.args[1]).to.deep.equals({
        send: 'prodinfo/set_msgpack',
        receive: 'prodinfo/set_msgpack_reply'
      });
      expect(sendAndReceiveStub.firstCall.args[2]).to.equals(10000);
    });
  });

  describe('#encode', () => {
    it('should encode payload argument', () => {
      const encoded = Api.encode('Hello');
      expect(encoded).to.be.instanceof(Buffer);
      expect(encoded.compare(msgpack.encode('Hello'))).to.equals(0);
    });

    it('should return argument when given a buffer', () => {
      const buffer = Buffer.from('test');
      const encoded = Api.encode(buffer);
      expect(buffer.compare(encoded)).to.equals(0);
    });
  });

  describe('#decode', () => {
    it('should decode string', () => {
      const strBuffer = Buffer.from('A string!');
      expect(Api.decode(strBuffer, 'string')).to.equals('A string!');
    });

    it('should decode int', () => {
      const buffer = Buffer.alloc(4);
      buffer.writeInt32LE(5, 0);
      expect(Api.decode(buffer, 'int')).to.equals(5);
    });

    it('should decode messagepack', () => {
      const obj = { msg: 'hi' };
      const msgpackBuff = msgpack.encode(obj);
      expect(Api.decode(msgpackBuff, 'messagepack')).to.deep.equals(obj);
    });

    it('should decode double', () => {
      const buffer = Buffer.alloc(8);
      buffer.writeDoubleLE(123.456, 0);
      expect(Api.decode(buffer, 'double')).to.equals(123.456);
    });

    it('should throw error when decode type is not supported', () => {
      try {
        Api.decode(new Buffer('foo'), 'bigint');
        expect(true).to.equals(false);
      } catch (e) {
        expect(e.message).to.equals('Cannot decode buffer for type: bigint');
      }
    });

    it('should return undefined when payload length is zero', () => {
      const decoded = Api.decode(Buffer.alloc(0), 'messagepack');
      expect(decoded).to.be.undefined;
    });
  });

  describe('#getUptime', () => {
    it('should perform a complete transfer-read process for uptime', async () => {
      const uptimeBuff = Buffer.alloc(8);
      uptimeBuff.writeDoubleLE(123.456, 0);
      transport.receiveMessage.resolves({ payload: uptimeBuff });
      const uptime = await api.getUptime();
      expect(transport.receiveMessage.firstCall.args[0]).to.equals('camctrl/uptime_reply');
      expect(transport.write.firstCall.args[0]).to.equals('camctrl/uptime');
      expect(uptime).to.equals(123.456);
    });
  });

  describe('#getCameraInfo', () => {
    let prodInfoStub;
    let uptimeStub;
    beforeEach(() => {
      prodInfoStub = sinon.stub(api, 'getProductInfo');
      uptimeStub = sinon.stub(api, 'getUptime');
    });
    afterEach(() => {
      prodInfoStub.restore();
      uptimeStub.restore();
    });
    it('should call #getProdinfo, #getUptime, #GetAutozoomStatus and merge the result together', async () => {
      prodInfoStub.resolves({ app_version: 'HuddlyIQ-123' });
      uptimeStub.resolves(123.456789);
      const cameraInfo = await api.getCameraInfo();
      expect(prodInfoStub.callCount).to.equals(1);
      expect(uptimeStub.callCount).to.equals(1);
      expect(cameraInfo).to.deep.equals({
        softwareVersion: 'HuddlyIQ-123',
        uptime: 123.46,
      });
    });
  });

  describe('#errorLog', () => {
    let sendAndReceiveMsgPackStub;
    beforeEach(() => {
      sendAndReceiveMsgPackStub = sinon.stub(api, 'sendAndReceiveMessagePack');
    });
    afterEach(() => {
      sendAndReceiveMsgPackStub.restore();
    });
    describe('#getErrorLog', () => {
      it('should call #fileTransfer with error log commands and decode the result to ascii string', async () => {
        const logStr = 'Camera Log 12333123';
        const errorLogDummy = {
          error: 0,
          string: 'Success',
          log: logStr,
        };
        sendAndReceiveMsgPackStub.resolves(errorLogDummy);
        const log = await api.getErrorLog(100);
        expect(sendAndReceiveMsgPackStub.firstCall.args[1]).to.deep.equals({
          send: 'error_logger/read_simple', receive: 'error_logger/read_simple_reply'
        });
        expect(log).to.equals(logStr);
      });
    });
    describe('#eraseErrorLog', () => {
      it('should call #fileTransfer with commands to erase error log', async () => {
        transport.receiveMessage.resolves();
        await api.eraseErrorLog(100);
        expect(transport.receiveMessage.lastCall.args[0]).to.equals('error_logger/erase_done');
        expect(transport.write.lastCall.args[0]).to.equals('error_logger/erase');
      });
    });
  });

  describe('#errorLogLegacy', () => {
    let fileTransferStub;
    let sendAndReceiveMsgPackStub;
    beforeEach(() => {
      fileTransferStub = sinon.stub(api, 'fileTransfer');
      sendAndReceiveMsgPackStub = sinon.stub(api, 'sendAndReceiveMessagePack');
    });
    afterEach(() => {
      fileTransferStub.restore();
      sendAndReceiveMsgPackStub.restore();
    });
    describe('#getErrorLog', () => {
      it('should call #fileTransfer with error log commands and decode the result to ascii string', async () => {
        const logStr = 'Camera Log 12333123';
        sendAndReceiveMsgPackStub.rejects('Timed out');
        fileTransferStub.returns(Promise.resolve(Buffer.from(logStr)));
        const log = await api.getErrorLog(100);
        expect(fileTransferStub.callCount).to.equals(1);
        expect(transport.write.firstCall.args[0]).to.equals('error_logger/read');
        expect(log).to.equals(logStr);
      });
    });
  });

  describe('#setInterpolationParameters', () => {
    it('should transfer a message with all interpolation parameters encoded in float32array', () => {
      const arr: Float32Array = new Float32Array(4);
      arr[0] = 0.1; arr[1] = 0.2; arr[2] = 0.3; arr[3] = 0.4;
      const expectedWritePayload = Buffer.from(arr.buffer);
      const expectedCommand = 'interpolator/set_params';
      api.setInterpolationParameters({x1: 0.1, y1: 0.2, x2: 0.3, y2: 0.4});
      expect(transport.write.firstCall.args[0]).to.equal(expectedCommand);
      expect(transport.write.firstCall.args[1].compare(expectedWritePayload)).to.equals(0);
    });
  });
  describe('#getInterpolationParameters', () => {
    let sendAndReceiveMsgPackStub;
    beforeEach(() => {
      sendAndReceiveMsgPackStub = sinon.stub(api, 'sendAndReceiveMessagePack');
    });
    afterEach(() => {
      sendAndReceiveMsgPackStub.restore();
    });
    it('should receive interpolation parameters as messagepack encoded map/object', async () => {
      const expectedParams = { x1: 0.1, y1: 0.7, x2: 0.43, y2: 0.23 };
      sendAndReceiveMsgPackStub.resolves(expectedParams);
      const params = await api.getInterpolationParameters();
      expect(params).to.deep.equals(expectedParams);
      expect(sendAndReceiveMsgPackStub.firstCall.args[1]).to.deep.equals({
        send: 'interpolator/get_params',
        receive: 'interpolator/get_params_reply'
      });
    });
  });

  describe('#getAutozoomStatus', () => {
    let sendReceiveStub;
    let decodeStub;
    beforeEach(() => {
      sendReceiveStub = sinon.stub(api, 'sendAndReceive').resolves({
        payload: {}
      });
      decodeStub = sinon.stub(Api, 'decode').returns('enabled');
    });
    afterEach(() => {
      sendReceiveStub.restore();
      decodeStub.restore();
    });
    it('should query autozoom status with appropriate api message parameters', async () => {
      const status = await api.getAutozoomStatus();
      expect(sendReceiveStub.getCall(0).args[0].compare(Buffer.alloc(0))).to.equals(0);
      expect(sendReceiveStub.getCall(0).args[1]).to.deep.equals({
        send: 'autozoom/status',
        receive: 'autozoom/status_reply'
      });
      expect(status).to.equals('enabled');
    });
  });
});
