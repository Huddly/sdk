import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import IGrpcTransport from '@huddly/sdk-interfaces/lib/interfaces/IGrpcTransport';
import { EventEmitter } from 'stream';
import { HuddlyServiceClient } from '@huddly/camera-proto/lib/api/huddly_grpc_pb';

import Ace from './../../../src/components/device/ace';
import AceUpgrader from './../../../src/components/upgrader/aceUpgrader';

chai.should();
chai.use(sinonChai);

class DummyTransport extends EventEmitter implements IGrpcTransport {
  device: any;
  grpcConnectionDeadlineSeconds: number;
  grpcClient: any;
  overrideGrpcClient(client: HuddlyServiceClient): void {
    // Ignore call
  }
  init(): Promise<void> {
    throw new Error('Method not implemented.');
  }
  close(): Promise<void> {
    return Promise.resolve();
  }
}

describe('ACE', () => {
  it('should have correct product name', () => {
    const ace = new Ace({}, new DummyTransport(), new EventEmitter());
    expect(ace.productName).to.equal('Huddly L1');
  });

  describe('#getUpgrader', () => {
    it('should return an instance of the AceUpgrader', async () => {
      const ace = new Ace({}, new DummyTransport(), new EventEmitter());
      const upgrader = await ace.getUpgrader();
      expect(upgrader).to.be.instanceOf(AceUpgrader);
    });
  });
});