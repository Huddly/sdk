import sinon from 'sinon';
import { expect } from 'chai';
import Detector from './../../src/components/detector';
import IDeviceManager from './../../src/interfaces/iDeviceManager';
import IDeviceUpgrader from './../../src/interfaces/IDeviceUpgrader';
import UpgradeOpts from './../../src//interfaces/IUpgradeOpts';
import IDetector from './../../src//interfaces/IDetector';
import DetectorOpts, { DetectionConvertion } from './../../src//interfaces/IDetectorOpts';
import { DiagnosticsMessage } from './../../src//components/diagnosticsMessage';
import DefaultLogger from './../../src/utilitis/logger';
import Api from './../../src/components/api';

class DeviceManager implements IDeviceManager {
  transport: any = {
    write: (msg) => {},
    receiveMessage: (msg, timeout) => {},
    on: (msg, listener) => {},
    removeListener: (msg, listener) => {},
    subscribe: (msg) => {},
    unsubscribe: (msg) => {}
  };
  api: any = {
    sendAndReceive: (buffer, commands, timeout) => {},
    sendAndReceiveMessagePack: (message, commands, timeout) => {},
    getAutozoomStatus: () => {},
    encode: (msg) => {},
    getProductInfo: () => {}
  };
  uvcControlInterface: any;
  logger: any;
  initialize(): Promise<void> { return Promise.resolve(); }
  closeConnection(): Promise<void> { return Promise.resolve(); }
  getInfo(): Promise<void> { return Promise.resolve(); }
  getErrorLog(): Promise<void> { return Promise.resolve(); }
  eraseErrorLog(): Promise<void> { return Promise.resolve(); }
  reboot(mode?: string): Promise<void> { return Promise.resolve(); }
  getUpgrader(): Promise<IDeviceUpgrader> { return Promise.resolve(undefined); }
  upgrade(opts: UpgradeOpts): Promise<any> { return Promise.resolve({}); }
  getDetector(opts: DetectorOpts): IDetector { return undefined; }
  getDiagnostics(): Promise<Array<DiagnosticsMessage>> { return Promise.resolve([]); }
  getState(): Promise<any> { return Promise.resolve(); }
  getPowerUsage(): Promise<any> { return Promise.resolve(); }
  getTemperature(): Promise<any> { return Promise.resolve(); }
}

const createDummyLogger = (): DefaultLogger => {
  return sinon.createStubInstance(DefaultLogger);
};

