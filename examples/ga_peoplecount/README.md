# Huddly analytics + Google analytics
This example illustrates how you can use a tracking tool like google analytics to track how many people is in a meeting room.

Our objective is to find out how many people are using our meeting room on average during the day, we accomplish this by using our huddly sdk and push the tally of people detected to google analytics.

Using google analytics we can create a report that shows the average number of people in the room per hour.

## Getting the detections
We split up the code in two parts first getting the detections from the camera, secondly we will push the number of detected people to GA.

```javascript
const HuddlyDeviceAPIUSB = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;

const meetingRoomName = process.env.HUDDLY_MEETING_ROOM || 'TEST_ROOM';

const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(usbApi);

async function init() {
  await sdk.init();

  sdk.on('ATTACH', async (cameraManager) => {
    const autozoomCtl = cameraManager.getAutozoomCtl();
    // Make sure that autozoom (genius framing is started)
    await autozoomCtl.init();
    await autozoomCtl.start();

    // Now get the detector instance from sdk
    const detector = cameraManager.getDetector();

    // Setup the detection listener
    detector.on('DETECTIONS', detections => {
      console.log('Number of people detected', detections.length);
    });

    // Calling detector init will initiate the generation of detection events
    detector.init();
  });
}

init();
```
First we need to setup the sdk and when the camera is attached, get the autozoom controller instance to make sure that autozoom
is configured and running on the camera.

```javascript
const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(usbApi, [usbApi]);
await sdk.init();

sdk.on('ATTACH', async (cameraManager) => {
  const autozoomCtl = cameraManager.getAutozoomCtl();
  await autozoomCtl.init();
  await autozoomCtl.start();
});
```
Then we get an instance of te detector class, initialize it and setup the detection listener so we get a detection events.

```javascript
...
const detector = cameraManager.getDetector();

detector.on('DETECTIONS', detections => {
  console.log('Number of people detected', detections.length);
});
...
```
Finally, calling `detector.init()` will start the detection engine which generates detection data that is caught
by our event listener that we set up in the previous step.

```javascript
detector.init();
```

The meeting room name is declared with an environment variable, so this can be configured from machine to machine.
```
  export HUDDLY_MEETING_ROOM="my_meeting_room"
```

Now that we set up how to track events to google analytics.

## Tracking
In order to track with GA we first need to create an account.

[Create a GA account and get the tracking ID ](https://support.google.com/analytics/answer/1042508).

You then need to set the tracking-ui as an environment variables.

  ```
    export GA_TRACKING_ID=YOUR-TRACKING-ID
  ```


And then some utility code that pushed the people count event to google analytics.

```javascript
const got = require('got');

const GA_TRACKING_ID = process.env.GA_TRACKING_ID;

async function trackEvent (category, action, label, value) {
  const data = {
    v: '1',
    tid: GA_TRACKING_ID,
    uid: '555',
    t: 'event',
    ec: category,
    ea: action,
    el: label,
    ev: value
  };

  try {
    await got.post('http://www.google-analytics.com/collect', {
      form: true,
      body: data,
    });
  } catch (e) {
    console.log('tracking failed');
  }
}


function trackPeopleCount(meetingRoom, numberOfPeople) {
  trackEvent('huddly-analytics', 'people-count', meetingRoom, numberOfPeople);
}

module.exports = trackPeopleCount;
```

You can find more information on google analytics integration [here](https://cloud.google.com/appengine/docs/flexible/nodejs/integrating-with-analytics)


## Putting it together

```javascript
const trackPeopleCount = require('./tracker');
const HuddlyDeviceAPIUSB = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;

const meetingRoomName = process.env.HUDDLY_MEETING_ROOM || 'TEST_ROOM';

const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(usbApi);

async function init() {
  await sdk.init();

  sdk.on('ATTACH', async (cameraManager) => {
    const autozoomCtl = cameraManager.getAutozoomCtl();
    // Make sure that autozoom (genius framing is started)
    await autozoomCtl.init();
    await autozoomCtl.start();

    // Now get the detector instance from sdk
    const detector = cameraManager.getDetector();

    // Setup the detection listener
    detector.on('DETECTIONS', detections => {
      trackPeopleCount(meetingRoomName, detections.length);
    });

    // Calling detector init will initiate the generation of detection events
    detector.init();
  });
}

init();
```

Next up we want to create our analytics report

## Setup a google analytics report
We want to create a report that calculates the average number of people in our meeting room per hour.

1. Create new custom report Customization > Custom report
2. Click + New Custom report
3. Setup report
  * Give it a name "average number of people in my_meeting_room"
  * Tab: name average number in hours
  * Type: Explorer
  * Click add metric
    * Select ```Avg. Value```
  * Click add dimension select ```Hour```
  * Click add filter only show ```Event Label``` Exact ```my_meeting_room``` (fill the name you set as environment variable)

  ![Average number people in meeting room moon](https://developer.huddly.com/assets/imgs/report.png)


## Check out your Dashboard
You should now have tracking data coming in, and you can select different date ranges for your report.

## NB!
### I'm not getting any detections:
  Make sure that you're streaming from the camera, pick any video application and select HUDDLY IQ, you should start getting in detections.

### Detections without streaming on a video applications?
It is possible to configure the detector in a way that you still get detection events even though you are not occupying the camera stream on the host machine. Please
have a look at the `IDetector` interface documentation and the Readme file to find out how this is done!
