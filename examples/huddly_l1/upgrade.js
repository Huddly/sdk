const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;
const { HUDDLY_L1_PID } = require('@huddly/sdk/lib/src/components/device/factory').default;
const fs = require('fs');

const ipApi = new HuddlyDeviceApiIp();
// Create an instance of the SDK
const sdk = new HuddlySdk(ipApi);

const applicationTeardown = () => {
    process.exit();
}

if (!process.argv[2]) {
    throw new Error('Please provide the cpio file path as the last argument!');
}

let aceDevice;
let isUpgrading = false;
const cpioFilePath = process.argv[2];
sdk.on('ATTACH', (newDevice) => {
    if (newDevice.pid == HUDDLY_L1_PID) {
        if (!aceDevice || aceDevice['serialNumber'] == newDevice['serialNumber']) {
            aceDevice = newDevice;
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
                aceDevice.getInfo()
                .then(newInfo => {
                    console.log(newInfo);
                    resolve();
                }).catch(e => {
                    console.error('Unable to get device info after upgrade!');
                    reject(e);
                })
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
    }
});

// Call init() to trigger device discovery
sdk.init();
