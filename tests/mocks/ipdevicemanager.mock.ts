import IIpDeviceManager from './../../src/interfaces/iDeviceManager';
import {
  CNNStatus,
  CnnFeature,
  Detections,
  DeviceStatus,
} from '@huddly/camera-proto/lib/api/huddly_pb';
import DeviceManagerMock from './devicemanager.mock';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

const statusDummy = new huddly.DeviceStatus();
statusDummy.setMessage('status');
const detectionsDummy = new huddly.Detections();

/**
 * @ignore
 *
 * @export
 * @class IpDeviceManagerMock
 * @implements {IIpDeviceManager}
 */
export default class IpDeviceManagerMock extends DeviceManagerMock implements IIpDeviceManager {
  grpcClient: any = {
    setCnnFeature(cnnFeature: CnnFeature, cb: any) {
      cb(undefined, statusDummy);
    },
    getDetections(empty: Empty, cb: any) {
      cb(undefined, detectionsDummy);
    },
  };
  getCnnFeatureStatus(cnnFeature: CnnFeature): Promise<CNNStatus> {
    return Promise.resolve(new CNNStatus());
  }
}
