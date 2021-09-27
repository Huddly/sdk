import sinon from 'sinon';
import { expect } from 'chai';
import IpFaceBasedExposureControl from '../../src/components/ipFaceBasedExposureControl';
import IIPDeviceManager from '../../src/interfaces/iIpDeviceManager';
import Logger from './../../src/utilitis/logger';
import DeviceManagerMock from '../mocks/ipdevicemanager.mock';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

describe('IpFaceBasedExposureControl', () => {
  let fbeControl: IpFaceBasedExposureControl;
  let deviceManager: IIPDeviceManager;
  let errorStub, infoStub, isEnabledStub;
  const dummyError = {
    message: 'Error',
  };

  beforeEach(() => {
    deviceManager = new DeviceManagerMock();
    fbeControl = new IpFaceBasedExposureControl(deviceManager);
    errorStub = sinon.stub(Logger, 'error');
    infoStub = sinon.stub(Logger, 'info');
  });

  afterEach(() => {
    errorStub.restore();
    infoStub.restore();
  });

  describe('#init', () => {
    it('should not throw error', () => {
      const initFunc = () => { fbeControl.init(); };
      expect(initFunc).to.not.throw();
    });
  });

  describe('#enable', () => {
    describe('fbe is disabled', () => {
      beforeEach(() => {
        isEnabledStub = sinon.stub(fbeControl, 'isEnabled').resolves(false);
      });
      afterEach(() => {
        isEnabledStub.restore();
      });
      it('should enable without issues and log status', async () => {
        const spy = sinon.spy(deviceManager.grpcClient, 'setCnnFeature');
        await fbeControl.enable();
        const arg = spy.firstCall.args[0];
        expect(arg.getFeature()).to.equal(huddly.Feature.FACEBASEDEXPOSURE);
        expect(arg.getMode()).to.equal(huddly.Mode.START);
        expect(infoStub).to.have.been.calledOnce;
      });
      it('should log error and reject with error message if something happens', async () => {
        sinon.stub(deviceManager.grpcClient, 'setCnnFeature').rejects(dummyError);
        fbeControl.enable().catch(err => {
          expect(errorStub).to.have.been.calledOnce;
          expect(err).to.equal(dummyError.message);
        });
      });
    });
    describe('fbe is enabled', () => {
      beforeEach(() => {
        isEnabledStub = sinon.stub(fbeControl, 'isEnabled').resolves(true);
      });
      afterEach(() => {
        isEnabledStub.restore();
      });
      it('should not do anything', async () => {
        // Having neither Logger.error or Logger.info called
        expect(infoStub).to.have.callCount(0);
        expect(errorStub).to.have.callCount(0);
      });
    });
  });
  describe('#disable', () => {
    describe('fbe is enabled', () => {
      beforeEach(() => {
        isEnabledStub = sinon.stub(fbeControl, 'isEnabled').resolves(true);
      });
      afterEach(() => {
        isEnabledStub.restore();
      });
      it('should enable without issues and log status', async () => {
        const spy = sinon.spy(deviceManager.grpcClient, 'setCnnFeature');
        await fbeControl.disable();
        const arg = spy.firstCall.args[0];
        expect(arg.getFeature()).to.equal(huddly.Feature.FACEBASEDEXPOSURE);
        expect(arg.getMode()).to.equal(huddly.Mode.STOP);
        expect(infoStub).to.have.been.calledOnce;
      });
      it('should log error and reject with error message if something happens', async () => {
        sinon.stub(deviceManager.grpcClient, 'setCnnFeature').rejects(dummyError);
        fbeControl.disable().catch(err => {
          expect(errorStub).to.have.been.calledOnce;
          expect(err).to.equal(dummyError.message);
        });
      });
    });
    describe('fbe is disabled', () => {
      beforeEach(() => {
        isEnabledStub = sinon.stub(fbeControl, 'isEnabled').resolves(false);
      });
      afterEach(() => {
        isEnabledStub.restore();
      });
      it('should not do anything', async () => {
        // Having neither Logger.error or Logger.info called
        expect(infoStub).to.have.callCount(0);
        expect(errorStub).to.have.callCount(0);
      });
    });
  });
});
