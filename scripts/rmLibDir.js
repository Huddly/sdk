const rimraf = require('rimraf');

try {
    rimraf.sync('./lib', { disableGlob: true });
} catch(err) {
    console.error('Unable to delete lib folder', err);
}
