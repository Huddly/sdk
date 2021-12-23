# Genius Framing Controller

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
**NOTE**: For subscribing for detection and/or framing events you need to use the `Detector` class.
