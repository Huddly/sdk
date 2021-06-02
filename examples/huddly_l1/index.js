const HuddlyDeviceApiIp = require('@huddly/device-api-ip').default;
const HuddlySdk = require('@huddly/sdk').default;

const ipApi = new HuddlyDeviceApiIp();

// Create an instance of the SDK
const sdk = new HuddlySdk(ipApi, [ipApi]);
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


/* const fs = require('fs');

class CpioFile {
    fd;
    name;
    size;
    pos;
    offset;

    constructor(fd, name, size, offset) {
        this.fd = fd;
        this.name = name;
        this.size = size;
        this.offset = offset;
        this.pos = offset;
    }

    read(buffer, count) {
        const bytesRead = fs.readSync(this.fd, buffer, 0, Math.min(count, this.size - this.pos), this.pos);
        this.pos += bytesRead;
        return bytesRead;
    }

    reset() {
        this.pos = this.offset;
    }

    close() {
        fs.closeSync(this.fd);
    }
}
class CpioReader {
    fd;
    files = {};
    TRAILER_FILENAME = 'TRAILER!!!';
    seekPos = undefined;

    constructor() {
        this.fd = fs.openSync("image.cpio", "r+");
        this.readFiles();
    }

    getFile(name) {
        return this.files[name];
    }

    readFiles() {
        while (true) {
            let headersize = 6 + 13 * 8;
            let fileData = Buffer.alloc(headersize);
            fs.readSync(this.fd, fileData, 0, headersize, this.seekPos);
            this.updatePos(headersize)

            let header = fileData.slice(6);
            let magic = fileData.slice(0, 6);
            if (magic.toString() != Buffer.from('070702').toString()) {
                console.error('Wrong magic');
                console.log(magic.toString() ," !== ", Buffer.from('070702').toString());
            }
            const namesize = parseInt(header.slice(11*8, 11*8+8).toString(), 16);
            const fileSize = parseInt(header.slice(6*8, 6*8+8).toString(), 16);
            let name = Buffer.alloc(namesize);
            fs.readSync(this.fd, name, 0, namesize, this.seekPos);
            this.updatePos(namesize)

            name = name.slice(0, -1).toString();
            if (name == this.TRAILER_FILENAME) {
                break;
            }

            if (this.seekPos && this.seekPos % 4 != 0) {
                this.relativeSeek()
            }

            console.log(`Creating cpio file ${name} starts at ${this.seekPos} and has size ${fileSize}`);
            this.files[name] = new CpioFile(this.fd, name, fileSize, this.seekPos);
            this.updatePos(fileSize)
            if (this.seekPos && this.seekPos % 4 != 0) {
                this.relativeSeek()
            }
        }
    }

    relativeSeek() {
        const amount_to_read = 4 - this.seekPos % 4;
        fs.readSync(this.fd, Buffer.alloc(amount_to_read), 0, amount_to_read, this.seekPos);
        this.updatePos(amount_to_read)
    }

    updatePos(increment) {
        if (!this.seekPos) {
            this.seekPos = increment
        } else {
            this.seekPos += increment
        }
    }

    close() {
        fs.closeSync(this.fd)
    }
}

var cpioReader = new CpioReader();
var cpioFile = cpioReader.getFile('image.itb');
GRPC_STREAM_CHUNK_SIZE = 1024
var buffer = Buffer.alloc(GRPC_STREAM_CHUNK_SIZE);
console.log('Buffer length '+ buffer.length);
let i = 0;

fs.open('image.itb', 'w', function(err, fd) {
    if (err) {
        throw 'could not open file: ' + err;
    }

    while (cpioFile.read(buffer, buffer.length)) {
        console.log('Writing data to file');
        fs.writeSync(fd, buffer, 0, buffer.length, null);
    }
    fs.closeSync(fd);
});
 */

