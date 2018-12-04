## This is the detector usage

```
# For creating a new detector do the following
detector = await sdk.getDetector(cameraManagerInstance);
await detector.uploadBlob(blobAsBuffer);
await detector.setDetectorConfig(detectorConfigFileAsJson);
await detector.start();
```

To subscribe for detections you can do the following:
```
detector.on('DETECTIONS`, (detections) => {
  // proccess the detection objects
});

```

To stop autozoom you do the following:

```
await detector.stop();
```
