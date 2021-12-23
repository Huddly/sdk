import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import IIpDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IIpDeviceManager';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

/**
 * Control class for configuring the Portrait Lighting feature of the camera.
 *
 * @export
 * @class IpFaceBasedExposureControl
 * @implements {ICnnControl}
 */
export default class IpFaceBasedExposureControl implements ICnnControl {
  /**
   * Represents an instance of an ip device manager (ex. Ace).
   *
   * @type {IIpDeviceManager}
   * @memberof IpFaceBasedExposureControl
   */
  _deviceManager: IIpDeviceManager;

  constructor(manager: IIpDeviceManager) {
    this._deviceManager = manager;
  }

  /**
   * Convenience function for setting up the camera for starting/stopping cnn feature.
   * Should be called before any other methods.
   *
   * @return {*}  {Promise<any>} Resolves when the initialisation is completed.
   * @memberof IpFaceBasedExposureControl
   */
  init(): Promise<any> {
    return Promise.resolve();
  }

  /**
   * Enables the cnn feature persistently. The enable state is persistent on camera reboot/power cycle.
   *
   * @param {number} [idleTimeMs] Not used for IpFaceBasedExposureControl
   * @return {*}  {Promise<void>} Resolves when feature is successfully enabled.
   * @memberof IpFaceBasedExposureControl
   */
  async enable(idleTimeMs?: number): Promise<void> {
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
   * Disables the cnn feature persistently. The disabled state is persistent on camera reboot/power cycle.
   *
   * @param {number} [idleTimeMs]  Not used for IpFaceBasedExposureControl
   * @return {*}  {Promise<void>}  Resolves when feature is successfully disabled.
   * @memberof IpFaceBasedExposureControl
   */
  async disable(idleTimeMs?: number): Promise<void> {
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
   * Checks if cnn feature is enabled on the camera. Returns true if yes, false otherwise.
   *
   * @return {*}  {Promise<Boolean>} Resolves to true if cnn features is enabled
   * @memberof IpFaceBasedExposureControl
   */
  async isEnabled(): Promise<Boolean> {
    const cnnFeature = new huddly.CnnFeature();
    cnnFeature.setFeature(huddly.Feature.FACEBASEDEXPOSURE);
    const azStatus = await this._deviceManager.getCnnFeatureStatus(cnnFeature);
    return azStatus.getFbeStatus().getFbeEnabled();
  }
}
