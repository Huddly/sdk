const trackPeopleCount = require('./tracker');
const HuddlyDeviceAPIUSB = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;

const meetingRoomName = process.env.HUDDLY_MEETING_ROOM || 'TEST_ROOM';

const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(usbApi, [usbApi]);

async function init() {
  await sdk.init();

  sdk.on('ATTACH', (cameraManager) => {
    const detector = await cameraManager.getDetector();
    await detector.init();

    detector.on('DETECTIONS', detections => {
      trackPeopleCount(meetingRoomName, detections.length);
    });

    detector.start();
  });
}

init();
