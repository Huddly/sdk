const HuddlyDeviceApiUsb = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;

// Create an instance of the IP Api
const usbApi = new HuddlyDeviceApiUsb();

// Create an instance of the SDK
const sdk = new HuddlySdk(usbApi);

const applicationTeardown = () => {
    process.exit();
}

let canvasDevice;
sdk.on('ATTACH', (cameraManager) => {
    canvasDevice = cameraManager;
    canvasDevice.enableCanvasEnhanceMode()
    .then(_ => new Promise((res, rej) => {
        // Device requires reboot for us to see the changes on the camera live stream
        canvasDevice.reboot()
        .then(_ => {
            console.log('Canvas enhancement mode enabled!');
            res();
        }).catch((e) => {
            console.error('Something went wrong while rebooting the camera');
            rej(e);
        });
    }))
    .catch((e) => {
        console.error('Something went wrong while disabling canvas ehancement mode!');
        console.trace(e);
    }).finally(_ => {
        canvasDevice.closeConnection()
        .then(applicationTeardown);
    });
});

// Call init() to trigger device discovery
sdk.init();
