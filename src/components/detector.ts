import { EventEmitter } from 'events';
import IDetector from './../interfaces/IDetector';
import IDeviceManager from './../interfaces/iDeviceManager';
import DetectorOpts, { DetectionConvertion } from './../interfaces/IDetectorOpts';
import Api from './api';
import CameraEvents from './../utilitis/events';
import semver from 'semver';
import IUsbTransport from './../interfaces/IUsbTransport';
import TypeHelper from './../utilitis/typehelper';
import Logger from './../utilitis/logger';

const PREVIEW_IMAGE_SIZE = { width: 640, height: 480 };
const LATEST_WITHOUT_PEOPLE_COUNT = '1.3.14';

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
  _detectionHandler: any;
  _framingHandler: any;
  _frame: any;
  _options: DetectorOpts;
  _defaultLabelWhiteList: Array<String> = ['head', 'person'];
  _subscriptionsSetup: boolean = false;
  _detectorInitialized: boolean = false;
  _previewStreamStarted: boolean = false;
  _usePeopleCount: boolean = false;

  /**
   * Creates an instance of Detector.
   * @param {IDeviceManager} manager An instance of the IDeviceManager (for example
   * the Boxfish implementation of IDeviceManager) for communicating with the device.
   * @param {*} logger Logger class for logging messages produced from the detector.
   * @param {DetectorOpts} options options detector.
   * @memberof Detector
   */
  constructor(manager: IDeviceManager, options?: DetectorOpts) {
    super();
    this._deviceManager = manager;
    this._options = {};
    this.validateOptions(options);
    this.setMaxListeners(50);
  }

  validateOptions(options: DetectorOpts) {
    const currentSetOpts = this._options;
    this._options = {
      ...currentSetOpts,
      ...options,
    };
    this._options.convertDetections =
      (options && options.convertDetections) || DetectionConvertion.RELATIVE;
    this._options.DOWS = (options && options.DOWS) || false;
  }

  get transport(): IUsbTransport {
    if (TypeHelper.instanceOfUsbTransport(this._deviceManager.transport)) {
      return <IUsbTransport>this._deviceManager.transport;
    }
    throw new Error('Unable to talk to device. Tarnsport must be UsbTransport compatible');
  }

  /**
   * @ignore
   * Check `IDetector` interface for method documentation.
   * @memberof Detector
   */
  async init(): Promise<any> {
    if (this._detectorInitialized) {
      Logger.warn('Detector already initialized', 'IQ Detector');
      return;
    }

    const cameraInfo = await this._deviceManager.getInfo();
    try {
      this._usePeopleCount = semver.gt(cameraInfo.version, LATEST_WITHOUT_PEOPLE_COUNT);
    } catch (err) {
      Logger.warn('Unable to test camera version with semver.');
      this._usePeopleCount = false;
    }

    Logger.debug('Initializing detector class', 'IQ Detector');
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
      if (this._usePeopleCount) {
        Logger.debug('Sending people_count start command', 'IQ Detector');
        await this.transport.write('people_count/start', Api.encode({ STREAMING_ONLY: false }));
      } else {
        Logger.debug('Sending detector start command', 'IQ Detector');
        await await this.transport.write('detector/start');
      }
      await this.setupDetectorSubscriptions({
        detectionListener: true,
        framingListener: false,
      });
      this._previewStreamStarted = true;
    } else {
      Logger.debug(
        'Setting up detection event listeners. \n\n** NB ** Host application must stream main in order to get detection events',
        'IQ Detector'
      );

      if (this._usePeopleCount) {
        await this.transport.write('people_count/start', Api.encode({ STREAMING_ONLY: true }));
      }

      await this.setupDetectorSubscriptions();
    }
    this._detectorInitialized = true;
    Logger.debug('Detector class initialized and ready', 'IQ Detector');
  }

  async updateOpts(options: DetectorOpts): Promise<any> {
    this.validateOptions(options);
    await this.teardownDetectorSubscriptions();
    this._detectorInitialized = false;
    return this.init();
  }

  async destroy(): Promise<void> {
    if (!this._detectorInitialized) {
      Logger.warn('Detector already destroyed', 'IQ Detector');
      return;
    }

    if (this._usePeopleCount) {
      await this.transport.write('people_count/stop');
    }

    if (!this._options.DOWS && this._previewStreamStarted) {
      Logger.debug(
        'IQ Detector teardown by stopping detection generation on previewstream, unsubscribing to events and unregistering listeners',
        'IQ Detector'
      );
      // Send `[people_count/detector]/stop` only if `[people_count/detector]/start` was called previously
      if (!this._usePeopleCount) {
        await this.transport.write('detector/stop');
      }
      this._previewStreamStarted = false;
      await this.teardownDetectorSubscriptions({
        detectionListener: true,
        framingListener: false,
      });
    } else {
      if (this._usePeopleCount) {
        Logger.debug(
          'IQ Detector teardown by  unsubscribing to events and unregistering listeners'
        );
      }
      Logger.debug(
        `IQ Detector teardown by ${
          this._usePeopleCount ? 'stopping detection generation on previewstream,' : ''
        } unsubscribing to events and unregistering listeners`
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
        await this.transport.subscribe('autozoom/predictions');
        this.transport.on('autozoom/predictions', this._detectionHandler);
      }
      // Framing listener setup
      if (!this._subscriptionsSetup && listenerConfigOpts.framingListener) {
        await this.transport.subscribe('autozoom/framing');
        this.transport.on('autozoom/framing', this._framingHandler);
      }
      this._subscriptionsSetup = true;
    } catch (e) {
      await this.transport.unsubscribe('autozoom/predictions');
      await this.transport.unsubscribe('autozoom/framing');
      Logger.error('Something went wrong getting predictions!', e, 'IQ Detector');
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
      await this.transport.unsubscribe('autozoom/predictions');
      this.transport.removeListener('autozoom/predictions', this._detectionHandler);
    }

    // Framing listener teardown
    if (this._subscriptionsSetup && listenerConfigOpts.framingListener) {
      await this.transport.unsubscribe('autozoom/framing');
      this.transport.removeListener('autozoom/framing', this._framingHandler);
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
