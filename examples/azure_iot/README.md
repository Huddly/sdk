# A demo application for people count with Huddly IQ, Microsoft Azure and Power BI

Huddly brings to market an AI powered collaboration camera that not only gives great collaboration experiences but also powerful analytics capabilities.

The onboard AI engine on Huddly IQ detects people on everything the lens can see, giving it the abilities to automatically frame people in the main video presented to the collaboration client, and also report the number of people seen in the room and relative locations to the lens. 

The demo shown in this repository shows you how these analytics data can be collected to give an overview of the number of people in meeting rooms throughout the day. These data provides insights into how many seats are used in each meeting room and average number of participants in meeting rooms.

![image](https://user-images.githubusercontent.com/3704622/58803982-03ede880-8611-11e9-80a1-89a2729abacd.png)

### Technical overview

![image](https://user-images.githubusercontent.com/3704622/58804343-eec58980-8611-11e9-83cc-8d821de719eb.png)


# Getting up and running with the SDK

Before we dive in to Azure and the analytics dashboard, we will start by getting up and running with the Huddly SDK. The Huddly SDK is a toolkit for NodeJS based applications to easily get started. The SDK itself is open source its code can be found on Github <Link>.

Now lets get NodeJS and the Huddly SDK. The Huddly SDK uses a native NodeJS module to interact with the USB interface of the camera. This native module is currently compiled for NodeJS version 10. Since NodeJS is a rapidly changing environment and new versions coming out quite often, I prefer using a version manager to be able to toggle between multiple version. There are several of these, but currently I’m sticking to `nvm`. 
Mac/Linux: https://github.com/nvm-sh/nvm
Windows: https://github.com/coreybutler/nvm-windows

Installing node
```
nvm install v10.15.3
nvm use v10.15.3
```

Initialize a new npm project and generate a `package.json` file
```
npm init
```
The result will look something like this
```
{
  "name": "huddly-azure-connector",
  "version": "1.0.0",
  "description": "An azure cloud connector for Huddly IQ devices",
  "main": "index.js",
  "scripts": {
    "test": "npm test"
  },
  "author": "Oystein Grimstad",
  "license": "MIT"
}
```

In this example I used index.js as the main entry for the project. 

Now lets install the Huddly SDK and the Huddly Device API for USB through npm.

```
npm install --save @huddly/sdk @huddly/device-api-usb
```

This will download the Huddly SDK and Huddly Device API for USB and add it to the dependencies section of your package.json

### Hello Huddly IQ
```
const HuddlySdk = require('@huddly/sdk').default;
const DeviceApiUsb = require('@huddly/device-api-usb').default;

const huddlySdk = new HuddlySdk(new DeviceApiUsb());

huddlySdk.on('ATTACH', async (deviceManager) => {
    const info = await deviceManager.getInfo();
    console.log('Woho, we have a device. ' +
        `Serial Number ${info.serialNumber} ` +
        `Software Version: ${info.version}`);
    process.exit(0);
});

huddlySdk.init();
```

Now that we have communication with the device up and running, lets start retrieving some more intelligent data from the camera. The camera has an onboard neural compute engine and is programmed to performed convolutional operations on full-image frames. The current neural network on Huddly IQ is optimized for detecting people and heads. 

The following example will print to the console every time Huddly IQ detects people within its frame.

```
const HuddlySdk = require('@huddly/sdk').default;
const CameraEvents = require('@huddly/sdk').CameraEvents;
const DeviceApiUsb = require('@huddly/device-api-usb').default;

const huddlySdk = new HuddlySdk(new DeviceApiUsb());

huddlySdk.on(CameraEvents.ATTACH, async (deviceManager) => {
    const detector = await deviceManager.getDetector();
    detector.on(CameraEvents.DETECTIONS, (detections) => {
        console.log(detections);
    });
    detector.start();
});

huddlySdk.init();
```

This program will output all detections from the camera, type and coordinates relative to the lens.
```
[ { label: 'head',
    bbox:
     { x: 0.6828125,
       y: 0.01875,
       width: 0.109375,
       height: 0.18958333333333333 } },
  { label: 'person',
    bbox:
     { x: 0.46875, y: 0, width: 0.5078125, height: 0.6541666666666667 } } ]
```

For this people counting demo, we are only interested in objects of type `person`’ and will therefore request the SDK to filter these for us
```
const detector = await deviceManager.getDetector({
 objectFilter: ['person'],
});
```

# Setting up the cloud

This example uses Microsoft Azure for the cloud components. Similar concepts also exist in other cloud solutions such as Amazon Web Services.

There are two backend components in azure we want to spin up to set up communication with our devices, Azure IoT Hub and Azure IoT Device Provisioning Service. The provisioning service is a helper service provided by Microsoft to enable “zero touch” provisioning to the right IoT Hub without human intervention. It simply allows us to scale beyond a couple of devices. 

The IoT Hub is a Microsoft managed service that acts as a central message hub for communication between IoT devices and cloud applications. We will use the IoT Hub to manage communication between azure and our cameras.

The first thing we will do is to create an IoT Hub instance in the azure portal. For this example we use F1 - Free tier hub.

![image](https://user-images.githubusercontent.com/3704622/58804453-34825200-8612-11e9-9bfc-0c7fd94b6d5e.png)



Now create the Device Provisioning Service. For this example we use S1 tier. Note the ID Scope as it will be used for connecting to the Provisioning Service later.

![image](https://user-images.githubusercontent.com/3704622/58804498-46fc8b80-8612-11e9-856f-e359b45f0a33.png)

Now that the Device Provisioning Service is created, we need to connect it to our IoT Hub. Select “Linked IoT hubs” in the left hand pane, and add the IoT hub created above with “iothubowner” access policy.

Next step is to set up enrollment group for our devices. Select “Manage Enrollments” in the left hand pane, and click “Add Enrollment Group” in the top menu.

![image](https://user-images.githubusercontent.com/3704622/58804529-5a0f5b80-8612-11e9-8654-b4dc5bb761b5.png)

Enter a name for the Enrollment Group, select Attestation Type “Symmetric Key” and save. 

Open the Enrollment Group (in this example “HuddlyProvisioningDemo”) and copy the Primary Attestation Key. This key will be used when connecting to the Provisioning Service.

![image](https://user-images.githubusercontent.com/3704622/58804566-71e6df80-8612-11e9-83fc-972e98b693ea.png)

# Connecting to the Cloud

The Iot Provisioning Service and the IoT Hub supports multiple transport and authentication mechanisms. For this example, we will be using AMQP transport and Symmetric Keys for authentications.

We will connect to the Provisioning Service using the ID Scope of the provisioning service and the symmetric key found in the azure portal (see above). From that key, we will derive a unique key for each device. The Provisioning Service will register the device and also assign the device to the appropriate IoT Hub based on allocation rule specified. Since we are only using one IoT Hub in this example, the allocation rule is less important.

Once the Provisioning Service completes, it will return connection parameters to the assigned IoT Hub to our application. We will use these parameters to communicate with the IoT Hub.

Our cloud connector component is defined in `lib/azureConnector.js`

It requires two environment variables to be set in order to communicate with Azure, `PROVISIONING_ID_SCOPE` and `PROVISIONING_SYMMETRIC_KEY`.

And here’s screenshots of what it looks like a after successful provisioning.

### Provisioning Service
![image](https://user-images.githubusercontent.com/3704622/58804717-d013c280-8612-11e9-9c05-05ec4e7e0835.png)

### IoT Hub
![image](https://user-images.githubusercontent.com/3704622/58804753-e883dd00-8612-11e9-8dbd-91b622909fd0.png)


4. Visualizing the data
Datavisualization in this example is done through Microsoft PowerBI. PowerBI is a powerfull tool that allows you to easily connect to a variety of data sources, visualize and discover what you find important and share with anyone you want.

To get our data from IoT Hub to PowerBI, we will be using a Stream Analytics job in Azure. This is done by adding a consumer group to the IoT Hub, and by running a Stream Analytics job for data transfer from IoT Hub to PowerBI. 

Set up stream analytics and PowerBI as described here
https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-live-data-visualization-in-power-bi

After going through the steps above, you should be able to generate a report in PowerBI as shown in the beginning of this writeup.

# Bundling it into an executable
There are several solutions out there to bundle a NodeJS application into a windows binary executable. For example ZEIT has created an excellent tool called pkg for this. It requires little configuration to do its work.

`npm install --save pkg`

Modify our package.json file to have a `bin` property pointing to the main js file(index.js). Since we are using native modules for communication to USB devices, we also need to add the `.node` files to the output folder. I added a `pack.js` script to the project that invokes `pkg` and copies the `.node` files to the `dist` folder.


5. Running as a windows service
Another great tool for this, 

TODO

6. Provisioning the computers
- Intune



The code used in this post, including running example can be found on Github,
https://github............

7. Considerations
False detections




