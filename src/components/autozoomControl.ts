import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';
import AutozoomModes from '@huddly/sdk-interfaces/lib/enums/AutozoomModes';

import Api from './api';

/**
 * Control class for configuring the Genius Framing feature of the camera.
 *
 * @export
 * @class AutozoomControl
 * @implements {ICnnControl}
 */
export default class AutozoomControl implements ICnnControl {
  /** @ignore */
  _deviceManager: IDeviceManager;
  /** @ignore */
  _options: AutozoomControlOpts;

  private readonly _defaultOpts: AutozoomControlOpts = {
    shouldAutoFrame: true,
    mode: AutozoomModes.NORMAL,
  };

  constructor(manager: IDeviceManager, options?: AutozoomControlOpts) {
    this._deviceManager = manager;
    this._options = { ...this._defaultOpts, ...options };

    this._validateOptions(this._options);
  }

  /**
   * Convenience function for setting up the camera for starting/stopping cnn feature.
   * Should be called before any other methods.
   *
   * @return {*}  {Promise<any>} Resolves when the initialisation is completed.
   * @memberof AutozoomControl
   */
  async init(): Promise<any> {
    Logger.info('Fetching autozoom state...', 'Autozoom Control');
    // Might take longer than 500ms to get the az controller status initially
    const azStatus = await this._deviceManager.api.getAutozoomStatus(5000);
    // Default to NORMAL for cameras without autozoom-mode support.
    const currentMode = azStatus['autozoom-mode'] || AutozoomModes.NORMAL;
    if (currentMode !== this._options.mode) {
      Logger.info(`Setting autozoom-mode to: '${this._options.mode}'`, 'Autozoom Control');
      try {
        this._setMode(this._options.mode);
      } catch (e) {
        Logger.warn(`Failed in setting autozoom-mode: ${e}.`);
        this._options.mode = undefined;
      }
    }
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

  /**
   * Helper function for updating the initial detector options specified when
   * instantiating the Detector class.
   *
   * @param {AutozoomControlOpts} options The new az control options to be used.
   * @return {*}  {Promise<any>} Resolves when the new options have been applied and detector is initialized.
   * @memberof AutozoomControl
   */
  async updateOpts(newOpts: AutozoomControlOpts): Promise<any> {
    const prevOpts = this._options;
    const nextOpts = { ...prevOpts, ...newOpts };
    this._validateOptions(nextOpts);

    if (nextOpts.mode !== prevOpts.mode) {
      try {
        await this._setMode(newOpts.mode);
      } catch (e) {
        Logger.error('Failed in updating opts:', e);
        return Promise.reject(e);
      }
    }
    this._options = nextOpts;

    if (nextOpts.shouldAutoFrame !== prevOpts.shouldAutoFrame) {
      await this.init();
    }
  }

  private _validateOptions(options: AutozoomControlOpts) {
    if (!Object.values(AutozoomModes).includes(options.mode)) {
      throw Error(`The following mode is not supported on autozoom controller: ${options.mode}`);
    }

    if (typeof options.shouldAutoFrame !== 'boolean') {
      throw Error(`Option 'shouldAutoFrame' cannot not be set to ${options.shouldAutoFrame}`);
    }

    if (!options.shouldAutoFrame && options.mode !== AutozoomModes.NORMAL) {
      const modeName = options.mode;
      throw Error(
        `AutozoomMode '${modeName}' does not support option 'shouldAutoFrame' set to ${options.shouldAutoFrame}!`
      );
    }
  }

  /**
   * Enables the cnn feature persistently. The enable state is persistent on camera reboot/power cycle.
   *
   * @param {number} [idleTimeMs=2000] Max time (in milliseconds) for the camera to respond to enable az control.
   * @return {*}  {Promise<void>} Resolves when feature is successfully enabled.
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
   * Disables the cnn feature persistently. The disabled state is persistent on camera reboot/power cycle.
   *
   * @param {number} [idleTimeMs=2000] Max time (in milliseconds) for the camera to respond to disable az control.
   * @return {*}  {Promise<void>} Resolves when feature is successfully disabled.
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
   * Checks if cnn feature is enabled on the camera. Returns true if yes, false otherwise.
   *
   * @return {*}  {Promise<Boolean>} Resolves to true if cnn features is enabled
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
   * @return {*}  {Promise<void>} Resolves when autozoom controler is started.
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
   * @return {*}  {Promise<void>} Resolves when the autozoom control is stopped.
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
   * @return {*}  {Promise<Boolean>} Resolves with information whether az control is running
   * or not.
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

  private async _setMode(mode: AutozoomModes) {
    const azStatus = await this._deviceManager.api.getAutozoomStatus();
    // Default to NORMAL for cameras without autozoom-mode support.
    const currentMode = azStatus['autozoom-mode'] || AutozoomModes.NORMAL;
    if (currentMode === mode) {
      Logger.info(`Camera already in autozoom-mode: '${mode}'`, 'Autozoom Control');
      return currentMode;
    }

    const modeKeys = {
      normal: 0,
      plaza: 1,
      plaza_duplicate: 2,
    };
    Logger.debug(
      `Sending autozoom/set-mode request with param '{ mode: ${modeKeys[mode]} }'`,
      'Autozoom Control'
    );
    const response = await this._deviceManager.api.sendAndReceiveMessagePack(
      { mode: modeKeys[mode] },
      {
        send: 'autozoom/set-mode',
        receive: 'autozoom/set-mode_reply',
      }
    );
    Logger.debug(`Received autozoom/set-mode response: ${JSON.stringify(response)}`);
    if (response['autozoom-mode'] !== mode) {
      throw new Error(
        `Could not set autozoomMode '${mode}': Target replied with mode '${response['autozoom-mode']}'`
      );
    }
    return response['autozoom-mode'];
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
