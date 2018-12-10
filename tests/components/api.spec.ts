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
          expect(e).to.equals('Data lenght is not 4, unable to proceed!');
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
          expect(e).to.equals('Error log transfer timed out');
          expect(transport.removeAllListeners.callCount).to.equals(1);
          expect(transport.removeAllListeners.getCall(0).args[0]).to.equals('async_file_transfer/timeout');
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

  describe('#getProductionInfo', () => {
    let asyncFileTransferStub;
    beforeEach(() => { asyncFileTransferStub = sinon.stub(api, 'asyncFileTransfer'); });
    afterEach(() => { asyncFileTransferStub.restore(); });

    it('should call #asyncFileTransfer with prodinfo commands and decode result', async () => {
      asyncFileTransferStub.returns(Promise.resolve(msgpack.encode('Production Info: Test')));
      const prodinfo = await api.getProductInfo();
      expect(asyncFileTransferStub.callCount).to.equals(1);
      expect(asyncFileTransferStub.firstCall.args[0]).to.deep.equals({ send: 'prodinfo/get', receive: 'prodinfo/get_status' });
      expect(prodinfo).to.equals('Production Info: Test');
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
    it('should call #getProdinfo and #getUptime and merge the result into an object', async () => {
      prodInfoStub.returns(Promise.resolve({ app_version: 'HuddlyIQ-123' }));
      uptimeStub.returns(Promise.resolve(123.456789));
      const cameraInfo = await api.getCameraInfo();
      expect(prodInfoStub.callCount).to.equals(1);
      expect(uptimeStub.callCount).to.equals(1);
      expect(cameraInfo).to.deep.equals({
        softwareVersion: 'HuddlyIQ-123',
        uptime: 123.46
      });
    });
  });

  describe('#errorLog', () => {
    let fileTransferStub;
    beforeEach(() => { fileTransferStub = sinon.stub(api, 'fileTransfer'); });
    afterEach(() => { fileTransferStub.restore(); });
    describe('#getErrorLog', () => {
      it('should call #fileTransfer with error log commands and decode the result to ascii string', async () => {
        const logStr = 'Camera Log 12333123';
        fileTransferStub.returns(Promise.resolve(Buffer.from(logStr)));
        const log = await api.getErrorLog();
        expect(fileTransferStub.callCount).to.equals(1);
        expect(transport.write.firstCall.args[0]).to.equals('error_logger/read');
        expect(log).to.equals(logStr);
      });
    });
    describe('#eraseErrorLog', () => {
      it('should call #fileTransfer with commands to erase error log', async () => {
        const getErrorLogSpy = sinon.spy(api, 'getErrorLog');
        fileTransferStub.returns(Promise.resolve(Buffer.alloc(0)));
        transport.receiveMessage.resolves();
        await api.eraseErrorLog();
        expect(transport.receiveMessage.lastCall.args[0]).to.equals('error_logger/erase_done');
        expect(transport.write.lastCall.args[0]).to.equals('error_logger/erase');
        expect(getErrorLogSpy.callCount).to.equals(1);
      });
    });
  });
});
