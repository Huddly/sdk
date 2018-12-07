import HuddlyDeviceAPIUSB from '@huddly/device-api-usb';
import HuddlySdk from '@huddly/sdk';

// Initialize the SDK
const opts = {};
// Create instances of device-apis you want to use
const usbApi = new HuddlyDeviceAPIUSB();

// Create an instance of the SDK
const sdk = new HuddlySdk(opts, usbApi, [usbApi]);

let cameraManager;
// Setup Attach/Detach Events
sdk.on('ATTACH', (d) => {
  cameraManager = d;
});

sdk.on('DETACH', () => {
  cameraManager = undefined;
});

init();

async function init() {
  await sdk.initialize();
}

async function getInfo() {
  if (cameraManager) {
    const info = await cameraManager.getInfo();
    return info;
  } else {
    return { "error": 'Camera manager not initialized' };
  }
}

let detector;
let detectorObj = {};
let frame = {};
async function setupDetectionListener() {
  detector.on('DETECTIONS', (d) => {
    detectorObj = d;
  });
}

function setupFramerListener() {
  detector.on('FRAMING', (f) => {
    frame = f;
  })
}

async function startAutozoom() {
  if (!detector) {
    detector = await sdk.getDetector(cameraManager);
  }

  if (detector) {
    try {
      detector.start();
      setupDetectionListener();
      setupFramerListener();
      return { "status": "Autozoom started!" };
    } catch (e) {
      return { "error": e };
    }
  } else {
    return { "error": 'Detector not initialized!' };
  }
}

async function prepareAutozoom() {
  if (cameraManager) {
    try {
      detector = await sdk.getDetector(cameraManager);
      await sdk.initialize();
      return { "status": "blob uploaded and autozoom started" };
    } catch (e) {
      return { "error": e };
    }
  } else {
    return { "error": 'Camera manager not initialized! Cannot initialize detector!' };
  }
}

async function stopAutozoom() {
  if (detector) {
    detector.stop();
    detector = undefined;
    return { "status": "Autozoom stopped!" };
  } else {
    return { "error": 'Camera manager not initialized! Cannot stop detector!' };
  }
}

async function detect() {
  if (detector) {
    return {
      "detections": detectorObj,
      "framing": frame
    };
  } else {
    return { "error": 'Camera manager not initialized! Cannot get detectors!' };
  }
}

let upgradeState;
async function upgrade({ file }) {
  if (cameraManager) {
    try {
      const upgradePromise = sdk.upgrade(cameraManager, {
        file,
      });
      upgradeState = 'in progress';
      await upgradePromise;
      upgradeState = 'complete';
      setTimeout(function () {
        upgradeState = null;
      }, 2000);
    } catch (e) {
      upgradeState = 'failed';
    }
  } else {
    return { "error": 'Camera manager not initialized' };
  }
}


function getUpgradeStatus() {
  return {
    state: upgradeState
  };
}

module.exports = {
  getInfo,
  prepareAutozoom,
  startAutozoom,
  stopAutozoom,
  detect,
  upgrade,
  getUpgradeStatus,
};
