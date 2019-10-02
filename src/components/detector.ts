import { EventEmitter } from 'events';
import IDetector from './../interfaces/IDetector';
import IDeviceManager from './../interfaces/iDeviceManager';
import iDetectorOpts, { DetectionConvertion } from './../interfaces/IDetectorOpts';
import Api from './api';
import CameraEvents from './../utilitis/events';

const PREVIEW_IMAGE_SIZE = { width: 640, height: 480 };

/**
 * Detector class used to configure genius framing on the camera.
 *
 * @export
 * @class Detector
 * @extends {EventEmitter}
 * @implements {IDetector}
 */
export default class Detector extends EventEmitter implements IDetector {
  _deviceManager: IDeviceManager;
  _logger: any;
  _predictionHandler: any;
  _framingHandler: any;
  _frame: any;
  _options: iDetectorOpts;
  _defaultLabelWhiteList: Array<String> = ['head', 'person'];
  _detectorSubscriptionsSetup: boolean;

  /**
   * Creates an instance of Detector.
   * @param {IDeviceManager} manager An instance of the IDeviceManager (for example
   * the Boxfish implementation of IDeviceManager) for communicating with the device.
   * @param {*} logger Logger class for logging messages produced from the detector.
   * @param options options detector.
   * @memberof Detector
   */
  constructor(manager: IDeviceManager, logger: any, options?: iDetectorOpts) {
    super();
    this._deviceManager = manager;
    this._logger = logger;
    this._options = options || {
      convertDetections: DetectionConvertion.RELATIVE,
      shouldAutoFrame: true,
    };
    this.setMaxListeners(50);
    this._predictionHandler = detectionBuffer => {
      const { predictions } = Api.decode(detectionBuffer.payload, 'messagepack');
      const convertedPredictions = this.convertPredictions(predictions, this._options);
      this.emit(CameraEvents.DETECTIONS, convertedPredictions);
    };
    this._framingHandler = frameBuffer => {
      const frame = Api.decode(frameBuffer.payload, 'messagepack');
      this.emit(CameraEvents.FRAMING, frame);
      this._frame = frame;
    };
  }

