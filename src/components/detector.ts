import { EventEmitter } from 'events';
import IDetector from './../interfaces/IDetector';
import IDeviceManager from './../interfaces/iDeviceManager';
import DetectorOpts, { DetectionConvertion } from './../interfaces/IDetectorOpts';
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
  _detectionHandler: any;
  _framingHandler: any;
  _frame: any;
  _options: DetectorOpts;
  _defaultLabelWhiteList: Array<String> = ['head', 'person'];
  _subscriptionsSetup: boolean = false;
  _detectorInitialized: boolean = false;
  _previewStreamStarted: boolean = false;

  /**
   * Creates an instance of Detector.
   * @param {IDeviceManager} manager An instance of the IDeviceManager (for example
   * the Boxfish implementation of IDeviceManager) for communicating with the device.
   * @param {*} logger Logger class for logging messages produced from the detector.
   * @param {DetectorOpts} options options detector.
   * @memberof Detector
   */
  constructor(manager: IDeviceManager, logger: any, options?: DetectorOpts) {
    super();
    this._deviceManager = manager;
    this._logger = logger;
    this._options = {};
    this._options.convertDetections =
      (options && options.convertDetections) || DetectionConvertion.RELATIVE;
    this._options.DOWS = (options && options.DOWS) || false;
    this.setMaxListeners(50);
  }

  /**
   * @ignore
   * Check `IDetector` interface for method documentation.
   * @memberof Detector
   */
  async init(): Promise<any> {
    if (this._detectorInitialized) {
      this._logger.warn('Detector already initialized', 'IQ Detector');
      return;
    }

    this._logger.debug('Initializing detector class', 'IQ Detector');
    if (!this._detectionHandler) {
      this._detectionHandler = detectionBuffer => {
        const { predictions } = Api.decode(detectionBuffer.payload, 'messagepack');
        const convertedDetections = this.convertDetections(predictions, this._options);
        this.emit(CameraEvents.DETECTIONS, convertedDetections);
      };
    }

    if (!this._framingHandler) {
      this._framingHandler = frameBuffer => {
        const frame = Api.decode(frameBuffer.payload, 'messagepack');
        this.emit(CameraEvents.FRAMING, frame);
        this._frame = frame;
      };
    }

    if (!this._options.DOWS) {
      this._logger.debug('Sending detector start command', 'IQ Detector');
      await this._deviceManager.transport.write('detector/start');
      await this.setupDetectorSubscriptions({
        detectionListener: true,
        framingListener: false,
      });
      this._previewStreamStarted = true;
    } else {
      this._logger.debug(
        'Setting up detection event listeners. \n\n** NB ** Host application must stream main in order to get detection events',
        'IQ Detector'
      );
      await this.setupDetectorSubscriptions();
    }

    this._detectorInitialized = true;
    this._logger.debug('Detector class initialized and ready', 'IQ Detector');
  }

  async destroy(): Promise<void> {
    if (!this._detectorInitialized) {
      this._logger.warn('Detector already destroyed', 'IQ Detector');
      return;
    }

    if (!this._options.DOWS && this._previewStreamStarted) {
      this._logger.debug(
        'IQ Detector teardown by stopping detection generation on previewstream, unsubscribing to events and unregistering listeners',
        'IQ Detector'
      );
      // Send `detector/stop` only if `detector/start` was called previously
      await this._deviceManager.transport.write('detector/stop');
      this._previewStreamStarted = false;
      await this.teardownDetectorSubscriptions({
        detectionListener: true,
        framingListener: false,
      });
    } else {
      this._logger.debug(
        'IQ Detector teardown by unsubscribing to events and unregistering listeners'
      );
      await this.teardownDetectorSubscriptions();
    }
    this._detectorInitialized = false;
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
      if (!this._subscriptionsSetup && listenerConfigOpts.detectionListener) {
        await this._deviceManager.transport.subscribe('autozoom/predictions');
        this._deviceManager.transport.on('autozoom/predictions', this._detectionHandler);
      }
      // Framing listener setup
      if (!this._subscriptionsSetup && listenerConfigOpts.framingListener) {
        await this._deviceManager.transport.subscribe('autozoom/framing');
        this._deviceManager.transport.on('autozoom/framing', this._framingHandler);
      }
      this._subscriptionsSetup = true;
    } catch (e) {
      await this._deviceManager.transport.unsubscribe('autozoom/predictions');
      await this._deviceManager.transport.unsubscribe('autozoom/framing');
      this._logger.error('Something went wrong getting predictions!', e, 'IQ Detector');
      this._subscriptionsSetup = false;
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
    if (this._subscriptionsSetup && listenerConfigOpts.detectionListener) {
      await this._deviceManager.transport.unsubscribe('autozoom/predictions');
      this._deviceManager.transport.removeListener('autozoom/predictions', this._detectionHandler);
    }

    // Framing listener teardown
    if (this._subscriptionsSetup && listenerConfigOpts.framingListener) {
      await this._deviceManager.transport.unsubscribe('autozoom/framing');
      this._deviceManager.transport.removeListener('autozoom/framing', this._framingHandler);
    }
    this._subscriptionsSetup = false;
  }

  /**
   * @ignore
   * Normalizes and filters detection objects so they are relative to image size
   *
   * @param {detections} Array of detections
   * @returns {detections} Converted detections
   * @memberof Detector
   */
  convertDetections(detections: Array<any>, opts?: DetectorOpts): Array<any> {
    let objectFilter = this._defaultLabelWhiteList;
    if (opts && opts.objectFilter) {
      objectFilter = opts.objectFilter;
    }
    const filteredDetections =
      objectFilter.length === 0
        ? detections
        : detections.filter(({ label }) => {
            return objectFilter.some(x => x === label);
          });

    if (opts && opts.convertDetections === DetectionConvertion.FRAMING && this._frame) {
      const { bbox: framingBBox } = this._frame;
      const relativeSize = {
        height: PREVIEW_IMAGE_SIZE.height / framingBBox.height,
        width: PREVIEW_IMAGE_SIZE.width / framingBBox.width,
      };
      return filteredDetections.map(({ label, bbox }) => {
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
      return filteredDetections.map(({ label, bbox }) => {
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
}
