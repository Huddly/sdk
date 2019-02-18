import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import DeviceFactory from './../../../src/components/device/factory';
import Boxfish from './../../../src/components/device/boxfish';
import HuddlyGo from './../../../src/components/device/huddlygo';
import IHuddlyDeviceAPI from './../../../src/interfaces/iHuddlyDeviceAPI';
import IUVCControlAPI from './../../../src/interfaces/iUVCControlApi';
import { EventEmitter } from 'events';
import ITransport from './../../../src/interfaces/iTransport';
import IDeviceDiscovery from './../../../src/interfaces/iDeviceDiscovery';

chai.should();
chai.use(sinonChai);

const dummyDevice = {
  serial: '123456',
  productName: 'Huddly IQ'
};

class DummyDeviceApi implements IHuddlyDeviceAPI {
  getCameraInfo(): Promise<any> { return Promise.resolve({ softwareVersion: 'HuddlyIQ-1.2.5' }); }
  isUVCControlsSupported(device: any): Promise<Boolean> { return Promise.resolve(false); }
  getUVCControlAPIForDevice(device: any): Promise<IUVCControlAPI> { return Promise.resolve(device); }
  getValidatedTransport(device: any): Promise<ITransport> { return Promise.resolve(device); }
  registerForHotplugEvents(eventEmitter: EventEmitter): void { }
  getTransport(device: any): Promise<ITransport> { return Promise.resolve(device); }
  getDeviceDiscoveryAPI(): Promise<IDeviceDiscovery> { return Promise.resolve(undefined); }
  isHIDSupported(device: any): Promise<Boolean> { return Promise.resolve(false); }
  getHIDAPIForDevice(device: any): Promise<any> { return Promise.resolve(false); }
  initialize(): void { }
}

const createNewDummyDeviceApis = () => {
  return [
    sinon.createStubInstance(DummyDeviceApi),
    sinon.createStubInstance(DummyDeviceApi)
  ];
};

