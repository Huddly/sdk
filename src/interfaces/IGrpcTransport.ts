import ITransport from './iTransport';
import { HuddlyServiceClient } from './../proto/huddly_grpc_pb';

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
}
