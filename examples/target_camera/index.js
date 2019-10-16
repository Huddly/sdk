const HuddlyDeviceAPIUSB = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;

const meetingRoomName = process.env.HUDDLY_MEETING_ROOM || 'TEST_ROOM';
const cameraSerialNumber = process.env.DETECTIONS_SERIAL_NUMBER || 'SERIAL_OF_TARGET_CAMERA';

const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(usbApi, [usbApi], {
  serial: cameraSerialNumber, // Target a specific camera using serial number
});

sdk.on('ATTACH', async (cameraManager) => {
  const autozoomCtl = cameraManager.getAutozoomControl();
  // Make sure that autozoom (genius framing is started)
  await autozoomCtl.init();
  await autozoomCtl.start();

  // Detector options to get head and person detections without streaming main
  const detectorOpts = {
    // DOWS: false, // DOWS is default false if set to true you only get detections when streaming video!
    objectFilter: ['head', 'person']
  };

  const detector = cameraManager.getDetector(detectorOpts);

  // Setup the detection listener
  detector.on('DETECTIONS', detections => {
    // detection stuff
    console.log(`Got ${detections.length} detections from camera with serial ${cameraManager.serialNumber}`)
  });

  // Calling detector init will initiate the generation of detection events
  detector.init();

  process.on('SIGINT', async () => {
    console.log("\nClosing application gracefully");
    if (detector) {
      console.log('Destroying detector');
      //If you don't destroy the detector correctly the LED on the camera will be left on
      await detector.destroy();
    }

    if (cameraManager) {
      console.log('Closing connection with the camera');
      await cameraManager.closeConnection();
    }
    console.log("\nTeardown completed! Application closed");
    process.exit();
  });
});

sdk.init();
