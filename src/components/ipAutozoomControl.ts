import ICnnControl from '../interfaces/ICnnControl';
import AutozoomControlOpts from '../interfaces/IAutozoomControlOpts';
import IIpDeviceManager from '../interfaces/iIpDeviceManager';
import Logger from './../utilitis/logger';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

export default class IpAutozoomControl implements ICnnControl {
  _deviceManager: IIpDeviceManager;
  _options: AutozoomControlOpts;

  constructor(manager: IIpDeviceManager, options?: AutozoomControlOpts) {
    this._deviceManager = manager;
    this._options = options || {
      shouldAutoFrame: true,
    };
  }

  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof IpAutozoomControl
   */
  async init(): Promise<any> {
    try {
      // Wait until camera can check az status
      const cnnFeature = new huddly.CnnFeature();
      cnnFeature.setFeature(huddly.Feature.AUTOZOOM);
      await this._deviceManager.getCnnFeatureStatus(cnnFeature);
      Logger.info('Autozoom initialized', IpAutozoomControl.name);
    } catch (err) {
      Logger.error(
        'Autozoom status not returned from camera. Autozoom might not be available',
        err,
        IpAutozoomControl.name
      );
    }
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
        Logger.debug('Enabling Autozoom', 'Autozoom Control');
        const cnnFeature = new huddly.CnnFeature();
        cnnFeature.setFeature(huddly.Feature.AUTOZOOM);
        cnnFeature.setMode(0);
        this._deviceManager.grpcClient.setCnnFeature(
          cnnFeature,
          (err, status: huddly.DeviceStatus) => {
            if (err != undefined) {
              Logger.error(
                'Unable to enable autozoom',
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
        Logger.debug('Stopping Autozoom', 'Autozoom Control');
        const cnnFeature = new huddly.CnnFeature();
        cnnFeature.setFeature(huddly.Feature.AUTOZOOM);
        cnnFeature.setMode(1);
        this._deviceManager.grpcClient.setCnnFeature(
          cnnFeature,
          (err, status: huddly.DeviceStatus) => {
            if (err != undefined) {
              Logger.error(
                'Unable to disable autozoom',
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
    cnnFeature.setFeature(huddly.Feature.AUTOZOOM);
    const azStatus = await this._deviceManager.getCnnFeatureStatus(cnnFeature);
    return azStatus.getAzStatus().getAzEnabled();
  }
}
