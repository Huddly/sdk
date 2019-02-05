const AzureConnector = require('./azureConnector').default;
const HuddlyDeviceAPIUSB = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;
const PeopleCounter = require('./peopleCounter').default;

const ROOM_NAME = process.env.ROOM_NAME || 'MEETING_ROOM';
const connectionString = process.env.HUDDLY_DEVICE_CONNECTION_STRING;


const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(usbApi, [usbApi]);

async function start() {
  await sdk.init();
  const azureConnector = new AzureConnector(connectionString);
  await azureConnector.init();

  sdk.on('ATTACH', async (cameraManager) => {
    const peopleCounter = new PeopleCounter(cameraManager);
    peopleCounter.on('PEOPLE_COUNT', async detections => {
      await azureConnector.sendEvent({
        room_name: ROOM_NAME,
        serial_number: cameraManager.serialNumber,
        people_count: detections ? detections.length : 0,
      });
    });

    await peopleCounter.init();
  });
}

start();
