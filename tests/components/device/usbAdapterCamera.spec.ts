import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import UsbAdapterCamera from '../../../src/components/device/smartbaseCamera';
import DummyTransport from '../../../tests/mocks/dummyTransport.mock';
import EventEmitter from 'events';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

chai.should();
chai.use(sinonChai);

const dummyDeviceInstance = {
  productId: 123,
  vendorId: 123,
};

describe('UsbAdapterCamera', () => {
  let usbAdapterCamera;
  const runIpDeviceInvocationTest = (functionString, withArgs?) => {
    const stub = sinon.stub(usbAdapterCamera.ipDevice, functionString);
    if (withArgs) {
      usbAdapterCamera[functionString](...withArgs);
      expect(stub).to.have.been.calledWith(...withArgs);
    } else {
      usbAdapterCamera[functionString]();
      expect(stub).to.have.callCount(1);
    }
    stub.restore();
  };
  beforeEach(() => {
    usbAdapterCamera = new UsbAdapterCamera(
      dummyDeviceInstance,
      sinon.createStubInstance(DummyTransport),
      new EventEmitter(),
      'Huddly L1'
    );
  });
  it('should get the given product name', () => {
    expect(usbAdapterCamera.productName).to.equal('Huddly L1');
  });

  it('should have the properties of the device instance', () => {
    expect(usbAdapterCamera.productId).to.equal(dummyDeviceInstance.productId);
    expect(usbAdapterCamera.vendorId).to.equal(dummyDeviceInstance.vendorId);
  });

  describe('#getCnnFeatureStatus', () => {
    it('should call getCnnFeatureStatus on ipDevice with given arg', () => {
      runIpDeviceInvocationTest('getCnnFeatureStatus', [new huddly.CnnFeature()]);
    });
  });

  describe('#getInfo', () => {
    it('should call getInfo on ipDevice with given arg', () => {
      runIpDeviceInvocationTest('getInfo');
    });
  });

  describe('#getSettings', () => {
    it('should call getSettings on ipDevice with given arg', () => {
      runIpDeviceInvocationTest('getSettings');
    });
  });

  describe('#getSetting', () => {
    it('should call getSetting on ipDevice with given arg', () => {
      runIpDeviceInvocationTest('getSetting', ['pan']);
    });
  });

  describe('#getErrorLog', () => {
    it('should call getErrorLog on api', () => {
      const getErrorLogStub = sinon.stub(usbAdapterCamera.api, 'getErrorLog');
      usbAdapterCamera.getErrorLog();
      expect(getErrorLogStub).to.have.callCount(1);
      getErrorLogStub.restore();
    });
  });

  describe('#eraseErrorLog', () => {
    it('should call eraseErrorLog on ipDevice ', () => {
      runIpDeviceInvocationTest('eraseErrorLog');
    });
  });

  describe('#reboot', () => {
    it('should call reboot on ipDevice ', () => {
      runIpDeviceInvocationTest('reboot');
    });
  });

  describe('#getState', () => {
    it('should call getState on ipDevice', () => {
      runIpDeviceInvocationTest('getState');
    });
  });

  describe('#getTemperature', () => {
    it('should call getTemperature on ipDevice', () => {
      runIpDeviceInvocationTest('getTemperature');
    });
  });

  describe('#setSettingValue', () => {
    it('should call getState on ipDevice', () => {
      runIpDeviceInvocationTest('setSettingValue', ['pan', 14000]);
    });
  });

  describe('#getPanTilt', () => {
    it('should call getPanTilt on ipDevice', () => {
      runIpDeviceInvocationTest('getPanTilt');
    });
  });

  describe('#setPanTilt', () => {
    it('should call setPanTilt on ipDevice', () => {
      runIpDeviceInvocationTest('setPanTilt', [{ pan: 1000, tilt: 10000 }]);
    });
  });

  describe('#getPanTiltZoom', () => {
    it('should call getPanTiltZoom on ipDevice', () => {
      runIpDeviceInvocationTest('getPanTiltZoom');
    });
  });

  describe('#setPanTiltZoom', () => {
    it('should call setPanTiltZoom on ipDevice', () => {
      runIpDeviceInvocationTest('setPanTiltZoom', [{ pan: 1000, tilt: 10000, zoom: 2000 }]);
    });
  });

  describe('#getSlot', () => {
    it('should call getSlot on ipDevice', () => {
      runIpDeviceInvocationTest('getSlot');
    });
  });

  describe('#uptime', () => {
    it('should call uptime on ipDevice', () => {
      runIpDeviceInvocationTest('uptime');
    });
  });

  describe('#getSupportedSettings', () => {
    it('should call getSupportedSettings on ipDevice', () => {
      runIpDeviceInvocationTest('getSupportedSettings');
    });
  });

  describe('#resetSettings', () => {
    it('should call resetSettings on ipDevice with provided args', () => {
      runIpDeviceInvocationTest('resetSettings', [['pan', 'tilt']]);
    });
  });

  describe('#getOptionCertificates', () => {
    it('should call getOptionCertificates on ipDevice', () => {
      runIpDeviceInvocationTest('getOptionCertificates');
    });
  });

  describe('uvcControlInterface', () => {
    it('is not supported and should thrown an error', () => {
      expect(() => {
        usbAdapterCamera.uvcControlInterface;
      }).to.throw();
    });
  });

  describe('closeConnection', () => {
    it('should thrown an error', () => {
      expect(usbAdapterCamera.closeConnection).to.throw();
    });
  });

  describe('getPowerUsage', () => {
    it('should thrown an error', () => {
      expect(usbAdapterCamera.getPowerUsage).to.throw();
    });
  });

  describe('isAlive', () => {
    it('should thrown an error', () => {
      expect(usbAdapterCamera.isAlive).to.throw();
    });
  });

  describe('usbReEnumerate', () => {
    it('should thrown an error', () => {
      expect(usbAdapterCamera.usbReEnumerate).to.throw();
    });
  });

  describe('getUpgrader', () => {
    it('should thrown an error', () => {
      expect(usbAdapterCamera.getUpgrader).to.throw();
    });
  });

  describe('getFaceBasedExposureControl', () => {
    it('should thrown an error', () => {
      expect(usbAdapterCamera.getFaceBasedExposureControl).to.throw();
    });
  });

  describe('getDiagnostics', () => {
    it('should thrown an error', () => {
      expect(usbAdapterCamera.getDiagnostics).to.throw();
    });
  });

  describe('getLatestFirmwareUrl', () => {
    it('should thrown an error', () => {
      expect(usbAdapterCamera.getLatestFirmwareUrl).to.throw();
    });
  });

  describe('getDetector', () => {
    it('should thrown an error', () => {
      expect(usbAdapterCamera.getDetector).to.throw();
    });
  });

  describe('getXUControl', () => {
    it('should thrown an error', () => {
      expect(usbAdapterCamera.getXUControl).to.throw();
    });
  });

  describe('setXUControl', () => {
    it('should thrown an error', () => {
      expect(usbAdapterCamera.setXUControl).to.throw();
    });
  });
});
