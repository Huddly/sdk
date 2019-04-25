import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import HuddlySdk from '../src';
import { EventEmitter } from 'events';
import Boxfish from '../src/components/device/boxfish';
import HuddlyGo from '../src/components/device/huddlygo';
import IHuddlyDeviceAPI from '../src/interfaces/iHuddlyDeviceAPI';
import IUVCControlAPI from '../src/interfaces/iUVCControlApi';
import ITransport from '../src/interfaces/iTransport';
import IDeviceDiscovery from '../src/interfaces/iDeviceDiscovery';
import DeviceFactory from '../src/components/device/factory';

chai.should();
chai.use(sinonChai);

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

const createNewNodeUsbApi = () => {
  return sinon.createStubInstance(DummyDeviceApi);
};

describe('HuddlySDK', () => {
  let nodeusbDeviceApi;
  const opts = { eventEmitter: {} };
  beforeEach(() => {
    nodeusbDeviceApi = createNewNodeUsbApi();
    nodeusbDeviceApi.getValidatedTransport.returns(Promise.resolve(true));
    nodeusbDeviceApi.getTransport.returns({});
    nodeusbDeviceApi.isUVCControlsSupported.returns(Promise.resolve(false));
  });

  describe('#constructor', () => {
    it('should set the first deviceapi from list as the main device api', () => {
      const sdk = new HuddlySdk(nodeusbDeviceApi);
      expect(sdk.deviceDiscoveryApi).to.deep.equals(nodeusbDeviceApi);
      expect(sdk.mainDeviceApi).to.deep.equals(nodeusbDeviceApi);
    });

    it('it should initialize the list of device apis', () => {
      const sdk = new HuddlySdk(nodeusbDeviceApi);
      expect(sdk.deviceApis.length).to.equals(1);
    });

    it('should setup hotplug events for the device discovery api', () => {
      nodeusbDeviceApi.registerForHotplugEvents.returns({});
      const sdk = new HuddlySdk(nodeusbDeviceApi);
      expect(nodeusbDeviceApi.registerForHotplugEvents.callCount).to.equals(1);
      expect(nodeusbDeviceApi.registerForHotplugEvents.firstCall.args[0]).to.be.instanceof(EventEmitter);
    });

    it('should throw error if no device apis are provided', () => {
      try {
        new HuddlySdk(undefined);
        expect(true).to.equals(false);
      } catch (e) {
        expect(e.message).to.equals('A default device api should be provided to the sdk!');
      }
    });
  });

  describe('#setupDeviceDiscoveryListeners', () => {
    const dummyGO = {
      productId: 0x11
    };
    const dummyIQ = {
      productId: 0x21
    };
    let huddlygoInitStub;
    let boxfishInitStub;
    let discoveryEmitter;
    let otherEmitter;
    let hidInterfaceStub;
    beforeEach(() => {
      huddlygoInitStub = sinon.stub(HuddlyGo.prototype, 'initialize').resolves();
      boxfishInitStub = sinon.stub(Boxfish.prototype, 'initialize').resolves();
      hidInterfaceStub = sinon.stub(DeviceFactory, 'getHIDInterface').resolves();
      discoveryEmitter = new EventEmitter();
      otherEmitter = new EventEmitter();
      new HuddlySdk(nodeusbDeviceApi, [nodeusbDeviceApi], { emitter: otherEmitter, apiDiscoveryEmitter: discoveryEmitter });
    });
    afterEach(() => {
      huddlygoInitStub.restore();
      boxfishInitStub.restore();
      hidInterfaceStub.restore();
    });

    it('should emit ATTACH event with Boxfish instance when attached device is boxfish', (done) => {
      otherEmitter.on('ATTACH', (d) => {
        expect(d).to.be.instanceof(Boxfish);
        done();
      });
      discoveryEmitter.emit('ATTACH', dummyIQ);
    });
    it('should emit ATTACH event with HuddlyGo instance when attached device is go', (done) => {
      otherEmitter.on('ATTACH', (d) => {
        expect(d).to.be.instanceof(HuddlyGo);
        done();
      });
      discoveryEmitter.emit('ATTACH', dummyGO);
    });
    it('should not emit ATTACH event when device api emits attach with undefined device instance', () => {
      const attachSpy = sinon.spy();
      otherEmitter.on('ATTACH', attachSpy);
      discoveryEmitter.emit('ATTACH', undefined);
      expect(attachSpy.callCount).to.equals(0);
    });
    it('should emit DETACH event when device discovery api emits DETACH for a huddly device', (done) => {
      otherEmitter.on('DETACH', (d) => {
        expect(d).to.deep.equals(dummyIQ);
        done();
      });
      discoveryEmitter.emit('DETACH', dummyIQ);
    });
    it('should not emit DETACH event when device api emits detach with undefined device instance', () => {
      const detachSpy = sinon.spy();
      otherEmitter.on('DETACH', detachSpy);
      discoveryEmitter.emit('DETACH', undefined);
      expect(detachSpy.callCount).to.equals(0);
    });
    describe('on error', () => {
      let getDeviceStub;
      beforeEach(() => {
        getDeviceStub = sinon.stub(DeviceFactory, 'getDevice').rejects(new Error('No transport'));
      });
      afterEach(() => {
        getDeviceStub.restore();
      });

      it('should not emit ERROR if can not get device', (done) => {

        otherEmitter.on('ERROR', (e) => {
          expect(e).to.be.instanceof(Error);
          done();
        });
        discoveryEmitter.emit('ATTACH', dummyIQ);
      });
    });

  });

  describe('#init', () => {
    it('should call initialize on the device discovery api', async () => {
      nodeusbDeviceApi.initialize.resolves();

      const sdk = new HuddlySdk(nodeusbDeviceApi, [nodeusbDeviceApi], {});
      await sdk.init();
      expect(nodeusbDeviceApi.initialize.callCount).to.equals(1);
    });
  });
});
