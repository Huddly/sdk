import { EventEmitter } from 'events';
import IDetector from './../interfaces/IDetector';
import IDeviceManager from './../interfaces/iDeviceManager';
import Api from './api';
import CameraEvents from './../utilitis/events';

export default class Detector extends EventEmitter implements IDetector {
  _deviceManager: IDeviceManager;
  _logger: any;
  _predictionHandler: any;
  _framingHandler: any;

  constructor(manager: IDeviceManager, logger: any) {
    super();
    this._deviceManager = manager;
    this._logger = logger;
    this.setMaxListeners(50);
    this._predictionHandler = (detectionBuffer) => {
      const { predictions } = Api.decode(detectionBuffer.payload, 'messagepack');
      this._logger.warn(`predictions: ${predictions}`);
      this.emit(CameraEvents.DETECTIONS, predictions);
    };
    this._framingHandler = (frameBuffer) => {
      const frame = Api.decode(frameBuffer.payload, 'messagepack');
      this._logger.warn('Framing Info', frame);
      this.emit(CameraEvents.FRAMING, frame);
    };
  }


  async start(): Promise<void> {
    this._logger.warn('Start cnn');
    const status = await this.autozoomStatus();
    if (!status['autozoom-enabled']) {
      await this._deviceManager.transport.write('autozoom/start');
    } else {
      this._logger.info('Autozoom already started!');
    }
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

  async stop(): Promise<void> {
    this._logger.warn('Stop cnn');
    const status = await this.autozoomStatus();
    if (status['autozoom-enabled']) {
      await this._deviceManager.transport.write('autozoom/stop');
    }
    await this._deviceManager.transport.unsubscribe('autozoom/predictions');
    await this._deviceManager.transport.unsubscribe('autozoom/framing');
    this._deviceManager.transport.removeListener('autozoom/predictions', this._predictionHandler);
    this._deviceManager.transport.removeListener('autozoom/framing', this._framingHandler);
  }

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

  async setDetectorConfig(config: JSON): Promise<void> {
    try {
      this._logger.warn('sending detector config.');
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

  async uploadFramingConfig(config: JSON): Promise<void> {
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

  // async getFraming() {
  //   return this.api.receive('autozoom/framing');
  // }
}
