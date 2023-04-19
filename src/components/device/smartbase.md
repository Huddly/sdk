# Smartbase api documentation v0.1

Smartbase and any supported ip camera that is connected will act like a usb based camera.
It is discoverable with usb discovery and will come up as an usb device.

It is worth noting that the smartbase can only expose one device interface at any given moment. This means that the smartbase device itself and whatever ip camera is connected won't enumerate at the same time.

## Device APIs

The apis when using the L1 and S1 when connected to smartbase are the same. Smartbase only has a very small subset consisting of `getInfo` and `upgrade`.

### Setup

As mentioned before we are exposing all devices as an usb device and the way to set things up will therefore be like that of the iq and other usb based cameras. [Click here](https://developer.huddly.com/) for guidance on general use of the sdk.

### Camera instance API

#### Run upgrade

```deviceInstance.upgrade(upgradeOptions: UpgradeOpts)```

#### Get info

```deviceInstance.getInfo()```

#### Get log

```deviceInstance.getErrorLog()```

#### Erase log

```deviceInstance.eraseErrorLog()```

#### Available attributes of note

```deviceInstance.serialNumber```
```deviceInstance.productName```

</br>

### Autozoom API

```const autozoomControl = deviceInstance.getAutozoomControl()```

#### Enable

```autozoomControl.enable()```

#### Disable

```autozoomControl.enable()```

#### SetFraming

```autozoomControl.setFraming(framingMode: FramingModes)```

</br>

### Detector API

```const detector = autozoomControl.getDetector(detectorOptions: DetectorOpts)```

#### Enable

#### Init

```detector.init();```

### Examples

For all of the exmples we are assuming that you have an instance of the device named `deviceInstance`.

#### Run upgrade

```
async function doUpgrade(upgradeFilePath: String) {
  try {
    const upgradeOptions = {
      file: fs.readFileSync(cpioFilePath)
    }
    deviceInstance.upgrade(upgradeOptions)
  } catch (error) {
    ...
  }
}
```

#### Enable and Disable Autozoom

```
const autozoomControl = deviceInstance.getAutozoomControl();
// Enable
autozoomControl.enable();

// Disable
autozoomControl.disable();
```

#### Change framing mode
If you are currently using _setMode we would recommend to change that to setFraming for a slightly more correct approach.
```
const FramingModes = require('@huddly/sdk-interfaces/lib/enums/FramingModes');

// Change to speakerframing
autozoomControl.setFraming(FramingModes.SPEAKER_FRAMING);

// Change to normal autozoom
autozoomControl.setFraming(FramingModes.NORMAL);

// Turn off framing
// FramingModes currently has an option named OFF, but this 
// will be replaced with MANUAL
autozoomControl.setFraming(FramingModes.OFF);

```

#### Get detections
Setup without options
```
const detector = deviceInstance.getDetector();
```
Alternative setup with DOWS (detections only when streaming)
```
const detector = deviceInstance.getDetector({
  DOWS: true,
})
```
Setup listener
```
detector.on('DETECTIONS', (detections) => {
  // Do something with the incomming detections
})
```
