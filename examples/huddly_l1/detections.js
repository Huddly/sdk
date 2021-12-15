const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;
const { HUDDLY_L1_PID } = require('@huddly/sdk/lib/src/components/device/factory').default;

const ipApi = new HuddlyDeviceApiIp();
const sdk = new HuddlySdk(ipApi);
let manager;
let detector;

sdk.on('ATTACH', async (aceDevice) => {
  if (aceDevice.pid == HUDDLY_L1_PID) {
    manager = aceDevice;
    detector = manager.getDetector({ objectFilter: ['person'] });
    detector.on('DETECTIONS', (data) => {
      if (Array.isArray(data)) {
        console.log(`Camera is seeing ${data.length} people in total!`)
      } else {
        console.log(data);
      }
    });
    detector.init();
    process.on('SIGINT', async () => {
      if (detector) {
        await detector.destroy();
        await manager.closeConnection();
      }
      process.exit();
    });
  }
});

sdk.init();