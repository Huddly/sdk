# Huddly Canvas
Just as with any other huddly device, the SDK can be used to upgrade and control the Huddly Canvas camera. This intelligent whiteboard camera is used to detect, dewarp and enhance the contents of a whiteboard automatically without any user input. The last feature, namely the "enhance" bit can be controlled using the SDK (meaning that it an be turned on and off). The detection and the dewarping of the whiteboard is a standard feature and therfore it can not be toggled.

In this docs page we will show you how to toggle the enhance feature of the Huddly Canvas camera using the SDK.

## Canvas enable content enhancement (default behavior)

```javascript
....
// We assume the sdk instance has already been initialized
....

const applicationTeardown = () => {
    process.exit();
}

let canvasDevice;
sdk.on('ATTACH', (cameraManager) => {
  canvasDevice = cameraManager;
  canvasDevice.enableCanvasEnhanceMode()
  .then(_ => new Promise((resolve, reject) => {
    // Device requires reboot for us to see the changes on the camera live stream
    canvasDevice.reboot()
    .then(_ => {
      console.log('Canvas enhancement mode enabled!');
      resolve();
    }).catch((e) => {
      console.error('Something went wrong while rebooting the camera');
      reject(e);
    });
  }))
  .catch((e) => {
    console.error('Something went wrong while disabling canvas ehancement mode!');
    console.trace(e);
  }).finally(_ => {
    // Close device connection and exit application
    canvasDevice.closeConnection()
    .then(applicationTeardown);
  });
});

....
```

## Canvas disable content enhancement

```javascript
....
// We assume the sdk instance has already been initialized
....

const applicationTeardown = () => {
    process.exit();
}

let canvasDevice;
sdk.on('ATTACH', (cameraManager) => {
  canvasDevice = cameraManager;
  canvasDevice.disableCanvasEnhanceMode()
  .then(_ => new Promise((resolve, reject) => {
    // Device requires reboot for us to see the changes on the camera live stream
    canvasDevice.reboot()
    .then(_ => {
      console.log('Canvas enhancement mode disabled!');
      resolve();
    }).catch((e) => {
      console.error('Something went wrong while rebooting the camera');
      reject(e);
    });
  }))
  .catch((e) => {
    console.error('Something went wrong while enabling canvas ehancement mode!');
    console.trace(e);
  }).finally(_ => {
    // Close device connection and exit application
    canvasDevice.closeConnection()
    .then(applicationTeardown);
  });
});

....
```
