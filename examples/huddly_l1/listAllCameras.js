const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlyDeviceApiIUsb = require('@huddly/device-api-usb').default;
const HuddlySdk = require('@huddly/sdk').default;
const { HUDDLY_L1_PID } = require('@huddly/sdk/lib/src/components/device/factory').default;

const ipApi = new HuddlyDeviceApiIp();
const usbApi = new HuddlyDeviceApiIUsb();
// Create an instance of the SDK
const sdk = new HuddlySdk([usbApi, ipApi], [usbApi, ipApi]);

const applicationTeardown = () => {
    process.exit();
}

if (!process.argv[2]) {
    console.log('Note: Default search time (30 seconds). Update it by adding an extra cmd argument.');
}
const searchTime = process.argv[2] || 30;
const cameraList = [];

sdk.on('ATTACH', (huddlyDevice) => {
    console.log(`Found [${huddlyDevice.productName}] device!`)
    huddlyDevice.getInfo()
    .then(info => {
        cameraList.push(info)
    })
    .catch((e) => {
        console.error(`Unable to get camera info from [${huddlyDevice.productName}]`)
        console.trace(e);
    }).finally(_ => {
        huddlyDevice.closeConnection();
    });
});

setTimeout(() => {
    console.group('Camera List')
    console.log(cameraList)
    console.groupEnd();
    applicationTeardown();
}, searchTime * 1000)

// Call init() to trigger device discovery
sdk.init();
