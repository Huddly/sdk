import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import See from './../../../src/components/device/see';
import IGrpcTransport from '@huddly/sdk-interfaces/lib/interfaces/IGrpcTransport';
import { EventEmitter } from 'stream';
import { HuddlyServiceClient } from '@huddly/camera-proto/lib/api/huddly_grpc_pb';

chai.should();
chai.use(sinonChai);

class DummyTransport extends EventEmitter implements IGrpcTransport {
  device: any;
  grpcConnectionDeadlineSeconds: number;
  grpcClient: any;
  overrideGrpcClient(client: HuddlyServiceClient): void {
    // Ignore call
  }
  init(): Promise < void> {
    throw new Error('Method not implemented.');
  }
  close(): Promise < void> {
    return Promise.resolve();
  }
}

describe('See', () => {
  it('should have correct product name', () => {
    const see = new See({}, new DummyTransport(), new EventEmitter());
    expect(see.productName).to.equal('Huddly S1');
  });
});