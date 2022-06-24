import { EventEmitter } from 'events';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import IIpDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IIpDeviceManager';
import DetectorOpts, {
  DetectionConvertion,
} from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import CameraEvents from './../utilitis/events';
import DetectionsConverter, { ImageSize } from './../utilitis/detectionsConverter';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import throttle from './../utilitis/throttle';
import { Empty } from 'google-protobuf/google/protobuf/empty_pb';

/**
 * Control class for configuring detector and subscribing to detection information.
 *
 * @export
 * @class IpDetector
 * @extends {EventEmitter}
 * @implements {IDetector}
 */
export default class IpDetector extends EventEmitter implements IDetector {
  /** @ignore */
  _deviceManager: IIpDeviceManager;
  /** @ignore */
  _imageSize: ImageSize;
  /** @ignore */
  _detectionHandler: any;
  /** @ignore */
  _framingHandler: any;
  /** @ignore */
  _frame: any;
  /** @ignore */
  _options: DetectorOpts;
  /** @ignore */
  _intervalId: NodeJS.Timeout;
  /** @ignore */
  _defaultLabelWhiteList: Array<String> = ['head', 'person'];
  /** @ignore */
  _subscriptionsSetup: boolean = false;
  /** @ignore */
  _detectorInitialized: boolean = false;
  /** @ignore */
  _previewStreamStarted: boolean = false;
  /** @ignore */
  _usePeopleCount: boolean = false;
  /** @ignore */
  _UPDATE_INTERVAL: number = 500; // ms
  /** @ignore */
  _detectorWasStarted: boolean = false;
  /** @ignore */
  _lastTimestamp: number = undefined;

  constructor(manager: IIpDeviceManager, imageSize: ImageSize, options?: DetectorOpts) {
    super();
    this._deviceManager = manager;
    this._imageSize = imageSize;
    this._options = options || {};
    this._validateOptions(this._options);
  }

  /**
   * Convenience function for setting detection and/or framing data event listeners.
   *
   * @return {*}  {Promise<any>} Resolves when detector initialization is completed.
   * @memberof IpDetector
   */
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
    this._intervalId = global.setInterval(
      () => this._getDetections().then(this._detectionHandler),
      this._UPDATE_INTERVAL
    );
    this._detectorInitialized = true;
    Logger.debug('Detector class initialized and ready', 'L1 Detector');
  }

  /**
   * @ignore
   *
   * @param {DetectorOpts} options
   * @memberof IpDetector
   */
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

  /**
   * @ignore
   *
   * @memberof IpDetector
   */
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

  /**
   * Fetches detection information from camera.
   *
   * @return {*}  {Promise<huddly.Detections>} An object representing detection data retreived from the camera.
   * The object type is described in the IP camera proto file.
   * @memberof IpDetector
   */
  _getDetections(): Promise<huddly.Detections> {
    return new Promise((resolve, reject) => {
      this._deviceManager.grpcClient.getDetections(
        new Empty(),
        (err, detections: huddly.Detections) => {
          if (err != undefined) {
            Logger.error('Unable to get detections', err.stack || '');
            reject(err.message || 'Unknown error');
            return;
          }
          resolve(detections);
        }
      );
    });
  }

  /**
   * Control command for starting detection feature.
   *
   * @return {*}  {Promise<void>} Resolves when the detection feature is started.
   * @memberof IpDetector
   */
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

  /**
   * Control command for stopping detection feature.
   *
   * @return {*}  {Promise<void>} Resolves when the detection feature is stopped.
   * @memberof IpDetector
   */
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

  /**
   * Helper function for updating the initial detector options specified when
   * instantiating the Detector class.
   *
   * @param {DetectorOpts} options The new detection options to be used.
   * @return {*}  {Promise<any>} Resolves when the new options have been applied and detector is initialized.
   * @memberof IpDetector
   */
  async updateOpts(options: DetectorOpts): Promise<any> {
    this._validateOptions(options);
    if (this._intervalId) {
      clearInterval(this._intervalId);
    }
    this._detectorInitialized = false;
    return this.init();
  }

  /**
   * Control command for tearing down the detector object.
   *
   * @return {*}  {Promise<void>} Resolves when the teardown process is completed.
   * @memberof IpDetector
   */
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
      await this._stopDetections();
    }
    this._detectorInitialized = false;
  }

  /**
   * Normalizes and filters detection objects so they are relative to image size.
   *
   * @ignore
   *
   * @param {Array<any>} detections Array of detections
   * @param {DetectorOpts} [opts] Returns an array of detections
   * @return {*}  {Array<any>}
   * @memberof IpDetector
   */
  convertDetections(detections: Array<any>, opts?: DetectorOpts): Array<any> {
    const converterOpts = {
      frame: { ...this._frame },
      preview_image_size: { ...this._imageSize },
      ...opts,
    };
    return new DetectionsConverter(detections, converterOpts).convert();
  }
}
