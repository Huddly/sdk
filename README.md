
<img class="huddly-logo" width="200px" height="auto" src="https://developer.huddly.io/assets/imgs/huddly.png" />

# Huddly Software Development Kit (SDK)

## Prerequisites
You have to use node version ```8.9.4```, we recommend using nvm for this (https://github.com/creationix/nvm).

After you've setup nvm run
```
  nvm use 8.9.4
```

## Get started
Then you can install and start using the huddly sdk you need first install it and the transport
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

setup ```camera attached``` subscriber, this will give you a camera than has been attached.

```javascript
// Create a instance that will represent the `IDeviceManager` interface
let cameraManager;
sdk.on('ATTACH', (d) => {
  cameraManager = d;
});
```

then initialize it

```javascript
sdk.init();
```

Then you should be good to go, try it should print the camera information when the camera is attached.

```javascript
sdk.on('ATTACH', (d) => {
  cameraManager = d;
  cameraManager.getInfo().then(console.log);
});
```
## Issues
If you have a question or found a bug please open an issue. Thank you


## Documentation
For more details on the rest of the functionality to the sdk check out the documentation for the sdk class and the cameraManager interface.

 - [SDK](https://developer.huddly.io/classes/HuddlySdk.html)
 - [CameraManager](https://developer.huddly.io/interfaces/IDeviceManager.html)
 - [Detector](https://developer.huddly.io/interfaces/IDetector.html)
