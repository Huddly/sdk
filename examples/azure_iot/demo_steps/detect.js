const HuddlySdk = require('@huddly/sdk').default;
const CameraEvents = require('@huddly/sdk').CameraEvents;
const DeviceApiUsb = require('@huddly/device-api-usb').default;

const huddlySdk = new HuddlySdk(new DeviceApiUsb());

huddlySdk.on(CameraEvents.ATTACH, async (deviceManager) => {
  const detector = await deviceManager.getDetector();
  detector.on(CameraEvents.DETECTIONS, (detections) => {
    console.log(detections);
  });
  detector.start();
});

huddlySdk.init();
