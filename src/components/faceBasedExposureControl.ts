import ICnnControl from '../interfaces/ICnnControl';
import IDeviceManager from '../interfaces/iDeviceManager';

export default class FaseBasedExposureControl implements ICnnControl {
  _deviceManager: IDeviceManager;
  _logger: any;

  constructor(manager: IDeviceManager, logger: any) {
    this._deviceManager = manager;
    this._logger = logger;
  }

  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof FaceBasedExposureControl
   */
  async enable(): Promise<void> {
    try {
      const r = await this._deviceManager.api.transport.write('face-based-exposure/enable');
      return r;
    } catch (e) {
      this._logger.error('Could enable face based exposure', e.message);
      throw new Error('Could not enable face based exposure');
    }
  }

  /**
   * @ignore
   * Check `IFaceBasedExposureControl` interface for method documentation.
   * @memberof FaceBasedExposureControl
   */
  async disable(): Promise<void> {
    try {
      const r = await this._deviceManager.api.transport.write('face-based-exposure/disable');
      return r;
    } catch (e) {
      this._logger.error('Could disable face based exposure', e.message);
      throw new Error('Could not disable face based exposure');
    }
  }

  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof FaceBasedExposureControl
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
      this._logger.error('Could disable face based exposure', e.message);
      throw new Error('Could not get face based exposure status');
    }
  }
}
