## SDK Usage
Please check the [Getting Started](http://developer.huddly.com/index.html) guide to integrate the sdk with your awesome application.

## SDK Events
When you create an instance of the SDK, you provide some options on the constructor:

```javascript
const usbApi = new DeviceApiUSB();
const opts = {
  //emitter: new EventEmitter(), <- this is an optional parameter
};
const sdk = new SDK(usbApi, [usbApi], opts);
```
If you do not provide the `emitter` option, the SDK instance itself will act as an Event Emitter. As a result you can use the sdk instance itself to listen for the supported events. The supported events are:

| Event        | Description    |
| ------------- |:-------------|
| ATTACH  | The `ATTACH` event is fired by the SDK for each Huddly camera attached on the host machine. This event will also be fired everytime you attach a new Huddly camera to the machine while the SDK instance is running. The `ATTACH` event gives you an instance of the `IDeviceManager` which can be used to communicate with the camera.|
| DETACH  | The `DETACH` event is fired by the SDK in case a Huddly camera is removed/detached from the host machine. The `DETACH` event gives you the `Serial Number` of the detached device. |
| ERROR  | The `ERROR` event is fired by the SDK when the device initialization step cannot be performed on the discovered Huddly camera. The event consists of a payload of type `AttachError` and contains the error mesage and origin of the device initialization failure |

Examples of subscribing for `ATTACH` and `DETACH` events:

```javascript
let connected = false;
let IQManager;
sdk.on('ATTACH', (cameraManager) => {
  // Proceed with communicating with the camera
  // For example...
  if (cameraManager.productName === "Huddly IQ") {
    IQManager = cameraManager;
    connected = true;
  }
});

sdk.on('DETACH', (serial) => {
  if (IQManager.serialNumber === serial) {
    // The camera you were using has been detached from the system.
    // Proceed with deinitializing the IQManager instance..
    IQManager.closeConnection()
    .then(_ => {
      IQManager = undefined;
    }).finally(_ => {
      // For example...
      connnected = false;
    });
  }
});

sdk.on('ERROR', (sdkError) => {
  if (sdkError.device && sdkError.device.serialNumber == serial) {
    // SDK is unable to initialize the desired camera
    console.error(sdkError.error);
    connected = false;
  }
});
```
