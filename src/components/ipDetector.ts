import { EventEmitter } from 'events';
import IDetector from './../interfaces/IDetector';
import IIpDeviceManager from '../interfaces/iIpDeviceManager';
import DetectorOpts, { DetectionConvertion } from './../interfaces/IDetectorOpts';
import CameraEvents from './../utilitis/events';
import DetectionsConverter from './../utilitis/detectionsConverter';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import Logger from './../utilitis/logger';
import throttle from './../utilitis/throttle';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

const PREVIEW_IMAGE_SIZE = { width: 832, height: 480 };

export default class IpDetector extends EventEmitter implements IDetector {
  _deviceManager: IIpDeviceManager;
  _detectionHandler: any;
  _framingHandler: any;
  _frame: any;
  _options: DetectorOpts;
  _intervalId: NodeJS.Timeout;
  _defaultLabelWhiteList: Array<String> = ['head', 'person'];
  _subscriptionsSetup: boolean = false;
  _detectorInitialized: boolean = false;
  _previewStreamStarted: boolean = false;
  _usePeopleCount: boolean = false;
  _UPDATE_INTERVAL: number = 500; // ms
  _detectorWasStarted: boolean = false;
  _lastTimestamp: number = undefined;

  constructor(manager: IIpDeviceManager, options?: DetectorOpts) {
    super();
    this._deviceManager = manager;
    this._options = options || {};
    this._validateOptions(this._options);
  }

  async init(): Promise<any> {
    if (this._detectorInitialized) {
      Logger.warn('Detector already initialized', 'L1 Detector');
      return;
    }
    Logger.debug('Initializing detector class', 'L1 Detector');

    this._setupDetectionHandler();
    if (!this._options.DOWS) {
      await this._startDetections();
    }
    this._intervalId = setInterval(
      () => this._getDetections().then(this._detectionHandler),
      this._UPDATE_INTERVAL
    );
    this._detectorInitialized = true;
    Logger.debug('Detector class initialized and ready', 'L1 Detector');
  }

  _validateOptions(options: DetectorOpts) {
    if (options.convertDetections && options.convertDetections === DetectionConvertion.FRAMING) {
      Logger.warn(
        'FRAMING opt is not fully supported on L1 yet. Convertion may not work as intended',
        'L1 Detector'
      );
    }
    const currentSetOpts = this._options;
    this._options = {
      ...currentSetOpts,
      ...options,
    };
    this._options.DOWS = (options && options.DOWS) || false;
    this._options.includeRawDetections = (options && options.includeRawDetections) || false;
  }

  _setupDetectionHandler() {
    // A negative timestamp means the IMX has not received any detections
    const detectionsAreInvalid = ({ timestamp }) => timestamp < 0.0;
    // A timestamp of 0 is the default value, which will be the case for older L1-versions which do not set the timestamp
    const detectionsAreStale = ({ timestamp }) =>
      timestamp !== 0 && timestamp === this._lastTimestamp;

    const throttledInvalidWarning = throttle(() => {
      Logger.warn(
        'Invalid detections received, ensure detector is running / autozoom is on and stream is open.',
        'L1 Detector'
      );
    }, 10000);

    this._detectionHandler = (detectionBuffer) => {
      const rawDetections = detectionBuffer.toObject();
      if (detectionsAreInvalid(rawDetections)) {
        throttledInvalidWarning();
        return;
      }
      if (detectionsAreStale(rawDetections)) {
        return;
      }
      this._lastTimestamp = rawDetections.timestamp;
      const convertedDetections = this.convertDetections(
        rawDetections.detectionsList,
        this._options
      );
      this.emit(CameraEvents.DETECTIONS, convertedDetections);
      if (this._options.includeRawDetections) {
        // Workaround until this is fixed camera side
        if (rawDetections.detectionsList[0] && rawDetections.detectionsList[0].label === 'NULL') {
          rawDetections.detectionsList = [];
        }
        this.emit(CameraEvents.RAW_DETECTIONS, rawDetections);
      }
    };
  }

  _getDetections(): Promise<huddly.Detections> {
    return new Promise((resolve, reject) => {
      this._deviceManager.grpcClient.getDetections(
        new Empty(),
        (err, detections: huddly.Detections) => {
          if (err != undefined) {
            Logger.error('Unable to get detections', err.stack || '');
            reject(err.message || 'Unknown error');
          }
          resolve(detections);
        }
      );
    });
  }

  _startDetections(): Promise<void> {
    if (this._detectorWasStarted) {
      Logger.error('Detector already started', '', 'L1 Detector');
      return;
    }
    return new Promise((resolve, reject) => {
      const cnnFeature = new huddly.CnnFeature();
      cnnFeature.setFeature(huddly.Feature.DETECTOR);
      cnnFeature.setMode(huddly.Mode.START);
      this._deviceManager.grpcClient.setCnnFeature(
        cnnFeature,
        (err, status: huddly.DeviceStatus) => {
          if (err != undefined) {
            Logger.error('Unable to start detections on L1', err.stack || '', 'L1 Detector');
            reject(err.message);
            return;
          }
          Logger.info(status.toString());
          this._detectorWasStarted = true;
          resolve();
        }
      );
    });
  }

  _stopDetections(): Promise<void> {
    if (!this._detectorWasStarted) {
      Logger.error('Detector has not been started', '', 'L1 Detector');
      return;
    }
    return new Promise((resolve, reject) => {
      const cnnFeature = new huddly.CnnFeature();
      cnnFeature.setFeature(huddly.Feature.DETECTOR);
      cnnFeature.setMode(huddly.Mode.STOP);
      this._deviceManager.grpcClient.setCnnFeature(
        cnnFeature,
        (err, status: huddly.DeviceStatus) => {
          if (err != undefined) {
            Logger.error('Unable to stop detections on L1', err.stack || '', 'L1 Detector');
            reject(err.message);
            return;
          }
          Logger.info(status.toString());
          this._detectorWasStarted = false;
          resolve();
        }
      );
    });
  }

  async updateOpts(options: DetectorOpts): Promise<any> {
    this._validateOptions(options);
    if (this._intervalId) {
      clearInterval(this._intervalId);
    }
    this._detectorInitialized = false;
    return this.init();
  }

  async destroy(): Promise<void> {
    if (!this._detectorInitialized) {
      Logger.warn('Detector already destroyed', 'L1 Detector');
      return;
    }
    if (this._intervalId) {
      clearInterval(this._intervalId);
    }
    if (this._detectorWasStarted) {
      Logger.debug('Sending stop-cnn Detector command', 'L1 Detector');
      this._stopDetections();
    }
    this._detectorInitialized = false;
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
    const converterOpts = {
      frame: { ...this._frame },
      preview_image_size: { ...PREVIEW_IMAGE_SIZE },
      ...opts,
    };
    return new DetectionsConverter(detections, converterOpts).convert();
  }
}
