import { EventEmitter } from 'events';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import CameraEvents from './../../utilitis/events';
import JSZip from 'jszip';

const BINARY_APPLICATION = 'huddly.bin';
const BINARY_BOOT = 'huddly_boot.bin';

const getBinaries = async (pkgAsBuffer) => {
  if (pkgAsBuffer === null) return {};
  const pkg = await JSZip.loadAsync(pkgAsBuffer);

  const mv2AppFile = pkg.files[BINARY_APPLICATION] ? BINARY_APPLICATION : `bin/${BINARY_APPLICATION}`;
  const mv2BootFile = pkg.files[BINARY_BOOT] ? BINARY_BOOT : `bin/${BINARY_BOOT}`;

  const mv2 = await pkg.files[mv2AppFile].async('nodebuffer');
  const mv2_boot = await pkg.files[mv2BootFile].async('nodebuffer');
  return {
    mv2,
    mv2_boot
  };
};

export default class HuddlyGoUpgrader extends EventEmitter implements IDeviceUpgrader {
  _devInstance: any;
  _cameraDiscovery: EventEmitter;
  _hidApi: any;
  logger: any;
  options: any = {};
  bootTimeout: number = (30 * 1000); // 30 seconds

  constructor(devInstance: any, cameraDiscovery: EventEmitter, hidAPI: any, logger: any) {
    super();
    this._devInstance = devInstance;
    this._cameraDiscovery = cameraDiscovery;
    this._hidApi = hidAPI;
    this.logger = logger;
  }

  init(opts: any): void {
    this.options.file = opts.file;
    if (opts.bootTimeout) {
      this.bootTimeout = opts.bootTimeout * 1000;
    }
  }

  async start(): Promise<void> {
    this.emit(CameraEvents.UPGRADE_START);
    this.doUpgrade();
  }


  async doUpgrade(): Promise<any> {
    const hidEventEmitter = new EventEmitter();
    let bootTimeout;
    this._hidApi.registerForHotplugEvents(hidEventEmitter);
    const upgradePromise = new Promise(async (resolve, reject) => {
      const binaries = await getBinaries(this.options.file);
      hidEventEmitter.on('HID_ATTACH', () => {
        this.logger.debug('HID Device attached');
        hidEventEmitter.removeAllListeners('HID_ATTACH');
        this._hidApi.upgrade(binaries);
      });

      hidEventEmitter.on('UPGRADE_FAILED', (msg) => {
        hidEventEmitter.removeAllListeners('UPGRADE_FAILED');
        hidEventEmitter.removeAllListeners('UPGRADE_COMPLETE');
        this.emit(CameraEvents.UPGRADE_FAILED);
        clearTimeout(bootTimeout);
        return reject(msg);
      });

      hidEventEmitter.on('UPGRADE_PROGRESS', msg => {
        this.logger.debug(msg);
      });
      hidEventEmitter.on('UPGRADE_COMPLETE', async () => {
        bootTimeout = setTimeout(() => {
          clearTimeout(bootTimeout);
          this.emit(CameraEvents.TIMEOUT, 'Camera did not come back up after upgrade!');
        }, this.bootTimeout);

        await this._hidApi.rebootInAppMode();

        this._hidApi.destruct();
        hidEventEmitter.removeAllListeners('UPGRADE_FAILED');
        hidEventEmitter.removeAllListeners('UPGRADE_COMPLETE');
        clearTimeout(bootTimeout);
        this.emit(CameraEvents.UPGRADE_COMPLETE);
        return resolve();
      });

      // this.eventEmitter.emit(CameraEvents.UPGRADE_START);
      this._devInstance.reboot('bl');

      this._hidApi.startScanner(100); // set low scan interval
    });
    await upgradePromise;
  }

  async postUpgrade(): Promise<any> {
    // Huddly Go does not require any post upgrade checks!
    return Promise.resolve();
  }
}