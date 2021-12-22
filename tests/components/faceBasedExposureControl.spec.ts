import sinon from 'sinon';
import { expect } from 'chai';

import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';

import FaceBasedExposureControl from '../../src/components/faceBasedExposureControl';
import DeviceManagerMock from '../mocks/devicemanager.mock';

describe('FaceBasedExposureControl', () => {
  let faceBasedExposureControl: FaceBasedExposureControl;
  let deviceManager: IDeviceManager;

  beforeEach(() => {
    deviceManager = new DeviceManagerMock();
    faceBasedExposureControl = new FaceBasedExposureControl(deviceManager);
  });

  describe('#init', () => {
    it('should not throw error', () => {
      const initFunc = () => { faceBasedExposureControl.init(); };
      expect(initFunc).to.not.throw();
    });
  });

  describe('fbe enable/disable', () => {
    let writeStub;
    let isEnabledStub;

    beforeEach(() => {
      writeStub = sinon.stub(deviceManager.api.transport, 'write');
      isEnabledStub = sinon.stub(faceBasedExposureControl, 'isEnabled');
    });
    afterEach(() => {
      writeStub.restore();
      isEnabledStub.restore();
    });

    describe('#enable', () => {
      it('should enable facebased exposure', async () => {
        writeStub.resolves();
        await faceBasedExposureControl.enable();
        expect(writeStub).to.have.been.calledWith('face-based-exposure/enable');
      });
    });
    describe('#disable', () => {
      it('should disable facebased exposure', async () => {
        writeStub.resolves();
        await faceBasedExposureControl.disable();
        expect(writeStub).to.have.been.calledWith('face-based-exposure/disable');
      });
    });
  });

  describe('#isEnabled', () => {
    let sendAndReceiveStub;
    beforeEach(() => {
      sendAndReceiveStub = sinon.stub(deviceManager.api, 'sendAndReceiveMessagePack');
    });
    afterEach(() => {
      sendAndReceiveStub.restore();
    });

    it('should call face-based-satus return fbe_enabled', async () => {
      sendAndReceiveStub.resolves({
        timestamp: 125186249888,
        'fbe-enabled': true,
        'num-iterations': 0,
        'num-weights-calculated': 0,
        'current-face-weight': 1,
        'per-face-weight': {}
      });
      const isEnabled = await faceBasedExposureControl.isEnabled();
      expect(sendAndReceiveStub).to.have.been.calledWith('', {
        send: 'face-based-exposure/status',
        receive: 'face-based-exposure/status_reply',
      });
      expect(isEnabled).to.equals(true);
    });
  });
});
