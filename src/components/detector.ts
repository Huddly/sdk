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
import FramingModes from '@huddly/sdk-interfaces/lib/enums/FramingModes';
import MsgBusSubscriber from './msgBusSubscriber';
import { MsgBusSubscriberOptions } from '@huddly/sdk-interfaces/lib/interfaces/IMsgBusSubscriber';

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
  /** @ignore */
  _detectionSubscriber: MsgBusSubscriber;
  /** @ignore */
  _framingSubscriber: MsgBusSubscriber;
  /** @ignore */
  _supportedFramingSubscriptions: Array<FramingModes> = [
    FramingModes.NORMAL,
    FramingModes.GALLERY_VIEW,
  ];

  constructor(manager: IDeviceManager, options?: DetectorOpts) {
    super();
    this._deviceManager = manager;
    this._options = {};
    this._validateOptions(options);
    this.setMaxListeners(50);
    this._detectionSubscriber = new MsgBusSubscriber(
      manager.transport as IUsbTransport,
      this._detectionHandler
    );
    this._framingSubscriber = new MsgBusSubscriber(
      manager.transport as IUsbTransport,
      this._framingHandler
    );
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

  framingSubscriptionCommandMap(framing: FramingModes): string {
    return {
      [FramingModes.NORMAL]: 'autozoom/framing',
      [FramingModes.GALLERY_VIEW]: 'autozoom/plaza/framing',
    }[framing];
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
      framingMode: FramingModes.NORMAL,
    }
  ) {
    try {
      const { detectionListener, framingListener } = listenerConfigOpts;
      const framingMode = listenerConfigOpts.framingMode
        ? listenerConfigOpts.framingMode
        : FramingModes.NORMAL;
      // Detection listener setup
      if (!this._subscriptionsSetup && detectionListener) {
        await this._detectionSubscriber.subscribe({ msgBusCmd: 'autozoom/predictions' });
      }
      // Framing listener setup
      if (!this._subscriptionsSetup && framingListener) {
        await this.updateFramingSubscriber(framingMode, this._framingHandler);
      }
      this._subscriptionsSetup = true;
    } catch (e) {
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
      await this._detectionSubscriber.unsubscribe();
    }

    // Framing listener teardown
    if (this._subscriptionsSetup && listenerConfigOpts.framingListener) {
      this._framingSubscriber.unsubscribe();
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

  /**
   * Update framing subscriber with new framing mode and/or subscription handler
   *
   * @param framingMode New framing mode to listen to
   * @param subscriptionHandler New function for handling the incoming frame buffer
   */
  async updateFramingSubscriber(framingMode: FramingModes, subscriptionHandler?: Function) {
    if (!this._supportedFramingSubscriptions.includes(framingMode)) {
      throw new Error(
        `Framing mode ${framingMode} does not have support for framing subscriptions`
      );
    }

    const framingSubscriberOptions: MsgBusSubscriberOptions = {
      msgBusCmd:
        framingMode !== undefined
          ? this.framingSubscriptionCommandMap(framingMode)
          : this._framingSubscriber.currentSubscription,
      subscriptionHandler,
    };

    await this._framingSubscriber.subscribe(framingSubscriberOptions);
  }
}
