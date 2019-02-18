import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import DeviceFactory from './../../../src/components/device/factory';
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
  let boxfish;
  beforeEach(async () => {
    const dummyIQDevice = {
      deviceDescriptor: {
        idProduct: 0x21
      }
    };
    const dummyDeviceApis = createNewDummyDeviceApis();
    const discoveryEmitter = sinon.createStubInstance(EventEmitter);
    const dummyTransport = sinon.createStubInstance(EventEmitter);
    dummyTransport.init = () => {};
    dummyTransport.initEventLoop = () => {};
    const preferredDevice = dummyDeviceApis[0];
    preferredDevice.getValidatedTransport.resolves(dummyTransport);
    boxfish = await DeviceFactory.getDevice(
      dummyIQDevice.deviceDescriptor.idProduct,
      undefined,
      preferredDevice,
      dummyDeviceApis,
      dummyIQDevice,
      discoveryEmitter,
      false);
  });
  describe.only('#initalize', () => {
    beforeEach(() => {
      boxfish.transport.on.callsArg(1);
      sinon.stub(boxfish, 'getInfo').resolves({
        version: '0.0.0'
      });
    });
    afterEach(() => {
      boxfish.getInfo.restore();
    });
    it('should throw an error if the camera sw is not compatible with sdk', async () => {
      boxfish.getInfo.resolves({
        version: '0.0.0'
      });
      try {
        await boxfish.initialize();
        expect(false).to.be.equal('Should have throw error');
      } catch (e) {
        expect(e).to.be.equal('Unsupported Device SW, the sw on this camera needs to be upated');
      }
    });

    it('should not throw an error if the camera sw is compatible with sdk', async () => {
      boxfish.getInfo.resolves({
        version: '1.2.5'
      });
      return boxfish.initialize();
    });
  });
});
