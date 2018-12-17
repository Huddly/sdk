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

  sdk.on('ATTACH', (cameraManager) => {
    const detector = cameraManager.getDetector();
    await detector.init();

    detector.on('DETECTIONS', detections => {
      console.log('Number of people detected', detections.length);
    });

    detector.start();
  });
}

init();
```
First we need to setup the sdk and when the camera is attached, then we initialize the detector so we get a detection object.

```javascript
const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(usbApi, [usbApi]);
await sdk.init();

sdk.on('ATTACH', (cameraManager) => {
  const detector = cameraManager.getDetector();
  await detector.init();
});
```

We then start listening to incoming detections and count them, and finally we start the detector.

```javascript
detector.on('DETECTIONS', detections => {
  console.log('Number of people detected', detections.length);
});

detector.start();
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
const sdk = new HuddlySdk(usbApi, [usbApi]);

async function init() {
  await sdk.init();

  sdk.on('ATTACH', (cameraManager) => {
    const detector = cameraManager.getDetector();
    await detector.init();

    detector.on('DETECTIONS', detections => {
      trackPeopleCount(meetingRoomName, detections.length);
    });

    detector.start();
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

  ![Average number people in meeting room moon](/assets/imgs/report.png)


## Check out your Dashboard
You should now have tracking data coming in, and you can select different date ranges for your report.
