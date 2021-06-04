const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;

const ipApi = new HuddlyDeviceApiIp();

// Create an instance of the SDK
const sdk = new HuddlySdk(ipApi, [ipApi], { developmentMode: true });
aceDevice = undefined;

sdk.on('ATTACH', async (cameraManager) => {
    aceDevice = cameraManager;
    aceDevice.getInfo()
    .then(async (info) => {
        console.log(info);
        await aceDevice.closeConnection();
        process.exit();
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
