
<img class="huddly-logo" src="/assets/imgs/huddly.ico" />

# Huddly Software Development Kit (SDK)

## Get started
To install and start using the huddly sdk you need first install it and the transport
```
  npm install @huddly/sdk @huddly/device-api-usb
```

Start by creating the sdk and the transport

```javascript
const HuddlyDeviceAPIUSB = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;

// Create instances of device-apis you want to use
const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(usbApi);
```

setup camera attached subscriber, this will give you a camera than has been attached.

```javascript
// Create a instance that will represent the `IDeviceManager` interface
let cameraManager;
sdk.on('ATTACH', (d) => {
  cameraManager = d;
});
```

then initialize it

```javascript
sdk.initialize();
```

Then you should be good to go, try it should print the camera information for the attached camera.

```javascript
  cameraManager.getInfo().then(console.log);
```

## Documentation
For more details on the rest of the functionality to the sdk check out the documentation for the sdk class and the cameraManager interface.

 - [SDK](classes/HuddlySdk.html)
 - [CameraManager](interfaces/IDeviceManager.html)
 - [Detector](interfaces/IDetector.html)
