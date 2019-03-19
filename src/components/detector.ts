import { EventEmitter } from 'events';
import IDetector from './../interfaces/IDetector';
import IDeviceManager from './../interfaces/iDeviceManager';
import iDetectorOpts, { DetectionConvertion } from './../interfaces/IDetectorOpts';
import Api from './api';
import CameraEvents from './../utilitis/events';

const PREVIEW_IMAGE_SIZE = { width: 544, height: 306 };
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
    this._options = options || { convertDetections: DetectionConvertion.RELATIVE, shouldAutoFrame: true };
    this.setMaxListeners(50);
    this._predictionHandler = (detectionBuffer) => {
      const { predictions } = Api.decode(detectionBuffer.payload, 'messagepack');
      const convertedPredictions = this.convertPredictions(predictions, this._options);
      this.emit(CameraEvents.DETECTIONS, convertedPredictions);
    };
    this._framingHandler = (frameBuffer) => {
      const frame = Api.decode(frameBuffer.payload, 'messagepack');
      this.emit(CameraEvents.FRAMING, frame);
      this._frame = frame;
    };
  }

  /**
   * Convenience function for setting up the camera
   * for starting/stopping genius framing. Should be
   * called before any other methods.
   *
   * @returns {Promise<any>} Returns a promise which
   * resolves in case the detector init is completed
   * otherwise it rejects with a rejection message!
   * @memberof Detector
   */
  async init(): Promise<any> {
    if (this._options.shouldAutoFrame !== undefined && this._options.shouldAutoFrame !== null) {
      return this.uploadFramingConfig({ AUTO_PTZ: this._options.shouldAutoFrame });
    }
  }

  /**
   * Starts genius framing on the camera and sets up
   * detection and framing events that can be used to
   * listen to.
   *
   * @returns {Promise<void>} Void Promise.
   * @memberof Detector
   */
  async start(): Promise<void> {
    this._logger.warn('Start cnn enable');
    await this._deviceManager.transport.write('autozoom/enable');
    await this._deviceManager.transport.write('autozoom/start');
    try {
      await this._deviceManager.transport.subscribe('autozoom/predictions');
      this._deviceManager.transport.on('autozoom/predictions', this._predictionHandler);
      await this._deviceManager.transport.subscribe('autozoom/framing');
      this._deviceManager.transport.on('autozoom/framing', this._framingHandler);
    } catch (e) {
      await this._deviceManager.transport.unsubscribe('autozoom/predictions');
      await this._deviceManager.transport.unsubscribe('autozoom/framing');
      this._logger.warn(`Something went wrong getting predictions! Error: ${e}`);
    }
  }

  /**
   * Stops genius framing on the camera and unregisters
   * the listeners for detection and framing information
   *
   * @returns {Promise<void>} Void Promise.
   * @memberof Detector
   */
  async stop(): Promise<void> {
    this._logger.warn('Stop cnn autozoom/disable');
    await this._deviceManager.transport.write('autozoom/disable');
    await this._deviceManager.transport.unsubscribe('autozoom/predictions');
    await this._deviceManager.transport.unsubscribe('autozoom/framing');
    this._deviceManager.transport.removeListener('autozoom/predictions', this._predictionHandler);
    this._deviceManager.transport.removeListener('autozoom/framing', this._framingHandler);
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
    const personPredictions = predictions.filter(({ label }) => label === 'person');

    if (
      opts
      && opts.convertDetections === DetectionConvertion.FRAMING
      && this._frame
    ) {
      const { bbox: framingBBox } = this._frame;
      const relativeSize = {
        height: PREVIEW_IMAGE_SIZE.height / framingBBox.height,
        width: PREVIEW_IMAGE_SIZE.width / framingBBox.width
      };
      return personPredictions.map(({ label, bbox }) => {
        return {
          label: label,
          bbox: {
            x: (bbox.x - framingBBox.x) * relativeSize.width,
            y: (bbox.y - framingBBox.y) * relativeSize.height,
            width: bbox.width * relativeSize.width,
            height: bbox.height * relativeSize.height,
            frameWidth: framingBBox.width * relativeSize.width,
            frameHeight: framingBBox.height * relativeSize.height
          }
        };
      });
    } else {
      return personPredictions.map(({ label, bbox }) => {
        return {
          label: label,
          bbox: {
            x: bbox.x / PREVIEW_IMAGE_SIZE.width,
            y: bbox.y / PREVIEW_IMAGE_SIZE.height,
            width: bbox.width / PREVIEW_IMAGE_SIZE.width,
            height: bbox.height / PREVIEW_IMAGE_SIZE.height,
          }
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
    try {
      const status = await this.autozoomStatus();
      if (!status['network-configured']) {
        this._logger.warn('uploading cnn blob.');
        await this._deviceManager.api.sendAndReceive(blobBuffer,
          {
            send: 'network-blob',
            receive: 'network-blob_reply'
          },
          60000
        );
        this._logger.warn('cnn blob uploaded. unlocking stream');
      } else {
        this._logger.info('Cnn blob already configured!');
      }
    } catch (e) {
      throw e;
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
    try {
      this._logger.warn('Sending detector config!');
      await this._deviceManager.api.sendAndReceive(Api.encode(config),
        {
          send: 'detector/config',
          receive: 'detector/config_reply'
        },
        6000
      );
      this._logger.warn('detector config sent.');
    } catch (e) {
      throw e;
    }
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
    this._logger.warn('Uploading new framing config!');
    try {
      await this._deviceManager.api.sendAndReceive(Api.encode(config),
        {
          send: 'autozoom/framer-config',
          receive: 'autozoom/framer-config_reply',
        },
        60000
      );
    } catch (e) {
      throw e;
    }
  }

  /**
   * Convenience function that is used to fetch the status of
   * genius framing on the camera. Includes information such as
   * whether genius framing is running, the time passed since it
   * is enabled and so on.
   *
   * @returns {Promise<any>} Returns an object with the status properties
   * and values.
   * @memberof Detector
   */
  async autozoomStatus(): Promise<any> {
    try {
      const statusReply = await this._deviceManager.api.sendAndReceive(Buffer.alloc(0),
        {
          send: 'autozoom/status',
          receive: 'autozoom/status_reply'
        });
      const decodedStatus = Api.decode(statusReply.payload, 'messagepack');
      return decodedStatus;
    } catch (e) {
      throw e;
    }
  }
}
