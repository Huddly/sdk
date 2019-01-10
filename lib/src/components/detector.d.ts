/// <reference types="node" />
import { EventEmitter } from 'events';
import IDetector from './../interfaces/IDetector';
import IDeviceManager from './../interfaces/iDeviceManager';
import iDetectorOpts from './../interfaces/IDetectorOpts';
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
    _defaultBlobURL: string;
    _defaultConfigURL: string;
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
    constructor(manager: IDeviceManager, logger: any, options?: iDetectorOpts);
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
    init(): Promise<any>;
    /**
     * Starts genius framing on the camera and sets up
     * detection and framing events that can be used to
     * listen to.
     *
     * @returns {Promise<void>} Void Promise.
     * @memberof Detector
     */
    start(): Promise<void>;
    /**
     * Stops genius framing on the camera and unregisters
     * the listeners for detection and framing information
     *
     * @returns {Promise<void>} Void Promise.
     * @memberof Detector
     */
    stop(): Promise<void>;
    /**
     * @ignore
     * Normalizes and filters predictions so they are relative to image size
     *
     * @param {predictions} Array of predictions
     * @returns {predictions} Converted predictions
     * @memberof Detector
     */
    convertPredictions(predictions: Array<any>, opts?: iDetectorOpts): Array<any>;
    /**
     * @ignore
     * Uploads the detector blob to the camera.
     *
     * @param {Buffer} blobBuffer The blob buffer to be uploaded to the camera.
     * @returns {Promise<void>} Void Promise.
     * @memberof Detector
     */
    uploadBlob(blobBuffer: Buffer): Promise<void>;
    /**
     * @ignore
     * Uploads the configuration file for the detector.
     *
     * @param {JSON} config JSON file representing the detector configuration.
     * @returns {Promise<void>} Void Promise.
     * @memberof Detector
     */
    setDetectorConfig(config: JSON): Promise<void>;
    /**
     * @ignore
     * Uploads the framing configuration file on the camera for using
     * new framing ruleset.
     *
     * @param {JSON} config JSON file representing the framing configuration.
     * @returns {Promise<void>} Void Promise.
     * @memberof Detector
     */
    uploadFramingConfig(config: JSON): Promise<void>;
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
    autozoomStatus(): Promise<any>;
}
