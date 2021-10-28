import { EventEmitter } from 'events';
import IDetector from './../interfaces/IDetector';
import IIpDeviceManager from '../interfaces/iIpDeviceManager';
import DetectorOpts from './../interfaces/IDetectorOpts';
import CameraEvents from './../utilitis/events';
import DetectionsConverter from './../utilitis/detectionsConverter';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import Logger from './../utilitis/logger';
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

  constructor(manager: IIpDeviceManager, options?: DetectorOpts) {
    super();
    this._deviceManager = manager;
    this._options = options || {};
    this._options.DOWS = (options && options.DOWS) || false;
  }

  async init(): Promise<any> {
    if (this._detectorInitialized) {
      Logger.warn('Detector already initialized', 'L1 Detector');
      return;
    }
    Logger.debug('Initializing detector class', 'L1 Detector');

    // _detectionHandler fetches detections from the grpc server and emits them.
    if (!this._detectionHandler) {
      this._detectionHandler = async () => {
        try {
          const detections = await this._getDetections();
          const convertedDetections = this.convertDetections(detections, this._options);
          this.emit(CameraEvents.DETECTIONS, convertedDetections);
        } catch (error) {
          Logger.warn(
            `Unable to get detection data from the camera! Make sure you're running latest camera fimware.\n${error}`
          );
        }
      };
    }
    if (!this._options.DOWS) {
      await this._startDetections();
    }
    this._intervalId = setInterval(this._detectionHandler, this._UPDATE_INTERVAL);
    this._detectorInitialized = true;
    Logger.debug('Detector class initialized and ready', 'L1 Detector');
  }

  _getDetections(): Promise<Array<any>> {
    return new Promise((resolve, reject) => {
      this._deviceManager.grpcClient.getDetections(
        new Empty(),
        (err, detections: huddly.Detections) => {
          if (err != undefined) {
            Logger.error('Unable to get detections', err.stack || '');
            reject(err.message || 'Unknown error');
            return;
          }
          resolve(detections.toObject().detectionsList || []);
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
      cnnFeature.setMode(huddly.Mode.START);
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
