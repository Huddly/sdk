import sinon from 'sinon';
import chaiAsPromised from 'chai-as-promised';
import chai, { expect } from 'chai';

chai.use(chaiAsPromised);

import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import AutozoomModes from '@huddly/sdk-interfaces/lib/enums/AutozoomModes';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import AutozoomControl from '../../src/components/autozoomControl';
import Api from '../../src/components/api';
import DeviceManagerMock from '../mocks/devicemanager.mock';
import FramingModes from '@huddly/sdk-interfaces/lib/enums/FramingModes';

describe('AutozoomControl', () => {
  let autozoomControl: AutozoomControl;
  let deviceManager: IDeviceManager;
  let infoStub;

  beforeEach(() => {
    deviceManager = new DeviceManagerMock();
    autozoomControl = new AutozoomControl(deviceManager);
    infoStub = sinon.stub(Logger, 'info');
  });

  afterEach(() => {
    infoStub.restore();
  });

  describe('Constructor', () => {
    it('should set options', () => {
      const opts: AutozoomControlOpts = {
        mode: AutozoomModes.NORMAL,
        shouldAutoFrame: false,
      };
      autozoomControl = new AutozoomControl(deviceManager, opts);
      expect(autozoomControl._options).to.deep.equal(opts);
    });

    it('should throw expection when passing invalid mode', () => {
      const opts: AutozoomControlOpts = {
        // @ts-ignore
        mode: 'test12343',
        shouldAutoFrame: false,
      };
      const badFn = () => new AutozoomControl(deviceManager, opts);
      expect(badFn).to.throw(
        'The following mode is not supported on autozoom controller: test12343'
      );
    });
    it('should throw expection when passing undefined mode', () => {
      const opts: AutozoomControlOpts = {
        mode: undefined,
        shouldAutoFrame: false,
      };
      const badFn = () => new AutozoomControl(deviceManager, opts);
      expect(badFn).to.throw(
        'The following mode is not supported on autozoom controller: undefined'
      );
    });
    it('should throw expection when passing null mode', () => {
      const opts: AutozoomControlOpts = {
        // tslint:disable-next-line
        mode: null,
        shouldAutoFrame: false,
      };
      const badFn = () => new AutozoomControl(deviceManager, opts);
      expect(badFn).to.throw('The following mode is not supported on autozoom controller: null');
    });

    it('should throw exception for bad combination of opts', () => {
      const opts: AutozoomControlOpts = {
        mode: AutozoomModes.PLAZA,
        shouldAutoFrame: false,
      };
      const badFn = () => new AutozoomControl(deviceManager, opts);
      expect(badFn).to.throw(
        "AutozoomMode 'plaza' does not support option 'shouldAutoFrame' set to false!"
      );
    });
  });

  describe('#init', () => {
    let uploadFramingConfigStub;
    let getAutozoomStatusStub;

    beforeEach(() => {
      uploadFramingConfigStub = sinon.stub(AutozoomControl.prototype, 'uploadFramingConfig');
      getAutozoomStatusStub = sinon.stub(deviceManager.api, 'getAutozoomStatus').resolves({});
    });
    afterEach(() => {
      uploadFramingConfigStub.restore();
      getAutozoomStatusStub.restore();
    });

    describe('on shouldAutoFrame option set', () => {
      describe('on shouldAutoFrame: true', () => {
        it('should set AUTO_PTZ framing config to true', async () => {
          autozoomControl = new AutozoomControl(deviceManager, { shouldAutoFrame: true });
          await autozoomControl.init();
          expect(uploadFramingConfigStub.callCount).to.equals(1);
          expect(uploadFramingConfigStub.firstCall.args[0]).to.deep.equals({ AUTO_PTZ: true });
        });
      });
      describe('on shouldAutoFrame: false', () => {
        it('should set AUTO_PTZ framing config to false', async () => {
          autozoomControl = new AutozoomControl(deviceManager, { shouldAutoFrame: false });
          await autozoomControl.init();
          expect(uploadFramingConfigStub.callCount).to.equals(1);
          expect(uploadFramingConfigStub.firstCall.args[0]).to.deep.equals({ AUTO_PTZ: false });
        });
      });
    });
  });

  describe('#updateOpts', () => {
    describe('on changes to `shouldAutoFrame`', () => {
      it('should update old opts with new opts and call init to reconfigure autozoom', () => {
        const newOpts = {
          shouldAutoFrame: false,
        };
        const initSpy = sinon.spy(autozoomControl, 'init');
        autozoomControl.updateOpts(newOpts);
        expect(autozoomControl._options).to.deep.equals({
          shouldAutoFrame: false,
          mode: AutozoomModes.NORMAL,
        });
        expect(initSpy.called).to.equals(true);
      });
    });
    describe('on `shouldAutoFrame` set, but not changed', () => {
      it('should not call init to reconfigure autozoom', async () => {
        const newOpts = {
          shouldAutoFrame: true,
        };
        const initSpy = sinon.spy(autozoomControl, 'init');
        autozoomControl.updateOpts(newOpts);
        expect(initSpy.called).to.equals(false);
      });
    });
    describe('on `shouldAutoFrame` not set', () => {
      it('should not call init to reconfigure autozoom', async () => {
        const newOpts = {};
        const initSpy = sinon.spy(autozoomControl, 'init');
        autozoomControl.updateOpts(newOpts);
        expect(initSpy.called).to.equals(false);
      });
    });

    describe('on changes to `autozoomMode`', () => {
      let getAutozoomStatusStub;

      beforeEach(() => {
        getAutozoomStatusStub = sinon.stub(deviceManager.api, 'getAutozoomStatus').resolves({});
      });
      afterEach(() => {
        getAutozoomStatusStub.restore();
      });

      describe('on target set-mode successfully', () => {
        it('should update this._options', async () => {
          autozoomControl = new AutozoomControl(deviceManager, { mode: AutozoomModes.NORMAL });
          const newOpts = {
            mode: AutozoomModes.PLAZA,
          };
          const stub = sinon.stub(deviceManager.api, 'sendAndReceiveMessagePack');
          stub.resolves({ 'autozoom-mode': 'plaza' });
          await autozoomControl.updateOpts(newOpts);
          expect(autozoomControl._options.mode).to.equals(AutozoomModes.PLAZA);
          expect(
            stub.calledWith(
              { mode: AutozoomModes.PLAZA },
              {
                send: 'autozoom/set-mode',
                receive: 'autozoom/set-mode_reply',
              }
            )
          );
        });
      });
      describe('on target set-mode failure', () => {
        it('should not update this._options and return reject', async () => {
          autozoomControl = new AutozoomControl(deviceManager, { mode: AutozoomModes.NORMAL });
          const newOpts = {
            mode: AutozoomModes.PLAZA,
          };
          const stub = sinon.stub(deviceManager.api, 'sendAndReceiveMessagePack');
          stub.rejects();
          const spy = sinon.spy(autozoomControl, 'updateOpts');
          try {
            await autozoomControl.updateOpts(newOpts);
          } catch {
            // pass
          }
          expect(spy.threw());
          expect(autozoomControl._options.mode).to.equal(AutozoomModes.NORMAL);
        });
      });
    });
    describe('on `autozoomMode` set, but not changed', () => {
      it('should not send a request to change autozoomMode on the camera', async () => {
        autozoomControl = new AutozoomControl(deviceManager, { mode: AutozoomModes.NORMAL });
        const newOpts = {
          mode: AutozoomModes.NORMAL,
        };
        const spy = sinon.spy(deviceManager.api, 'sendAndReceiveMessagePack');
        await autozoomControl.updateOpts(newOpts);
        expect(autozoomControl._options.mode).to.equals(AutozoomModes.NORMAL);
        expect(spy.called).to.equal(false);
      });
    });
    describe('Invalid Options', () => {
      it('should throw expection when passing invalid mode', () => {
        const opts: AutozoomControlOpts = {
          // @ts-ignore
          mode: 'test12343',
          shouldAutoFrame: false,
        };
        return expect(autozoomControl.updateOpts(opts)).to.be.rejectedWith(
          Error,
          'The following mode is not supported on autozoom controller: test12343'
        );
      });
      it('should throw expection when passing undefined mode', () => {
        const opts: AutozoomControlOpts = {
          mode: undefined,
          shouldAutoFrame: false,
        };
        return expect(autozoomControl.updateOpts(opts)).to.be.rejectedWith(
          Error,
          'The following mode is not supported on autozoom controller: undefined'
        );
      });
      it('should throw expection when passing null mode', () => {
        const opts: AutozoomControlOpts = {
          // tslint:disable-next-line
          mode: null,
          shouldAutoFrame: false,
        };
        return expect(autozoomControl.updateOpts(opts)).to.be.rejectedWith(
          Error,
          'The following mode is not supported on autozoom controller: null'
        );
      });
      it('should throw exception for bad combination of opts', () => {
        const opts: AutozoomControlOpts = {
          mode: AutozoomModes.PLAZA,
          shouldAutoFrame: false,
        };
        return expect(autozoomControl.updateOpts(opts)).to.be.rejectedWith(
          Error,
          "AutozoomMode 'plaza' does not support option 'shouldAutoFrame' set to false!"
        );
      });
      it('should throw exception for undefined|null shouldAutoFrame option', () => {
        const opts: AutozoomControlOpts = {
          shouldAutoFrame: undefined,
        };
        return expect(autozoomControl.updateOpts(opts)).to.be.rejectedWith(
          Error,
          "'shouldAutoFrame' cannot not be set to undefined"
        );
      });
    });
  });

  describe('autozoom enable/disable', () => {
    let sendAndReceiveStub;
    let isEnabledStub;

    beforeEach(() => {
      sendAndReceiveStub = sinon.stub(deviceManager.api, 'sendAndReceive');
      isEnabledStub = sinon.stub(autozoomControl, 'isEnabled');
    });
    afterEach(() => {
      sendAndReceiveStub.restore();
      isEnabledStub.restore();
    });

    describe('#enable', () => {
      it('should enable autozoom and check the autozoom active state', async () => {
        sendAndReceiveStub.resolves();
        isEnabledStub.resolves(true);
        await autozoomControl.enable(10);
        expect(sendAndReceiveStub.getCall(0).args[1]).to.deep.equals({
          send: 'autozoom/enable',
          receive: 'autozoom/enable_reply',
        });
      });

      it('should resolve after first retry', async () => {
        sendAndReceiveStub.resolves();
        isEnabledStub.onCall(0).resolves(false);
        isEnabledStub.onCall(1).resolves(true);
        await autozoomControl.enable(10);
        expect(isEnabledStub.callCount).to.equals(2);
      });

      it('should resolve after second', async () => {
        sendAndReceiveStub.resolves();
        isEnabledStub.onCall(0).resolves(false);
        isEnabledStub.onCall(1).resolves(false);
        isEnabledStub.onCall(2).resolves(true);
        await autozoomControl.enable(10);
        expect(isEnabledStub.callCount).to.equals(3);
      });

      it('should throw error when all retries result disabled state', async () => {
        sendAndReceiveStub.resolves();
        isEnabledStub
          .onFirstCall()
          .resolves(false)
          .onSecondCall()
          .resolves(false)
          .onThirdCall()
          .resolves(false);
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
        sendAndReceiveStub.resolves();
        isEnabledStub.resolves(false);
        await autozoomControl.disable(10);
        expect(sendAndReceiveStub.getCall(0).args[1]).to.deep.equals({
          send: 'autozoom/disable',
          receive: 'autozoom/disable_reply',
        });
        expect(isEnabledStub.callCount).to.equals(1);
      });

      it('should resolve after first retry', async () => {
        sendAndReceiveStub.resolves();
        isEnabledStub.onCall(0).resolves(true);
        isEnabledStub.onCall(1).resolves(false);
        await autozoomControl.disable(10);
        expect(isEnabledStub.callCount).to.equals(2);
      });

      it('should resolve after second', async () => {
        sendAndReceiveStub.resolves();
        isEnabledStub.onCall(0).resolves(true);
        isEnabledStub.onCall(1).resolves(true);
        isEnabledStub.onCall(2).resolves(false);
        await autozoomControl.disable(10);
        expect(isEnabledStub.callCount).to.equals(3);
      });

      it('should throw error when all retries result in enabled state', async () => {
        sendAndReceiveStub.resolves();
        isEnabledStub
          .onFirstCall()
          .resolves(true)
          .onSecondCall()
          .resolves(true)
          .onThirdCall()
          .resolves(true);
        try {
          await autozoomControl.disable();
        } catch (e) {
          expect(e instanceof Error).to.equal(true);
          return;
        }
        throw new Error('Autozoom not off after disable.');
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
        autozoom_enabled: false,
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
            receive: 'autozoom/start_reply',
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
            receive: 'autozoom/stop_reply',
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
          'network-configured': false,
        });
      });
      it('should call appropriate api message for blob upload', async () => {
        await autozoomControl.uploadBlob(Buffer.from(''));
        expect(sendReceiveStub.getCall(0).args[0].compare(Buffer.from(''))).to.equals(0);
        expect(sendReceiveStub.getCall(0).args[1]).to.deep.equals({
          send: 'network-blob',
          receive: 'network-blob_reply',
        });
        expect(sendReceiveStub.getCall(0).args[2]).to.equals(60000);
      });
    });
    describe('on network configured', () => {
      beforeEach(() => {
        autozoomStatusStub.resolves({
          'network-configured': true,
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
          receive: 'detector/config_reply',
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
  describe('#_setMode', () => {
    let autoozoomStatusStub, sendReceiveStub;
    beforeEach(() => {
      autoozoomStatusStub = sinon
        .stub(autozoomControl._deviceManager.api, 'getAutozoomStatus')
        .resolves({ 'autozoom-mode': AutozoomModes.NORMAL });
      sendReceiveStub = sinon.stub(deviceManager.api, 'sendAndReceiveMessagePack');
    });
    afterEach(() => {
      autoozoomStatusStub.restore();
      sendReceiveStub.restore();
    });
    describe('attempting to set already running mode', () => {
      it('should log info and return without changing mode', async () => {
        // @ts-ignore
        const returnMode = await autozoomControl._setMode(AutozoomModes.NORMAL);
        expect(infoStub).to.have.been.calledOnce;
        expect(returnMode).to.equal(AutozoomModes.NORMAL);
        expect(sendReceiveStub).to.have.callCount(0);
      });
    });
    describe('setting new mode on camera', () => {
      let enableStub;
      beforeEach(() => {
        enableStub = sinon.stub(autozoomControl, 'enable');
      });
      afterEach(() => {
        enableStub.restore();
      });
      it('should throw error if response from camera is not the new mode', async () => {
        const newMode = AutozoomModes.PLAZA;
        sendReceiveStub.resolves({ 'autozoom-mode': AutozoomModes.NORMAL });
        let error;
        try {
          // @ts-ignore
          await autozoomControl._setMode(newMode);
        } catch (err) {
          error = err;
        }
        expect(error).instanceof(Error);
      });
      it('should set and return new mode if successful', async () => {
        const newMode = AutozoomModes.PLAZA;
        sendReceiveStub.resolves({ 'autozoom-mode': AutozoomModes.PLAZA });
        // @ts-ignore
        const response = await autozoomControl._setMode(newMode);
        expect(response).to.equal(newMode);
      });
      it('should by default not enable autozoom even if it is not active', async () => {
        const newMode = AutozoomModes.PLAZA;
        sendReceiveStub.resolves({ 'autozoom-mode': AutozoomModes.PLAZA, 'autozoom-active': false });
        // @ts-ignore
        await autozoomControl._setMode(newMode);
        expect(enableStub).to.have.callCount(0);
      });
      it('should enable autozoom if enable is true and az is not active', async () => {
        const newMode = AutozoomModes.PLAZA;
        sendReceiveStub.resolves({ 'autozoom-mode': AutozoomModes.PLAZA, 'autozoom-active': false });
        // @ts-ignore
        await autozoomControl._setMode(newMode, true);
        expect(enableStub).to.have.callCount(1);
      });
    });
  });
  describe('#setFramingMode', () => {
    let _setModeStub, disableStub;

    beforeEach(() => {
      _setModeStub = sinon.stub(autozoomControl, '_setMode');
      disableStub = sinon.stub(autozoomControl, 'disable');
    });
    afterEach(() => {
      _setModeStub.restore();
      disableStub.restore();
    });
    it('should disable autozoom if autozoomMode is OFF', () => {
      autozoomControl.setFramingMode(FramingModes.OFF);
      expect(disableStub).to.have.callCount(1);
    });
    it('should _setMode with appropriate autozoomMode', () => {
      autozoomControl.setFramingMode(FramingModes.GALLERY_VIEW);
      expect(_setModeStub).to.have.been.calledWith(AutozoomModes.PLAZA);
    });
  });
});
