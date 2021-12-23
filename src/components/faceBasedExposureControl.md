# Portrait Lightning Controller
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
