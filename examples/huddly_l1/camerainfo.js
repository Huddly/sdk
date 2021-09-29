const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;
const { HUDDLY_L1_PID } = require('@huddly/sdk/lib/src/components/device/factory').default;

const ipApi = new HuddlyDeviceApiIp();

// Create an instance of the SDK
const sdk = new HuddlySdk(ipApi);

const applicationTeardown = () => {
    process.exit();
}

sdk.on('ATTACH', (aceDevice) => {
    if (aceDevice.pid == HUDDLY_L1_PID) {
        aceDevice.getInfo()
        .then(info => {
            console.log(info);
        })
        .catch((e) => {
            console.trace(e);
        }).finally(_ => {
            aceDevice.closeConnection()
            .then(applicationTeardown);
        });
    }
});

// Call init() to trigger device discovery
sdk.init();
