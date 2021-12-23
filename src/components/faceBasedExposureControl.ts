import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

/**
 * Control class for configuring the Portrait Lighting feature of the camera.
 *
 * @export
 * @class FaseBasedExposureControl
 * @implements {ICnnControl}
 */
export default class FaseBasedExposureControl implements ICnnControl {
  /**
   * Represents an instance of an ip device manager (ex. Boxfish).
   *
   * @type {IDeviceManager}
   * @memberof FaseBasedExposureControl
   */
  _deviceManager: IDeviceManager;

  constructor(manager: IDeviceManager) {
    this._deviceManager = manager;
  }

  /**
   * Convenience function for setting up the camera for starting/stopping cnn feature.
   * Should be called before any other methods.
   *
   * @return {*}  {Promise<any>} Resolves when the initialisation is completed.
   * @memberof FaseBasedExposureControl
   */
  init(): Promise<any> {
    return Promise.resolve();
  }

  /**
   * Enables the cnn feature persistently. The enable state is persistent on camera reboot/power cycle.
   *
   * @return {*}  {Promise<void>} Resolves when feature is successfully enabled.
   * @memberof FaseBasedExposureControl
   */
  async enable(): Promise<void> {
    try {
      const r = await this._deviceManager.api.transport.write('face-based-exposure/enable');
      return r;
    } catch (e) {
      Logger.error('Could enable face based exposure', e.message);
      throw new Error('Could not enable face based exposure');
    }
  }

  /**
   * Disables the cnn feature persistently. The disabled state is persistent on camera reboot/power cycle.
   *
   * @return {*}  {Promise<void>} Resolves when feature is successfully disabled.
   * @memberof FaseBasedExposureControl
   */
  async disable(): Promise<void> {
    try {
      const r = await this._deviceManager.api.transport.write('face-based-exposure/disable');
      return r;
    } catch (e) {
      Logger.error('Could disable face based exposure', e.message);
      throw new Error('Could not disable face based exposure');
    }
  }

  /**
   * Checks if cnn feature is enabled on the camera. Returns true if yes, false otherwise.
   *
   * @return {*}  {Promise<Boolean>} Resolves to true if cnn features is enabled
   * @memberof FaseBasedExposureControl
   */
  async isEnabled(): Promise<Boolean> {
    try {
      const message = await this._deviceManager.api.sendAndReceiveMessagePack(
        '',
        {
          send: 'face-based-exposure/status',
          receive: 'face-based-exposure/status_reply',
        },
        3000
      );
      return message['fbe-enabled'];
    } catch (e) {
      Logger.error('Could disable face based exposure', e.message);
      throw new Error('Could not get face based exposure status');
    }
  }
}
