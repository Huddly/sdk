const HuddlySdk = require('@huddly/sdk').default;
const CameraEvents = require('@huddly/sdk').CameraEvents;
const DeviceApiUsb = require('@huddly/device-api-usb').default;

const huddlySdk = new HuddlySdk(new DeviceApiUsb());

huddlySdk.on(CameraEvents.ATTACH, async (deviceManager) => {
  this.deviceManager = deviceManager;
  this.autozoomCtl = this.deviceManager.getAutozoomControl();
  await this.autozoomCtl.init();
  await this.autozoomCtl.start();
  this.detector = this.deviceManager.getDetector();
  this.detector.on(CameraEvents.DETECTIONS, (detections) => {
    console.log(detections);
  });
  this.detector.init();
});

process.on('SIGINT', async () => {
  // Keyboard interrupt signal

  if (this.detector) {
    await this.detector.destroy();
  }

  if(this.autozoomCtl) {
    await this.autozoomCtl.stop();
  }

  if (this.deviceManager) {
    await this.deviceManager.closeConnection();
  }
  console.log("\nApplication successfully closed!");
  process.exit();
});

huddlySdk.init();
