import { EventEmitter } from 'events';
import semver from 'semver';

import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import IBoxfishUpgraderFile, {
  IMAGE_TYPES,
} from '@huddly/sdk-interfaces/lib/interfaces/IBoxfishUpgraderFile';
import UpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import Locksmith from './../locksmith';
import Api from '../api';
import { calculate } from './../../utilitis/crc32c';
import CameraEvents from './../../utilitis/events';
import TypeHelper from './../../utilitis/typehelper';
import Boxfish from './../device/boxfish';
import UpgradeStatus, { UpgradeStatusStep } from './upgradeStatus';

import { createBoxfishUpgraderFile } from './../upgrader/boxfishUpgraderFactory';

import { HPK_SUPPORT_VERSION } from './../upgrader/boxfishUpgraderFactory';

/**
 * @deprecated
 * @ignore
 *
 * Controller class for instrumenting the upgrade process on the Huddly IQ cameras (legacy).
 *
 * @export
 * @class BoxfishUpgrader
 * @extends {EventEmitter}
 * @implements {IDeviceUpgrader}
 */
export default class BoxfishUpgrader extends EventEmitter implements IDeviceUpgrader {
  _cameraManager: IDeviceManager;
  _sdkDeviceDisoveryEmitter: EventEmitter;
  _boxfishPackage: IBoxfishUpgraderFile;
  locksmith: Locksmith;
  options: any = {};
  bootTimeout: number = 30 * 1000; // 30 seconds
  writeBufSupport: boolean = undefined;
  verboseStatusLog: boolean = true;
  private _upgradeStatus: UpgradeStatus;

  get transport(): IUsbTransport {
    if (TypeHelper.instanceOfUsbTransport(this._cameraManager.transport)) {
      return <IUsbTransport>this._cameraManager.transport;
    }
    throw new Error('Unable to talk to device. Tarnsport must be UsbTransport compatible');
  }

  constructor(manager: IDeviceManager, sdkDeviceDiscoveryEmitter: EventEmitter) {
    super();
    this._cameraManager = manager;
    this._sdkDeviceDisoveryEmitter = sdkDeviceDiscoveryEmitter;
    this.locksmith = new Locksmith();
  }

  init(opts: UpgradeOpts): void {
    this._boxfishPackage = createBoxfishUpgraderFile(opts.file);
    this.options.flash_fsbl = opts.flash_fsbl;
    this.options.file = opts.file;
    if (opts.bootTimeout) {
      this.bootTimeout = opts.bootTimeout * 1000;
    }
    if (opts.verboseStatusLog !== undefined) {
      this.verboseStatusLog = opts.verboseStatusLog;
    }
    this.registerHotPlugEvents();
  }

  registerHotPlugEvents(): void {
    this._sdkDeviceDisoveryEmitter.on(CameraEvents.ATTACH, async (devManager) => {
      if (
        devManager &&
        devManager instanceof Boxfish &&
        this._cameraManager['serialNumber'] === devManager['serialNumber']
      ) {
        this._cameraManager = devManager;
        this.emit('UPGRADE_REBOOT_COMPLETE');
      }
    });

    this._sdkDeviceDisoveryEmitter.on(CameraEvents.DETACH, async (d) => {
      if (d && this._cameraManager['serialNumber'] === d.serialNumber) {
        this.transport.close();
        this.emit('UPGRADE_REBOOT');
      }
    });
  }

  emitProgressStatus(statusString?: string) {
    if (statusString) this._upgradeStatus.statusString = statusString;
    this.emit(CameraEvents.UPGRADE_PROGRESS, this._upgradeStatus.getStatus());
  }

