## How to use the detector interface!

In order to use the detector interface you need to make sure that the autozoom feature is enabled on the camera (see the [IAutozoomControl](http://developer.huddly.com/interfaces/IAutozoomControl.html) interface for documentation on how to do it).

The detector interface allows you to subscribe to detection and/or framing data from the camera. From version 0.4.0 we support getting detection data from Detector without having to stream the camera on the host machine. **NOTE** that this is the default behavior now. It is still possible to get detections the old way, where you only get detection when streaming the camera on the host machine. We show you below how to do that!

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
 * When you are done, call `destroy` method to properly teardown
 * the detection instance.
 */
await detector.destroy();

...
```
**!! NOTE !!** When tearing down your application which is using the detector object, it is important that you call `destroy` method before closing the host application. Not doing so will leave the camera streaming internally after you have closed the application which might lead to confusion. The camera will stop generating detection data at some point when it detects that no host application is consuming its data. However, it is strongly recommended to properly teardown the detector instance from the host application.

## Get detections only when streaming (DOWS)
If you would like to configure the detector so that you get detection events only and only when the user starts streaming the camera on the host machine, then the following code sinppet illustrates how to do just that:

``` javascript
...

/**
 * The `getDetector` method accepts options documented on
 * `IDetectorOpts` interface. One of the options allows you
 * to configure the detector to get detection only when
 * camera is streaming on the host machine. This option is
 * called `DOWS` short for Detections Only When Streaming.
 */
const detector = await cameraManager.getDetector({
  DOWS: true,
});

// Call init
await detector.init();

// Setup detection event listener
detector.on('DETECTIONS', (detectionList) => {
  // Your code here
});

// Teardown
await detector.destroy();
...
```

## Detector Events
The detector class can emit the following events:

| Event        | Description    |
| ------------- |:-------------|
| DETECTIONS  | Subscribe to this event to get detections from the camera. At the moment only the `People` class is supported from the detector. |
| FRAMING     | Subscribe to this event to get information about the framing. Framing data consists of a property called `bbox` which contains the coordinates (x, y, width and height) representing the framing data. The framer configuration on the camera will always make sure that the perfect framing of the people in the view is selected.|