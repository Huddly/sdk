## How to use the detector interface!

Below you can find an example on how to get started with Genius Framing on IQ. Follow the steps below for configuring Genius Framing on the camera
and subscribing for detection and framing information!
```javascript
/* 
We suppose that the SDK has been initialized previously
and the camera is attached and an instance of IDeviceManager
is created!
*/
const detector = await cameraManager.getDetector();
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

## Detection data without streaming
Wondering whether it is possible getting detection (but not framing) data from the camera without streaming on a third party streaming application? The answer is yes! This new feature has been release with version 0.3.2 of the SDK and the follow code snippet illustrates the usage of the new feature:

``` javascript
/* 
We suppose that the SDK has been initialized previously
and the camera is attached and an instance of IDeviceManager
is created!
*/
...

const detector = await cameraManager.getDetector();
await detector.init();

await detector.detectorStart(); // Call #detectorStart instead of #start for getting detection data without streaming on host

// Setup detection event listener
detector.on('DETECTIONS', (detectionList) => {
  // Your code here
});

// !!! IMPORTANT !!! Make sure you call #detectorStop when you are done with detection data
await detector.detectorStop();
...
```
**!! NOTE !!** When tearing down your application which is using the detector object, it is important that you call `detectorStop` method before closing the host application. Not doing so will leave the camera streaming after you have closed the application which might lead to confusion. The camera will stop generating detection data at some point when it detects that no host application is consuming its data. However, it is strongly recommended to properly teardown the detector instance from the host application.
## Detector Events
The detector class can emit the following events:

| Event        | Description    |
| ------------- |:-------------|
| DETECTIONS  | Subscribe to this event to get detections from the camera. At the moment only the `People` class is supported from the detector. |
| FRAMING     | Subscribe to this event to get information about the framing. Framing data consists of a property called `bbox` which contains the coordinates (x, y, width and height) representing the framing data. The framer configuration on the camera will always make sure that the perfect framing of the people in the view is selected.|