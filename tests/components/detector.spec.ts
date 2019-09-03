import sinon from 'sinon';
import { expect } from 'chai';
import Detector from './../../src/components/detector';
import IDeviceManager from './../../src/interfaces/iDeviceManager';
import { DetectionConvertion } from './../../src//interfaces/IDetectorOpts';
import DefaultLogger from './../../src/utilitis/logger';
import DeviceManagerMock from './../mocks/devicemanager.mock';

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

  describe('#init', () => {
    let transportWriteStub;
    beforeEach(() => {
      transportWriteStub = sinon.stub(deviceManager.transport, 'write');
    });
    afterEach(() => {
      transportWriteStub.restore();
    });

    describe('on configDetectionsOnSubstream set', () => {
      it('should send detector/start command and setup detection listener only', async () => {
        detector = new Detector(deviceManager, createDummyLogger(), { configDetectionsOnSubstream: true });
        const setupDetectorSubscriptionSpy = sinon.spy(detector, 'setupDetectorSubscriptions');
        transportWriteStub.resolves();
        await detector.init();
        expect(transportWriteStub.called).to.equals(true);
        expect(transportWriteStub.getCall(0).args[0]).to.equals('detector/start');
        expect(setupDetectorSubscriptionSpy.callCount).to.equals(1);
        expect(setupDetectorSubscriptionSpy.getCall(0).args[0]).to.deep.equals({
          detectionListener: true,
          framingListener: false,
        });
        expect(detector._detectionsOnSubstreamStarted).to.equals(true);
      });
    });

    describe('on configDetectionsOnSubstream unset', () => {
      it('should only setup event listeners for detection and framing data', async () => {
        detector = new Detector(deviceManager, createDummyLogger(), {});
        const setupDetectorSubscriptionSpy = sinon.spy(detector, 'setupDetectorSubscriptions');
        await detector.init();
        expect(setupDetectorSubscriptionSpy.callCount).to.equals(1);
        expect(setupDetectorSubscriptionSpy.getCall(0).args[0]).to.undefined;
        expect(detector._detectionsOnSubstreamStarted).to.equals(false);
      });
    });
  });

  describe('#destroy', () => {
    let transportWriteStub;
    beforeEach(() => {
      transportWriteStub = sinon.stub(deviceManager.transport, 'write');
    });
    afterEach(() => {
      transportWriteStub.restore();
    });

    describe('on configDetectionsOnSubstream set', () => {
      it('should send detector/stop command and teardown detection listener/subscriber', async () => {
        detector = new Detector(deviceManager, createDummyLogger(), { configDetectionsOnSubstream: true });
        const teardownDetectorSubscriptionSpy = sinon.spy(detector, 'teardownDetectorSubscriptions');
        transportWriteStub.resolves();
        detector._detectionsOnSubstreamStarted = true;
        await detector.destroy();
        expect(transportWriteStub.called).to.equals(true);
        expect(transportWriteStub.getCall(0).args[0]).to.equals('detector/stop');
        expect(teardownDetectorSubscriptionSpy.callCount).to.equals(1);
        expect(teardownDetectorSubscriptionSpy.getCall(0).args[0]).to.deep.equals({
          detectionListener: true,
          framingListener: false,
        });
        expect(detector._detectionsOnSubstreamStarted).to.equals(false);
      });
    });
    describe('on configDetectionsOnSubstream unset', () => {
      it('should only teardown detection and framing listeners/subscribers', async () => {
        detector._detectionsOnSubstreamStarted = true;
        detector = new Detector(deviceManager, createDummyLogger(), {});
        const teardownDetectorSubscriptionSpy = sinon.spy(detector, 'teardownDetectorSubscriptions');
        await detector.destroy();
        expect(teardownDetectorSubscriptionSpy.callCount).to.equals(1);
        expect(teardownDetectorSubscriptionSpy.getCall(0).args[0]).to.undefined;
        expect(detector._detectionsOnSubstreamStarted).to.equals(false);
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
        const newPredictions = detector.convertDetections(predictions, { convertDetections: DetectionConvertion.FRAMING });
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
        const newPredictions = detector.convertDetections(predictions, { convertDetections: DetectionConvertion.RELATIVE });
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
});
