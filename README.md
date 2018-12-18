<p>
  <a href="https://travis-ci.com/Huddly/sdk"><img src="https://travis-ci.com/Huddly/sdk.svg?branch=master" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/@huddly/sdk"><img src="https://badge.fury.io/js/%40huddly%2Fsdk.svg" alt="npm badge"></a>
  <a href="https://img.shields.io/david/Huddly/sdk"><img src="https://img.shields.io/david/Huddly/sdk.svg" alt="npm dependencies"></a>
  <!-- <a href="https://img.shields.io/david/dev/Huddly/sdk"><img src="https://img.shields.io/david/dev/Huddly/sdk.svg" alt="npm devDependencies"></a> -->
  <a href="https://npmcharts.com/compare/@huddly/sdk?minimal=true"><img src="https://img.shields.io/npm/dm/@huddly/sdk.svg?style=flat" alt="NPM Downloads"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="MIT badge"></a>
</p>

<img class="huddly-logo" width="200px" height="auto" src="http://developer.huddly.com/assets/imgs/huddly.png" />

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

Then you should be good to go. All the actions on the cameraManager are done after the attach event. For example, to get the camera information, call `getInfo` when the camera is attached.

```javascript
sdk.on('ATTACH', (d) => {
  cameraManager = d;
  cameraManager.getInfo().then(console.log);
});
```
## Issues
If you have a question or found a bug please [open an issue](https://github.com/Huddly/sdk/issues). Thank you


## Documentation
For more details on the rest of the functionality to the sdk check out the documentation for the sdk class and the cameraManager (IDeviceManager) interface.

 - [SDK](http://developer.huddly.com/classes/HuddlySdk.html)
 - [IDeviceManager](http://developer.huddly.com/interfaces/IDeviceManager.html)
 - [Detector](http://developer.huddly.com/interfaces/IDetector.html)

## Repo
Check out the sdk code on github (https://github.com/Huddly/sdk)

## FAQ
### I'm not getting any detections:
  Make sure that you're streaming from the camera, pick any video application and select HUDDLY IQ, you should start getting in detections.

### My detections are not matching what I see in the stream:
  Internally the camera always sees full field of view, the coordinates are relative to full field of view by deafault. If you want the coordinates to be be absolute to the current framing, you can specify this when you get the detector.
  ```
    cameraManager.getDetector({ convertDetections: 'FRAMING' });
  ```
  This makes it easy to draw these bbox directly on top of the main stream.

### The camera is never attached, or throwing an Error
  Make sure that no other application such as the Huddly app or another sdk instance is running and using the camera.
