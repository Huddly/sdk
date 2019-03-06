const fs = require('fs');

const HuddlyDeviceAPIUSB = require('@huddly/device-api-usb').default;
const HuddlySdk = require('./lib/src').default;

// Create instances of device-apis you want to use
const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(usbApi);


let cameraManager;

console.log(process.argv);
sdk.init();

async function onAttach(d) {
  if (cameraManager) {
    return;
  }
  console.log('----------------- UPGRADE __________________________________');
  sdk.removeListener('ATTACH', onAttach);
  cameraManager = d;
  const opts = {
    file: fs.readFileSync(process.argv[2])
  }
  await cameraManager.upgrade(opts);
  process.exit(0);
}
sdk.on('ATTACH', onAttach);
