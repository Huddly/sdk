import sinon from 'sinon';
import { expect } from 'chai';
import AutozoomControl from '../../src/components/autozoomControl';
import IDeviceManager from '../../src/interfaces/iDeviceManager';
import DefaultLogger from '../../src/utilitis/logger';
import Api from '../../src/components/api';
import DeviceManagerMock from '../mocks/devicemanager.mock';

const createDummyLogger = (): DefaultLogger => {
  return sinon.createStubInstance(DefaultLogger);
};

describe('AutozoomControl', () => {
  let autozoomControl: AutozoomControl;
  let deviceManager: IDeviceManager;

  beforeEach(() => {
    deviceManager = new DeviceManagerMock();
    autozoomControl = new AutozoomControl(deviceManager, createDummyLogger());
  });

  describe('#init', () => {
    let uploadFramingConfigStub;
    beforeEach(() => {
      uploadFramingConfigStub = sinon.stub(AutozoomControl.prototype, 'uploadFramingConfig');
    });
    afterEach(() => {
      uploadFramingConfigStub.restore();
    });

    describe('on shouldAutoFrame option set', () => {
      describe('on shouldAutoFrame: true', () => {
        it('should set AUTO_PTZ framing config to true', async () => {
          autozoomControl = new AutozoomControl(deviceManager, createDummyLogger(), { shouldAutoFrame: true });
          await autozoomControl.init();
          expect(uploadFramingConfigStub.callCount).to.equals(1);
          expect(uploadFramingConfigStub.firstCall.args[0]).to.deep.equals({ AUTO_PTZ: true });
        });
      });
      describe('on shouldAutoFrame: false', () => {
        it('should set AUTO_PTZ framing config to false', async () => {
          autozoomControl = new AutozoomControl(deviceManager, createDummyLogger(), { shouldAutoFrame: false });
          await autozoomControl.init();
          expect(uploadFramingConfigStub.callCount).to.equals(1);
          expect(uploadFramingConfigStub.firstCall.args[0]).to.deep.equals({ AUTO_PTZ: false });
        });
      });
    });

    describe('on shouldAutoFrame option not set', () => {
      it('should not call #uploadFramingConfig when shouldAutoFrame options is not provided', async () => {
        autozoomControl = new AutozoomControl(deviceManager, createDummyLogger(), {});
        await autozoomControl.init();
        expect(uploadFramingConfigStub.callCount).to.equals(0);
      });
    });
  });

  describe('autozoom enable/disable', () => {
    let sendAndReceiveStub;

    beforeEach(() => {
      sendAndReceiveStub = sinon.stub(deviceManager.api, 'sendAndReceiveMessagePack');
    });
    afterEach(() => {
      sendAndReceiveStub.restore();
    });

    describe('#enable', () => {
      it('should enable autozoom and check the autozoom active state', async () => {
        sendAndReceiveStub.resolves({ 'autozoom-active': true });
        await autozoomControl.enable(10);
        expect(sendAndReceiveStub.getCall(0).args[1]).to.deep.equals({
          send: 'autozoom/enable',
          receive: 'autozoom/enable_reply'
        });
      });

      it('should throw error if autozoom status state is disabled', async () => {
        sendAndReceiveStub.resolves({ 'autozoom-active': false });
        try {
          await autozoomControl.enable();
        } catch (e) {
          expect(e instanceof Error).to.equal(true);
          return;
        }
        throw new Error('Autozoom enable assert failed!');
      });
    });
    describe('#disable', () => {
      it('should disable autozoom and check the autozoom active state', async () => {
        sendAndReceiveStub.resolves({ 'autozoom-active': false });
        await autozoomControl.disable(10);
        expect(sendAndReceiveStub.getCall(0).args[1]).to.deep.equals({
          send: 'autozoom/disable',
          receive: 'autozoom/disable_reply'
        });
      });

      it('should throw error if autozoom status state is enabled', async () => {
        sendAndReceiveStub.resolves({ 'autozoom-active': true });
        try {
          await autozoomControl.disable();
        } catch (e) {
          expect(e instanceof Error).to.equal(true);
          return;
        }
        throw new Error('Autozoom disable assert failed!');
      });
    });
  });

  describe('#isEnabled', () => {
    let prodInfoStub;
    beforeEach(() => {
      prodInfoStub = sinon.stub(deviceManager.api, 'getProductInfo');
    });
    afterEach(() => {
      prodInfoStub.restore();
    });

    it('should call #getProductInfo function on api class and return autozoom_enabled property', async () => {
      const prodInfoRes = {
        serial: '12344t5o4132',
        name: 'Huddly Camera',
        vendor: 1234,
        autozoom_enabled: false
      };
      prodInfoStub.resolves(prodInfoRes);
      const isEnabled = await autozoomControl.isEnabled();
      expect(isEnabled).to.equals(prodInfoRes.autozoom_enabled);
    });
  });

  describe('autozoom start/stop', () => {
    let sendAndReceiveStub;
    let transportWriteStub;
    let isRunningStub;
    beforeEach(() => {
      sendAndReceiveStub = sinon.stub(deviceManager.api, 'sendAndReceive');
      transportWriteStub = sinon.stub(deviceManager.transport, 'write');
      isRunningStub = sinon.stub(autozoomControl, 'isRunning');
    });
    afterEach(() => {
      sendAndReceiveStub.restore();
      transportWriteStub.restore();
      isRunningStub.restore();
    });

    describe('#start', () => {
      describe('az not running', () => {
        it('should send autozoom/start command', async () => {
          isRunningStub.resolves(false);
          await autozoomControl.start();
          expect(sendAndReceiveStub.getCall(0).args[1]).to.deep.equals({
            send: 'autozoom/start',
            receive: 'autozoom/start_reply'
          });
          expect(sendAndReceiveStub.getCall(0).args[2]).to.equals(3000);
        });
      });
      describe('az already running', () => {
        it('should do nothing', async () => {
          isRunningStub.resolves(true);
          await autozoomControl.start();
          expect(sendAndReceiveStub.called).to.equals(false);
        });
      });
    });

    describe('#stop', () => {
      describe('az running', () => {
        it('should send autozoom/stop command', async () => {
          isRunningStub.resolves(true);
          await autozoomControl.stop();
          expect(sendAndReceiveStub.getCall(0).args[1]).to.deep.equals({
            send: 'autozoom/stop',
            receive: 'autozoom/stop_reply'
          });
          expect(sendAndReceiveStub.getCall(0).args[2]).to.equals(3000);
        });
      });
      describe('az not running', () => {
        it('should do nothing', async () => {
          isRunningStub.resolves(false);
          await autozoomControl.stop();
          expect(sendAndReceiveStub.called).to.equals(false);
        });
      });
    });
  });

  describe('#isRunning', () => {
    let azStatusStub;
    beforeEach(() => {
      azStatusStub = sinon.stub(deviceManager.api, 'getAutozoomStatus');
    });
    afterEach(() => {
      azStatusStub.restore();
    });

    it('should call #getAutozoomStatus on api class and return autozoom-active property', async () => {
      const autozoomStatusRes = {
        time: '130 min',
        'autozoom-active': true,
      };
      azStatusStub.resolves(autozoomStatusRes);
      const isRunning = await autozoomControl.isRunning();
      expect(isRunning).to.equals(autozoomStatusRes['autozoom-active']);
    });
  });

  describe('#uploadBlob', () => {
    let sendReceiveStub;
    let autozoomStatusStub;
    beforeEach(() => {
      sendReceiveStub = sinon.stub(deviceManager.api, 'sendAndReceive').resolves({ payload: {} });
      autozoomStatusStub = sinon.stub(deviceManager.api, 'getAutozoomStatus');
    });
    afterEach(() => {
      sendReceiveStub.restore();
      autozoomStatusStub.restore();
    });
    describe('on network not configured', () => {
      beforeEach(() => {
        autozoomStatusStub.resolves({
          'network-configured': false
        });
      });
      it('should call appropriate api message for blob upload', async () => {
        await autozoomControl.uploadBlob(Buffer.from(''));
        expect(sendReceiveStub.getCall(0).args[0].compare(Buffer.from(''))).to.equals(0);
        expect(sendReceiveStub.getCall(0).args[1]).to.deep.equals({
          send: 'network-blob',
          receive: 'network-blob_reply'
        });
        expect(sendReceiveStub.getCall(0).args[2]).to.equals(60000);
      });
    });
    describe('on network configured', () => {
      beforeEach(() => {
        autozoomStatusStub.resolves({
          'network-configured': true
        });
      });
      it('should do nothing', async () => {
        await autozoomControl.uploadBlob(Buffer.from(''));
        expect(sendReceiveStub.callCount).to.equals(0); // One call for autozoom-status
      });
    });
  });

  describe('set config', () => {
    let sendReceiveStub;
    let encodeStub;
    beforeEach(() => {
      sendReceiveStub = sinon.stub(deviceManager.api, 'sendAndReceive');
      encodeStub = sinon.stub(Api, 'encode').returns('Dummy Config');
    });
    afterEach(() => {
      sendReceiveStub.restore();
      encodeStub.restore();
    });
    describe('#setDetectorConfig', () => {
      it('should call appropriate api message for setting detector config', async () => {
        const config = { hello: 'world' };
        await autozoomControl.setDetectorConfig(JSON.parse('{"hello": "world"}'));
        expect(encodeStub.getCall(0).args[0]).to.deep.equals(config);
        expect(sendReceiveStub.getCall(0).args[0]).to.equals('Dummy Config');
        expect(sendReceiveStub.getCall(0).args[1]).to.deep.equals({
          send: 'detector/config',
          receive: 'detector/config_reply'
        });
        expect(sendReceiveStub.getCall(0).args[2]).to.equals(6000);
      });
    });

    describe('#uploadFramingConfig', () => {
      it('should call appropriate api message for framing config upload', async () => {
        const config = { config: 'dummy' };
        await autozoomControl.uploadFramingConfig(config);
        expect(encodeStub.getCall(0).args[0]).to.deep.equals(config);
        expect(sendReceiveStub.getCall(0).args[0]).to.equals('Dummy Config');
        expect(sendReceiveStub.getCall(0).args[1]).to.deep.equals({
          send: 'autozoom/framer-config',
          receive: 'autozoom/framer-config_reply',
        });
        expect(sendReceiveStub.getCall(0).args[2]).to.equals(60000);
      });
    });
  });
});
