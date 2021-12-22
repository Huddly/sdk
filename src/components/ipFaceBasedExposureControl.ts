import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import IIpDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IIpDeviceManager';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

export default class IpFaceBasedExposureControl implements ICnnControl {
  _deviceManager: IIpDeviceManager;

  constructor(manager: IIpDeviceManager) {
    this._deviceManager = manager;
  }

  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof FaceBasedExposureControl
   */
  init(): Promise<any> {
    return Promise.resolve();
  }

  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof IpFaceBasedExposureControl
   */
  async enable(idleTimeMs: number = 2000): Promise<void> {
    if (!(await this.isEnabled())) {
      // Only stop if az is running
      return new Promise((resolve, reject) => {
        Logger.debug('Enabling Face Based Exposure', IpFaceBasedExposureControl.name);
        const cnnFeature = new huddly.CnnFeature();
        cnnFeature.setFeature(huddly.Feature.FACEBASEDEXPOSURE);
        cnnFeature.setMode(huddly.Mode.START);
        this._deviceManager.grpcClient.setCnnFeature(
          cnnFeature,
          (err, status: huddly.DeviceStatus) => {
            if (err != undefined) {
              Logger.error(
                'Unable to enable Face Based Exposure',
                err.stack ? err.stack : '',
                IpFaceBasedExposureControl.name
              );
              reject(err.message);
              return;
            }
            Logger.info(status.toString());
            resolve();
          }
        );
      });
    }
  }

  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof IpFaceBasedExposureControl
   */
  async disable(idleTimeMs: number = 2000): Promise<void> {
    if (await this.isEnabled()) {
      // Only stop if az is running
      return new Promise((resolve, reject) => {
        Logger.debug('Stopping Face Based Exposure', IpFaceBasedExposureControl.name);
        const cnnFeature = new huddly.CnnFeature();
        cnnFeature.setFeature(huddly.Feature.FACEBASEDEXPOSURE);
        cnnFeature.setMode(huddly.Mode.STOP);
        this._deviceManager.grpcClient.setCnnFeature(
          cnnFeature,
          (err, status: huddly.DeviceStatus) => {
            if (err != undefined) {
              Logger.error(
                'Unable to disable Face Based Exposure',
                err.stack ? err.stack : console.trace(),
                IpFaceBasedExposureControl.name
              );
              reject(err.message);
              return;
            }
            Logger.info(status.toString());
            resolve();
          }
        );
      });
    }
  }

  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof IpFaceBasedExposureControl
   */
  async isEnabled(): Promise<Boolean> {
    const cnnFeature = new huddly.CnnFeature();
    cnnFeature.setFeature(huddly.Feature.FACEBASEDEXPOSURE);
    const azStatus = await this._deviceManager.getCnnFeatureStatus(cnnFeature);
    return azStatus.getFbeStatus().getFbeEnabled();
  }
}
