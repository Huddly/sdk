## How to use the detector interface!

Below you can find an example on how to get started with Genius Framing on IQ. Follow the steps below for configuring Genius Framing on the camera
and subscribing for detection and framing information!
```javascript
/* 
We suppose that the SDK has been initialized previously
and the camera is attached and an instance of IDeviceManager
is created!
*/
const HuddlyDetector = await cameraManager.getDetector();
await detector.init();
await detector.start();

/*
In order to subscribe for detection and framing information
proceed with the following code snippet
*/

detector.on('DETECTIONS', (detectionList) => {
  // Process the array
});

detector.on('FRAMING', (framingInfo) => {
  // Process framing info
});


/* To stop Genius Framing on IQ, use the #stop method */
await detector.stop();

```
