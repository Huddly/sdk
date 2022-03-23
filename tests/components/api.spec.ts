import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import chaiAsPromised from 'chai-as-promised';
import * as msgpack from 'msgpack-lite';
import nock from 'nock';

import ITransport from '@huddly/sdk-interfaces/lib/interfaces/ITransport';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';

import Api from './../../src/components/api';
import Locksmith from './../../src/components/locksmith';

chai.should();
chai.use(sinonChai);
chai.use(chaiAsPromised);
chai.use(require('chai-things'));

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

describe('API', () => {
  let transport;
  let api;
  beforeEach(() => {
    transport = createDummyTransport();
    transport.clear.returns(Promise.resolve());
    transport.write.returns(Promise.resolve());
    transport.subscribe.returns(Promise.resolve());
    transport.unsubscribe.returns(Promise.resolve());
    api = new Api(transport, new Locksmith());
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

  describe('#getProductionInfo', () => {
    let sendAndReceiveMsgPackStub;
    beforeEach(() => {
      sendAndReceiveMsgPackStub = sinon.stub(Api.prototype, 'sendAndReceiveMessagePack');
    });
    afterEach(() => {
      sendAndReceiveMsgPackStub.restore();
    });

    it('should fail when msgpack not supported', () => {
      sendAndReceiveMsgPackStub.rejects(new Error('Cant do that!'));
      return expect(api.getProductInfo()).to.eventually.be.rejectedWith('Cant do that!');
    });

    it('should fail when msgpack result is empty', () => {
      sendAndReceiveMsgPackStub.resolves(undefined);
      return expect(api.getProductInfo()).to.eventually.be.rejectedWith('Product info data retreived is empty or undefined!');
    });

    it('should retrieve prodinfo with one messagepack call to target', async () => {
      const prodInfoDummy = {
        appVersion: '1.1.1',
        product: 'Huddly IQ'
      };
      sendAndReceiveMsgPackStub.resolves(prodInfoDummy);
      const prodInfoResult = await api.getProductInfo();
      expect(prodInfoDummy).to.deep.equals(prodInfoResult);
      expect(sendAndReceiveMsgPackStub.firstCall.args[0].compare(Buffer.from(''))).to.equals(0);
      expect(sendAndReceiveMsgPackStub.firstCall.args[1]).to.deep.equals({
        send: 'prodinfo/get_msgpack', receive: 'prodinfo/get_msgpack_reply'
      });
      expect(sendAndReceiveMsgPackStub.firstCall.args[2]).to.equals(1000);
    });
  });

  describe('#setProductInfo', () => {
    let sendAndReceiveStub;
    beforeEach(() => {
      sendAndReceiveStub = sinon.stub(api, 'sendAndReceive');
    });
    afterEach(() => {
      sendAndReceiveStub.restore();
    });

    it('should fail when msgpack not supported', async () => {
      sendAndReceiveStub.rejects(new Error('Cant do that!'));
      const prodinfoSet = { newValue: 'Hello' };
      return expect(api.setProductInfo(prodinfoSet)).to.eventually.be.rejectedWith('Cant do that!');
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
      it('should call corresponding message bus command for fetching log and decode the result to ascii string', async () => {
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
      it('should call corresponding message bus command for erasing log', async () => {
        transport.receiveMessage.resolves();
        await api.eraseErrorLog(100);
        expect(transport.receiveMessage.lastCall.args[0]).to.equals('error_logger/erase_done');
        expect(transport.write.lastCall.args[0]).to.equals('error_logger/erase');
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

  describe('#getLatestFirmwareUrl', () => {
    describe('on 204 status code', () => {
      beforeEach(() => {
        nock('http://huddlyreleaseserver.azurewebsites.net')
        .get('/releases/stable/latest/iq')
        .reply(204);
      });
      it('should reject with NO_UPDATE_AVAILABLE when response status code is 204', () =>
        api.getLatestFirmwareUrl('iq', ReleaseChannel.STABLE)
        .should.be.rejectedWith('There are no available firmware packages for this this channel')
      );
    });
    describe('on request error', () => {
      beforeEach(() => {
        nock('http://huddlyreleaseserver.azurewebsites.net')
        .get('/releases/stable/latest/iq')
        .replyWithError('FAILED');
      });
      it('should reject when the response contains error message', async () => {
        try {
          await api.getLatestFirmwareUrl('iq', ReleaseChannel.STABLE);
          throw new Error('Request should fail, but it passed!');
        } catch (e) {
          expect(e.message).to.be.equal('Request error!\n Error: FAILED');
        }
      });
    });

    describe('on 404 status code', () => {
      beforeEach(() => {
        nock('http://huddlyreleaseserver.azurewebsites.net')
        .get('/releases/stable/latest/iq')
        .reply(404);
      });
      it('should reject with 404', () =>
        api.getLatestFirmwareUrl('iq', ReleaseChannel.STABLE)
        .should.be.rejectedWith('Failed performing a request to Huddly release server!\nStatus Code: 404')
      );
    });

    describe('on non json content type', () => {
      beforeEach(() => {
        nock('http://huddlyreleaseserver.azurewebsites.net')
          .defaultReplyHeaders({
            'Content-Type': 'application/xml',
          })
          .get('/releases/stable/latest/iq')
          .reply(200);
      });
      it('should reject content type error message', () =>
        api.getLatestFirmwareUrl('iq', ReleaseChannel.STABLE)
          .should.be.rejectedWith('Invalid content-type.\nExpected application/json but received application/xml')
      );
    });

    describe('on get IQ firmware url', () => {
      describe('on empty url_hpk key', () => {
        beforeEach(() => {
          nock('http://huddlyreleaseserver.azurewebsites.net')
          .get('/releases/stable/latest/iq')
          .reply(200, { version: '1.1.2' });
        });

        it('should reject when json cant be parsed', async () => {
          try {
            await api.getLatestFirmwareUrl('iq', ReleaseChannel.STABLE);
            throw new Error('Request should fail, but it passed!');
          } catch (e) {
            expect(e.message).to.be.equal('JSON content does not contain \'url_hpk\' key!');
          }
        });
      });

      describe('on valid json body', () => {
        beforeEach(() => {
          nock('http://huddlyreleaseserver.azurewebsites.net')
          .get('/releases/stable/latest/iq')
          .reply(200, { url_hpk: 'test', version: '1.1.2' });
        });

        it('should download the firmware on the given url specified in url_hpk key', async () => {
          const url = await api.getLatestFirmwareUrl('iq', ReleaseChannel.STABLE);
          expect(url).to.equals('test');
        });
      });
    });

    describe('on get GO firmware url', () => {
      beforeEach(() => {
        nock('http://huddlyreleaseserver.azurewebsites.net')
          .get('/releases/stable/latest/go')
          .reply(200, { hpk_url: '123', version: '1.1.2' });
      });

      it('should reject when json body does not contain "url" key', async () => {
        try {
          await api.getLatestFirmwareUrl('go', ReleaseChannel.STABLE);
          throw new Error('Request should fail, but it passed!');
        } catch (e) {
          expect(e.message).to.be.equal('JSON content does not contain \'url\' key!');
        }
      });
    });
  });
});