  async start(): Promise<void> {
    const firstUploadStatusStep = new UpgradeStatusStep('Executing software upgrade', 80);
    const rebootStep = new UpgradeStatusStep('Rebooting camera', 3);
    const verificationStep = new UpgradeStatusStep('Verifying new software', 3);

    this._upgradeStatus = new UpgradeStatus([firstUploadStatusStep, rebootStep, verificationStep]);
    Logger.debug('Starting Upgrade', 'Boxfish PKG Upgrader');
    this.emitProgressStatus('Starting upgrade');
    this.emit(CameraEvents.UPGRADE_START);
    firstUploadStatusStep.progress = 1;
    const state = await this.upgrade();
    firstUploadStatusStep.progress = 100;
    this.emitProgressStatus();
    rebootStep.progress = 1;
    Logger.debug('Rebooting Camera', 'Boxfish PKG Upgrader');
    this.emitProgressStatus('Rebooting camera');

    // Timeout if the camera does not come back up after bootTimeout seconds have passed!
    const bootTimeout = setTimeout(() => {
      clearTimeout(bootTimeout);
      this.emit(CameraEvents.TIMEOUT, 'Camera did not come back up after upgrade!');
    }, this.bootTimeout);

    this.once('UPGRADE_REBOOT_COMPLETE', async () => {
      Logger.debug('Camerea successfully booted after upgrade', 'Boxfish PKG Upgrader');
      try {
        rebootStep.progress = 100;
        this.emitProgressStatus();
        verificationStep.progress = 1;
        Logger.debug('Verifying new software', 'Boxfish PKG Upgrader');
        this.emitProgressStatus('Verifying new software');
        await this.postUpgrade(state);
        verificationStep.progress = 100;
        Logger.debug('Upgrade Completed', 'Boxfish PKG Upgrader');
        this.emitProgressStatus('Upgrade complete');
        clearTimeout(bootTimeout);
        this.emit(CameraEvents.UPGRADE_COMPLETE, this._cameraManager);
      } catch (e) {
        clearTimeout(bootTimeout);
        this.emit(CameraEvents.UPGRADE_FAILED, e);
      }
    });
  }

  async doUpgrade(): Promise<any> {
    return new Promise<void>(async (resolve, reject) => {
      this.once(CameraEvents.UPGRADE_COMPLETE, () => resolve());
      this.once(CameraEvents.UPGRADE_FAILED, (e) => reject(e));
      this.start();
    });
  }

  extractSofwareVersionFromProdInfo(prodInfo: any): string {
    const appVer = prodInfo.app_version;
    return appVer.replace(/\D+-/, '');
  }

  getBootDecision(prodInfo: any): string {
    const bac = prodInfo.bac_fsbl;
    if (!bac) return '';
    return bac.boot_decision;
  }

  async allocateBuf(size): Promise<any> {
    return this.sendReceive('upgrader/allocate', { args: { size } });
  }

  async legacyWriteBuf(buf: Buffer, offset: number = 0): Promise<any> {
    Logger.debug('Falling back to legacy async file transfer', 'Boxfish PKG Upgrader');
    const sendData = {
      size: buf.length,
      offset,
    };
    const command = {
      send: 'upgrader/write',
      send_data: Api.encode(sendData),
      receive: 'upgrader/write_reply',
    };
    return this._cameraManager.api.asyncFileTransfer(command, buf);
  }

  async writeBuffProbe(): Promise<boolean> {
    try {
      await this.sendReceive('upgrader/write_buf', {
        args: { data: Buffer.alloc(1), offset: 0 },
        receiveEncoding: 'string',
      });
      return true;
    } catch (e) {
      Logger.error('Signle Write Buffer not supported in this firmware', e, 'Boxfish PKG Upgrader');
      return false;
    }
  }

  async writeBuf(buf: Buffer, offset: number = 0): Promise<any> {
    if (this.writeBufSupport === undefined) {
      this.writeBufSupport = await this.writeBuffProbe();
    }

    if (this.writeBufSupport) {
      const result = await this.sendReceive('upgrader/write_buf', {
        args: { data: buf, offset },
        receiveEncoding: 'messagepack',
        timeout: 60000,
      });
      return result;
    }
    return this.legacyWriteBuf(buf, offset);
  }

  async sendReceive(cmd: string, options: any = {}): Promise<any> {
    const res = await this.locksmith.executeAsyncFunction(async () => {
      const r = await this._cameraManager.api.sendAndReceiveWithoutLock(cmd, options);
      return r;
    });
    return res;
  }

  async postUpgrade(upgradeSelection: string): Promise<boolean> {
    Logger.debug('Performing post upgrade steps', 'Boxfish PKG Upgrader');
    await this.printBootInfo();
    await this.setFlashBootState(upgradeSelection);
    await this.setRamBootSelector(upgradeSelection);
    return true;
  }

