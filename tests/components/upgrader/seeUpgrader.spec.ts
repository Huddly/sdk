import chai, { expect } from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import { EventEmitter } from 'events';

import IpBaseDevice from '../../../src/components/device/ipbase';
import SeeUpgrader from '../../../src/components/upgrader/seeUpgrader';

chai.should();
chai.use(sinonChai);

const createDummyManager = () => {
  const dummyManager = sinon.createStubInstance(IpBaseDevice);
  dummyManager.transport = {
    grpcConnectionDeadlineSeconds: () => {},
    close: () => {}
  };
  dummyManager.grpcClient = {
    getDeviceVersion: sinon.stub(),
    upgradeDevice: sinon.stub(),
    upgradeVerify: sinon.stub(),
    reset: sinon.stub()
  };
  dummyManager.wsdDevice = {
    serialNumber: '1245',
    mac: 'FF:FF:FF:FF:FF:FF'
  };
  return dummyManager;
};

const dummyEmitter = new EventEmitter();

describe('SeeUpgrader', () => {
  let upgrader: SeeUpgrader;
  let dummyManager;
  beforeEach(() => {
    dummyManager = createDummyManager();
    upgrader = new SeeUpgrader(dummyManager, dummyEmitter);
  });

  it('should have correct class name', () => {
    expect(upgrader.className).to.equal('SeeUpgrader');
  });
});
