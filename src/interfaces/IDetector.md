## How to use the detector interface!

In order to use the detector interface you need to make sure that the autozoom feature is enabled on the camera (see the [IAutozoomCtl](http://developer.huddly.com/interfaces/IAutozoomCtl.html) interface for documentation on how to do it).

The detector interface allows you to subscribe to detection and/or framing data from the camera. It is also possible to configure the detector in a way where detection data can be retrieved even without streaming on host using a streaming application. Examples below show how the detector can be used.

```javascript
/* 
We suppose that the sdk has been initialized and autozoom feature is enabled
and running.
*/
...

/**
 * Get an instance of detector implementation from the
 * camera manager.
 */
const detector = cameraManager.getDetector();

// Always call `init`
await detector.init();

/*
Detector class implements EventEmitter and therefor implements
all the event emitter methods. Below we show how to listen
to detector events such as DETECTIONS and FRAMING.
*/

detector.on('DETECTIONS', (detectionList) => {
  // Process the array
});

detector.on('FRAMING', (framingInfo) => {
  // Process framing info
});


/**
 * When you are done call `destroy` method to properly teardown
 * the detection instance.
 */
await detector.destroy();

...
```

## Detection data without streaming
Wondering how to configure detector to get detection data without streaming main? The new feature has been added on release 0.4.0 and can be set up as the following:

``` javascript
...

/**
 * The `getDetector` method accepts options documented on
 * `IDetectorOpts` interface. One of the options allows you
 * to configure the detector to get detection data without
 * having to stream main stream on the host machine.
 */
const detector = await cameraManager.getDetector({
  configDetectionsOnSubstream: true,
});

// Call init
await detector.init();

// Setup detection event listener
detector.on('DETECTIONS', (detectionList) => {
  // Your code here
});

// !!! IMPORTANT !!! Make sure you call `destroy` when you are done with detection data
await detector.destroy();
...
```
**!! NOTE !!** When tearing down your application which is using the detector object, it is important that you call `destroy` method before closing the host application. Not doing so will leave the camera streaming internally after you have closed the application which might lead to confusion. The camera will stop generating detection data at some point when it detects that no host application is consuming its data. However, it is strongly recommended to properly teardown the detector instance from the host application.

## Detector Events
The detector class can emit the following events:

| Event        | Description    |
| ------------- |:-------------|
| DETECTIONS  | Subscribe to this event to get detections from the camera. At the moment only the `People` class is supported from the detector. |
| FRAMING     | Subscribe to this event to get information about the framing. Framing data consists of a property called `bbox` which contains the coordinates (x, y, width and height) representing the framing data. The framer configuration on the camera will always make sure that the perfect framing of the people in the view is selected.|