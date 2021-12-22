import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';

import DetectorOpts, { DetectionConvertion } from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import IIPDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IIpDeviceManager';

import IpDetector from '../../src/components/ipDetector';
import DeviceManagerMock from '../mocks/ipdevicemanager.mock';
import CameraEvents from '../../src/utilitis/events';
import Logger from './../../src/utilitis/logger';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

chai.should();
chai.use(sinonChai);

describe('IpDetector', () => {
  let ipDetector: IpDetector;
  let deviceManager: IIPDeviceManager;

  beforeEach(() => {
    deviceManager = new DeviceManagerMock();
  });
  describe('#init', () => {
    let clock;
    let setCnnFeatureSpy;
    beforeEach(() => {
      clock = sinon.useFakeTimers();
      setCnnFeatureSpy = sinon.spy(deviceManager.grpcClient, 'setCnnFeature');
    });
    afterEach(() => {
      clock.restore();
      setCnnFeatureSpy.restore();
      ipDetector.destroy();
    });
    describe('on detector not initialized', () => {
      describe('on grpcServer responding with duplicate detections', () => {
        let getDetectionsStub;
        const detectionsDummy = new huddly.Detections();
        detectionsDummy.setTimestamp(100.0);
        beforeEach(() => {
          getDetectionsStub = sinon
            .stub(deviceManager.grpcClient, 'getDetections')
            .callsArgWith(1, undefined, detectionsDummy);
        });
        afterEach(() => {
          getDetectionsStub.restore();
        });
        it('should not emit stale detections', async () => {
          ipDetector = new IpDetector(deviceManager, {});
          const cb = sinon.spy();
          ipDetector.on(CameraEvents.DETECTIONS, cb);
          await ipDetector.init();
          clock.tick(ipDetector._UPDATE_INTERVAL);
          await clock.next();
          expect(getDetectionsStub.callCount).to.equal(2);
          expect(cb.callCount).to.equal(1);
        });
      });

      describe('on grpcServer responding with invalid detections', () => {
        let getDetectionsStub;
        let warnStub;
        const detectionsDummy = new huddly.Detections();
        // If timestamp < 0 it means that IMX has not received any detections,
        // likely due to detector not being started / AZ not on / camera not streaming
        detectionsDummy.setTimestamp(-1.0);
        beforeEach(() => {
          warnStub = sinon.stub(Logger, 'warn');
          getDetectionsStub = sinon
            .stub(deviceManager.grpcClient, 'getDetections')
            .callsArgWith(1, undefined, detectionsDummy);
        });
        afterEach(() => {
          getDetectionsStub.restore();
          warnStub.restore();
        });
        it('should log a warning', async () => {
          ipDetector = new IpDetector(deviceManager, {});
          await ipDetector.init();
          clock.tick(ipDetector._UPDATE_INTERVAL);
          await clock.next();
          expect(warnStub).to.have.been.called;
        });
        it('should not emit invalid detections', async () => {
          ipDetector = new IpDetector(deviceManager, {});
          const cb = sinon.spy();
          ipDetector.on(CameraEvents.DETECTIONS, cb);
          await ipDetector.init();
          clock.tick(ipDetector._UPDATE_INTERVAL);
          await clock.next();
          expect(getDetectionsStub.callCount).to.equal(2);
          expect(cb.callCount).to.equal(0);
        });
      });

      describe('on grpcServer responding with distinct detections', () => {
        let getDetectionsStub;
        const firstDetectionsDummy = new huddly.Detections();
        firstDetectionsDummy.setTimestamp(100.0);
        const secondDetectionsDummy = new huddly.Detections();
        secondDetectionsDummy.setTimestamp(150.0);
        beforeEach(() => {
          getDetectionsStub = sinon
            .stub(deviceManager.grpcClient, 'getDetections')
            .onFirstCall()
            .callsArgWith(1, undefined, firstDetectionsDummy)
            .onSecondCall()
            .callsArgWith(1, undefined, secondDetectionsDummy);
        });
        afterEach(() => {
          getDetectionsStub.restore();
        });
        it('should emit all distinct detections', async () => {
          ipDetector = new IpDetector(deviceManager, {});
          const cb = sinon.spy();
          ipDetector.on(CameraEvents.DETECTIONS, cb);
          await ipDetector.init();
          clock.tick(ipDetector._UPDATE_INTERVAL);
          await clock.next();
          expect(getDetectionsStub.callCount).to.equal(2);
          expect(cb.callCount).to.equal(2);
        });
      });

      describe('on querying old L1 versions where timestamp is not set', () => {
        let getDetectionsStub;
        const detectionsDummy = new huddly.Detections();
        beforeEach(() => {
          getDetectionsStub = sinon
            .stub(deviceManager.grpcClient, 'getDetections')
            .callsArgWith(1, undefined, detectionsDummy);
        });
        afterEach(() => {
          getDetectionsStub.restore();
        });
        it('should emit all DETECTIONS it receives', async () => {
          ipDetector = new IpDetector(deviceManager, {});
          const cb = sinon.spy();
          ipDetector.on(CameraEvents.DETECTIONS, cb);
          await ipDetector.init();
          clock.tick(ipDetector._UPDATE_INTERVAL * 2);
          await clock.next();
          expect(getDetectionsStub.callCount).to.equals(3);
          expect(cb.callCount).to.equals(3);
        });
      });

      describe('on includeRawDetections is true', () => {
        it('should emit both DETECTIONS and RAWDETECTIONS at initialization', async () => {
          ipDetector = new IpDetector(deviceManager, { includeRawDetections: true });
          const cb = sinon.spy();
          ipDetector.on(CameraEvents.DETECTIONS, cb);
          const rawCb = sinon.spy();
          ipDetector.on(CameraEvents.RAW_DETECTIONS, rawCb);
          await ipDetector.init();
          clock.tick(ipDetector._UPDATE_INTERVAL);
          await clock.next();
          expect(cb.called).to.equal(true);
          expect(rawCb.called).to.equal(true);
        });
      });
      describe('on includeRawDetections is false', () => {
        it('should only emit DETECTIONS', async () => {
          ipDetector = new IpDetector(deviceManager, { includeRawDetections: false });
          const cb = sinon.spy();
          ipDetector.on(CameraEvents.DETECTIONS, cb);
          const rawCb = sinon.spy();
          ipDetector.on(CameraEvents.RAW_DETECTIONS, rawCb);
          await ipDetector.init();
          clock.tick(ipDetector._UPDATE_INTERVAL);
          await clock.next();
          expect(cb.called).to.equal(true);
          expect(rawCb.called).to.equal(false);
        });
      });

      describe('on DOWS not set', () => {
        it('should call setCnnFeature with correct arg', async () => {
          ipDetector = new IpDetector(deviceManager, {});
          await ipDetector.init();
          const arg = setCnnFeatureSpy.firstCall.args[0];
          expect(arg.getFeature()).to.equal(huddly.Feature.DETECTOR);
          expect(arg.getMode()).to.equal(huddly.Mode.START);
        });
        describe('On DOWS set', () => {
          it('should not call setCnnFeature', async () => {
            ipDetector = new IpDetector(deviceManager, { DOWS: true });
            await ipDetector.init();
            expect(setCnnFeatureSpy.called).to.equal(false);
          });
        });
      });
    });
    describe('on detector initialized', () => {
      let setIntervalSpy;
      beforeEach(() => {
        setIntervalSpy = sinon.spy(clock, 'setInterval');
      });
      afterEach(() => {
        setIntervalSpy.restore();
      });
      it('should not do anything', async () => {
        ipDetector = new IpDetector(deviceManager, {});
        ipDetector._detectorInitialized = true;
        await ipDetector.init();
        expect(setIntervalSpy.called).to.be.false;
        expect(setCnnFeatureSpy.called).to.be.false;
      });
    });
  });
  describe('#destroy', () => {
    let clearIntervalSpy;
    let setCnnFeatureSpy;
    beforeEach(() => {
      clearIntervalSpy = sinon.spy(global, 'clearInterval');
      setCnnFeatureSpy = sinon.spy(deviceManager.grpcClient, 'setCnnFeature');
    });
    afterEach(() => {
      clearIntervalSpy.restore();
      setCnnFeatureSpy.restore();
    });

    describe('on detector initialized', () => {
      describe('on DOWS not set', () => {
        it('should invoke clearInterval', async () => {
          ipDetector = new IpDetector(deviceManager, {});
          await ipDetector.init();
          await ipDetector.destroy();
          expect(clearIntervalSpy).to.have.been.calledOnce;
        });
        it('should call setCnnFeature with correct arg', async () => {
          ipDetector = new IpDetector(deviceManager, {});
          await ipDetector.init();
          await ipDetector.destroy();
          const arg = setCnnFeatureSpy.secondCall.args[0];
          expect(arg.getFeature()).to.equal(huddly.Feature.DETECTOR);
          expect(arg.getMode()).to.equal(huddly.Mode.STOP);
        });
      });
      describe('on DOWS set', () => {
        it('should invoke clearInterval', async () => {
          ipDetector = new IpDetector(deviceManager, { DOWS: true });
          await ipDetector.init();
          await ipDetector.destroy();
          expect(clearIntervalSpy).to.have.been.calledOnce;
        });
        it('should not call setCnnFeature', async () => {
          ipDetector = new IpDetector(deviceManager, { DOWS: true });
          await ipDetector.init();
          await ipDetector.destroy();
          expect(setCnnFeatureSpy.called).to.equals(false);
        });
      });
    });
    describe('on detector not initialized', () => {
      it('should not do anything', async () => {
        await ipDetector.destroy();
        expect(clearIntervalSpy.callCount).to.equals(0);
        expect(setCnnFeatureSpy.called).to.equals(false);
      });
    });
  });

  describe('#updateOpts', () => {
    let initStub;
    const newOpts: DetectorOpts = {
      DOWS: true,
      convertDetections: DetectionConvertion.FRAMING,
      includeRawDetections: true,
      objectFilter: ['person'],
    };
    beforeEach(() => {
      initStub = sinon.stub(ipDetector, 'init').resolves();
    });
    afterEach(() => {
      initStub.restore();
      ipDetector.destroy();
    });
    it('should reset detector class with new options', async () => {
      ipDetector = new IpDetector(deviceManager, {});
      await ipDetector.updateOpts(newOpts);
      expect(ipDetector._options).to.deep.equals(newOpts);
    });
  });
});
