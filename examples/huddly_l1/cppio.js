var cpio = require('cpio-stream')
var extract = cpio.extract()
var fs = require('fs')

extract.on('entry', (header, stream, cb) => {
    if (header.name !== 'image.itb') {
        return;
    }
    stream.on('end', () => {
        console.log('end');
        cb()
        extract.destroy();
    });
    stream.on('data', (chunk) => {
        console.log('Got chunk ' + chunk);
    });
    console.log(`Drain for ${header.name}`);
    stream.resume() // auto drain

});

fs.createReadStream('image.cpio').pipe(extract);