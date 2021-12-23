import { EventEmitter } from 'events';

import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import DetectorOpts, {
  DetectionConvertion,
} from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import Api from './api';
import CameraEvents from './../utilitis/events';
import semver from 'semver';
import TypeHelper from './../utilitis/typehelper';
import DetectionsConverter from './../utilitis/detectionsConverter';

const PREVIEW_IMAGE_SIZE = { width: 640, height: 480 };
const LATEST_WITHOUT_PEOPLE_COUNT = '1.3.14';

/**
 * Control class for configuring detector and subscribing to detection information.
 *
 * @export
 * @class Detector
 * @extends {EventEmitter}
 * @implements {IDetector}
 */
export default class Detector extends EventEmitter implements IDetector {
  /** @ignore */
  _deviceManager: IDeviceManager;
  /** @ignore */
  _detectionHandler: any;
  /** @ignore */
  _framingHandler: any;
  /** @ignore */
  _frame: any;
  /** @ignore */
  _options: DetectorOpts;
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

  constructor(manager: IDeviceManager, options?: DetectorOpts) {
    super();
    this._deviceManager = manager;
    this._options = {};
    this._validateOptions(options);
    this.setMaxListeners(50);
  }

  /**
   * @ignore
   *
   * @param {DetectorOpts} options
   * @memberof Detector
   */
  _validateOptions(options: DetectorOpts) {
    const currentSetOpts = this._options;
    this._options = {
      ...currentSetOpts,
      ...options,
    };
    this._options.convertDetections =
      (options && options.convertDetections) || DetectionConvertion.RELATIVE;
    this._options.DOWS = (options && options.DOWS) || false;
    this._options.includeRawDetections = (options && options.includeRawDetections) || false;
  }

  /**
   * @ignore
   *
   * @readonly
   * @type {IUsbTransport}
   * @memberof Detector
   */
  get transport(): IUsbTransport {
    if (TypeHelper.instanceOfUsbTransport(this._deviceManager.transport)) {
      return <IUsbTransport>this._deviceManager.transport;
    }
    throw new Error('Unable to talk to device. Tarnsport must be UsbTransport compatible');
  }

  /**
   * Convenience function for setting detection and/or framing data event listeners.
   *
   * @return {*}  {Promise<any>} Resolves when detector initialization is completed.
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
    this._setupDetectionHandler();

    if (!this._framingHandler) {
      this._framingHandler = (frameBuffer) => {
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

  /**
   * @ignore
   *
   * @memberof Detector
   */
  _setupDetectionHandler() {
    this._detectionHandler = (detectionBuffer) => {
      const rawDetections = Api.decode(detectionBuffer.payload, 'messagepack');
      const convertedDetections = this.convertDetections(rawDetections.predictions, this._options);
      this.emit(CameraEvents.DETECTIONS, convertedDetections);
      if (this._options.includeRawDetections) {
        this.emit(CameraEvents.RAW_DETECTIONS, rawDetections);
      }
    };
  }

  /**
   * Helper function for updating the initial detector options specified when
   * instantiating the Detector class.
   *
   * @param {DetectorOpts} options The new detection options to be used.
   * @return {*}  {Promise<any>} Resolves when the new options have been applied and detector is initialized.
   * @memberof Detector
   */
  async updateOpts(options: DetectorOpts): Promise<any> {
    this._validateOptions(options);
    await this.teardownDetectorSubscriptions();
    this._detectorInitialized = false;
    return this.init();
  }

  /**
   * Control command for tearing down the detector object.
   *
   * @return {*}  {Promise<void>} Resolves when the teardown process is completed.
   * @memberof Detector
   */
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
    const converterOpts = {
      frame: this._frame,
      preview_image_size: PREVIEW_IMAGE_SIZE,
      ...opts,
    };
    return new DetectionsConverter(detections, converterOpts).convert();
  }
}
