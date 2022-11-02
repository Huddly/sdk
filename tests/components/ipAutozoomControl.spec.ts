import sinon from 'sinon';
import { expect } from 'chai';

import IIPDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IIpDeviceManager';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import IpAutozoomControl from '../../src/components/ipAutozoomControl';
import DeviceManagerMock from '../mocks/ipdevicemanager.mock';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import AutozoomModes from '@huddly/sdk-interfaces/lib/enums/AutozoomModes';
import FramingModes from '@huddly/sdk-interfaces/lib/enums/FramingModes';

describe('IpAutozoomControl', () => {
  let autozoomControl: IpAutozoomControl;
  let deviceManager: IIPDeviceManager;
  let errorStub, warnStub, infoStub, isEnabledStub;
  const dummyError = {
    message: 'Error',
  };

  beforeEach(() => {
    deviceManager = new DeviceManagerMock();
    autozoomControl = new IpAutozoomControl(deviceManager);
    errorStub = sinon.stub(Logger, 'error');
    infoStub = sinon.stub(Logger, 'info');
    warnStub = sinon.stub(Logger, 'warn');
  });

  afterEach(() => {
    errorStub.restore();
    infoStub.restore();
    warnStub.restore();
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
  describe('#setCnnFeature', () => {
    it('should set cnn feature with given params and log status', async () => {
      const spy = sinon.spy(deviceManager.grpcClient, 'setCnnFeature');
      // @ts-ignore
      await autozoomControl._setCnnFeature(huddly.Feature.FACEBASEDEXPOSURE, huddly.Mode.STOP);
      const arg = spy.firstCall.args[0];
      console.log(arg);
      expect(arg.getFeature()).to.equal(huddly.Feature.FACEBASEDEXPOSURE);
      expect(arg.getMode()).to.equal(huddly.Mode.STOP);
      expect(infoStub).to.have.been.calledOnce;
    });
    it('should log error and reject with error message if something happens', async () => {
      sinon.stub(deviceManager.grpcClient, 'setCnnFeature').rejects(dummyError);
      autozoomControl.enable().catch((err) => {
        expect(errorStub).to.have.been.calledOnce;
        expect(err).to.equal(dummyError.message);
      });
    });
  });
  describe('#enable', () => {
    let setCnnFeatureStub;
    beforeEach(() => {
      setCnnFeatureStub = sinon.stub(autozoomControl, '_setCnnFeature');
    });
    afterEach(() => {
      setCnnFeatureStub.restore();
    });
    describe('autozoom is disabled', () => {
      beforeEach(() => {
        isEnabledStub = sinon.stub(autozoomControl, 'isEnabled').resolves(false);
      });
      afterEach(() => {
        isEnabledStub.restore();
      });
      it('should setCnnFeature with appropriate cnn feature', async () => {
        await autozoomControl.enable();
        expect(setCnnFeatureStub).to.have.been.calledWith(
          huddly.Feature.AUTOZOOM,
          huddly.Mode.START
        );
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
        await autozoomControl.enable();
        expect(setCnnFeatureStub).to.have.callCount(0);
      });
    });
  });
  describe('#disable', () => {
    let setCnnFeatureStub;
    beforeEach(() => {
      setCnnFeatureStub = sinon.stub(autozoomControl, '_setCnnFeature');
    });
    afterEach(() => {
      setCnnFeatureStub.restore();
    });
    describe('autozoom is disabled', () => {
      beforeEach(() => {
        isEnabledStub = sinon.stub(autozoomControl, 'isEnabled').resolves(true);
      });
      afterEach(() => {
        isEnabledStub.restore();
      });
      it('should setCnnFeature with appropriate cnn feature', async () => {
        await autozoomControl.disable();
        expect(setCnnFeatureStub).to.have.been.calledWith(
          huddly.Feature.AUTOZOOM,
          huddly.Mode.STOP
        );
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
        await autozoomControl.disable();
        expect(setCnnFeatureStub).to.have.callCount(0);
      });
    });
  });

  describe('#start', () => {
    it('should not throw error', () => {
      const startFunc = () => {
        autozoomControl.start();
      };
      expect(startFunc).to.not.throw();
    });
  });
  describe('#stop', () => {
    it('should not throw error', () => {
      const stopFunc = () => {
        autozoomControl.stop();
      };
      expect(stopFunc).to.not.throw();
    });
  });

  describe('#setFramingMode', () => {
    let setCnnFeatureStub;
    beforeEach(() => {
      setCnnFeatureStub = sinon.stub(autozoomControl, '_setCnnFeature');
    });
    afterEach(() => {
      setCnnFeatureStub.restore();
    });
    it('should reject with an error if not using supported mode', async () => {
      let error;
      try {
        // @ts-ignore
        await autozoomControl.setFramingMode(FramingModes.GALLERY_VIEW);
      } catch (err) {
        error = err;
      }
      expect(error).to.be.instanceof(Error);
    });

    it('should set appropriate cnn feature for autozoom', async () => {
      await autozoomControl.setFramingMode(FramingModes.NORMAL);
      expect(setCnnFeatureStub).to.be.calledWith(huddly.Feature.AUTOZOOM, huddly.Mode.START);
    });
    it('should set appropriate cnn feature for speaker framing', async () => {
      await autozoomControl.setFramingMode(FramingModes.SPEAKER_FRAMING);
      expect(setCnnFeatureStub).to.be.calledWith(huddly.Feature.SPEAKERFRAMING, huddly.Mode.START);
    });
    it('should set cnn feature mode STOP for all supported features if given the OFF param', async () => {
      await autozoomControl.setFramingMode(FramingModes.OFF);
      expect(setCnnFeatureStub.getCall(0)).to.be.calledWith(
        huddly.Feature.AUTOZOOM,
        huddly.Mode.STOP
      );
      expect(setCnnFeatureStub.getCall(1)).to.be.calledWith(
        huddly.Feature.SPEAKERFRAMING,
        huddly.Mode.STOP
      );
    });
  });
});
