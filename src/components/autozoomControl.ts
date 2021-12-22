import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import Api from './api';

export default class AutozoomControl implements ICnnControl {
  _deviceManager: IDeviceManager;
  _options: AutozoomControlOpts;

  constructor(manager: IDeviceManager, options?: AutozoomControlOpts) {
    this._deviceManager = manager;
    this._options = options || {
      shouldAutoFrame: true,
    };
  }

  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof AutozoomControl
   */
  async init(): Promise<any> {
    if (this._options.shouldAutoFrame !== undefined && this._options.shouldAutoFrame !== null) {
      Logger.debug(
        `Initializing autozoom with framing config option AUTO_PTZ: ${this._options.shouldAutoFrame}`,
        'Autozoom Control'
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

  updateOpts(options: AutozoomControlOpts): Promise<any> {
    const currentSetOpts = this._options;
    this._options = {
      ...currentSetOpts,
      ...options,
    };
    return this.init();
  }

  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof AutozoomControl
   */
  async enable(idleTimeMs: number = 2000): Promise<void> {
    Logger.debug('Enabling autozoom persistently', 'Autozoom Control');

    await this._deviceManager.api.sendAndReceive(
      Buffer.alloc(0),
      {
        send: 'autozoom/enable',
        receive: 'autozoom/enable_reply',
      },
      idleTimeMs
    );

    /**
     * `autozoom/enable` asynchronously sets the
     * "autozoom_enabled" property of the camera product
     * info. It is necessary to query the isEnabled more
     * than once to have a legitimate assertion.
     */
    const promise = new Promise<void>(async (resolve, reject) => {
      let retry = 3;
      while (retry) {
        const isEnabled = await this.isEnabled();
        if (isEnabled) {
          resolve();
          break;
        }
        retry -= 1;
      }
      if (retry === 0) {
        reject(new Error('Autozoom not on after enable.'));
      }
    });

    await promise;
    Logger.debug('Autozoom enabled persistently', 'Autozoom Control');
  }

  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof AutozoomControl
   */
  async disable(idleTimeMs: number = 2000): Promise<void> {
    Logger.debug('Disabling autozoom persistently', 'Autozoom Control');

    await this._deviceManager.api.sendAndReceive(
      Buffer.alloc(0),
      {
        send: 'autozoom/disable',
        receive: 'autozoom/disable_reply',
      },
      idleTimeMs
    );

    /**
     * `autozoom/disable` asynchronously sets the
     * "autozoom_enabled" property of the camera product
     * info. It is necessary to query the isEnabled more
     * than once to have a legitimate assertion.
     */
    const promise = new Promise<void>(async (resolve, reject) => {
      let retry = 3;
      while (retry) {
        const isEnabled = await this.isEnabled();
        if (!isEnabled) {
          resolve();
          break;
        }
        retry -= 1;
      }
      if (retry === 0) {
        reject(new Error('Autozoom not off after disable.'));
      }
    });

    await promise;
    Logger.debug('Autozoom disabled persistently', 'Autozoom Control');
  }

  /**
   * @ignore
   * Check `ICnnControl` interface for method documentation.
   * @memberof AutozoomControl
   */
  async isEnabled(): Promise<Boolean> {
    const prodInfo = await this._deviceManager.api.getProductInfo();
    return prodInfo.autozoom_enabled;
  }

  /**
   * Starts autozoom feature on the camera. User `Detector` class
   * for setting up detections and/or framing event listeners.
   *
   * NOTE: For persistent enable of autozoom feature you
   * need to call the `enable` method.
   *
   * @memberof AutozoomControl
   */
  async start(): Promise<void> {
    if (!(await this.isRunning())) {
      // Only start if not already started
      Logger.debug('Starting Autozoom', 'Autozoom Control');
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
   * Stops autozoom feature on the camera.
   *
   * NOTE: For persistent disable of autozoom feature you
   * need to call the `disable` method.
   *
   * @returns {Promise<void>} A void function.
   * @memberof AutozoomControl
   */
  async stop(): Promise<void> {
    if (await this.isRunning()) {
      // Only stop if az is running
      Logger.debug('Stopping Autozoom', 'Autozoom Control');
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
   * Checks if autozoom is running on the camera. Returns true if yes, false otherwise.
   *
   * @returns {Promise<Boolean>} Boolean representation of the running state
   * of autozoom feature.
   * @memberof AutozoomControl
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
   * @memberof AutozoomControl
   */
  async uploadBlob(blobBuffer: Buffer): Promise<void> {
    const status = await this._deviceManager.api.getAutozoomStatus();
    if (!status['network-configured']) {
      Logger.debug('Uploading cnn blob', 'Autozoom Control');
      await this._deviceManager.api.sendAndReceive(
        blobBuffer,
        {
          send: 'network-blob',
          receive: 'network-blob_reply',
        },
        60000
      );
      Logger.debug('Cnn blob has been uploaded. Unlocking the stream!', 'Autozoom Control');
    } else {
      Logger.debug('Cnn blob already configured on the camera', 'Autozoom Control');
    }
  }

  /**
   * @ignore
   * Uploads the configuration file for the detector.
   *
   * @param {JSON} config JSON file representing the detector configuration.
   * @returns {Promise<void>} Void Promise.
   * @memberof AutozoomControl
   */
  async setDetectorConfig(config: JSON): Promise<void> {
    Logger.debug('Sending detector config!', 'Autozoom Control');
    await this._deviceManager.api.sendAndReceive(
      Api.encode(config),
      {
        send: 'detector/config',
        receive: 'detector/config_reply',
      },
      6000
    );
    Logger.debug('Detector config sent!', 'Autozoom Control');
  }

  /**
   * @ignore
   * Uploads the framing configuration file on the camera for using
   * new framing ruleset.
   *
   * @param {JSON} config JSON file representing the framing configuration.
   * @returns {Promise<void>} Void Promise.
   * @memberof AutozoomControl
   */
  async uploadFramingConfig(config: any): Promise<void> {
    Logger.debug('Uploading new framing config', 'Autozoom Control');
    await this._deviceManager.api.sendAndReceive(
      Api.encode(config),
      {
        send: 'autozoom/framer-config',
        receive: 'autozoom/framer-config_reply',
      },
      60000
    );
    Logger.debug('New framing config uploaded on the camera.', 'Autozoom Control');
  }
}
