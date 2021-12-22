## Huddly Camera Switch Service
With version **v0.6.0** we added support for Huddly IP Cameras on the SDK and with that a new feature exclusively on windows. This new feature allows you to switch the stream between different Huddly IP cameras used on various windows streaming applications (ex. windows camera app).

This feature can be useful in a multi-cam scenario where you have more than one Huddly IP camera set up on your meeting room and want to use the sdk to control which camera is used to stream on your zoom, google meet or microsoft teams meeting.

The pre-requisites for using this feature are:
- Running on windows 10 or above
- Having the Huddly IP Camera driver and service up and running on your system
- Two or more Huddly IP Camera devices available on your network

### Listing available Huddly IP Cameras
In order to be able to tell the service to switch from one camera to another, you need to be able to list all available cameras on your network and find their corresponding ip addresses. Here is a code snippet that helps you find the list of cameras:

```javascript
const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlyDeviceApiIUsb = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;
const { HUDDLY_L1_PID } = require('@huddly/sdk/lib/src/components/device/factory').default;

const ipApi = new HuddlyDeviceApiIp();
const usbApi = new HuddlyDeviceApiIUsb();
// Create an instance of the SDK
const sdk = new HuddlySdk([usbApi, ipApi], [usbApi, ipApi]);

const applicationTeardown = () => {
  process.exit();
}

const searchTime = 30; // seconds
const cameraList = [];

sdk.on('ATTACH', (huddlyDevice) => {
  if (huddlyDevice.pid == HUDDLY_L1_PID) {
    console.log(`Found [${huddlyDevice.productName}] device!`)
    huddlyDevice.getInfo()
    .then(info => {
      cameraList.push(info)
    })
    .catch((e) => {
      console.error(`Unable to get camera info from [${huddlyDevice.productName}]`)
      console.trace(e);
    }).finally(_ => {
      huddlyDevice.closeConnection();
    });
  }
});

setTimeout(() => {
  console.group('Camera List')
  console.log(cameraList)
  console.groupEnd();
  applicationTeardown();
}, searchTime * 1000)
sdk.init();
```

Running the code snippet above should give you the following result
```shell
Found [Huddly L1] device!
Found [Huddly L1] device!
Camera List
  [
    {
      name: 'L1',
      mac: '90:E2:FC:90:12:EC',
      ipv4: '169.254.98.175',
      serialNumber: '12101A0029',
      modelName: '810-00011-MBLK',
      manufacturer: 'Huddly',
      productId: 1001,
      version: '1.2.6-4302.12+sha.cc52293',
      uptime: 22417.75,
      slot: 'B'
    },
    {
      name: 'L1',
      mac: '90:E2:FC:90:12:ED',
      ipv4: '169.254.98.81',
      serialNumber: '12101A0039',
      modelName: '810-00011-MWHT',
      manufacturer: 'Huddly',
      productId: 1001,
      version: '1.2.6-4302.12+sha.cc52293',
      uptime: 344.75,
      slot: 'B'
    }
  ]

```

### Getting started
Now that you have the information about all the connected Huddly IP cameras on your network, you can use the service to figure out which camera is picked by default by the Huddly IP camera driver, switch to a different camera, set the default camera etc.


The code snipped below will illustrate the camera switch service funcionalities:
```javascript
// Import SDK
const HuddlySdk = require('@huddly/sdk').default;

// Get a new camera switch service instance
const cameraSwitchService = await HuddlySdk.getService();

// Get the active camera currently picked by the driver
const activeCameraObj = await cameraSwitchService.getActiveCamera();

// Get the default camera currently set for the driver (can be empty if not set before)
const defaultCameraObj = await cameraSwitchService.getDefaultCamera();

// Switch between different cameras
const huddlyIpCamera1 = {
  name: "L1",
  ip: '169.254.98.81'
}
const huddlyIpCamera2 = {
  name: "L1",
  ip: '169.254.98.81'
}

// Switch to camera1
await cameraSwitchService.setActiveCamera(huddlyIpCamera1);

// Switch to camera2
await cameraSwitchService.setActiveCamera(huddlyIpCamera2);

// Make camera2 default pick for the driver (persistent across boot)
await cameraSwitchService.setDefaultCamera(huddlyIpCamera2);
```