  async checksumBuf(size: number, offset: number = 0, algorithm: string = 'crc32c'): Promise<any> {
    const cmd = 'upgrader/checksum';
    const cmdResult = `${cmd}_result`;
    const doReply = function (reply) {
      if (algorithm === 'crc32c') {
        return reply.checksum.readUInt32LE();
      }
      return reply.checksum;
    };

    const result = await this._cameraManager.api.withSubscribe(
      [cmdResult],
      () =>
        new Promise(async (resolve, reject) => {
          this.transport
            .receiveMessage(cmdResult, 5000)
            .then((data) => {
              const receivedCmd = data.message;
              if (receivedCmd !== cmdResult) {
                Logger.warn(
                  `Received unexpected ${receivedCmd}. Expected ${cmdResult}`,
                  'Boxfish PKG Upgrader'
                );
                reject(`Received unexpected ${receivedCmd}. Expected ${cmdResult}.`);
              } else {
                const args = Api.decode(data.payload, 'messagepack');
                const result = doReply(args);
                resolve(result);
              }
            })
            .catch((e) => {
              Logger.error('Checksum receive message failure', e, 'Boxfish PKG Upgrader');
              reject(e);
            });

          const res = await this.sendReceive(cmd, {
            args: { size, offset, algorithm },
            receiveEncoding: 'messagepack',
          });
          if (res.error !== 0) {
            throw new Error(
              `Failed to retrieve checksum. Error: ${res.error}. Status: ${res.string}`
            );
          }
          if (res.checksum !== undefined) {
            const result = doReply(res);
            resolve(result);
          }
        })
    );
    return result;
  }

  async executeFlashCmdWaitForDoneWithStatus(
    cmd: string,
    cmdData: any,
    addr: number,
    size: number,
    statusFn?: any
  ): Promise<any> {
    const cmds = {
      cmd,
      done: `${cmd}_done`,
      status: `${cmd}_status`,
    };
    const subscribeMessages = statusFn ? [cmds.done, cmds.status] : [cmds.done];
    return this.locksmith.executeAsyncFunction(async () => {
      await this._cameraManager.api.withSubscribe(
        subscribeMessages,
        () =>
          new Promise<void>(async (resolve, reject) => {
            this.transport.on(cmds.done, (data) => {
              const args = Api.decode(data.payload, 'messagepack');
              if (args.error_count === 0) {
                this.transport.removeAllListeners(cmds.done);
                if (statusFn) {
                  statusFn(size, size);
                  this.transport.removeAllListeners(cmds.status);
                } else {
                  Logger.debug('Stage Completed', 'Boxfish PKG Upgrader');
                }
                resolve();
              } else {
                Logger.warn(
                  `Flash command ${cmd} failed with ${args.error_count} errors`,
                  'Boxfish PKG Upgrader'
                );
                reject(`Flash command ${cmd} failed with ${args.error_count} errors`);
              }
            });
            if (statusFn) {
              this.transport.on(cmds.status, (data) => {
                const args = Api.decode(data.payload, 'messagepack');
                statusFn(args.offset, size);
              });
            }
            await this._cameraManager.api.sendAndReceiveWithoutLock(cmds.cmd, { args: cmdData });
          })
      );
    });
  }

  async eraseFlash(addr: number, size: number, statusFn: any): Promise<any> {
    const cmdData = { flash_addr: addr, size };
    return this.executeFlashCmdWaitForDoneWithStatus(
      'upgrader/erase_flash',
      cmdData,
      addr,
      size,
      statusFn
    );
  }

  async writeFlash(addr: number, size: number, statusFn: any): Promise<any> {
    const cmdData = { flash_addr: addr, size, offset: 0 };
    return this.executeFlashCmdWaitForDoneWithStatus(
      'upgrader/write_flash',
      cmdData,
      addr,
      size,
      statusFn
    );
  }

  async readFlashIntoBuf(addr: number, size: number, statusFn: any): Promise<any> {
    const cmdData = { flash_addr: addr, size, offset: 0 };
    return this.executeFlashCmdWaitForDoneWithStatus(
      'upgrader/read_flash',
      cmdData,
      addr,
      size,
      statusFn
    );
  }

