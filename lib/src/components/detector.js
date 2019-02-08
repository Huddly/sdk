"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const IDetectorOpts_1 = require("./../interfaces/IDetectorOpts");
const api_1 = __importDefault(require("./api"));
const events_2 = __importDefault(require("./../utilitis/events"));
const axios_1 = __importDefault(require("axios"));
const framingconfig_1 = require("./../utilitis/framingconfig");
const PREVIEW_IMAGE_SIZE = { width: 544, height: 306 };
/**
 * Detector class used to configure genius framing on the camera.
 *
 * @export
 * @class Detector
 * @extends {EventEmitter}
 * @implements {IDetector}
 */
class Detector extends events_1.EventEmitter {
    /**
     * Creates an instance of Detector.
     * @param {IDeviceManager} manager An instance of the IDeviceManager (for example
     * the Boxfish implementation of IDeviceManager) for communicating with the device.
     * @param {*} logger Logger class for logging messages produced from the detector.
     * @param options options detector.
     * @memberof Detector
     */
    constructor(manager, logger, options) {
        super();
        this._defaultBlobURL = 'https://autozoom.blob.core.windows.net/detectors-public/huddly_az_v8_ncsdk_02_08.blob';
        this._defaultConfigURL = 'https://autozoom.blob.core.windows.net/detectors-public/config.json';
        this._deviceManager = manager;
        this._logger = logger;
        this._options = options || { convertDetections: IDetectorOpts_1.DetectionConvertion.RELATIVE, shouldAutoFrame: true };
        this.setMaxListeners(50);
        this._predictionHandler = (detectionBuffer) => {
            const { predictions } = api_1.default.decode(detectionBuffer.payload, 'messagepack');
            const convertedPredictions = this.convertPredictions(predictions, this._options);
            this.emit(events_2.default.DETECTIONS, convertedPredictions);
        };
        this._framingHandler = (frameBuffer) => {
            const frame = api_1.default.decode(frameBuffer.payload, 'messagepack');
            this.emit(events_2.default.FRAMING, frame);
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
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            const configData = framingconfig_1.getFramingConfig();
            if (this._options.shouldAutoFrame !== undefined && this._options.shouldAutoFrame !== null) {
                configData.AUTO_PTZ = this._options.shouldAutoFrame;
                yield this.uploadFramingConfig(configData);
            }
            else {
                yield this.uploadFramingConfig(configData);
            }
            const status = yield this.autozoomStatus();
            if (!status['network-configured']) {
                return new Promise((resolve, reject) => {
                    axios_1.default.get(this._defaultBlobURL, { responseType: 'arraybuffer' })
                        .then(res => res.data)
                        .then(buffer => this.uploadBlob(buffer)
                        .then(() => axios_1.default.get(this._defaultConfigURL, { responseType: 'json' })
                        .then(configRes => configRes.data)
                        .then(configJson => this.setDetectorConfig(configJson)
                        .then(() => resolve())
                        .catch(setConfigErr => reject(setConfigErr)))
                        .catch(fetchConfigErr => reject(fetchConfigErr)))
                        .catch(uploadBlobErr => reject(uploadBlobErr)))
                        .catch(fetchBlobErr => reject(fetchBlobErr));
                });
            }
            return Promise.resolve();
        });
    }
    /**
     * Starts genius framing on the camera and sets up
     * detection and framing events that can be used to
     * listen to.
     *
     * @returns {Promise<void>} Void Promise.
     * @memberof Detector
     */
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.warn('Start cnn enable');
            yield this._deviceManager.transport.write('autozoom/enable');
            yield this._deviceManager.transport.write('autozoom/start');
            try {
                yield this._deviceManager.transport.subscribe('autozoom/predictions');
                this._deviceManager.transport.on('autozoom/predictions', this._predictionHandler);
                yield this._deviceManager.transport.subscribe('autozoom/framing');
                this._deviceManager.transport.on('autozoom/framing', this._framingHandler);
            }
            catch (e) {
                yield this._deviceManager.transport.unsubscribe('autozoom/predictions');
                yield this._deviceManager.transport.unsubscribe('autozoom/framing');
                this._logger.warn(`Something went wrong getting predictions! Error: ${e}`);
            }
        });
    }
    /**
     * Stops genius framing on the camera and unregisters
     * the listeners for detection and framing information
     *
     * @returns {Promise<void>} Void Promise.
     * @memberof Detector
     */
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.warn('Stop cnn autozoom/disable');
            yield this._deviceManager.transport.write('autozoom/disable');
            yield this._deviceManager.transport.unsubscribe('autozoom/predictions');
            yield this._deviceManager.transport.unsubscribe('autozoom/framing');
            this._deviceManager.transport.removeListener('autozoom/predictions', this._predictionHandler);
            this._deviceManager.transport.removeListener('autozoom/framing', this._framingHandler);
        });
    }
    /**
     * @ignore
     * Normalizes and filters predictions so they are relative to image size
     *
     * @param {predictions} Array of predictions
     * @returns {predictions} Converted predictions
     * @memberof Detector
     */
    convertPredictions(predictions, opts) {
        const personPredictions = predictions.filter(({ label }) => label === 'person');
        if (opts
            && opts.convertDetections === IDetectorOpts_1.DetectionConvertion.FRAMING
            && this._frame) {
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
        }
        else {
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
    uploadBlob(blobBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const status = yield this.autozoomStatus();
                if (!status['network-configured']) {
                    this._logger.warn('uploading cnn blob.');
                    yield this._deviceManager.api.sendAndReceive(blobBuffer, {
                        send: 'network-blob',
                        receive: 'network-blob_reply'
                    }, 60000);
                    this._logger.warn('cnn blob uploaded. unlocking stream');
                }
                else {
                    this._logger.info('Cnn blob already configured!');
                }
            }
            catch (e) {
                throw e;
            }
        });
    }
    /**
     * @ignore
     * Uploads the configuration file for the detector.
     *
     * @param {JSON} config JSON file representing the detector configuration.
     * @returns {Promise<void>} Void Promise.
     * @memberof Detector
     */
    setDetectorConfig(config) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                this._logger.warn('Sending detector config!');
                yield this._deviceManager.api.sendAndReceive(api_1.default.encode(config), {
                    send: 'detector/config',
                    receive: 'detector/config_reply'
                }, 6000);
                this._logger.warn('detector config sent.');
            }
            catch (e) {
                throw e;
            }
        });
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
    uploadFramingConfig(config) {
        return __awaiter(this, void 0, void 0, function* () {
            this._logger.warn('Uploading new framing config!');
            try {
                yield this._deviceManager.api.sendAndReceive(api_1.default.encode(config), {
                    send: 'autozoom/framer-config',
                    receive: 'autozoom/framer-config_reply',
                }, 60000);
            }
            catch (e) {
                throw e;
            }
        });
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
    autozoomStatus() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const statusReply = yield this._deviceManager.api.sendAndReceive(Buffer.alloc(0), {
                    send: 'autozoom/status',
                    receive: 'autozoom/status_reply'
                });
                const decodedStatus = api_1.default.decode(statusReply.payload, 'messagepack');
                return decodedStatus;
            }
            catch (e) {
                throw e;
            }
        });
    }
}
exports.default = Detector;
//# sourceMappingURL=detector.js.map