describe('Detector', () => {
  let detector: Detector;
  let deviceManager: IDeviceManager;

  beforeEach(() => {
    deviceManager = new DeviceManager();
    detector = new Detector(deviceManager, createDummyLogger());
  });

  describe('#init', () => {
    let uploadFramingConfigStub;
    beforeEach(() => {
      uploadFramingConfigStub = sinon.stub(Detector.prototype, 'uploadFramingConfig');
    });
    afterEach(() => {
      uploadFramingConfigStub.restore();
    });

    describe('on shouldAutoFrame option set', () => {
      describe('on shouldAutoFrame: true', () => {
        it('should set AUTO_PTZ framing config to true', async () => {
          detector = new Detector(deviceManager, createDummyLogger(), { shouldAutoFrame: true });
          await detector.init();
          expect(uploadFramingConfigStub.callCount).to.equals(1);
          expect(uploadFramingConfigStub.firstCall.args[0]).to.deep.equals({ AUTO_PTZ: true });
        });
      });
      describe('on shouldAutoFrame: false', () => {
        it('should set AUTO_PTZ framing config to false', async () => {
          detector = new Detector(deviceManager, createDummyLogger(), { shouldAutoFrame: false });
          await detector.init();
          expect(uploadFramingConfigStub.callCount).to.equals(1);
          expect(uploadFramingConfigStub.firstCall.args[0]).to.deep.equals({ AUTO_PTZ: false });
        });
      });
    });

    describe('on shouldAutoFrame option not set', () => {
      it('should not call #uploadFramingConfig when shouldAutoFrame options is not provided', async () => {
        detector = new Detector(deviceManager, createDummyLogger(), { convertDetections: DetectionConvertion.RELATIVE });
        await detector.init();
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
        await detector.enable(10);
        expect(sendAndReceiveStub.getCall(0).args[1]).to.deep.equals({
          send: 'autozoom/enable',
          receive: 'autozoom/enable_reply'
        });
      });

      it('should throw error if autozoom status state is disabled', async () => {
        sendAndReceiveStub.resolves({ 'autozoom-active': false });
        try {
          await detector.enable();
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
        await detector.disable(10);
        expect(sendAndReceiveStub.getCall(0).args[1]).to.deep.equals({
          send: 'autozoom/disable',
          receive: 'autozoom/disable_reply'
        });
      });

      it('should throw error if autozoom status state is enabled', async () => {
        sendAndReceiveStub.resolves({ 'autozoom-active': true });
        try {
          await detector.disable();
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
      const isEnabled = await detector.isEnabled();
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
      isRunningStub = sinon.stub(detector, 'isRunning');
    });
    afterEach(() => {
      sendAndReceiveStub.restore();
      transportWriteStub.restore();
      isRunningStub.restore();
    });

    describe('#start', () => {
      describe('az not running', () => {
        it('should send autozoom/start command and setup subscription listeners', async () => {
          const detectionSubscritionSpy = sinon.spy(detector, 'setupDetectorSubscriptions');
          isRunningStub.resolves(false);
          await detector.start();
          expect(sendAndReceiveStub.getCall(0).args[1]).to.deep.equals({
            send: 'autozoom/start',
            receive: 'autozoom/start_reply'
          });
          expect(sendAndReceiveStub.getCall(0).args[2]).to.equals(3000);
          expect(detectionSubscritionSpy.called).to.equals(true);
          expect(detectionSubscritionSpy.getCall(0).args[0]).to.undefined;
        });
      });
      describe('az already running', () => {
        it('should only setup the subscription listeners', async () => {
          isRunningStub.resolves(true);
          const detectionSubscritionSpy = sinon.spy(detector, 'setupDetectorSubscriptions');
          await detector.start();
          expect(sendAndReceiveStub.called).to.equals(false);
          expect(detectionSubscritionSpy.called).to.equals(true);
        });
      });
    });

    describe('#detectorStart', () => {
      it('should send detector/start command and setup subscription listeners', async () => {
        transportWriteStub.resolves();
        const detectionSubscritionSpy = sinon.spy(detector, 'setupDetectorSubscriptions');
        await detector.detectorStart();
        expect(transportWriteStub.called).to.equals(true);
        expect(transportWriteStub.getCall(0).args[0]).to.equals('detector/start');
        expect(detectionSubscritionSpy.called).to.equals(true);
        expect(detectionSubscritionSpy.getCall(0).args[0]).to.deep.equals({
          detectionListener: true,
          framingListener: false,
        });
      });
    });

    describe('#stop', () => {
      describe('az running', () => {
        it('should send autozoom/stop command and teardown subscription listeners', async () => {
          const detectionTeardownSpy = sinon.spy(detector, 'teardownDetectorSubscriptions');
          isRunningStub.resolves(true);
          await detector.stop();
          expect(sendAndReceiveStub.getCall(0).args[1]).to.deep.equals({
            send: 'autozoom/stop',
            receive: 'autozoom/stop_reply'
          });
          expect(sendAndReceiveStub.getCall(0).args[2]).to.equals(3000);
          expect(detectionTeardownSpy.called).to.equals(true);
          expect(detectionTeardownSpy.getCall(0).args[0]).to.undefined;
        });
      });
      describe('az not running', () => {
        it('should only teardown subscription listeners', async () => {
          const detectionTeardownSpy = sinon.spy(detector, 'teardownDetectorSubscriptions');
          isRunningStub.resolves(false);
          await detector.stop();
          expect(sendAndReceiveStub.called).to.equals(false);
          expect(detectionTeardownSpy.called).to.equals(true);
        });
      });
    });

    describe('#detectorStop', () => {
      it('should send detector/stop command and teardown subscription listeners', async () => {
        transportWriteStub.resolves();
        const detectionTeardownSpy = sinon.spy(detector, 'teardownDetectorSubscriptions');
        await detector.detectorStop();
        expect(transportWriteStub.called).to.equals(true);
        expect(transportWriteStub.getCall(0).args[0]).to.equals('detector/stop');
        expect(detectionTeardownSpy.called).to.equals(true);
        expect(detectionTeardownSpy.getCall(0).args[0]).to.deep.equals({
          detectionListener: true,
          framingListener: false,
        });
      });
    });
  });

  describe('detection/framing subscription listener setup/teardown', () => {
    let transportOnStub;
    let transportSubscribeStub;
    let transportUnsubscribeStub;
    let transportRemoveListenerStub;
    beforeEach(() => {
      transportOnStub = sinon.stub(deviceManager.transport, 'on');
      transportSubscribeStub = sinon.stub(deviceManager.transport, 'subscribe');
      transportUnsubscribeStub = sinon.stub(deviceManager.transport, 'unsubscribe');
      transportRemoveListenerStub = sinon.stub(deviceManager.transport, 'removeListener');
    });
    afterEach(() => {
      transportOnStub.restore();
      transportSubscribeStub.restore();
      transportUnsubscribeStub.restore();
      transportRemoveListenerStub.restore();
    });

    describe('on detection setup', () => {
      describe('on subscription success', () => {
        it('should setup detections event listeners only', async () => {
          await detector.setupDetectorSubscriptions({
            detectionListener: true,
            framingListener: false,
          });
          expect(transportSubscribeStub.getCall(0).args[0]).to.equals('autozoom/predictions');
          expect(transportOnStub.getCall(0).args[0]).to.equals('autozoom/predictions');
          expect(transportSubscribeStub.callCount).to.equals(1);
          expect(transportOnStub.callCount).to.equals(1);
          expect(detector._detectorSubscriptionsSetup).to.equals(true);
        });
        it('should setup framing event listeners only', async () => {
          await detector.setupDetectorSubscriptions({
            detectionListener: false,
            framingListener: true,
          });
          expect(transportSubscribeStub.getCall(0).args[0]).to.equals('autozoom/framing');
          expect(transportOnStub.getCall(0).args[0]).to.equals('autozoom/framing');
          expect(transportSubscribeStub.callCount).to.equals(1);
          expect(transportOnStub.callCount).to.equals(1);
          expect(detector._detectorSubscriptionsSetup).to.equals(true);
        });
      });

      describe('on subscription failure', () => {
        beforeEach(() => {
          transportSubscribeStub.rejects('Something went wrong');
        });
        it('should unsubscribe to detection and framing events', async () => {
          await detector.setupDetectorSubscriptions();
          expect(transportUnsubscribeStub.getCall(0).args[0]).to.equals('autozoom/predictions');
          expect(transportUnsubscribeStub.getCall(1).args[0]).to.equals('autozoom/framing');
          expect(detector._detectorSubscriptionsSetup).to.equals(false);
        });
      });
    });

    describe('on detection teardown', () => {
      it('should unsubscribe to detection events and remove detection listener', async () => {
        detector._detectorSubscriptionsSetup = true;
        await detector.teardownDetectorSubscriptions({
          detectionListener: true,
          framingListener: false,
        });
        expect(transportUnsubscribeStub.getCall(0).args[0]).to.equals('autozoom/predictions');
        expect(transportRemoveListenerStub.getCall(0).args[0]).to.equals('autozoom/predictions');
        expect(transportUnsubscribeStub.callCount).to.equals(1);
        expect(transportRemoveListenerStub.callCount).to.equals(1);
        expect(detector._detectorSubscriptionsSetup).to.equals(false);
      });
      it('should unsubscribe to framing events and remove detection listener', async () => {
        detector._detectorSubscriptionsSetup = true;
        await detector.teardownDetectorSubscriptions({
          detectionListener: false,
          framingListener: true,
        });
        expect(transportUnsubscribeStub.getCall(0).args[0]).to.equals('autozoom/framing');
        expect(transportRemoveListenerStub.getCall(0).args[0]).to.equals('autozoom/framing');
        expect(transportUnsubscribeStub.callCount).to.equals(1);
        expect(transportRemoveListenerStub.callCount).to.equals(1);
        expect(detector._detectorSubscriptionsSetup).to.equals(false);
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
      const isRunning = await detector.isRunning();
      expect(isRunning).to.equals(autozoomStatusRes['autozoom-active']);
    });
  });

  describe('#convertPredictions', () => {
    const predictions = [
      {
        label: 'person',
        bbox: {
          x: 10,
          y: 10,
          width: 60,
          height: 120
        }
      },
      { label: 'couch',
        bbox: {
          x: 10,
          y: 10,
          width: 60,
          height: 120
        }
      }
    ];
    beforeEach(() => {
      detector._frame = {
        bbox: {
          x: 0,
          y: 0,
          width: 720,
          height: 405
        }
      };
    });
    describe('RELATIVE', () => {
      it('should convert bbox coordinates absolute to the selected frame in main stream', () => {
        const newPredictions = detector.convertPredictions(predictions, { convertDetections: DetectionConvertion.FRAMING });
        expect(newPredictions.length).to.equals(1);
        expect(newPredictions[0].label).to.equals('person');
        expect(newPredictions[0].bbox).to.deep.equals({
          x: 8.88888888888889,
          y: 11.851851851851851,
          width: 53.33333333333333,
          height: 142.22222222222223,
          frameWidth: 640,
          frameHeight: 480
        });
      });
      it('should detect couch when objectFilter is set to all', () => {
        const newPredictions = detector.convertPredictions(predictions, {
          convertDetections: DetectionConvertion.FRAMING,
          objectFilter: [],
        });
        expect(newPredictions.length).to.equals(2);
      });
      it('should detect objects specified by filter', () => {
        const newPredictions = detector.convertPredictions(predictions, {
          convertDetections: DetectionConvertion.FRAMING,
          objectFilter: ['person'],
        });
        expect(newPredictions.length).to.equals(1);
      });
    });
    describe('ABSOLUTE', () => {
      it('should convert bbox absolute coordinates to relative (0 to 1 values)', async () => {
        const newPredictions = detector.convertPredictions(predictions, { convertDetections: DetectionConvertion.RELATIVE });
        expect(newPredictions.length).to.equals(1);
        expect(newPredictions[0].label).to.equals('person');
        expect(newPredictions[0].bbox).to.deep.equals({
          x: 0.015625,
          y: 0.020833333333333332,
          width: 0.09375,
          height: 0.25
        });
      });
    });
  });

  describe('#uploadBlob', () => {
    let sendReceiveStub;
    let autozoomStatusStub;
    beforeEach(() => {
      sendReceiveStub = sinon.stub(deviceManager.api, 'sendAndReceive').resolves({ payload: {}});
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
        await detector.uploadBlob(Buffer.from(''));
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
        await detector.uploadBlob(Buffer.from(''));
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
        await detector.setDetectorConfig(JSON.parse('{"hello": "world"}'));
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
        await detector.uploadFramingConfig(config);
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
