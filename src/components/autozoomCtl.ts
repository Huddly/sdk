import IAutozoomCtl from './../interfaces/IAutozoomCtl';
import AutozoomCtlOpts from './../interfaces/IAutozoomCtlOpts';
import IDeviceManager from './../interfaces/iDeviceManager';
import Api from './api';

export default class AutozoomCtl implements IAutozoomCtl {
  _deviceManager: IDeviceManager;
  _logger: any;
  _options: AutozoomCtlOpts;

  constructor(manager: IDeviceManager, logger: any, options?: AutozoomCtlOpts) {
    this._deviceManager = manager;
    this._logger = logger;
    this._options = options || {
      shouldAutoFrame: true,
    };
  }

  /**
   * @ignore
   * Check `IAutozoomCtl` interface for method documentation.
   * @memberof AutozoomCtl
   */
  async init(): Promise<any> {
    if (this._options.shouldAutoFrame !== undefined && this._options.shouldAutoFrame !== null) {
      this._logger.debug(
        `Initializing autozoom with framing config option AUTO_PTZ: ${
          this._options.shouldAutoFrame
        }`,
        'Autozoom Controller'
      );
      await this.uploadFramingConfig({
        AUTO_PTZ: this._options.shouldAutoFrame,
      });
      // Autozoom status command will after boot only respond
      // when the cnn is finished attempting to load the blob.
      // waiting to the status reply will assure the detector is ready.
      await this._deviceManager.api.getAutozoomStatus(8000);
    }
  }

  /**
   * @ignore
   * Check `IAutozoomCtl` interface for method documentation.
   * @memberof AutozoomCtl
   */
  async enable(idleTimeMs: number = 2000): Promise<void> {
    this._logger.debug('Enabling autozoom persistently', 'Autozoom Controller');

    const reply = await this._deviceManager.api.sendAndReceiveMessagePack(
      Buffer.alloc(0),
      {
        send: 'autozoom/enable',
        receive: 'autozoom/enable_reply',
      },
      idleTimeMs
    );
    if (!reply['autozoom-active']) {
      throw new Error('Autozoom not on after enable.');
    }
  }

  /**
   * @ignore
   * Check `IAutozoomCtl` interface for method documentation.
   * @memberof AutozoomCtl
   */
  async disable(idleTimeMs: number = 2000): Promise<void> {
    this._logger.debug('Disabling autozoom persistently', 'Autozoom Controller');

    const reply = await this._deviceManager.api.sendAndReceiveMessagePack(
      Buffer.alloc(0),
      {
        send: 'autozoom/disable',
        receive: 'autozoom/disable_reply',
      },
      idleTimeMs
    );
    if (reply['autozoom-active'] != false) {
      throw new Error('No blob loaded while enabling autozoom');
    }
  }

  /**
   * @ignore
   * Check `IAutozoomCtl` interface for method documentation.
   * @memberof AutozoomCtl
   */
  async isEnabled(): Promise<Boolean> {
    const prodInfo = await this._deviceManager.api.getProductInfo();
    return prodInfo.autozoom_enabled;
  }

  /**
   * @ignore
   * Check `IAutozoomCtl` interface for method documentation.
   * @memberof AutozoomCtl
   */
  async start(): Promise<void> {
    if (!(await this.isRunning())) {
      // Only start if not already started
      this._logger.debug('Starting Autozoom', 'Autozoom Controller');
      await this._deviceManager.api.sendAndReceive(
        Buffer.alloc(0),
        {
          send: 'autozoom/start',
          receive: 'autozoom/start_reply',
        },
        3000
      );
    }
  }

  /**
   * @ignore
   * Check `IAutozoomCtl` interface for method documentation.
   * @memberof AutozoomCtl
   */
  async stop(): Promise<void> {
    if (await this.isRunning()) {
      // Only stop if az is running
      this._logger.debug('Stopping Autozoom', 'Autozoom Controller');
      await this._deviceManager.api.sendAndReceive(
        Buffer.alloc(0),
        {
          send: 'autozoom/stop',
          receive: 'autozoom/stop_reply',
        },
        3000
      );
    }
  }

  /**
   * @ignore
   * Check `IAutozoomCtl` interface for method documentation.
   * @memberof AutozoomCtl
   */
  async isRunning(): Promise<Boolean> {
    const status = await this._deviceManager.api.getAutozoomStatus();
    return status['autozoom-active'];
  }

  /**
   * @ignore
   * Uploads the detector blob to the camera.
   *
   * @param {Buffer} blobBuffer The blob buffer to be uploaded to the camera.
   * @returns {Promise<void>} Void Promise.
   * @memberof AutozoomCtl
   */
  async uploadBlob(blobBuffer: Buffer): Promise<void> {
    const status = await this._deviceManager.api.getAutozoomStatus();
    if (!status['network-configured']) {
      this._logger.debug('Uploading cnn blob', 'Autozoom Controller');
      await this._deviceManager.api.sendAndReceive(
        blobBuffer,
        {
          send: 'network-blob',
          receive: 'network-blob_reply',
        },
        60000
      );
      this._logger.debug(
        'Cnn blob has been uploaded. Unlocking the stream!',
        'Autozoom Controller'
      );
    } else {
      this._logger.debug('Cnn blob already configured on the camera', 'Autozoom Controller');
    }
  }

  /**
   * @ignore
   * Uploads the configuration file for the detector.
   *
   * @param {JSON} config JSON file representing the detector configuration.
   * @returns {Promise<void>} Void Promise.
   * @memberof AutozoomCtl
   */
  async setDetectorConfig(config: JSON): Promise<void> {
    this._logger.debug('Sending detector config!', 'Autozoom Controller');
    await this._deviceManager.api.sendAndReceive(
      Api.encode(config),
      {
        send: 'detector/config',
        receive: 'detector/config_reply',
      },
      6000
    );
    this._logger.debug('Detector config sent!', 'Autozoom Controller');
  }

  /**
   * @ignore
   * Uploads the framing configuration file on the camera for using
   * new framing ruleset.
   *
   * @param {JSON} config JSON file representing the framing configuration.
   * @returns {Promise<void>} Void Promise.
   * @memberof AutozoomCtl
   */
  async uploadFramingConfig(config: any): Promise<void> {
    this._logger.debug('Uploading new framing config', 'Autozoom Controller');
    await this._deviceManager.api.sendAndReceive(
      Api.encode(config),
      {
        send: 'autozoom/framer-config',
        receive: 'autozoom/framer-config_reply',
      },
      60000
    );
    this._logger.debug('New framing config uploaded on the camera.', 'Autozoom Controller');
  }
}
