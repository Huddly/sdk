import { EventEmitter } from 'events';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import CameraEvents from './../../utilitis/events';
import JSZip from 'jszip';
import UpgradeStatus, { UpgradeStatusStep } from './upgradeStatus';
import Logger from './../../utilitis/logger';

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
  options: any = {};
  bootTimeout: number = (30 * 1000); // 30 seconds
  private _upgradeStatus: UpgradeStatus;

  constructor(devInstance: any, cameraDiscovery: EventEmitter, hidAPI: any) {
    super();
    this._devInstance = devInstance;
    this._cameraDiscovery = cameraDiscovery;
    this._hidApi = hidAPI;
  }

  init(opts: UpgradeOpts): void {
    this.options.file = opts.file;
    if (opts.bootTimeout) {
      this.bootTimeout = opts.bootTimeout * 1000;
    }
  }

  emitProgressStatus(statusString?: string) {
    if (statusString) this._upgradeStatus.statusString = statusString;
    this.emit(CameraEvents.UPGRADE_PROGRESS, this._upgradeStatus.getStatus());
  }

  async start(): Promise<void> {
    const step = new UpgradeStatusStep('Upgrading camera');
    this._upgradeStatus = new UpgradeStatus([step]);
    this.emitProgressStatus('Starting upgrade');
    this.emit(CameraEvents.UPGRADE_START);
    step.progress = 1;
    this.emitProgressStatus();
    await this.doUpgrade();
    step.progress = 100;
    this.emitProgressStatus('Upgrade completed');
  }

  async doUpgrade(): Promise<any> {
    const hidEventEmitter = new EventEmitter();
    let bootTimeout;
    this._hidApi.registerForHotplugEvents(hidEventEmitter);
    const upgradePromise = new Promise<void>(async (resolve, reject) => {
      const binaries = await getBinaries(this.options.file);
      hidEventEmitter.on('HID_ATTACH', () => {
        Logger.debug('HID Device attached', 'HuddlyGO Upgrader');
        hidEventEmitter.removeAllListeners('HID_ATTACH');
        this._hidApi.upgrade(binaries);
      });

      hidEventEmitter.on('UPGRADE_FAILED', (msg) => {
        Logger.info('HID Upgrade failed', 'HuddlyGO Upgrader');
        hidEventEmitter.removeAllListeners('UPGRADE_FAILED');
        hidEventEmitter.removeAllListeners('UPGRADE_COMPLETE');
        this.emit(CameraEvents.UPGRADE_FAILED);
        clearTimeout(bootTimeout);
        return reject(msg);
      });

      hidEventEmitter.on('UPGRADE_PROGRESS', msg => {
        Logger.info(msg, 'HuddlyGO Upgrader');
      });

      hidEventEmitter.on('UPGRADE_COMPLETE', async () => {
        bootTimeout = setTimeout(() => {
          clearTimeout(bootTimeout);
          this.emit(CameraEvents.TIMEOUT, 'Camera did not come back up after upgrade!');
          Logger.info('HID Upgrade timed out', 'HuddlyGO Upgrader');
        }, this.bootTimeout);

        await this._hidApi.rebootInAppMode();

        this._hidApi.destruct();
        hidEventEmitter.removeAllListeners('UPGRADE_FAILED');
        hidEventEmitter.removeAllListeners('UPGRADE_COMPLETE');
        clearTimeout(bootTimeout);
        this.emit(CameraEvents.UPGRADE_COMPLETE);
        Logger.info('Upgrade successful', 'HuddlyGO Upgrader');
        return resolve();
      });

      // this.eventEmitter.emit(CameraEvents.UPGRADE_START);
      Logger.debug('Booting the camera into bootloader mode', 'HuddlyGO Upgrader');
      this._devInstance.reboot('bl');

      this._hidApi.startScanner(100); // set low scan interval
    });
    await upgradePromise;
  }

  async postUpgrade(): Promise<any> {
    // Huddly Go does not require any post upgrade checks!
    return Promise.resolve();
  }

  async upgradeIsValid(): Promise<boolean> {
    // Huddly Go does valid check works!
    return Promise.resolve(true);
  }
}
