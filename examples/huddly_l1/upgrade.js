const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;

const ipApi = new HuddlyDeviceApiIp();

// Create an instance of the SDK
const sdk = new HuddlySdk(ipApi, [ipApi], { serial: '12101A0029' });
aceDevice = undefined;

sdk.once('ATTACH', async (cameraManager) => {
    aceDevice = cameraManager;
    cameraManager.upgrade({
        cpioFilePath: 'image.cpio'
    }).then(() => {
        console.log('---- APP ----- upgrade completed!');
    }).catch((e) => {
        console.error(e);
        console.error('---- APP ----- upgrade failed!');
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

console.log('SDK init')
sdk.init();