import { EventEmitter } from 'events';
import JSZip from 'jszip';

import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import UpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import CameraEvents from './../../utilitis/events';
import UpgradeStatus, { UpgradeStatusStep } from './upgradeStatus';

const BINARY_APPLICATION = 'huddly.bin';
const BINARY_BOOT = 'huddly_boot.bin';

/**
 * @ignore
 *
 * @param {*} pkgAsBuffer
 * @return {*} Object of buffers
 */
const getBinaries = async (pkgAsBuffer) => {
  if (pkgAsBuffer === null) return {};
  const pkg = await JSZip.loadAsync(pkgAsBuffer);

  const mv2AppFile = pkg.files[BINARY_APPLICATION]
    ? BINARY_APPLICATION
    : `bin/${BINARY_APPLICATION}`;
  const mv2BootFile = pkg.files[BINARY_BOOT] ? BINARY_BOOT : `bin/${BINARY_BOOT}`;

  const mv2 = await pkg.files[mv2AppFile].async('nodebuffer');
  const mv2_boot = await pkg.files[mv2BootFile].async('nodebuffer');
  return {
    mv2,
    mv2_boot,
  };
};

/**
 * Controller class for instrumenting the upgrade process on Huddly GO camera.
 *
 * @export
 * @class HuddlyGoUpgrader
 * @extends {EventEmitter}
 * @implements {IDeviceUpgrader}
 */
export default class HuddlyGoUpgrader extends EventEmitter implements IDeviceUpgrader {
  /** @ignore */
  _devInstance: any;
  /** @ignore */
  _cameraDiscovery: EventEmitter;
  /** @ignore */
  _hidApi: any;
  /** @ignore */
  options: any = {};
  /** @ignore */
  bootTimeout: number = 30 * 1000; // 30 seconds
  /** @ignore */
  private _upgradeStatus: UpgradeStatus;

  constructor(devInstance: any, cameraDiscovery: EventEmitter, hidAPI: any) {
    super();
    this._devInstance = devInstance;
    this._cameraDiscovery = cameraDiscovery;
    this._hidApi = hidAPI;
  }

  /**
   * Initializes the upgrader with the necessary options.
   *
   * @param {UpgradeOpts} opts The upgrade options required for performing a firmware upgrade on Huddly GO
   * @memberof HuddlyGoUpgrader
   */
  init(opts: UpgradeOpts): void {
    this.options.file = opts.file;
    if (opts.bootTimeout) {
      this.bootTimeout = opts.bootTimeout * 1000;
    }
  }

  /**
   * @ignore
   * Helper function for firing upgrade progress status events
   *
   * @param {string} [statusString] The status of the upgrade to be reported.
   * @memberof HuddlyGoUpgrader
   */
  emitProgressStatus(statusString?: string) {
    if (statusString) this._upgradeStatus.statusString = statusString;
    this.emit(CameraEvents.UPGRADE_PROGRESS, this._upgradeStatus.getStatus());
  }

  /**
   * Starts the upgrade process on the Huddly GO camera and also reports upgrade status to the consumer
   * using events.
   *
   * @return {*}  {Promise<void>} Void function that relies on events for communicating the upgrade result/progress.
   * @memberof HuddlyGoUpgrader
   */
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

  /**
   * @ignore
   * Start the upgrade procedure on the Huddly GO camera without setting up upgrade status. Plase use
   * `start()` when you want to invoke the proper upgrade with status reporting.
   *
   * @return {*}  {Promise<any>} Resolves when the upgrade is completed.
   * @memberof HuddlyGoUpgrader
   */
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

      hidEventEmitter.on('UPGRADE_PROGRESS', (msg) => {
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
