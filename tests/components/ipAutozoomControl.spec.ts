import sinon from 'sinon';
import { expect } from 'chai';

import IIPDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IIpDeviceManager';

import IpAutozoomControl from '../../src/components/ipAutozoomControl';
import Logger from './../../src/utilitis/logger';
import DeviceManagerMock from '../mocks/ipdevicemanager.mock';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

describe('IpAutozoomControl', () => {
  let autozoomControl: IpAutozoomControl;
  let deviceManager: IIPDeviceManager;
  let errorStub, infoStub, isEnabledStub;
  const dummyError = {
    message: 'Error',
  };

  beforeEach(() => {
    deviceManager = new DeviceManagerMock();
    autozoomControl = new IpAutozoomControl(deviceManager);
    errorStub = sinon.stub(Logger, 'error');
    infoStub = sinon.stub(Logger, 'info');
  });

  afterEach(() => {
    errorStub.restore();
    infoStub.restore();
  });

  describe('#init', () => {
    it('should await for the autozoom status to be returned', async () => {
      await autozoomControl.init();
      expect(infoStub).to.have.been.calledOnce;
    });
    it('should log an error if something happens', async () => {
      sinon.stub(deviceManager, 'getCnnFeatureStatus').rejects('error');
      await autozoomControl.init();
      expect(errorStub).to.have.been.calledOnce;
    });
  });
  describe('#enable', () => {
    describe('autozoom is disabled', () => {
      beforeEach(() => {
        isEnabledStub = sinon.stub(autozoomControl, 'isEnabled').resolves(false);
      });
      afterEach(() => {
        isEnabledStub.restore();
      });
      it('should enable without issues and log status', async () => {
        const spy = sinon.spy(deviceManager.grpcClient, 'setCnnFeature');
        await autozoomControl.enable();
        const arg = spy.firstCall.args[0];
        expect(arg.getFeature()).to.equal(huddly.Feature.AUTOZOOM);
        expect(arg.getMode()).to.equal(huddly.Mode.START);
        expect(infoStub).to.have.been.calledOnce;
      });
      it('should log error and reject with error message if something happens', async () => {
        sinon.stub(deviceManager.grpcClient, 'setCnnFeature').rejects(dummyError);
        autozoomControl.enable().catch(err => {
          expect(errorStub).to.have.been.calledOnce;
          expect(err).to.equal(dummyError.message);
        });
      });
    });
    describe('autozoom is enabled', () => {
      beforeEach(() => {
        isEnabledStub = sinon.stub(autozoomControl, 'isEnabled').resolves(true);
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
    describe('autozoom is enabled', () => {
      beforeEach(() => {
        isEnabledStub = sinon.stub(autozoomControl, 'isEnabled').resolves(true);
      });
      afterEach(() => {
        isEnabledStub.restore();
      });
      it('should enable without issues and log status', async () => {
        const spy = sinon.spy(deviceManager.grpcClient, 'setCnnFeature');
        await autozoomControl.disable();
        const arg = spy.firstCall.args[0];
        expect(arg.getFeature()).to.equal(huddly.Feature.AUTOZOOM);
        expect(arg.getMode()).to.equal(huddly.Mode.STOP);
        expect(infoStub).to.have.been.calledOnce;
      });
      it('should log error and reject with error message if something happens', async () => {
        sinon.stub(deviceManager.grpcClient, 'setCnnFeature').rejects(dummyError);
        autozoomControl.disable().catch(err => {
          expect(errorStub).to.have.been.calledOnce;
          expect(err).to.equal(dummyError.message);
        });
      });
    });
    describe('autozoom is disabled', () => {
      beforeEach(() => {
        isEnabledStub = sinon.stub(autozoomControl, 'isEnabled').resolves(false);
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

  describe('#start', () => {
    it('should not throw error', () => {
      const startFunc = () => { autozoomControl.start(); };
      expect(startFunc).to.not.throw();
    });
  });
  describe('#stop', () => {
    it('should not throw error', () => {
      const stopFunc = () => { autozoomControl.stop(); };
      expect(stopFunc).to.not.throw();
    });
  });
});
