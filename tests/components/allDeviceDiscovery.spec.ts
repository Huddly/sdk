import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import { EventEmitter } from 'events';
import AllDeviceDiscovery from '../../src/components/allDeviceDiscovery';
import IHuddlyDeviceAPI from '../../src/interfaces/iHuddlyDeviceAPI';
import IUVCControlAPI from '../../src/interfaces/iUVCControlApi';
import ITransport from '../../src/interfaces/iTransport';
import IDeviceDiscovery from '../../src/interfaces/iDeviceDiscovery';

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

describe('AllDeviceDiscovery', () => {
  let nodeusbDeviceApi;
  beforeEach(() => {
    nodeusbDeviceApi = createNewNodeUsbApi();
    nodeusbDeviceApi.getValidatedTransport.returns(Promise.resolve(true));
    nodeusbDeviceApi.getTransport.returns({});
    nodeusbDeviceApi.isUVCControlsSupported.returns(Promise.resolve(false));
  });

  it('#initalize should call init on all discover apis', () => {
    const dicovery = new AllDeviceDiscovery([nodeusbDeviceApi, nodeusbDeviceApi, nodeusbDeviceApi]);
    dicovery.initialize();
    expect(nodeusbDeviceApi.initialize.callCount).to.equal(3);
  });

  it('should setup hotplug events for all device discovery api', () => {
    nodeusbDeviceApi.registerForHotplugEvents.returns({});
    const emitter = new EventEmitter();
    const dicovery = new AllDeviceDiscovery([nodeusbDeviceApi, nodeusbDeviceApi]);
    dicovery.registerForHotplugEvents(emitter);

    expect(nodeusbDeviceApi.registerForHotplugEvents.callCount).to.equals(2);
    expect(nodeusbDeviceApi.registerForHotplugEvents.firstCall.args[0]).to.be.equal(emitter);
  });
});
