# Huddly Insight Analytics + Azure IoT 
This is an example implementation feeding data from Huddly IQ to Azure IoT Hub.

For information on how to set up the Azure side of things, see [here](https://docs.microsoft.com/en-us/azure/iot-hub/iot-hub-live-data-visualization-in-power-bi) 

# Get the example running
To get the example running, you need to set the Azure IoT Hub Device Connection string as an environment variable

```
  export HUDDLY_DEVICE_CONNECTION_STRING=<device connection string>
```

The meeting room name can also be set with an environment variable
```
  export ROOM_NAME="My Meeting Room"
```

Now run the example
```
  node index.js
``` 

## NB!
### I'm not getting any detections:
  Make sure that you're streaming from the camera, pick any video application and select HUDDLY IQ, you should start getting in detections.