  async doFlash(buffer: Buffer, address: string): Promise<any> {
    let lastTime = 0;
    let lastProgress = Number.POSITIVE_INFINITY;
    let status = undefined;
    if (this.verboseStatusLog) {
      status = (progress, total) => {
        const now = Date.now();
        if (progress < lastProgress || progress === total || now > lastTime + 1) {
          Logger.info(`Status: ${Math.ceil(100 * (progress / total))}%\r`);
          lastTime = now;
          lastProgress = progress;
          if (progress === total) {
            Logger.info('');
          }
        }
      };
    }

    const addr = parseInt(address, 16);
    Logger.info(`Allocating buf.. ${buffer.length}`, 'Boxfish PKG Upgrader');
    await this.allocateBuf(buffer.length);
    Logger.info('Uploading data to camera...', 'Boxfish PKG Upgrader');
    await this.writeBuf(buffer);
    Logger.info('Calculating checksum on target...', 'Boxfish PKG Upgrader');
    const expectedCrc = calculate(buffer);
    const crc = await this.checksumBuf(buffer.length);
    if (expectedCrc !== crc) {
      throw new Error(`Expected crc ${expectedCrc}, got crc ${crc}`);
    }
    const eraseLen = Math.ceil(buffer.length / 4096) * 4096;
    Logger.info(`Erasing... addr: ${addr}`, 'Boxfish PKG Upgrader');
    await this.eraseFlash(addr, eraseLen, status);
    Logger.info('Writing...', 'Boxfish PKG Upgrader');
    await this.writeFlash(addr, buffer.length, status);
    Logger.info('Reading from flash to memory...', 'Boxfish PKG Upgrader');
    await this.readFlashIntoBuf(addr, buffer.length, status);
    Logger.info('Calculating checksum...', 'Boxfish PKG Upgrader');
    const flashCrc = await this.checksumBuf(buffer.length);
    if (expectedCrc !== flashCrc) {
      throw new Error(`Expected crc ${expectedCrc}, got crc ${flashCrc}`);
    }
  }

  async flashFsbl(fsblMvcmd: Buffer): Promise<any> {
    Logger.info('Flashing fsbl', 'Boxfish PKG Upgrader');
    return this.doFlash(fsblMvcmd, '0x00');
  }

  async setFlashBootState(state: string): Promise<any> {
    Logger.info(`Setting flash boot state to ${state}`, 'Boxfish PKG Upgrader');
    return this._cameraManager.api.setProductInfo({ flash_boot_state: state });
  }

  async initFlash(fsblMvcmd: Buffer, boxfishUpgraderFile: IBoxfishUpgraderFile): Promise<any> {
    Logger.info('Initializing flash', 'Boxfish PKG Upgrader');
    await this.flashFsbl(fsblMvcmd);
    /* eslint-disable max-len */
    await this.flashImage(IMAGE_TYPES.SSBL_HEADER, boxfishUpgraderFile, 'C');
    await this.flashImage(IMAGE_TYPES.SSBL, boxfishUpgraderFile, 'C');
    await this.flashImage(IMAGE_TYPES.APP_HEADER, boxfishUpgraderFile, 'C');
    await this.flashImage(IMAGE_TYPES.APP, boxfishUpgraderFile, 'C');
    /* eslint-enable max-len */
    await this.setFlashBootState('C');
    await this.setRamBootSelector('C');
  }

  async flashImage(
    imageType: IMAGE_TYPES,
    upgraderFile: IBoxfishUpgraderFile,
    location: string
  ): Promise<any> {
    const data = upgraderFile.getData(imageType);
    if (data.length === 0) {
      throw new Error(
        `Error starting flashing of image ${IMAGE_TYPES} - could not get data from package`
      );
    }
    const address = upgraderFile.getFlashAddress(imageType, location);
    return this.doFlash(data, address);
  }

  async setRamBootSelector(selector: string): Promise<any> {
    Logger.info(`Setting ram boot selector to ${selector}`, 'Boxfish PKG Upgrader');
    return this._cameraManager.api.setProductInfo({ bac_fsbl: { ram_boot_selector: selector } });
  }

  async printBootInfo(): Promise<void> {
    const prodInfo = await this._cameraManager.api.getProductInfo();
    Logger.info(
      `Current boot decision: ${prodInfo.bac_fsbl.boot_decision}`,
      'Boxfish PKG Upgrader'
    );
    Logger.info(
      `Current flash boot selector: ${prodInfo.flash_boot_state}`,
      'Boxfish PKG Upgrader'
    );
    Logger.info(
      `Current ram boot selector: ${prodInfo.bac_fsbl.ram_boot_selector}`,
      'Boxfish PKG Upgrader'
    );
  }

