import sinon from 'sinon';
import { expect } from 'chai';
import IpFaceBasedExposureControl from '../../src/components/ipFaceBasedExposureControl';
import IIPDeviceManager from '../../src/interfaces/iIpDeviceManager';
import Logger from './../../src/utilitis/logger';
import DeviceManagerMock from '../mocks/ipdevicemanager.mock';

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

  describe('#enable', () => {
    describe('fbe is disabled', () => {
      beforeEach(() => {
        isEnabledStub = sinon.stub(fbeControl, 'isEnabled').resolves(false);
      });
      afterEach(() => {
        isEnabledStub.restore();
      });
      it('should enable without issues and log status', async () => {
        await fbeControl.enable();
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
        await fbeControl.disable();
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
