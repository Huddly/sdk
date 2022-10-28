import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import HuddlySdk from '../src';
import { EventEmitter } from 'events';

import IHuddlyDeviceAPI from '@huddly/sdk-interfaces/lib/interfaces/IHuddlyDeviceAPI';
import IUVCControlAPI from '@huddly/sdk-interfaces/lib/interfaces/IUVCControlApi';
import ITransport from '@huddly/sdk-interfaces/lib/interfaces/ITransport';
import IDeviceDiscovery from '@huddly/sdk-interfaces/lib/interfaces/IDeviceDiscovery';

import Boxfish from '../src/components/device/boxfish';
import HuddlyGo from '../src/components/device/huddlygo';
import DeviceFactory from '../src/components/device/factory';
import ServiceFactory from '../src/components/service/factory';
import DiscoveryApiMock from './mocks/discoveryApi.mock';
import HuddlyHex from '@huddly/sdk-interfaces/lib/enums/HuddlyHex';


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

    it('should setup hotplug events for all device discovery api', () => {
      nodeusbDeviceApi.registerForHotplugEvents.returns({});
      const sdk = new HuddlySdk([nodeusbDeviceApi, nodeusbDeviceApi], [nodeusbDeviceApi]);
      expect(nodeusbDeviceApi.registerForHotplugEvents.callCount).to.equals(2);
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
    const deviceSerial = '123456';
    const dummyGO = {
      productId: 0x11,
      serialNumber: deviceSerial
    };
    const dummyIQ = {
      productId: 0x21,
      serialNumber: deviceSerial
    };
    const dummyBase = {
      productId: 0xBA5E,
      serialNumber: '1241234541234'
    };

    let huddlygoInitStub;
    let boxfishInitStub;
    let discoveryEmitter;
    let otherEmitter;
    let hidInterfaceStub;

    const initSdk = (targetSerial = undefined) => {
      new HuddlySdk(nodeusbDeviceApi, [nodeusbDeviceApi], { emitter: otherEmitter, apiDiscoveryEmitter: discoveryEmitter, serial: targetSerial });
    };

    beforeEach(() => {
      huddlygoInitStub = sinon.stub(HuddlyGo.prototype, 'initialize').resolves();
      boxfishInitStub = sinon.stub(Boxfish.prototype, 'initialize').resolves();
      hidInterfaceStub = sinon.stub(DeviceFactory, 'getHIDInterface').resolves();
      discoveryEmitter = new EventEmitter();
      otherEmitter = new EventEmitter();
    });
    afterEach(() => {
      huddlygoInitStub.restore();
      boxfishInitStub.restore();
      hidInterfaceStub.restore();

    });

    it('should emit ATTACH event with Boxfish instance when attached device is boxfish', (done) => {
      initSdk();
      otherEmitter.on('ATTACH', (d) => {
        expect(d).to.be.instanceof(Boxfish);
        expect(d.serialNumber).to.equals(deviceSerial);
        done();
      });
      discoveryEmitter.emit('ATTACH', dummyIQ);
    });
    it('should emit ATTACH event with Boxfish instance when attached device is boxfish and targetSerial match', (done) => {
      const dummyTargetSerial = deviceSerial;
      initSdk(dummyTargetSerial);
      otherEmitter.on('ATTACH', (d) => {
        expect(d).to.be.instanceof(Boxfish);
        expect(d.serialNumber).to.equals(dummyTargetSerial);
        done();
      });
      discoveryEmitter.emit('ATTACH', dummyIQ);
    });

    it('should not emit ATTACH event when device api emits attach with serialNumber not matching targetSerial', (done) => {
      const dummyTargetSerial = 'nonMatchSerial';
      initSdk(dummyTargetSerial);
      const attachSpy = sinon.spy();
      otherEmitter.on('ATTACH', attachSpy);
      discoveryEmitter.emit('ATTACH', dummyIQ);

      setTimeout(() => {
        expect(attachSpy.callCount).to.equals(0);
        done();
      }
      , 50);
    });

    it('should emit ATTACH event with empty targetSerial', (done) => {
      const dummyTargetSerial = '';
      initSdk(dummyTargetSerial);
      otherEmitter.on('ATTACH', (d) => {
        expect(d).to.be.instanceof(Boxfish);
        done();
      });
      discoveryEmitter.emit('ATTACH', dummyIQ);
    });


    it('should emit ATTACH event with HuddlyGo instance when attached device is go', (done) => {
      initSdk();
      otherEmitter.on('ATTACH', (d) => {
        expect(d).to.be.instanceof(HuddlyGo);
        done();
      });
      discoveryEmitter.emit('ATTACH', dummyGO);
    });

    it('should not emit ATTACH event when device api emits attach with undefined device instance', (done) => {
      initSdk();
      const attachSpy = sinon.spy();
      otherEmitter.on('ATTACH', attachSpy);
      discoveryEmitter.emit('ATTACH', undefined);

      setTimeout(() => {
        expect(attachSpy.callCount).to.equals(0);
        done();
      }
      , 50);
    });

    it('should emit DETACH event when device discovery api emits DETACH for a huddly device', (done) => {
      initSdk();
      otherEmitter.on('DETACH', (d) => {
        expect(d).to.deep.equals(dummyIQ);
        done();
      });
      discoveryEmitter.emit('DETACH', dummyIQ);
    });

    it('should not emit DETACH event when device api emits detach with undefined device instance', (done) => {
      initSdk();
      const detachSpy = sinon.spy();
      otherEmitter.on('DETACH', detachSpy);
      discoveryEmitter.emit('DETACH', undefined);

      setTimeout(() => {
        expect(detachSpy.callCount).to.equals(0);
        done();
      }
      , 50);
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
        initSdk();
        otherEmitter.on('ERROR', (e) => {
          expect(e.error).to.be.instanceof(Error);
          done();
        });
        discoveryEmitter.emit('ATTACH', dummyIQ);
      });
      it('should emit error and resolve if BASE is discovered', (done) => {
        initSdk();
        otherEmitter.on('ERROR', (e) => {
          expect(e.error).to.be.instanceof(Error);
          expect(e.error.message).to.equal(`No transport implementation supported for {"productId":47710,"serialNumber":"1241234541234"}`);
          done();
        });
        discoveryEmitter.emit('ATTACH', dummyBase);
      });
    });
    describe('combined', () => {
      it('should should resolve IQ when non supported Huddly device gets discovered first', (done) => {
        initSdk();
        otherEmitter.on('ATTACH', (d) => {
          expect(d).to.be.instanceof(Boxfish);
          expect(d.serialNumber).to.equals(deviceSerial);
          done();
        });
        discoveryEmitter.emit('ATTACH', dummyBase);
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

  describe('#getService', () => {
    let serviceFactoryMock;
    const serviceStub = {
      init: sinon.stub(),
    };
    beforeEach(() => {
      serviceFactoryMock = sinon.stub(ServiceFactory, 'getService').returns(serviceStub);
    });
    afterEach(() => {
      serviceFactoryMock.restore();
    });
    it('should use service factory to create and initialize a huddly service supported for curent os', async () => {
      serviceStub.init.resolves();
      const myService = await HuddlySdk.getService();
      expect(myService).to.deep.equal(serviceStub);
      expect(serviceStub.init.called).to.equal(true);
    });
  });

  describe('#getConnectedCameras', () => {
    let clock, mockDiscoveryApi: DiscoveryApiMock;
    const defaultTimeout = 2000;
    beforeEach(() => {
      clock = sinon.useFakeTimers();
      mockDiscoveryApi = new DiscoveryApiMock();
    });
    afterEach(() => {
      clock.restore();
    });
    it('should return a list of devices that are attached', async () => {
      HuddlySdk.getConnectedCameras([mockDiscoveryApi]).then((cameras) => {
        expect(cameras[0]).to.deep.equal(mockDiscoveryApi.boxfishCamera);
      });
      mockDiscoveryApi.emitBoxfishCamera();
      clock.tick(defaultTimeout);
    });
    it('should return an empty list if no devices are attached', async () => {
      HuddlySdk.getConnectedCameras([mockDiscoveryApi]).then((cameras) => {
        expect(cameras.length).to.equal(0);
      });
      clock.tick(defaultTimeout);
    });
    it('should by default exclude base devices', async () => {
      HuddlySdk.getConnectedCameras([mockDiscoveryApi]).then((cameras) => {
        expect(cameras.length).to.equal(1);
        expect(cameras[0]).to.deep.equal(mockDiscoveryApi.boxfishCamera);
      });
      mockDiscoveryApi.emitBase();
      mockDiscoveryApi.emitBoxfishCamera();
      clock.tick(defaultTimeout);
    });
    it('should exclude based on passed in exclusion argument', async () => {
      HuddlySdk.getConnectedCameras([mockDiscoveryApi], defaultTimeout, [
        HuddlyHex.BOXFISH_PID,
      ]).then((cameras) => {
        expect(cameras.length).to.equal(1);
        expect(cameras[0]).to.deep.equal(mockDiscoveryApi.base);
      });
      mockDiscoveryApi.emitBase();
      mockDiscoveryApi.emitBoxfishCamera();
      clock.tick(defaultTimeout);
    });
  });
});