  async upgrade(): Promise<string> {
    try {
      const startTime = new Date().getTime();
      const prodInfo = await this._cameraManager.api.getProductInfo();
      const boxfishUpgraderFile = createBoxfishUpgraderFile(this.options.file);
      await boxfishUpgraderFile.init();
      this.emit(CameraEvents.UPGRADE_PROGRESS);
      const currentSwVersion = this.extractSofwareVersionFromProdInfo(prodInfo);
      if (semver.gt(currentSwVersion, '0.0.7')) {
        await this.locksmith.executeAsyncFunction(async () => {
          await this.transport.clear();
          await this.transport.write('streaming/lock');
        });
      }

      if (prodInfo.bac_fsbl === false && !this.options.flash_fsbl) {
        throw new Error(
          'Unable to upgrade without first stage bootloader.\n' +
            'No first stage bootloader provided'
        );
      } else if (prodInfo.bac_fsbl === false && this.options.flash_fsbl) {
        const fsblBuffer = boxfishUpgraderFile.getImage(IMAGE_TYPES.FSBL);
        await this.initFlash(fsblBuffer, boxfishUpgraderFile);
        await this._cameraManager.reboot();
        return 'C';
      }
      const bootDecision = this.getBootDecision(prodInfo);
      Logger.info(`Current boot decision ${bootDecision}`, 'Boxfish PKG Upgrader');
      const upgradeSelection = bootDecision === 'A' ? 'B' : 'A';

      /* eslint-disable max-len */
      Logger.debug('Flashing SSBL_HEADER', 'Boxfish PKG Upgrader');
      await this.flashImage(IMAGE_TYPES.SSBL_HEADER, boxfishUpgraderFile, upgradeSelection);
      Logger.debug('Flashing SSBL', 'Boxfish PKG Upgrader');
      await this.flashImage(IMAGE_TYPES.SSBL, boxfishUpgraderFile, upgradeSelection);
      Logger.debug('Flashing APPLICATION_HEADER', 'Boxfish PKG Upgrader');
      await this.flashImage(IMAGE_TYPES.APP_HEADER, boxfishUpgraderFile, upgradeSelection);
      Logger.debug('Flashing APPLICATION', 'Boxfish PKG Upgrader');
      await this.flashImage(IMAGE_TYPES.APP, boxfishUpgraderFile, upgradeSelection);
      /* eslint-enable max-len */
      if (semver.gt(currentSwVersion, '0.0.7')) {
        Logger.debug('Unlocking UVC stream on camera', 'Boxfish PKG Upgrader');
        await this.locksmith.executeAsyncFunction(async () => {
          await this.transport.clear();
          await this.transport.write('streaming/unlock');
        });
      }
      Logger.debug(`Setting boot selector to ${upgradeSelection}`, 'Boxfish PKG Upgrader');
      await this.setRamBootSelector(upgradeSelection);
      await this.printBootInfo();

      Logger.debug(
        'Booting the camera and closing communication instances',
        'Boxfish PKG Upgrader'
      );
      await this._cameraManager.reboot();
      await this.transport.close();

      const finishTime = new Date().getTime();
      const flashTime = (finishTime - startTime) / 1000;
      Logger.info(`Upgrade completed in ${flashTime} seconds`, 'Boxfish PKG Upgrader');

      return upgradeSelection;
    } catch (e) {
      Logger.error('Boxfish camera upgrade failed', e, 'Boxfish PKG Upgrader');
      this.emit(CameraEvents.UPGRADE_FAILED, e);
      throw e;
    }
  }

  async upgradeIsValid(): Promise<boolean> {
    const prodInfo = await this._cameraManager.api.getProductInfo();
    const currentSwVersion = this.extractSofwareVersionFromProdInfo(prodInfo);
    if (semver.lt(currentSwVersion, HPK_SUPPORT_VERSION)) {
      return true;
    }

    try {
      const response = await this._cameraManager.getState();

      Logger.info(`Upgrade status ${JSON.stringify(response)}`, 'Boxfish PKG Upgrader');
      if (response.status === 10) {
        // EMMC is not ready lets wait and try again
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await this.upgradeIsValid();
      }
      return response.status === 0;
    } catch (e) {
      return false;
    }
  }
}
