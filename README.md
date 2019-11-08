<p>
  <a href="https://travis-ci.com/Huddly/sdk"><img src="https://travis-ci.com/Huddly/sdk.svg?branch=master" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/@huddly/sdk"><img src="https://badge.fury.io/js/%40huddly%2Fsdk.svg" alt="npm badge"></a>
  <a href="https://img.shields.io/david/Huddly/sdk"><img src="https://img.shields.io/david/Huddly/sdk.svg" alt="npm dependencies"></a>
  <a href="https://img.shields.io/david/dev/Huddly/sdk"><img src="https://img.shields.io/david/dev/Huddly/sdk.svg" alt="npm devDependencies"></a>
  <a href="https://npmcharts.com/compare/@huddly/sdk?minimal=true"><img src="https://img.shields.io/npm/dm/@huddly/sdk.svg?style=flat" alt="NPM Downloads"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="MIT badge"></a>
  <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen badge"></a>
</p>


<img class="huddly-logo" width="200px" height="auto" src="http://developer.huddly.com/assets/imgs/huddly.png" />

# Huddly Software Development Kit (SDK)

## Prerequisites
Huddly SDK supportes the following node versions: (Needs to support NAPI v3 )

- 8.11.2
- 10.15.2
- 11.5.0

We recommend using nvm as your node version manager [https://github.com/creationix/nvm](https://github.com/creationix/nvm).

After you've setup nvm run
```
  nvm use 8.11.2
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
 - [Autozoom Controller](http://developer.huddly.com/interfaces/IAutozoomControl.html)
 - [Detector](http://developer.huddly.com/interfaces/IDetector.html)

## Repo
Check out the sdk code on github (https://github.com/Huddly/sdk)

## FAQ
### My detections are not matching what I see in the stream:
  Internally the camera always sees full field of view, the coordinates are relative to full field of view by deafault. If you want the coordinates to be be absolute to the current framing, you can specify this when you get the detector.
  ```
    cameraManager.getDetector({ convertDetections: 'FRAMING' });
  ```
  This makes it easy to draw these bbox directly on top of the main stream.

### How can i disable autoframing and still get detection information from camera?
  Another available detector configuration is the `shouldAutoFrame` option which when set to false, it allows you to configure Genius Framing to send detection data without autoframing.

  ```
    cameraManager.getDetector({ shouldAutoFrame: false });
  ```
  By default, the detector is configured to run autoframing and generate detection information.

### How do I get detections only when I am streaming with my Huddly IQ!
  If you want to get detection data only when the camera is streaming on the host machine, you need to configure the detector class with the `DOWS` option.

  ```
    cameraManager.getDetector({ DOWS: true });
  ```
  This option makes it possible to configure the detector so that you only get detection data when you are streaming on host machine. By default, this option set to `false` so that you don't have to stream to get detection data.

### LED light is ON, but I am not streaming with my Huddly IQ!
  After **v0.4.0**, SDK comes with a new feature ragarding the way you get detection data from the camera. On this version (and onward) the default behavior of detector is starting an internal stream (controlled by the camera only) to give you detection information. As a result the LED light is turned ON. Proper tearing down of the detector instance will stop the internal stream on the camera and with it the LED light.

### The camera is never attached, or throwing an Error
  Make sure that no other application such as the Huddly app or another sdk instance is running and using the camera.

### Can I use undocumented methods.
No. To make sure that camera is compatible with the sdk the documented api gets thoroughly tested, we won't guarantee that undocumented functionality might break/change from sdk version to sdk version, or camera sw to camera sw.

### Transition from 0.3.* to 0.4.0
  The transition from 0.3.* to 0.4.0 involves breaking changes with regards to Genius Framing configuration and detection data retrival. The breaking change is that we have moved the configuraion part of GeniusFraming (autozoom) into a separate interface that we called [AutozoomControl](http://developer.huddly.com/interfaces/IAutozoomControl.html#readme). The autozoom configuration methods `enable`, `disable`, `start` and `stop` which used to live in the detector interface are now moved to the new `AutozoomControl` interface. On the other hand, the [Detector](https://developer.huddly.com/interfaces/IDetector.html#readme) interace remains responsible for only setting up events for getting detection and framing data from the camera. Have a look at the documentation of each interface to see usage examples.
