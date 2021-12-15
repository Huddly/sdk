const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;
const { HUDDLY_L1_PID } = require('@huddly/sdk/lib/src/components/device/factory').default;

const ipApi = new HuddlyDeviceApiIp();
const sdk = new HuddlySdk(ipApi);
let manager;
let azController;

let enable = process.argv[2] || 1;

sdk.on('ATTACH', async (aceDevice) => {
  if (aceDevice.pid == HUDDLY_L1_PID) {
    manager = aceDevice;
    azController = manager.getAutozoomControl();
    await azController.init();
    if (parseInt(enable) == 1) {
      console.log('Enabling autozoom.....');
      await azController.enable();
    } else {
      console.log('Disabling autozoom.....');
      await azController.disable();
    }
    process.exit();
  }
});

sdk.init();