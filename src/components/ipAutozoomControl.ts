import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import IIpDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IIpDeviceManager';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import IAutozoomControl from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControl';
import FramingModes from '@huddly/sdk-interfaces/lib/enums/FramingModes';
import AutozoomModes from '@huddly/sdk-interfaces/lib/enums/AutozoomModes';

/**
 * Control class for configuring the Genius Framing feature of the camera.
 *
 * @export
 * @class IpAutozoomControl
 * @implements {ICnnControl}
 */
export default class IpAutozoomControl implements IAutozoomControl {
  /** @ignore */
  _deviceManager: IIpDeviceManager;
  /** @ignore */
  _options: AutozoomControlOpts;
  /** @ignore */
  _supportedModes: Array<FramingModes> = [
    FramingModes.NORMAL,
    FramingModes.SPEAKER_FRAMING,
    FramingModes.GALLERY_VIEW,
  ];

  constructor(manager: IIpDeviceManager, options?: AutozoomControlOpts) {
    this._deviceManager = manager;
    this._options = options || {
      shouldAutoFrame: true,
    };
  }
  getSupportedFramingModes(): Promise<FramingModes[]> {
    return Promise.resolve(this._supportedModes);
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
    Logger.debug('Starting Autozoom', IpAutozoomControl.name);
    return this._setCnnFeature(huddly.Feature.AUTOZOOM, huddly.Mode.START);
  }

  /**
   * Disables the cnn feature persistently. The disabled state is persistent on camera reboot/power cycle.
   *
   * @param {number} [idleTimeMs] Not used for IpAutozoomControl
   * @return {*}  {Promise<void>} Resolves when feature is successfully disabled.
   * @memberof IpAutozoomControl
   */
  async disable(idleTimeMs?: number): Promise<void> {
    Logger.debug('Stopping Autozoom', IpAutozoomControl.name);
    return this._setCnnFeature(huddly.Feature.AUTOZOOM, huddly.Mode.STOP);
  }

  /**
   * Checks if cnn feature is enabled on the camera. Returns true if yes, false otherwise.
   *
   * @return {*}  {Promise<Boolean>} Resolves to true if cnn features is enabled
   * @memberof IpAutozoomControl
   */
  async isEnabled(feature: huddly.Feature = huddly.Feature.AUTOZOOM): Promise<Boolean> {
    const cnnFeature = new huddly.CnnFeature();
    cnnFeature.setFeature(feature);
    const azStatus = await this._deviceManager.getCnnFeatureStatus(cnnFeature);
    return azStatus.getAzStatus().getAzEnabled();
  }

  async _setMode(autozoomMode: AutozoomModes): Promise<any> {
    const supportedAutozoomModes = [AutozoomModes.NORMAL, AutozoomModes.SPEAKER_FRAMING];
    if (!supportedAutozoomModes.includes(autozoomMode)) {
      throw new Error(
        `Provided mode ${autozoomMode} is not supported. Supported modes: ${supportedAutozoomModes.toString()}`
      );
    }
    const framingMode = {
      [AutozoomModes.NORMAL]: FramingModes.NORMAL,
      [AutozoomModes.SPEAKER_FRAMING]: FramingModes.SPEAKER_FRAMING,
      [AutozoomModes.PLAZA]: FramingModes.GALLERY_VIEW,
    }[autozoomMode];

    await this.setFramingMode(framingMode);
  }

  /**
   * Sets autozoom feature on the camera.
   *
   * @param {FramingModes} [framingMode] Autozoom mode to set on camera
   * @return {Promise<void | Error>}
   * @memberof IpAutozoomControl
   */
  async setFramingMode(framingMode: FramingModes): Promise<any> {
    const featureMapping = {
      [FramingModes.NORMAL]: huddly.Feature.AUTOZOOM,
      [FramingModes.SPEAKER_FRAMING]: huddly.Feature.SPEAKERFRAMING,
      [FramingModes.GALLERY_VIEW]: huddly.Feature.GALLERYVIEW,
    };

    if (framingMode === FramingModes.OFF) {
      this._supportedModes.forEach((feat) => {
        this._setCnnFeature(featureMapping[feat], huddly.Mode.STOP);
      });
      return;
    }

    if (!this._supportedModes.includes(framingMode)) {
      throw new Error(
        `Provided mode ${framingMode} is not supported. Supported modes: ${this._supportedModes.toString()}`
      );
    }

    // The following section is a bit confusing due to different naming conventions
    // for the different camera types.

    // Feature is the gRPC type for framing type and is to IP cameras what mode is to USB cameras
    const feature = featureMapping[framingMode];

    // The camera should handle turning other framing features off
    await this._setCnnFeature(feature, huddly.Mode.START);
  }

  /**
   * Sets a cnn feature to given mode
   *
   * @param {huddly.Feature} [feature] Feature to set
   * @param {huddly.Mode} [mode] Set mode START/STOP
   * @return {*} {Promise<void>}
   * @memberof IpAutozoomControl
   */
  private async _setCnnFeature(feature: huddly.Feature, mode: huddly.Mode): Promise<void> {
    return new Promise((resolve, reject) => {
      const cnnFeature = new huddly.CnnFeature();
      cnnFeature.setFeature(feature);
      cnnFeature.setMode(mode);

      const featureString = Object.keys(huddly.Feature)[feature];
      const modeString = Object.keys(huddly.Mode)[mode];

      Logger.debug(`Setting cnn feature: ${modeString} ${featureString}`, IpAutozoomControl.name);
      this._deviceManager.grpcClient.setCnnFeature(
        cnnFeature,
        (err, status: huddly.DeviceStatus) => {
          if (err != undefined) {
            Logger.error(
              `Unable to ${modeString} ${featureString}`,
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
