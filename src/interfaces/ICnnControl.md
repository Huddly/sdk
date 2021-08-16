# ICnnControl Interface
## Genius Framing Controller

Below you can find an example on how to get started with Genius Framing (GF) on Huddly cameras that support the feature. Follow the steps below to enable or disable GF:
```javascript
...
// We assume the sdk has been initialized and camera manager instance acquired
...

/**
 * Get an autozoom control instance from the initialized camera manager.
 * For custom autozoom, `getAutozoomControl` accepts some options which are
 * documented on the `IAutozoomControlOpts` interface.
 */
const autozoomCtrl = cameraManager.getAutozoomControl();

// Always call init before doing anything
await autozoomCtrl.init();

/* Enable autozoom cnn feature on the camera (persistent across camera booting) */
await autozoomCtrl.enable();

...
// Your code goes here
...

/* Disable autozoom cnn feature on the camera (persistent across camera booting) */
await autozoomCtrl.disable();
```
**NOTE**: For subscribing for detection and/or framing events you need to use the [Detector](http://developer.huddly.com/interfaces/IDetector.html#readme) class.

## Portrait Lightning Controller
In a similar way to Genius Framing controller, Portrait Lightning also implements ICnnController and can be used to toggle the feature as needed. Below is a code snippet on how to do it.

```javascript
const portraitLightningCtrl = cameraManager.getFaceBasedExposureControl();

// Always call init before doing anything
await portraitLightningCtrl.init();

/* Enable Portrait Lightning cnn feature on the camera (persistent across camera booting) */
await portraitLightningCtrl.enable();

...
// Your code goes here
...

/* Disable Portrait Lightning cnn feature on the camera (persistent across camera booting) */
await portraitLightningCtrl.disable();
```
