## How to use the autozoom controller interface

Below you can find an example on how to get started with autozoom (Genius Framing) on IQ. Follow the steps below for configuring the autozoom feature on the camera.
```javascript
/**
 * We suppose that the SDK has been initialized previously
 * and the camera is attached and an instance of IDeviceManager
 * is created!
 */

/**
 * Get an autozoom controller instance from the initialized camera manager.
 * For custom autozoom, `getAutozoomCtl` accepts some options which are
 * documented on the `IAutozoomCtlOpts` interface.
 */
const autozoomCtl = cameraManager.getAutozoomCtl();

// Always call init before doing anything
await autozoomCtl.init();

/**
 * By default cameras with latest firmware have autozoom enabled persistently. If you
 * want to play with the persistance state of autozoom you can use `autozoomCtl.enable()`
 * and `autozoomCtl.disable()` dor changing the state of autozoom persistently.
 */

// Call `start` to make sure autozoom will start when you start streaming
await autozoomCtl.start();

...

// Your code goes here

...

/**
 * You can call `stop` on autozoom controller class to stop autozom feature.
 * Keep in mind, `stop` is not persistent across camera boot 
 */
await detector.stop();
```
**NOTE**: For subscribing for detection and/or framing events you need to use the [Detector](http://developer.huddly.com/interfaces/IDetector.html) class.
