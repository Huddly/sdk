# REST server
In order to run this examples you first need to clone the repo
```
git clone git@github.com:Huddly/sdk.git
```

then go to the example folder
```
cd examples/rest
```
After that install the project dependencies using npm as below:
```
npm install
```
Yarn can also be used to install dependencies.
```
yarn install
```

Start the server by running the command below:
```
npm run start
```

The REST api will then be available under ```localhost:8080```

This example applications is a REST server that where you can get camera information as well as performing actions and changing state in the camera.

Here are the actions you can perform:

## Camera Info
* [Get camera info](rest-api/camera-info.html) : `GET /info`

## Detector
* [Start autozoom (genius framing) and detector](rest-api/detector-start.html) : `PUT /detector/start`
* [Stop autozoom (genius framing) and detector](rest-api/detector-stop-.html) : `PUT /detector/stop`
* [Get detections](rest-api/get-detections.html) : `GET /detector/detections`

## Upgrade
* [Upgrade camera](rest-api/upgrade.html) : `POST /upgrade`
* [Status of upgrade](rest-api/upgrade-status.html) : `GET /upgrade/status`

The server is using the huddly-sdk to communicate with the camera, and koa for the web application.
