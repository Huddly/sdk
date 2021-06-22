import IIpDeviceManager from './../../src/interfaces/iDeviceManager';
import { CNNStatus, CnnFeature } from '@huddly/camera-proto/lib/api/huddly_pb';
import DeviceManagerMock from './devicemanager.mock';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

const statusDummy = new huddly.DeviceStatus();
statusDummy.setMessage('status');

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
  };
  getCnnFeatureStatus(cnnFeature: CnnFeature): Promise<CNNStatus> {
    return Promise.resolve(new CNNStatus());
  }
}
