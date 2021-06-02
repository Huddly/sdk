import ITransport from './iTransport';
import { HuddlyServiceClient } from './../proto/huddly_grpc_pb';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';
import * as huddly from './../proto/huddly_pb';

/**
 * Interface used to communicate with huddly network devices.
 *
 * @ignore
 * @interface IGrpcTransport
 */
export default interface IGrpcTransport extends ITransport {
  /**
   * TODO
   *
   * @type {number}
   * @memberof IGrpcTransport
   */
  grpcConnectionDeadlineSeconds: number;

  /**
   * TODO
   *
   * @type {HuddlyServiceClient}
   * @memberof IGrpcTransport
   */
  grpcClient: HuddlyServiceClient;

  // Workaround until the google.protobuf.Empty class is same from sdk and device-api-ip
  empty: Empty;

  chunk: huddly.Chunk;
}