describe('DeviceFactory', () => {
  let dummyDeviceApis;
  beforeEach(() => {
    dummyDeviceApis = createNewDummyDeviceApis();
  });
  describe('#getTransportImplementation', () => {
    describe('is supported preferred device-api', () => {
      it('should return the transport of the preferred device api', async () => {
        const preferredDeviceApi = dummyDeviceApis[0];
        preferredDeviceApi.getValidatedTransport.resolves({});
        await DeviceFactory.getTransportImplementation(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
        expect(preferredDeviceApi.getValidatedTransport.callCount).to.be.equal(1);
        expect(preferredDeviceApi.getValidatedTransport.firstCall.args[0]).to.deep.equal(dummyDevice);
      });
    });
    describe('not supported for preferred device-api', () => {
      it('should return the transport of the secondary device api', async () => {
        dummyDeviceApis[0].getValidatedTransport.resolves(undefined);
        dummyDeviceApis[1].getValidatedTransport.resolves({});
        await DeviceFactory.getTransportImplementation(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
        expect(dummyDeviceApis[0].getValidatedTransport.callCount).to.be.equal(2);
        expect(dummyDeviceApis[1].getValidatedTransport.callCount).to.be.equal(1);
        expect(dummyDeviceApis[1].getValidatedTransport.firstCall.args[0]).to.deep.equal(dummyDevice);
      });
      it('should throw error when none of device-apis are supported for given device', async () => {
        dummyDeviceApis[0].getValidatedTransport.returns(Promise.resolve(false));
        dummyDeviceApis[1].getValidatedTransport.returns(Promise.resolve(false));
        try {
          await DeviceFactory.getTransportImplementation(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
          expect(true).to.equal(false);
        } catch (e) {
          expect(e.message).to.equal('Unable to find appropriate transport implementation for device: {"serial":"123456","productName":"Huddly IQ"}');
        }
      });
    });
  });

  describe('#getUVCControlInterface', () => {
    describe('is supported preferred device-api', () => {
      it('should return the transport of the preferred device api', async () => {
        const preferredDeviceApi = dummyDeviceApis[0];
        preferredDeviceApi.isUVCControlsSupported.returns(Promise.resolve(true));
        await DeviceFactory.getUVCControlInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
        expect(preferredDeviceApi.getUVCControlAPIForDevice.callCount).to.be.equal(1);
        expect(preferredDeviceApi.getUVCControlAPIForDevice.firstCall.args[0]).to.deep.equal(dummyDevice);
      });
    });
    describe('not supported for preferred device-api', () => {
      it('should return the transport of the secondary device api', async () => {
        dummyDeviceApis[0].isUVCControlsSupported.returns(Promise.resolve(false));
        dummyDeviceApis[1].isUVCControlsSupported.returns(Promise.resolve(true));
        await DeviceFactory.getUVCControlInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
        expect(dummyDeviceApis[0].getUVCControlAPIForDevice.callCount).to.be.equal(0);
        expect(dummyDeviceApis[1].getUVCControlAPIForDevice.callCount).to.be.equal(1);
        expect(dummyDeviceApis[1].getUVCControlAPIForDevice.firstCall.args[0]).to.deep.equal(dummyDevice);
      });
      it('should return undefined when none of the device-apis support uvc controls', async () => {
        dummyDeviceApis[0].isUVCControlsSupported.returns(Promise.resolve(false));
        dummyDeviceApis[1].isUVCControlsSupported.returns(Promise.resolve(false));
        const uvcImplementation = await DeviceFactory.getUVCControlInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
        expect(uvcImplementation).to.be.undefined;
      });
    });
  });

  describe('#getHIDInterface', () => {
    describe('is supported preferred device-api', () => {
      it('should return the transport of the preferred device api', async () => {
        const preferredDeviceApi = dummyDeviceApis[0];
        preferredDeviceApi.isHIDSupported.returns(Promise.resolve(true));
        await DeviceFactory.getHIDInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
        expect(preferredDeviceApi.getHIDAPIForDevice.callCount).to.be.equal(1);
        expect(preferredDeviceApi.getHIDAPIForDevice.firstCall.args[0]).to.deep.equal(dummyDevice);
      });
    });
    describe('not supported for preferred device-api', () => {
      it('should return the transport of the secondary device api', async () => {
        dummyDeviceApis[0].isHIDSupported.returns(Promise.resolve(false));
        dummyDeviceApis[1].isHIDSupported.returns(Promise.resolve(true));
        await DeviceFactory.getHIDInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
        expect(dummyDeviceApis[0].getHIDAPIForDevice.callCount).to.be.equal(0);
        expect(dummyDeviceApis[1].getHIDAPIForDevice.callCount).to.be.equal(1);
        expect(dummyDeviceApis[1].getHIDAPIForDevice.firstCall.args[0]).to.deep.equal(dummyDevice);
      });
      it('should throw error when none of device-apis are supported for given device', async () => {
        dummyDeviceApis[0].isHIDSupported.returns(Promise.resolve(false));
        dummyDeviceApis[1].isHIDSupported.returns(Promise.resolve(false));
        try {
          await DeviceFactory.getHIDInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
          expect(true).to.equal(false);
        } catch (e) {
          expect(e.message).to.equal('Unable to find appropriate HID interface for device: {"serial":"123456","productName":"Huddly IQ"}');
        }
      });
    });
  });

  describe('#getDevice', () => {
    let getTransportImpl;
    let getUvcCtrl;
    let getHidInterface;
    let discoveryEmitter;
    beforeEach(() => {
      getTransportImpl = sinon.stub(DeviceFactory, 'getTransportImplementation');
      getUvcCtrl = sinon.stub(DeviceFactory, 'getUVCControlInterface');
      getHidInterface = sinon.stub(DeviceFactory, 'getHIDInterface').resolves();
      discoveryEmitter = sinon.createStubInstance(EventEmitter);
    });
    afterEach(() => {
      getTransportImpl.restore();
      getUvcCtrl.restore();
      getHidInterface.restore();
    });

    it('should throw error for unknown product ids', async () => {
      const dummyNonHuddlyDevice = {
        deviceDescriptor: {
          idProduct: 1231232
        }
      };
      try {
        getTransportImpl.returns(Promise.resolve());
        getUvcCtrl.returns(Promise.resolve());
        await DeviceFactory.getDevice(
          1231232,
          undefined,
          dummyDeviceApis[0],
          dummyDeviceApis,
          dummyNonHuddlyDevice,
          discoveryEmitter);
      } catch (e) {
        expect(e.message).to.equal('Unsupported Device. USB ProductId: 1231232');
      }
    });

    describe('Boxfish', () => {
      it('should initialize boxfish device when product id is 0x21', async () => {
        const dummyIQDevice = {
          deviceDescriptor: {
            idProduct: 0x21
          }
        };
        const deviceManager = await DeviceFactory.getDevice(
          dummyIQDevice.deviceDescriptor.idProduct,
          undefined,
          dummyDeviceApis[0],
          dummyDeviceApis,
          dummyIQDevice,
          discoveryEmitter,
          false);
        expect(deviceManager).to.be.instanceof(Boxfish);
      });
    });

    describe('HuddlyGo', () => {
      it('should initialize huddlygo device when product id is 0x11', async () => {
        const dummyGODevice = {
          deviceDescriptor: {
            idProduct: 0x11
          }
        };
        const deviceManager = await DeviceFactory.getDevice(
          dummyGODevice.deviceDescriptor.idProduct,
          undefined,
          dummyDeviceApis[0],
          dummyDeviceApis,
          dummyGODevice,
          discoveryEmitter,
          false);
        expect(deviceManager).to.be.instanceof(HuddlyGo);
      });
    });
  });
});
