const HuddlySdk = require('@huddly/sdk').default;
const DeviceApiUsb = require('@huddly/device-api-usb').default;

const huddlySdk = new HuddlySdk(new DeviceApiUsb());

huddlySdk.on('ATTACH', async (deviceManager) => {
  const info = await deviceManager.getInfo();
  console.log('Woho, we have a device. ' +
    `Serial Number ${info.serialNumber} ` +
    `Software Version: ${info.version}`);
  process.exit(0);
});

huddlySdk.init();
