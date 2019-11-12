import sinon from 'sinon';
import { expect } from 'chai';
import Detector from './../../src/components/detector';
import IDeviceManager from './../../src/interfaces/iDeviceManager';
import DetectorOpts, { DetectionConvertion } from './../../src//interfaces/IDetectorOpts';
import DefaultLogger from './../../src/utilitis/logger';
import DeviceManagerMock from './../mocks/devicemanager.mock';
import * as msgpack from 'msgpack-lite';
import { isSymbol } from 'util';

const createDummyLogger = (): DefaultLogger => {
  return sinon.createStubInstance(DefaultLogger);
};

describe('Detector', () => {
  let detector: Detector;
  let deviceManager: IDeviceManager;

  beforeEach(() => {
    deviceManager = new DeviceManagerMock();
    detector = new Detector(deviceManager, createDummyLogger());
  });

  describe('#validateOptions', () => {
    it('should update old options with new options', () => {
      expect(detector._options.convertDetections).to.equals(DetectionConvertion.RELATIVE);
      expect(detector._options.DOWS).to.equals(false);
      const newOpts: DetectorOpts = {
        DOWS: true,
        convertDetections: DetectionConvertion.FRAMING,
      };
      detector.validateOptions(newOpts);
      expect(detector._options).to.deep.equals(newOpts);
    });
  });

  describe('#init', () => {
    let transportWriteStub;
    beforeEach(() => {
      transportWriteStub = sinon.stub(deviceManager.transport, 'write');
    });
    afterEach(() => {
      transportWriteStub.restore();
    });

    describe('on detector not initialized', () => {
      it('should set _usePeopleCount to false if there is an issue with checking version with semver', async () => {
        deviceManager.getInfo = () => {
          return Promise.resolve({ version: undefined });
        };
        detector = new Detector(deviceManager, createDummyLogger(), {});
        const setupDetectorSubscriptionSpy = sinon.spy(detector, 'setupDetectorSubscriptions');
        transportWriteStub.resolves();
        await detector.init();
        expect(detector._usePeopleCount).to.equals(false);
      });
      describe('on camera sw version older than one that supports people_count msg', () => {
        beforeEach(() => {
          deviceManager.getInfo = () => {
            return Promise.resolve({ version: '0.0.0' });
          };
        });
        it('should should send detector/start command if camera sw does not support people_count msg if DOWS is not set', async () => {
          detector = new Detector(deviceManager, createDummyLogger(), {});
          transportWriteStub.resolves();
          await detector.init();
          expect(transportWriteStub.getCall(0).args[0]).to.equals('detector/start');
        });
        it('should not send any start msg to camera if DOWS is set', async () => {
          detector = new Detector(deviceManager, createDummyLogger(), { DOWS: true });
          transportWriteStub.resolves();
          await detector.init();
          expect(transportWriteStub.called).to.equals(false);
        });
      });
      describe('on camera sw version new enough to support people_count msg', () => {
        it('should send people_count/start command with !STREAMING_ONLY and setup detection listener if DOWS is not set', async () => {
          detector = new Detector(deviceManager, createDummyLogger(), {});
          const setupDetectorSubscriptionSpy = sinon.spy(detector, 'setupDetectorSubscriptions');
          transportWriteStub.resolves();
          await detector.init();
          expect(transportWriteStub.called).to.equals(true);
          expect(transportWriteStub.getCall(0).args[0]).to.equals('people_count/start');
          expect(setupDetectorSubscriptionSpy.callCount).to.equals(1);
          expect(setupDetectorSubscriptionSpy.getCall(0).args[0]).to.deep.equals({
            detectionListener: true,
            framingListener: false,
          });
          expect(detector._previewStreamStarted).to.equals(true);
          expect(detector._detectorInitialized).to.equals(true);

          // Decode buffer and stringify resulting JSON
          const streamingOnly = JSON.stringify(
            msgpack.decode(transportWriteStub.getCall(0).args[1])
          );
          expect(streamingOnly).to.equals(JSON.stringify({ STREAMING_ONLY: false }));
        });
      });
      it('should send people_count/start command with STREAMING_ONLY and setup detection listener if DOWS is set', async () => {
        detector = new Detector(deviceManager, createDummyLogger(), { DOWS: true });
        const setupDetectorSubscriptionSpy = sinon.spy(detector, 'setupDetectorSubscriptions');
        transportWriteStub.resolves();
        await detector.init();
        expect(transportWriteStub.called).to.equals(true);
        expect(setupDetectorSubscriptionSpy.callCount).to.equals(1);
        expect(setupDetectorSubscriptionSpy.getCall(0).args[0]).to.undefined;
        expect(detector._previewStreamStarted).to.equals(false);
        expect(detector._detectorInitialized).to.equals(true);

        const streamingOnly = JSON.stringify(
          msgpack.decode(transportWriteStub.getCall(0).args[1])
        );
        expect(streamingOnly).to.equals(JSON.stringify({ STREAMING_ONLY: true }));
      });
    });
    describe('on detector initialized', () => {
      it('should not do anthing', async () => {
        detector = new Detector(deviceManager, createDummyLogger(), {});
        const setupDetectorSubscriptionSpy = sinon.spy(detector, 'setupDetectorSubscriptions');
        detector._detectorInitialized = true;
        await detector.init();
        expect(transportWriteStub.called).to.equals(false);
        expect(setupDetectorSubscriptionSpy.called).to.equals(false);
      });
    });
  });

  describe('#updateOpts', () => {
    let teardownStub;
    let initStub;
    const newOpts: DetectorOpts = {
      DOWS: true,
      convertDetections: DetectionConvertion.FRAMING,
    };
    beforeEach(() => {
      teardownStub = sinon.stub(detector, 'teardownDetectorSubscriptions').resolves();
      initStub = sinon.stub(detector, 'init').resolves();
    });
    afterEach(() => {
      teardownStub.restore();
      initStub.restore();
    });

    it('should validate new options', async () => {
      const validateOptionsSpy = sinon.spy(detector, 'validateOptions');
      await detector.updateOpts(newOpts);
      expect(validateOptionsSpy.called).to.equals(true);
      expect(validateOptionsSpy.getCall(0).args[0]).to.deep.equals(newOpts);
    });

    it('should reset detector class with new options', async () => {
      await detector.updateOpts(newOpts);
      expect(teardownStub.called).to.equals(true);
      expect(detector._detectorInitialized).to.equals(false);
      expect(initStub.called).to.equals(true);
    });
  });

  describe('#destroy', () => {
    let transportWriteStub;
    let teardownDetectorSubscriptionSpy;
    beforeEach(() => {
      transportWriteStub = sinon.stub(deviceManager.transport, 'write');
    });
    afterEach(() => {
      transportWriteStub.restore();
    });

    describe('on detector initialized', () => {
      describe('on DOWS not set', () => {
        beforeEach(async () => {
          detector = new Detector(deviceManager, createDummyLogger(), {});
          teardownDetectorSubscriptionSpy = sinon.spy(detector, 'teardownDetectorSubscriptions');
          transportWriteStub.resolves();
          detector._previewStreamStarted = true;
          detector._detectorInitialized = true;
        });
        it('should send people_count/stop command with and teardown detection listener/subscriber', async () => {
          detector._usePeopleCount = true;
          await detector.destroy();
          expect(transportWriteStub.called).to.equals(true);
          expect(transportWriteStub.getCall(0).args[0]).to.equals('people_count/stop');
          expect(teardownDetectorSubscriptionSpy.callCount).to.equals(1);
          expect(teardownDetectorSubscriptionSpy.getCall(0).args[0]).to.deep.equals({
            detectionListener: true,
            framingListener: false,
          });
          expect(detector._previewStreamStarted).to.equals(false);
          expect(detector._detectorInitialized).to.equals(false);
        });
        it('should send detector/stop command if camera does not have the people_count command', async () => {
          detector._usePeopleCount = false;
          await detector.destroy();
          expect(transportWriteStub.getCall(0).args[0]).to.equals('detector/stop');
        });
      });
      describe('on DOWS set', () => {
        it('should teardown detection and framing listeners/subscribers and send people_count/stop', async () => {
          detector = new Detector(deviceManager, createDummyLogger(), { DOWS: true });
          detector._usePeopleCount = true;
          teardownDetectorSubscriptionSpy = sinon.spy(detector, 'teardownDetectorSubscriptions');
          transportWriteStub.resolves();
          detector._detectorInitialized = true;
          await detector.destroy();
          expect(transportWriteStub.called).to.equals(true);
          expect(transportWriteStub.getCall(0).args[0]).to.equals('people_count/stop');
          expect(teardownDetectorSubscriptionSpy.callCount).to.equals(1);
          expect(teardownDetectorSubscriptionSpy.getCall(0).args[0]).to.undefined;
          expect(detector._detectorInitialized).to.equals(false);
        });
        it('should not send a stop command if camera software is older than a given threshold', async () => {
          detector = new Detector(deviceManager, createDummyLogger(), { DOWS: true });
          transportWriteStub.resolves();
          await detector.destroy();
          expect(transportWriteStub.called).to.equals(false);
        });
      });
    });

    describe('on detector not initialized', () => {
      it('should not do anthing', async () => {
        detector = new Detector(deviceManager, createDummyLogger(), {});
        teardownDetectorSubscriptionSpy = sinon.spy(detector, 'teardownDetectorSubscriptions');
        await detector.destroy();
        expect(transportWriteStub.called).to.equals(false);
        expect(teardownDetectorSubscriptionSpy.called).to.equals(false);
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
          expect(detector._subscriptionsSetup).to.equals(true);
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
          expect(detector._subscriptionsSetup).to.equals(true);
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
          expect(detector._subscriptionsSetup).to.equals(false);
        });
      });
    });

    describe('on detection teardown', () => {
      it('should unsubscribe to detection events and remove detection listener', async () => {
        detector._subscriptionsSetup = true;
        await detector.teardownDetectorSubscriptions({
          detectionListener: true,
          framingListener: false,
        });
        expect(transportUnsubscribeStub.getCall(0).args[0]).to.equals('autozoom/predictions');
        expect(transportRemoveListenerStub.getCall(0).args[0]).to.equals('autozoom/predictions');
        expect(transportUnsubscribeStub.callCount).to.equals(1);
        expect(transportRemoveListenerStub.callCount).to.equals(1);
        expect(detector._subscriptionsSetup).to.equals(false);
      });
      it('should unsubscribe to framing events and remove detection listener', async () => {
        detector._subscriptionsSetup = true;
        await detector.teardownDetectorSubscriptions({
          detectionListener: false,
          framingListener: true,
        });
        expect(transportUnsubscribeStub.getCall(0).args[0]).to.equals('autozoom/framing');
        expect(transportRemoveListenerStub.getCall(0).args[0]).to.equals('autozoom/framing');
        expect(transportUnsubscribeStub.callCount).to.equals(1);
        expect(transportRemoveListenerStub.callCount).to.equals(1);
        expect(detector._subscriptionsSetup).to.equals(false);
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
          height: 120,
        },
      },
      {
        label: 'couch',
        bbox: {
          x: 10,
          y: 10,
          width: 60,
          height: 120,
        },
      },
    ];
    beforeEach(() => {
      detector._frame = {
        bbox: {
          x: 0,
          y: 0,
          width: 720,
          height: 405,
        },
      };
    });
    describe('RELATIVE', () => {
      it('should convert bbox coordinates absolute to the selected frame in main stream', () => {
        const newPredictions = detector.convertDetections(predictions, {
          convertDetections: DetectionConvertion.FRAMING,
        });
        expect(newPredictions.length).to.equals(1);
        expect(newPredictions[0].label).to.equals('person');
        expect(newPredictions[0].bbox).to.deep.equals({
          x: 8.88888888888889,
          y: 11.851851851851851,
          width: 53.33333333333333,
          height: 142.22222222222223,
          frameWidth: 640,
          frameHeight: 480,
        });
      });
      it('should detect couch when objectFilter is set to all', () => {
        const newPredictions = detector.convertDetections(predictions, {
          convertDetections: DetectionConvertion.FRAMING,
          objectFilter: [],
        });
        expect(newPredictions.length).to.equals(2);
      });
      it('should detect objects specified by filter', () => {
        const newPredictions = detector.convertDetections(predictions, {
          convertDetections: DetectionConvertion.FRAMING,
          objectFilter: ['person'],
        });
        expect(newPredictions.length).to.equals(1);
      });
    });
    describe('ABSOLUTE', () => {
      it('should convert bbox absolute coordinates to relative (0 to 1 values)', async () => {
        const newPredictions = detector.convertDetections(predictions, {
          convertDetections: DetectionConvertion.RELATIVE,
        });
        expect(newPredictions.length).to.equals(1);
        expect(newPredictions[0].label).to.equals('person');
        expect(newPredictions[0].bbox).to.deep.equals({
          x: 0.015625,
          y: 0.020833333333333332,
          width: 0.09375,
          height: 0.25,
        });
      });
    });
  });
});
