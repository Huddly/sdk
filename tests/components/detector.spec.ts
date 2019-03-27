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
    on: (msg, listener) => {},
    removeListener: (msg, listener) => {},
    subscribe: (msg) => {},
    unsubscribe: (msg) => {}
  };
  api: any = {
    sendAndReceive: (buffer, commands, timeout) => {},
    getAutozoomStatus: () => {},
    encode: (msg) => {}
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

  describe('autozoom start/stop', () => {
    let trasnsportWriteStub;
    let transportOnStub;
    let transportSubscribeStub;
    let transportUnsubscribeStub;
    let transportRemoveListenerStub;
    beforeEach(() => {
      trasnsportWriteStub = sinon.stub(deviceManager.transport, 'write');
      transportOnStub = sinon.stub(deviceManager.transport, 'on');
      transportSubscribeStub = sinon.stub(deviceManager.transport, 'subscribe');
      transportUnsubscribeStub = sinon.stub(deviceManager.transport, 'unsubscribe');
      transportRemoveListenerStub = sinon.stub(deviceManager.transport, 'removeListener');
    });
    afterEach(() => {
      trasnsportWriteStub.restore();
      transportOnStub.restore();
      transportSubscribeStub.restore();
      transportUnsubscribeStub.restore();
      transportRemoveListenerStub.restore();
    });
    describe('#start', () => {
      describe('on success', () => {
        it('should call appropriate api messages for enabling autozoom', async () => {
          await detector.start();
          expect(trasnsportWriteStub.getCall(0).args[0]).to.equals('autozoom/enable');
          expect(trasnsportWriteStub.getCall(1).args[0]).to.equals('autozoom/start');
          expect(transportSubscribeStub.getCall(0).args[0]).to.equals('autozoom/predictions');
          expect(transportOnStub.getCall(0).args[0]).to.equals('autozoom/predictions');
          expect(transportSubscribeStub.getCall(1).args[0]).to.equals('autozoom/framing');
          expect(transportOnStub.getCall(1).args[0]).to.equals('autozoom/framing');
        });
      });
      describe('on fail', () => {
        beforeEach(() => {
          transportSubscribeStub.rejects('Something went wrong');
        });
        it('should call appropriate api messages for enabling autozoom', async () => {
          await detector.start();
          expect(transportUnsubscribeStub.getCall(0).args[0]).to.equals('autozoom/predictions');
          expect(transportUnsubscribeStub.getCall(1).args[0]).to.equals('autozoom/framing');
        });
      });
    });
    describe('#stop', () => {
      it('should call appropriate api messages for disabling autozoom', async () => {
        await detector.stop();
        expect(trasnsportWriteStub.getCall(0).args[0]).to.equals('autozoom/disable');
        expect(transportUnsubscribeStub.getCall(0).args[0]).to.equals('autozoom/predictions');
        expect(transportUnsubscribeStub.getCall(1).args[0]).to.equals('autozoom/framing');
        expect(transportRemoveListenerStub.getCall(0).args[0]).to.equals('autozoom/predictions');
        expect(transportRemoveListenerStub.getCall(1).args[0]).to.equals('autozoom/framing');
      });
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
      { label: 'couch'}
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
          x: 7.555555555555555,
          y: 7.555555555555555,
          width: 45.33333333333333,
          height: 90.66666666666666,
          frameWidth: 544,
          frameHeight: 306
        });
      });
    });
    describe('ABSOLUTE', () => {
      it('should convert bbox absolute coordinates to relative (0 to 1 values)', async () => {
        const newPredictions = detector.convertPredictions(predictions, { convertDetections: DetectionConvertion.RELATIVE });
        expect(newPredictions.length).to.equals(1);
        expect(newPredictions[0].label).to.equals('person');
        expect(newPredictions[0].bbox).to.deep.equals({
          x: 0.01838235294117647,
          y: 0.032679738562091505,
          width: 0.11029411764705882,
          height: 0.39215686274509803
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
