import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import IIpDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IIpDeviceManager';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

/**
 * Control class for configuring the Genius Framing feature of the camera.
 *
 * @export
 * @class IpAutozoomControl
 * @implements {ICnnControl}
 */
export default class IpAutozoomControl implements ICnnControl {
  /** @ignore */
  _deviceManager: IIpDeviceManager;
  /** @ignore */
  _options: AutozoomControlOpts;

  constructor(manager: IIpDeviceManager, options?: AutozoomControlOpts) {
    this._deviceManager = manager;
    this._options = options || {
      shouldAutoFrame: true,
    };
  }

  /**
   * Convenience function for setting up the camera for starting/stopping cnn feature.
   * Should be called before any other methods.
   *
   * @return {*}  {Promise<any>} Resolves when the initialisation is completed.
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
   * Enables the cnn feature persistently. The enable state is persistent on camera reboot/power cycle.
   *
   * @param {number} [idleTimeMs]  Not used for IpAutozoomControl
   * @return {*}  {Promise<void>} Resolves when feature is successfully enabled.
   * @memberof IpAutozoomControl
   */
  async enable(idleTimeMs?: number): Promise<void> {
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
   * Disables the cnn feature persistently. The disabled state is persistent on camera reboot/power cycle.
   *
   * @param {number} [idleTimeMs] Not used for IpAutozoomControl
   * @return {*}  {Promise<void>} Resolves when feature is successfully disabled.
   * @memberof IpAutozoomControl
   */
  async disable(idleTimeMs?: number): Promise<void> {
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
   * Checks if cnn feature is enabled on the camera. Returns true if yes, false otherwise.
   *
   * @return {*}  {Promise<Boolean>} Resolves to true if cnn features is enabled
   * @memberof IpAutozoomControl
   */
  async isEnabled(): Promise<Boolean> {
    const cnnFeature = new huddly.CnnFeature();
    cnnFeature.setFeature(huddly.Feature.AUTOZOOM);
    const azStatus = await this._deviceManager.getCnnFeatureStatus(cnnFeature);
    return azStatus.getAzStatus().getAzEnabled();
  }

  /**
   * @deprecated
   * @ignore
   *
   * @return {*}  {Promise<void>}
   * @memberof IpAutozoomControl
   */
  async start(): Promise<void> {
    // Not required. The `enable` method takes care of autozoom persistency across boot and also starting autozoom at the same time.
    Logger.warn(
      'Autozoom->start() method on IpAutozoomControl is redundant. Present only for backwards compatibility reasons!',
      IpAutozoomControl.name
    );
  }

  /**
   * @deprecated
   * @ignore
   *
   * @return {*}  {Promise<void>}
   * @memberof IpAutozoomControl
   */
  async stop(): Promise<void> {
    // Not required. The `enable` method takes care of autozoom persistency across boot and also stopping autozoom at the same time.
    Logger.warn(
      'Autozoom->stop() method on IpAutozoomControl is redundant. Present only for backwards compatibility reasons!',
      IpAutozoomControl.name
    );
  }
}
