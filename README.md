<p>
  <a href="https://travis-ci.com/Huddly/sdk"><img src="https://travis-ci.com/Huddly/sdk.svg?branch=master" alt="Build Status"></a>
  <a href="https://www.npmjs.com/package/@huddly/sdk"><img src="https://badge.fury.io/js/%40huddly%2Fsdk.svg" alt="npm badge"></a>
  <a href="https://npmcharts.com/compare/@huddly/sdk?minimal=true"><img src="https://img.shields.io/npm/dm/@huddly/sdk.svg?style=flat" alt="NPM Downloads"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-brightgreen.svg" alt="MIT badge"></a>
  <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen badge"></a>
</p>


<img class="huddly-logo" width="200px" height="auto" src="http://developer.huddly.com/assets/imgs/huddly.png" />

# Huddly Software Development Kit (SDK)

## Prerequisites
Huddly SDK works with the following NodeJS releases: (Needs to support NAPI v3 )

- Node 10
- Node 11
- Node 12
- Node 14
- Node 16

We recommend using nvm as your node version manager [https://github.com/creationix/nvm](https://github.com/creationix/nvm).

After you've setup nvm run
```bash
  nvm install 16
  nvm use 16
```

## Getting started
With the node environment setup and ready, go ahead and install our sdk as part of your project dependencies:
```
  npm install @huddly/sdk@latest
```

You also need to install some other Huddly npm dependencies from which the SDK relies on for device discovery and communication. Depending on which product (camera) you will be working with, the corresponding device api packages must be accompanied with the SDK:

```
  npm install @huddly/device-api-usb    # For interacting with our USB cameras
  npm install @huddly/device-api-ip     # For interacting with our Ethernet/IP comeras
```

It is also possible to install both of them and configure the SDK which one to use for discovery and/or communication.

### Setting up the sdk instance
The example below illustrates how to setup the SDK instance to communicate with a Huddly camera connected to the host machine. Start by creating the sdk and the transport apis:

```javascript
const HuddlyDeviceAPIUSB = require('@huddly/device-api-usb').default;
const HuddlyDeviceApiIP = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;

// Create instances of device-apis you want to use. These APIs also take configuration parameters which can be consulted by the IDeviceApiOpts interface.
const usbApi = new HuddlyDeviceAPIUSB();
const ipApi = new HuddlyDeviceApiIP();

/*
 Creating the SDK instance requires you to provide the following:
 - DeviceAPI instance (or a lis of different DeviceApi instances) responsible for doing discovery (1st constructor argumet)
 - An optional list of DeviceApi instances that can be used for communication (if ommitted the discovery device api will also be used for communication).
*/

// To setup an sdk instance that works with USB devices only, you'd do:
const sdk = new HuddlySdk(usbApi);

// To setup an sdk instance that works with IP devices only, you'd do:
const sdk = new HuddlySdk(ipApi);

// **BETA Feature** To setup an sdk that work with discovering both usb and ip cameras, you'd do:
const sdk = new HuddlySdk([usbApi, ipApi], [usbApi, ipApi]);
```

The SDK instance will fire `ATTACH` events if it finds a camera connected on the host or if a camera is connected at a later stage. The code below listens to attach events from the SDK and initilizes a camera manager instance:

```javascript
// Create a instance that will represent the `IDeviceManager` interface
let cameraManager;
sdk.on('ATTACH', (newDevice) => {
  cameraManager = newDevice;
});
```

Now since the attach event listener has been set up, we can initilize the SDK and allow it to start the device discovery process:

```javascript
sdk.init();
```

That's it on the SDK initialization process. All the actions on the cameraManager instance are done after the attach event. For example, to get the camera information, call `getInfo` when the camera is attached:

```javascript
sdk.on('ATTACH', (newDevice) => {
  cameraManager = newDevice;
  cameraManager.getInfo().then(console.log);
});
```

## Automate updates
To always get the latest release of the SDK and the corresponding transport libraries (`@huddly/device-api-*`) you can add some extra steps to your build pipeline to do just that. Npm facilitates this for you by simply running an update command as below:

```bash
npm update @huddly/sdk
```
The command above will make sure that your project is using the latest release of `@huddly/sdk`. Keep in mind that the command above will make changes to your `package.json` and `package-lock.json` files to compensate for the new changes (if any).

In case you always want the latest patch updates on the library you can use the tilde `~` prefix in front of the version on the package.json file:
```json
"@huddly/sdk": "~0.6.5"
```
The above version scheme will use releases from `0.6.5` to `<0.7.0`. Another alternative is to use caret `^` symbol in front of the version string which tells npm to use all future minor/patch versions without incrementing the major version. For example:

```json
"@huddly/sdk": "^0.6.5"
```
will use releases from `0.6.5` to `<1.0.0`. Major updates will have to be updated manually due to the potential of breaking changes involved with the new update.

## Issues
If you have a question or found a bug please [open an issue](https://github.com/Huddly/sdk/issues). Thank you


## Documentation
For more details on the rest of the functionality to the sdk check out [developer.huddly.com](http://developer.huddly.com) for the different classes, interfaces, enums and more which some of them having example code as well.

## Code Samples
All code samples and usage demos can be found on the official [Huddly SDK sample repository](https://github.com/Huddly/sdk-samples).

## Repo
Check out the sdk code on github (https://github.com/Huddly/sdk)

## FAQ
#### **My detections are not matching what I see in the stream!**
  Internally the camera always sees full field of view, the coordinates are relative to full field of view by default. If you want the coordinates to be be absolute to the current framing, you can specify this when you get the detector.
  ```
    cameraManager.getDetector({ convertDetections: 'FRAMING' });
  ```
  This makes it easy to draw these bbox directly on top of the main stream.

#### **How can i disable autoframing and still get detection information from camera?**
  Another available detector configuration is the `shouldAutoFrame` option which when set to false, it allows you to configure Genius Framing to send detection data without autoframing.

  ```
    cameraManager.getDetector({ shouldAutoFrame: false });
  ```
  By default, the detector is configured to run autoframing and generate detection information.

#### **How do I get detections only when I am streaming with my Huddly Camera!**
  If you want to get detection data only when the camera is streaming on the host machine, you need to configure the detector class with the `DOWS` option.

  ```
    cameraManager.getDetector({ DOWS: true });
  ```
  This option makes it possible to configure the detector so that you only get detection data when you are streaming on host machine. By default, this option set to `false` so that you don't have to stream to get detection data.

#### **LED light is ON, but I am not streaming with my Huddly IQ!**
  After **v0.4.0**, SDK comes with a new feature ragarding the way you get detection data from the camera. On this version (and onward) the default behavior of detector is starting an internal stream (controlled by the camera only) to give you detection information. As a result the LED light is turned ON. Proper tearing down of the detector instance will stop the internal stream on the camera and with it the LED light.

#### **The camera is never attached, or throwing an Error!**
  Make sure that no other application such as the Huddly app or another sdk instance is running and using the camera.

#### **Can I use undocumented methods?**
No. To make sure that camera is compatible with the sdk the documented api gets thoroughly tested. We do not guarantee that undocumented functionality will not break/change from sdk version to sdk version, or camera sw to camera sw.

#### **SDK crashes when there are two IQs connected!**
The current implementation of the SDK does not support having two usb cameras connected to the host at the same time. However, having one Huddly usb camera (IQ, Canvas, GO) and one Huddly IP camera (L1) is supported.  
