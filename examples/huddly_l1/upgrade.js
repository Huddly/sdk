const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;
const { HUDDLY_L1_PID } = require('@huddly/sdk/lib/src/components/device/factory').default;
const fs = require('fs');

const ipApi = new HuddlyDeviceApiIp();
const sdk = new HuddlySdk(ipApi);
let aceDevice;
let isUpgrading = false;


const applicationTeardown = () => {
    process.exit();
}

const performUpgrade = (attachedDevice, cpioFilePath) => {
    if (!aceDevice || aceDevice['serialNumber'] == attachedDevice['serialNumber']) {
        aceDevice = attachedDevice;
        if (isUpgrading) {
            return;
        }
    }
    aceDevice.getInfo()
    .then(info => new Promise((resolve, reject) => {
        console.log(info);
        const upgradeOpts = {
            file: fs.readFileSync(cpioFilePath)
        };
        console.log('Starting software upgrade...');
        isUpgrading = true;
        aceDevice.upgrade(upgradeOpts)
        .then(_ => {
            console.log('Upgrade completed successfully!');
            resolve();
        }).catch(e => {
            console.error('Upgrade failed!');
            reject(e);
        });
    }))
    .catch((e) => {
        console.trace(e);
    }).finally(_ => {
        aceDevice.closeConnection()
        .then(applicationTeardown);
    });
};

if (!process.argv[2]) {
    throw new Error('Please provide the cpio file path as the last argument!');
}


sdk.on('ATTACH', (newDevice) => {
    if (newDevice.pid == HUDDLY_L1_PID) {
        performUpgrade(newDevice, process.argv[2]);
    }
});

// Call init() to trigger device discovery
sdk.init();