  /**
   * @ignore
   * Check `IDetector` interface for method documentation.
   * @memberof Detector
   */
  async init(): Promise<any> {
    if (this._options.shouldAutoFrame !== undefined && this._options.shouldAutoFrame !== null) {
      this._logger.debug(
        `Initializing detector with framing config option AUTO_PTZ: ${this._options.shouldAutoFrame}`,
        'Boxfish Detector'
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
   * Check `IDetector` interface for method documentation.
   * @memberof Detector
   */
  async enable(idleTimeMs: number = 2000): Promise<void> {
    this._logger.debug('Enabling autozoom persistently', 'Boxfish Detector');

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
   * Check `IDetector` interface for method documentation.
   * @memberof Detector
   */
  async disable(idleTimeMs: number = 2000): Promise<void> {
    this._logger.debug('Disabling autozoom persistently', 'Boxfish Detector');

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
   * Check `IDetector` interface for method documentation.
   * @memberof Detector
   */
  async isEnabled(): Promise<Boolean> {
    const prodInfo = await this._deviceManager.api.getProductInfo();
    return prodInfo.autozoom_enabled;
  }

  /**
   * @ignore
   * Check `IDetector` interface for method documentation.
   * @memberof Detector
   */
  async start(): Promise<void> {
    if (!(await this.isRunning())) {
      // Only start if not already started
      this._logger.debug('Starting Autozoom', 'Boxfish Detector');
      await this._deviceManager.api.sendAndReceive(
        Buffer.alloc(0),
        {
          send: 'autozoom/start',
          receive: 'autozoom/start_reply',
        },
        3000
      );
    }
    await this.setupDetectorSubscriptions();
  }

  /**
   * @ignore
   * Check `IDetector` interface for method documentation.
   * @memberof Detector
   */
  async detectorStart(): Promise<void> {
    this._logger.debug('Starting detector', 'Boxfish Detector');
    await this._deviceManager.transport.write('detector/start');
    await this.setupDetectorSubscriptions({
      detectionListener: true,
      framingListener: false,
    });
  }

  /**
   * @ignore
   * Check `IDetector` interface for method documentation.
   * @memberof Detector
   */
  async stop(): Promise<void> {
    if (await this.isRunning()) {
      // Only stop if az is running
      this._logger.debug('Stopping Autozoom', 'Boxfish Detector');
      await this._deviceManager.api.sendAndReceive(
        Buffer.alloc(0),
        {
          send: 'autozoom/stop',
          receive: 'autozoom/stop_reply',
        },
        3000
      );
    }
    await this.teardownDetectorSubscriptions();
  }

  /**
   * @ignore
   * Check `IDetector` interface for method documentation.
   * @memberof Detector
   */
  async detectorStop(): Promise<void> {
    this._logger.debug('Stopping detector', 'Boxfish Detector');
    await this._deviceManager.transport.write('detector/stop');
    await this.teardownDetectorSubscriptions({
      detectionListener: true,
      framingListener: false,
    });
  }

  /**
   * @ignore
   * Convenience function for setting up detection and framing
   * data listeners and subscribing to camera events that send
   * such data to the host.
   *
   * @param {*} [listenerConfigOpts={
   *       detectionListener: true,
   *       framingListener: true,
   *     }]
   * @memberof Detector
   */
  async setupDetectorSubscriptions(
    listenerConfigOpts: any = {
      detectionListener: true,
      framingListener: true,
    }
  ) {
    try {
      // Detection listener setup
      if (!this._detectorSubscriptionsSetup && listenerConfigOpts.detectionListener) {
        await this._deviceManager.transport.subscribe('autozoom/predictions');
        this._deviceManager.transport.on('autozoom/predictions', this._predictionHandler);
      }
      // Framing listener setup
      if (!this._detectorSubscriptionsSetup && listenerConfigOpts.framingListener) {
        await this._deviceManager.transport.subscribe('autozoom/framing');
        this._deviceManager.transport.on('autozoom/framing', this._framingHandler);
      }
      this._detectorSubscriptionsSetup = true;
    } catch (e) {
      await this._deviceManager.transport.unsubscribe('autozoom/predictions');
      await this._deviceManager.transport.unsubscribe('autozoom/framing');
      this._logger.error('Something went wrong getting predictions!', e, 'Boxfish Detector');
      this._detectorSubscriptionsSetup = false;
    }
  }

  /**
   * @ignore
   * Convenience function for tearing down all the setup listeners
   * for detection and framing data and unsubscribes from getting
   * detection events from camera.
   *
   * @param {*} [listenerConfigOpts={
   *       detectionListener: true,
   *       framingListener: true,
   *     }]
   * @memberof Detector
   */
  async teardownDetectorSubscriptions(
    listenerConfigOpts: any = {
      detectionListener: true,
      framingListener: true,
    }
  ) {
    // Detection listener teardown
    if (this._detectorSubscriptionsSetup && listenerConfigOpts.detectionListener) {
      await this._deviceManager.transport.unsubscribe('autozoom/predictions');
      this._deviceManager.transport.removeListener('autozoom/predictions', this._predictionHandler);
    }

    // Framing listener teardown
    if (this._detectorSubscriptionsSetup && listenerConfigOpts.framingListener) {
      await this._deviceManager.transport.unsubscribe('autozoom/framing');
      this._deviceManager.transport.removeListener('autozoom/framing', this._framingHandler);
    }
    this._detectorSubscriptionsSetup = false;
  }

  /**
   * @ignore
   * Check `IDetector` interface for method documentation.
   * @memberof Detector
   */
  async isRunning(): Promise<Boolean> {
    const status = await this._deviceManager.api.getAutozoomStatus();
    return status['autozoom-active'];
  }

  /**
   * @ignore
   * Normalizes and filters predictions so they are relative to image size
   *
   * @param {predictions} Array of predictions
   * @returns {predictions} Converted predictions
   * @memberof Detector
   */
  convertPredictions(predictions: Array<any>, opts?: iDetectorOpts): Array<any> {
    let objectFilter = this._defaultLabelWhiteList;
    if (opts && opts.objectFilter) {
      objectFilter = opts.objectFilter;
    }
    const filteredPredictions =
      objectFilter.length === 0
        ? predictions
        : predictions.filter(({ label }) => {
            return objectFilter.some(x => x === label);
          });

    if (opts && opts.convertDetections === DetectionConvertion.FRAMING && this._frame) {
      const { bbox: framingBBox } = this._frame;
      const relativeSize = {
        height: PREVIEW_IMAGE_SIZE.height / framingBBox.height,
        width: PREVIEW_IMAGE_SIZE.width / framingBBox.width,
      };
      return filteredPredictions.map(({ label, bbox }) => {
        return {
          label: label,
          bbox: {
            x: (bbox.x - framingBBox.x) * relativeSize.width,
            y: (bbox.y - framingBBox.y) * relativeSize.height,
            width: bbox.width * relativeSize.width,
            height: bbox.height * relativeSize.height,
            frameWidth: framingBBox.width * relativeSize.width,
            frameHeight: framingBBox.height * relativeSize.height,
          },
        };
      });
    } else {
      return filteredPredictions.map(({ label, bbox }) => {
        return {
          label: label,
          bbox: {
            x: bbox.x / PREVIEW_IMAGE_SIZE.width,
            y: bbox.y / PREVIEW_IMAGE_SIZE.height,
            width: bbox.width / PREVIEW_IMAGE_SIZE.width,
            height: bbox.height / PREVIEW_IMAGE_SIZE.height,
          },
        };
      });
    }
  }

  /**
   * @ignore
   * Uploads the detector blob to the camera.
   *
   * @param {Buffer} blobBuffer The blob buffer to be uploaded to the camera.
   * @returns {Promise<void>} Void Promise.
   * @memberof Detector
   */
  async uploadBlob(blobBuffer: Buffer): Promise<void> {
    const status = await this._deviceManager.api.getAutozoomStatus();
    if (!status['network-configured']) {
      this._logger.debug('Uploading cnn blob', 'Boxfish Detector');
      await this._deviceManager.api.sendAndReceive(
        blobBuffer,
        {
          send: 'network-blob',
          receive: 'network-blob_reply',
        },
        60000
      );
      this._logger.debug('Cnn blob has been uploaded. Unlocking the stream!', 'Boxfish Detector');
    } else {
      this._logger.debug('Cnn blob already configured on the camera', 'Boxfish Detector');
    }
  }

  /**
   * @ignore
   * Uploads the configuration file for the detector.
   *
   * @param {JSON} config JSON file representing the detector configuration.
   * @returns {Promise<void>} Void Promise.
   * @memberof Detector
   */
  async setDetectorConfig(config: JSON): Promise<void> {
    this._logger.debug('Sending detector config!', 'Boxfish Detector');
    await this._deviceManager.api.sendAndReceive(
      Api.encode(config),
      {
        send: 'detector/config',
        receive: 'detector/config_reply',
      },
      6000
    );
    this._logger.debug('Detector config sent!', 'Boxfish Detector');
  }

  /**
   * @ignore
   * Uploads the framing configuration file on the camera for using
   * new framing ruleset.
   *
   * @param {JSON} config JSON file representing the framing configuration.
   * @returns {Promise<void>} Void Promise.
   * @memberof Detector
   */
  async uploadFramingConfig(config: any): Promise<void> {
    this._logger.debug('Uploading new framing config', 'Boxfish Detector');
    await this._deviceManager.api.sendAndReceive(
      Api.encode(config),
      {
        send: 'autozoom/framer-config',
        receive: 'autozoom/framer-config_reply',
      },
      60000
    );
    this._logger.debug('New framing config uploaded on the camera.', 'Boxfish Detector');
  }
}
