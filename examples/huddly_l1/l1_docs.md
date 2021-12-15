# Huddly L1 IP Camera

This page provides with code snippets and examples on how to use the SDK for interacting with the Huddly L1 camera.

## Camera Info
```javascript
const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;
const { HUDDLY_L1_PID } = require('@huddly/sdk/lib/src/components/device/factory').default;

const ipApi = new HuddlyDeviceApiIp();

// Create an instance of the SDK
const sdk = new HuddlySdk(ipApi);

const applicationTeardown = () => {
    process.exit();
}

sdk.on('ATTACH', (aceDevice) => {
    if (aceDevice.pid == HUDDLY_L1_PID) {
        aceDevice.getInfo()
        .then(info => {
            console.log(info);
        })
        .catch((e) => {
            console.trace(e);
        }).finally(_ => {
            aceDevice.closeConnection()
            .then(applicationTeardown);
        });
    }
});

// Call init() to trigger device discovery
sdk.init();
```
Running the above code snippet would print the following information on the console:
```console
{
  name: 'Huddly L1',
  mac: '90:E2:FC:90:12:EC',
  ipv4: '169.254.98.175',
  serialNumber: '12101A0029',
  modelName: '810-00011-MBLK',
  manufacturer: 'Huddly',
  productId: 1001,
  vendorId: 11225,
  version: '1.2.8-4388.21+sha.10b8803',
  uptime: 751.91,
  slot: 'A'
}
```

## Upgrade
```javascript
const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;
const { HUDDLY_L1_PID } = require('@huddly/sdk/lib/src/components/device/factory').default;
const fs = require('fs');

const ipApi = new HuddlyDeviceApiIp();
const sdk = new HuddlySdk(ipApi);
let aceDevice;
let isUpgrading = false;


const applicationTeardown = () => {
    process.exit();
}

const performUpgrade = (attachedDevice, cpioFilePath) => {
    if (!aceDevice || aceDevice['serialNumber'] == newDevice['serialNumber']) {
        aceDevice = newDevice;
        if (isUpgrading) {
            return;
        }
    }
    aceDevice.getInfo()
    .then(info => new Promise((resolve, reject) => {
        console.log(info);
        const upgradeOpts = {
            file: fs.readFileSync(cpioFilePath)
        };
        console.log('Starting software upgrade...');
        isUpgrading = true;
        aceDevice.upgrade(upgradeOpts)
        .then(_ => {
            console.log('Upgrade completed successfully!');
            resolve();
        }).catch(e => {
            console.error('Upgrade failed!');
            reject(e);
        });
    }))
    .catch((e) => {
        console.trace(e);
    }).finally(_ => {
        aceDevice.closeConnection()
        .then(applicationTeardown);
    });
};

if (!process.argv[2]) {
    throw new Error('Please provide the cpio file path as the last argument!');
}


sdk.on('ATTACH', (newDevice) => {
    if (newDevice.pid == HUDDLY_L1_PID) {
        performUpgrade(newDevice, process.argv[2]);
    }
});

// Call init() to trigger device discovery
sdk.init();
```
The code snippet above allows you to performa software upgrades on the L1 camera given that you have the firmware image available. You can run the command below for starting the upgrade process:
```bash
node upgrade.js ~/Path/to/L1_FW_Image.cpio
```

This results in the following console output:
```stdout
{
  name: 'Huddly L1',
  mac: '90:E2:FC:90:12:EC',
  ipv4: '169.254.98.175',
  serialNumber: '12101A0029',
  modelName: '810-00011-MBLK',
  manufacturer: 'Huddly',
  productId: 1001,
  vendorId: 11225,
  version: '1.2.8-4388.21+sha.10b8803',
  uptime: 1353.97,
  slot: 'A'
}
Starting software upgrade...
Upgrade completed successfully!
```

## Detections
```javascript
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
```
Use the code snippet above to get detection data from Huddly L1 camera. You can update the object filter to get `face` detections only or get both. See the `IDetectorOpts` interface for detailed information on the options you can give to the detector.

Here is an example console output after running the snippet above:
```console
Camera is seeing 0 people in total!
Camera is seeing 1 people in total!
Camera is seeing 1 people in total!
Camera is seeing 2 people in total!
Camera is seeing 1 people in total!
Camera is seeing 0 people in total!
```

## PTZ
```javascript
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
```

Use the code snippet above to manually update pan,tilt and zoom values on the Huddly L1 camera. Please note that updating PTZ values manually on the camera will disable the Genius Framing feature.

If you want to re-enable genius framing on the camera you can either do it with the Huddly App, or use the SDK showcased on the example below:

```javascript
/*
* We assume that the SDK setup is already completed
*/
...

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

...
```
