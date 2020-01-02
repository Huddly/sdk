const trackPeopleCount = require('./tracker');
const HuddlyDeviceAPIUSB = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;

const meetingRoomName = process.env.HUDDLY_MEETING_ROOM || 'TEST_ROOM';

const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(usbApi, [usbApi]);

async function init() {
  await sdk.init();

  sdk.on('ATTACH', async (cameraManager) => {
    const detectorOpts = {
      objectFilter: ['person'],
      DOWS: true // Get detection only when streaming main
    };
    const detector = await cameraManager.getDetector(detectorOpts);
    await detector.init();
    // Setup detection listener
    detector.on('DETECTIONS', detections => {
      trackPeopleCount(meetingRoomName, detections.length);
    });

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
}

init();
