import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { EventEmitter } from 'events';

import IHuddlyDeviceAPI from '@huddly/sdk-interfaces/lib/interfaces/IHuddlyDeviceAPI';
import IUVCControlAPI from '@huddly/sdk-interfaces/lib/interfaces/IUVCControlApi';
import ITransport from '@huddly/sdk-interfaces/lib/interfaces/ITransport';
import IDeviceDiscovery from '@huddly/sdk-interfaces/lib/interfaces/IDeviceDiscovery';

import DeviceFactory from './../../../src/components/device/factory';
import Boxfish from './../../../src/components/device/boxfish';
import HuddlyGo from './../../../src/components/device/huddlygo';
import Dwarffish from './../../../src/components/device/dwarffish';
import Clownfish from './../../../src/components/device/clownfish';
import DartFish from './../../../src/components/device/dartfish';
import Ace from './../../../src/components/device/ace';
import See from './../../../src/components/device/see';
import HuddlyHex from '@huddly/sdk-interfaces/lib/enums/HuddlyHex';

chai.should();
chai.use(sinonChai);

const dummyDevice = {
  serial: '123456',
  productName: 'Huddly IQ'
};

class DummyDeviceApi implements IHuddlyDeviceAPI {
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
          dummyDeviceApis[0],
          dummyDeviceApis,
          dummyNonHuddlyDevice,
          discoveryEmitter);
      } catch (e) {
        expect(e.message).to.equal('Unsupported Device. USB ProductId: 1231232');
      }
    });

    describe('Boxfish', () => {
      it(`should initialize boxfish device when product id is ${HuddlyHex.BOXFISH_PID}`, async () => {
        const dummyIQDevice = {
          deviceDescriptor: {
            idProduct: HuddlyHex.BOXFISH_PID
          }
        };
        const deviceManager = await DeviceFactory.getDevice(
          dummyIQDevice.deviceDescriptor.idProduct,
          dummyDeviceApis[0],
          dummyDeviceApis,
          dummyIQDevice,
          discoveryEmitter);
        expect(deviceManager).to.be.instanceof(Boxfish);
      });
    });

    describe('Dwarffish', () => {
      it(`should initialize boxfish device when product id is ${HuddlyHex.DWARFFISH_PID}`, async () => {
        const dummyDwarffishDevice = {
          deviceDescriptor: {
            idProduct: HuddlyHex.DWARFFISH_PID
          }
        };
        const deviceManager = await DeviceFactory.getDevice(
          dummyDwarffishDevice.deviceDescriptor.idProduct,
          dummyDeviceApis[0],
          dummyDeviceApis,
          dummyDwarffishDevice,
          discoveryEmitter);
        expect(deviceManager).to.be.instanceof(Dwarffish);
      });
    });
    describe('Clownfish', () => {
      it(`should initialize clownfish device when product id is ${HuddlyHex.CLOWNFISH_PID}`, async () => {
        const dummyClownfishDevice = {
          deviceDescriptor: {
            idProduct: HuddlyHex.CLOWNFISH_PID
          }
        };
        const deviceManager = await DeviceFactory.getDevice(
          dummyClownfishDevice.deviceDescriptor.idProduct,
          dummyDeviceApis[0],
          dummyDeviceApis,
          dummyClownfishDevice,
          discoveryEmitter);
        expect(deviceManager).to.be.instanceof(Clownfish);
      });
    });

    describe('Dartfish', () => {
      it(`should initialize dartfish/canvas device when product id is ${HuddlyHex.DARTFISH_PID}`, async () => {
        const dummyDartfishDevice = {
          deviceDescriptor: {
            idProduct: HuddlyHex.DARTFISH_PID
          }
        };
        const deviceManager = await DeviceFactory.getDevice(
          dummyDartfishDevice.deviceDescriptor.idProduct,
          dummyDeviceApis[0],
          dummyDeviceApis,
          dummyDartfishDevice,
          discoveryEmitter);
        expect(deviceManager).to.be.instanceof(DartFish);
      });
    });

    describe('Ace', () => {
      it(`should initialize Ace/L1 device when product id is ${HuddlyHex.L1_PID}`, async () => {
        const dummyAceDevice = {
          deviceDescriptor: {
            idProduct: HuddlyHex.L1_PID
          }
        };
        const deviceManager = await DeviceFactory.getDevice(
          dummyAceDevice.deviceDescriptor.idProduct,
          dummyDeviceApis[0],
          dummyDeviceApis,
          dummyAceDevice,
          discoveryEmitter);
        expect(deviceManager).to.be.instanceof(Ace);
      });
    });

    describe('See', () => {
      it(`should initialize See/S1 device when product id is ${HuddlyHex.S1_PID}`, async () => {
        const dummyAceDevice = {
          deviceDescriptor: {
            idProduct: HuddlyHex.S1_PID
          }
        };
        const deviceManager = await DeviceFactory.getDevice(
          dummyAceDevice.deviceDescriptor.idProduct,
          dummyDeviceApis[0],
          dummyDeviceApis,
          dummyAceDevice,
          discoveryEmitter);
        expect(deviceManager).to.be.instanceof(See);
      });
    });

    describe('HuddlyGo', () => {
      it(`should initialize huddlygo device when product id is ${HuddlyHex.GO_PID}`, async () => {
        const dummyGODevice = {
          deviceDescriptor: {
            idProduct: HuddlyHex.GO_PID
          }
        };
        const deviceManager = await DeviceFactory.getDevice(
          dummyGODevice.deviceDescriptor.idProduct,
          dummyDeviceApis[0],
          dummyDeviceApis,
          dummyGODevice,
          discoveryEmitter);
        expect(deviceManager).to.be.instanceof(HuddlyGo);
      });
    });
  });
});
