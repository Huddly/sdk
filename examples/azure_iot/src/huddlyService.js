const HuddlySdk = require('@huddly/sdk').default;
const CameraEvents = require('@huddly/sdk').CameraEvents;
const DeviceApiUsb = require('@huddly/device-api-usb').default;
const AzureConnector = require('./azureConnector.js');
const os = require('os');


class EventHandler {
  constructor(deviceId, roomName) {
    this.deviceId = deviceId;
    this.roomName = roomName;
    this.azureConnector =  new AzureConnector(deviceId);
    this.eventCache = [];
  }
  async init() {
    await this.azureConnector.init();
  }

  async handleEvent(event) {
    const azureEvent = Object.assign({}, event);
    azureEvent.deviceId = this.deviceId;
    azureEvent.roomName = this.roomName;
    this.azureConnector.sendEvent(azureEvent);
  }
}

class HuddlyService {
  constructor(logger = console) {
    this.logger = logger;
    logger.info('Starting service');
  }

  start() {
    this.huddlySdk = new HuddlySdk(new DeviceApiUsb(), null, {
      logger: this.logger
    });
    
    this.huddlySdk.on(CameraEvents.ATTACH, async (deviceManager) => {
      try {
        const cameraInfo = await deviceManager.getInfo();
        const deviceId = cameraInfo.serialNumber;
        const roomName = process.env.ROOM_NAME || os.hostname;
    
        const eventHandler = new EventHandler(deviceId, roomName);
        this.detector = await deviceManager.getDetector({
          objectFilter: ['person']
        });
        this.detector.on(CameraEvents.DETECTIONS, async (detections) => {
          await eventHandler.handleEvent({
            people: detections ? detections.length : 0,
          });
        });
        this.detector.start();
      } catch (e) {
        this.logger.error('Whoops, we encountered an error. ' + e);
      }
    });
    this.huddlySdk.init();
  }
  
  stop() {
    if (this.detector) {
      this.detector.stop();
    }
    this.huddlySdk = null;
  }
}

module.exports = HuddlyService;