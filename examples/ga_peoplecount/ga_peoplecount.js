const trackPeopleCount = require('./tracker');
const HuddlyDeviceAPIUSB = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;

const meetingRoomName = process.env.HUDDLY_MEETING_ROOM || 'TEST_ROOM';

const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(opts, usbApi, [usbApi]);

async function init() {
  await sdk.initialize();

  const detector = await sdk.getDetector(cameraManager);
  await detector.initialize();

  detector.on('detection', detections => {
    trackPeopleCount(meetingRoomName, detections.length);
  });

  detector.start();
}

init();
