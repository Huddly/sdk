const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;

const ipApi = new HuddlyDeviceApiIp();

// Create an instance of the SDK
const sdk = new HuddlySdk(ipApi, [ipApi], { serial: '12101A0029' });
aceDevice = undefined;

sdk.on('ATTACH', async (cameraManager) => {
    aceDevice = cameraManager;
    cameraManager.getInfo().then((info) => {
        console.log(info);
    }).catch((e) => {
        console.error('Something went wrong');
        console.trace(e);
        aceDevice.closeConnection().then(() => {
            console.log("\nTeardown completed! Application closed");
            process.exit();
        });
    });
});

sdk.on('DETACH', async (device) => {
    await aceDevice.closeConnection();
    aceDevice = undefined;
});


process.on('SIGINT', async () => {
    console.log("\nClosing application gracefully");
    if (aceDevice) {
        console.log('Closing connection with the camera');
        await aceDevice.closeConnection();
    }
    console.log("\nTeardown completed! Application closed");
    process.exit();
});

sdk.init();
