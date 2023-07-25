import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';
import SmartbaseCamera from '../../../src/components/device/smartbaseCamera';
import DummyTransport from '../../mocks/dummyTransport.mock';
import EventEmitter from 'events';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import IpAutozoomControl from '../../../src/components/ipAutozoomControl';
import IpFaceBasedExposureControl from '../../../src/components/ipFaceBasedExposureControl';

chai.should();
chai.use(sinonChai);

const dummyDeviceInstance = {
  productId: 123,
  vendorId: 123,
};

describe('SmartbaseCamera', () => {
  let smartbaseCamera;
  const runIpDeviceInvocationTest = (functionString, withArgs?) => {
    const stub = sinon.stub(smartbaseCamera.ipDevice, functionString);
    if (withArgs) {
      smartbaseCamera[functionString](...withArgs);
      expect(stub).to.have.been.calledWith(...withArgs);
    } else {
      smartbaseCamera[functionString]();
      expect(stub).to.have.callCount(1);
    }
    stub.restore();
  };
  beforeEach(() => {
    smartbaseCamera = new SmartbaseCamera(
      dummyDeviceInstance,
      sinon.createStubInstance(DummyTransport),
      new EventEmitter(),
      'Huddly L1'
    );
  });
  it('should get the given product name', () => {
    expect(smartbaseCamera.productName).to.equal('Huddly L1');
  });

  it('should have the properties of the device instance', () => {
    expect(smartbaseCamera.productId).to.equal(dummyDeviceInstance.productId);
    expect(smartbaseCamera.vendorId).to.equal(dummyDeviceInstance.vendorId);
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
      const getErrorLogStub = sinon.stub(smartbaseCamera.api, 'getErrorLog');
      smartbaseCamera.getErrorLog();
      expect(getErrorLogStub).to.have.callCount(1);
      getErrorLogStub.restore();
    });
  });

  describe('#eraseErrorLog', () => {
    it('should call eraseErrorLog on api ', () => {
      const eraseErrorLogStub = sinon.stub(smartbaseCamera.api, 'eraseErrorLog');
      smartbaseCamera.eraseErrorLog();
      expect(eraseErrorLogStub).to.have.callCount(1);
      eraseErrorLogStub.restore();
    });
  });

  describe('#reboot', () => {
    it('should call reboot through transport.write ', async () => {
      await smartbaseCamera.reboot();
      expect(smartbaseCamera.transport.clear).to.have.been.calledOnce;
      expect(smartbaseCamera.transport.write).to.have.been.calledOnce;
      expect(smartbaseCamera.transport.write).to.have.been.calledWith('camctrl/reboot');
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

  describe('#getAutozoomControl', () => {
    it('should return an instance of IpAutozoomControl', () => {
      const AzControl = smartbaseCamera.getAutozoomControl({});
      expect(AzControl).to.be.instanceOf(IpAutozoomControl);
    });
  });

  describe('#getFaceBasedExposureControl', () => {
    it('should return an instance of IpFaceBasedExposureControl', () => {
      const fbeCtrl = smartbaseCamera.getFaceBasedExposureControl();
      expect(fbeCtrl).to.be.instanceOf(IpFaceBasedExposureControl);
    });
  });

  describe('uvcControlInterface', () => {
    it('is not supported and should thrown an error', () => {
      expect(() => {
        smartbaseCamera.uvcControlInterface;
      }).to.throw();
    });
  });

  describe('closeConnection', () => {
    it('should thrown an error', () => {
      expect(smartbaseCamera.closeConnection).to.throw();
    });
  });

  describe('getPowerUsage', () => {
    it('should thrown an error', () => {
      expect(smartbaseCamera.getPowerUsage).to.throw();
    });
  });

  describe('isAlive', () => {
    it('should thrown an error', () => {
      expect(smartbaseCamera.isAlive).to.throw();
    });
  });

  describe('usbReEnumerate', () => {
    it('should thrown an error', () => {
      expect(smartbaseCamera.usbReEnumerate).to.throw();
    });
  });

  describe('getUpgrader', () => {
    it('should thrown an error', () => {
      expect(smartbaseCamera.getUpgrader).to.throw();
    });
  });

  describe('getDiagnostics', () => {
    it('should thrown an error', () => {
      expect(smartbaseCamera.getDiagnostics).to.throw();
    });
  });

  describe('getLatestFirmwareUrl', () => {
    it('should thrown an error', () => {
      expect(smartbaseCamera.getLatestFirmwareUrl).to.throw();
    });
  });

  describe('getDetector', () => {
    it('should thrown an error', () => {
      expect(smartbaseCamera.getDetector).to.throw();
    });
  });

  describe('getXUControl', () => {
    it('should thrown an error', () => {
      expect(smartbaseCamera.getXUControl).to.throw();
    });
  });

  describe('setXUControl', () => {
    it('should thrown an error', () => {
      expect(smartbaseCamera.setXUControl).to.throw();
    });
  });
  
  describe('addOptionCertificate', () => {
    it('should call addOptionCertificate on the ipDevice with the cert', () => {
      runIpDeviceInvocationTest('addOptionCertificate', ['test']);
    });
  });
});
