const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;
const { HUDDLY_L1_PID } = require('@huddly/sdk/lib/src/components/device/factory').default;

const ipApi = new HuddlyDeviceApiIp();
const sdk = new HuddlySdk(ipApi);

if (!process.argv[2]) {
  throw new Error('Provide ptz data comma separated. Ex: node ptz.js 0,0,1000');
}
const ptz = process.argv[2].split(',');

if (ptz.length < 3) {
  throw new Error('You need to specify all three values as a comma separated argument!');
}

const pan = ptz[0];   // Default value for pan is 0
const tilt = ptz[1];  // Default value for tilt is 0
const zoom = ptz[2];  // Default value for zoom is 1000

sdk.on('ATTACH', (aceDevice) => {
  if (aceDevice.pid == HUDDLY_L1_PID) {
    aceDevice.setPanTiltZoom({
      pan,
      tilt,
      zoom
    }).then(() => console.log('PTZ updated on the camera!'))
    .catch((e) => console.error(e))
    .finally(async () => {
      if (aceDevice) {
        await aceDevice.closeConnection()
      }
      process.exit();
    });
  }
});

sdk.init();
