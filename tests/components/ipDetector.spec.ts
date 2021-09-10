import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import IpDetector from '../../src/components/ipDetector';
import IIPDeviceManager from '../../src/interfaces/iIpDeviceManager';
import DeviceManagerMock from '../mocks/ipdevicemanager.mock';
import CameraEvents from '../../src/utilitis/events';
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
      describe('on DOWS not set', () => {
        it('should emit DETECTIONS event at initialization and every update interval', async () => {
          ipDetector = new IpDetector(deviceManager, {});
          const cb = sinon.spy();
          ipDetector.on(CameraEvents.DETECTIONS, cb);
          await ipDetector.init();
          clock.tick(ipDetector._UPDATE_INTERVAL * 2);
          await clock.next();
          expect(cb.callCount).to.equals(3);
        });
        it('should call setCnnFeature with correct arg', async () => {
          ipDetector = new IpDetector(deviceManager, {});
          await ipDetector.init();
          const arg = setCnnFeatureSpy.firstCall.args[0];
          expect(arg.getFeature()).to.equal(huddly.Feature.DETECTOR);
          expect(arg.getMode()).to.equal(huddly.Mode.START);
        });
        describe('On DOWS set', () => {
          it('should emit DETECTIONS event at initialization and every update interval', async () => {
            ipDetector = new IpDetector(deviceManager, { DOWS: true });
            const cb = sinon.spy();
            ipDetector.on(CameraEvents.DETECTIONS, cb);
            await ipDetector.init();
            clock.tick(ipDetector._UPDATE_INTERVAL * 2);
            await clock.next();
            expect(cb.callCount).to.equals(3);
          });
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
          const arg = setCnnFeatureSpy.firstCall.args[0];
          expect(arg.getFeature()).to.equal(huddly.Feature.DETECTOR);
          expect(arg.getMode()).to.equal(huddly.Mode.START);
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
});
