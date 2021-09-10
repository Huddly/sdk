import IDeviceManager from './iDeviceManager';
import { HuddlyServiceClient } from '@huddly/camera-proto/lib/api/huddly_grpc_pb';
import { CnnFeature, CNNStatus, DeviceStatus } from '@huddly/camera-proto/lib/api/huddly_pb';

/**
 * Interface used to manage communcation with a IP camera.
 *
 * @ignore
 * @interface IIpDeviceManager
 */
export default interface IIpDeviceManager extends IDeviceManager {
  /**
   *
   * @type {HuddlyServiceClient}
   * @memberof IIpDeviceManager
   */
  grpcClient: HuddlyServiceClient;

  /**
   * Retrieves status off the given cnn feature.
   * @param {CnnFeature} cnnFeature Cnn feature to retrieve the status of.
   * @returns {Promise<CNNStatus>} A CNNStatus object that contains the cnn feature status.
   * @memberof IIpDeviceManager
   */

  getCnnFeatureStatus(cnnFeature: CnnFeature): Promise<CNNStatus>;
}
