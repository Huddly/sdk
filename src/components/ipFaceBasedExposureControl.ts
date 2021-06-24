import ICnnControl from '../interfaces/ICnnControl';
import IIpDeviceManager from '../interfaces/iIpDeviceManager';
import Logger from '../utilitis/logger';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

export default class IpAutozoomControl implements ICnnControl {
  _deviceManager: IIpDeviceManager;

  constructor(manager: IIpDeviceManager) {
    this._deviceManager = manager;
  }
  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof IpAutozoomControl
   */
  async enable(idleTimeMs: number = 2000): Promise<void> {
    if (!(await this.isEnabled())) {
      // Only stop if az is running
      return new Promise((resolve, reject) => {
        Logger.debug('Enabling Face Based Exposure', IpAutozoomControl.name);
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
                IpAutozoomControl.name
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
   * @memberof IpAutozoomControl
   */
  async disable(idleTimeMs: number = 2000): Promise<void> {
    if (await this.isEnabled()) {
      // Only stop if az is running
      return new Promise((resolve, reject) => {
        Logger.debug('Stopping Face Based Exposure', IpAutozoomControl.name);
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
                IpAutozoomControl.name
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
   * @memberof IpAutozoomControl
   */
  async isEnabled(): Promise<Boolean> {
    const cnnFeature = new huddly.CnnFeature();
    cnnFeature.setFeature(huddly.Feature.FACEBASEDEXPOSURE);
    const azStatus = await this._deviceManager.getCnnFeatureStatus(cnnFeature);
    return azStatus.getAzStatus().getAzEnabled();
  }
}
