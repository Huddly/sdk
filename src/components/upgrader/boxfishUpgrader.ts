import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import { EventEmitter } from 'events';
import IDeviceManager from './../../interfaces/iDeviceManager';
import IBoxfishUpgraderFile, { IMAGE_TYPES } from './../../interfaces/IBoxfishUpgraderFile';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import semver from 'semver';
import Locksmith from './../locksmith';
import Api from '../api';
import { calculate } from './../../utilitis/crc32c';
import CameraEvents from './../../utilitis/events';
import Boxfish from './../device/boxfish';
import UpgradeStatus, { UpgradeStatusStep } from './upgradeStatus';

import { createBoxfishUpgraderFile } from './../upgrader/boxfishUpgraderFactory';

import { HPK_SUPPORT_VERSION } from './../upgrader/boxfishUpgraderFactory';

export default class BoxfishUpgrader extends EventEmitter implements IDeviceUpgrader {
  _cameraManager: IDeviceManager;
  _sdkDeviceDisoveryEmitter: EventEmitter;
  _logger: any;
  _boxfishPackage: IBoxfishUpgraderFile;
  locksmith: Locksmith;
  options: any = {};
  bootTimeout: number = (30 * 1000); // 30 seconds
  writeBufSupport: boolean = undefined;
  verboseStatusLog: boolean = true;
  private _upgradeStatus: UpgradeStatus;

  constructor(manager: IDeviceManager, sdkDeviceDiscoveryEmitter: EventEmitter, logger: any) {
    super();
    this._cameraManager = manager;
    this._sdkDeviceDisoveryEmitter = sdkDeviceDiscoveryEmitter;
    this._logger = logger;
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
      if (devManager && devManager instanceof Boxfish
        && this._cameraManager['serialNumber'] === devManager['serialNumber']) {
        this._cameraManager = devManager;
        this.emit('UPGRADE_REBOOT_COMPLETE');
      }
    });

    this._sdkDeviceDisoveryEmitter.on(CameraEvents.DETACH, async (d) => {
      if (d && this._cameraManager['serialNumber'] === d.serialNumber) {
        this._cameraManager.transport.close();
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

    this._upgradeStatus = new UpgradeStatus([
      firstUploadStatusStep,
      rebootStep,
      verificationStep,
    ]);
    this.emitProgressStatus('Starting upgrade');
    this.emit(CameraEvents.UPGRADE_START);
    firstUploadStatusStep.progress = 1;
    const state = await this.upgrade();
    firstUploadStatusStep.progress = 100;
    this.emitProgressStatus();
    rebootStep.progress = 1;
    this.emitProgressStatus('Rebooting camera');

    // Timeout if the camera does not come back up after bootTimeout seconds have passed!
    const bootTimeout = setTimeout(() => {
      clearTimeout(bootTimeout);
      this.emit(CameraEvents.TIMEOUT, 'Camera did not come back up after upgrade!');
    }, this.bootTimeout);

    this.once('UPGRADE_REBOOT_COMPLETE', async () => {
      try {
        rebootStep.progress = 100;
        this.emitProgressStatus();
        verificationStep.progress = 1;
        this.emitProgressStatus('Verifying new software');
        await this.postUpgrade(state);
        verificationStep.progress = 100;
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
    return new Promise(async (resolve, reject) => {
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
    this._logger.warn('Falling back to file transfer');
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
      await this.sendReceive(
        'upgrader/write_buf',
        {
          args: { data: Buffer.alloc(1), offset: 0 },
          receiveEncoding: 'string'
        });
      return true;
    } catch (e) {
      this._logger.warn(`Write buf not supported in this firmware! ${e}`);
      return false;
    }
  }

  async writeBuf(buf: Buffer, offset: number = 0): Promise<any> {
    if (this.writeBufSupport === undefined) {
      this.writeBufSupport = await this.writeBuffProbe();
    }

    if (this.writeBufSupport) {
      const result = await this.sendReceive(
        'upgrader/write_buf',
        {
          args: { data: buf, offset },
          receiveEncoding: 'messagepack',
          timeout: 60000
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
      [cmdResult], () => new Promise(async (resolve, reject) => {
        this._cameraManager.transport.receiveMessage(cmdResult, 5000)
          .then((data) => {
            const receivedCmd = data.message;
            if (receivedCmd !== cmdResult) {
              reject(`Received unexpected ${receivedCmd}. Expected ${cmdResult}.`);
            } else {
              const args = Api.decode(data.payload, 'messagepack');
              const result = doReply(args);
              resolve(result);
            }
          })
          .catch((e) => reject(e));

        const res = await this.sendReceive(cmd, {
          args: { size, offset, algorithm },
          receiveEncoding: 'messagepack',
        });
        if (res.error !== 0) {
          throw new Error(`Failed to retrieve checksum. Error: ${res.error}. Status: ${res.string}`);
        }
        if (res.checksum !== undefined) {
          const result = doReply(res);
          resolve(result);
        }
      }));
    return result;
  }

  async executeFlashCmdWaitForDoneWithStatus(cmd: string, cmdData: any, addr: number, size: number, statusFn?: any): Promise<any> {
    const cmds = {
      cmd,
      done: `${cmd}_done`,
      status: `${cmd}_status`,
    };
    const subscribeMessages = statusFn ? [cmds.done, cmds.status] : [cmds.done];
    return this.locksmith.executeAsyncFunction(async () => {
      await this._cameraManager.api.withSubscribe(
        subscribeMessages, () => new Promise(async (resolve, reject) => {
          this._cameraManager.transport.on(cmds.done, (data) => {
            const args = Api.decode(data.payload, 'messagepack');
            if (args.error_count === 0) {
              this._cameraManager.transport.removeAllListeners(cmds.done);
              if (statusFn) {
                statusFn(size, size);
                this._cameraManager.transport.removeAllListeners(cmds.status);
              } else {
                this._logger.info('Stage Completed!');
              }
              resolve();
            } else {
              reject(`Flash command ${cmd} failed with ${args.error_count} errors`);
            }
          });
          if (statusFn) {
            this._cameraManager.transport.on(cmds.status, (data) => {
              const args = Api.decode(data.payload, 'messagepack');
              statusFn(args.offset, size);
            });
          }
          await this._cameraManager.api.sendAndReceiveWithoutLock(cmds.cmd, { args: cmdData });
        }));
    });
  }

  async eraseFlash(addr: number, size: number, statusFn: any): Promise<any> {
    const cmdData = { flash_addr: addr, size };
    return this.executeFlashCmdWaitForDoneWithStatus('upgrader/erase_flash', cmdData, addr, size, statusFn);
  }

  async writeFlash(addr: number, size: number, statusFn: any): Promise<any> {
    const cmdData = { flash_addr: addr, size, offset: 0 };
    return this.executeFlashCmdWaitForDoneWithStatus('upgrader/write_flash', cmdData, addr, size, statusFn);
  }

  async readFlashIntoBuf(addr: number, size: number, statusFn: any): Promise<any> {
    const cmdData = { flash_addr: addr, size, offset: 0 };
    return this.executeFlashCmdWaitForDoneWithStatus('upgrader/read_flash', cmdData, addr, size, statusFn);
  }

  async doFlash(buffer: Buffer, address: string): Promise<any> {
    let lastTime = 0;
    let lastProgress = Number.POSITIVE_INFINITY;
    let status = undefined;
    if (this.verboseStatusLog) {
      status = (progress, total) => {
        const now = Date.now();
        if (progress < lastProgress || progress === total || now > lastTime + 1) {
          this._logger.info(`Status: ${Math.ceil(100 * (progress / total))}%\r`);
          lastTime = now;
          lastProgress = progress;
          if (progress === total) {
            this._logger.info('');
          }
        }
      };
    }

    const addr = parseInt(address, 16);
    this._logger.info(`Allocating buf.. ${buffer.length}`);
    await this.allocateBuf(buffer.length);
    this._logger.info('Uploading data to camera...');
    await this.writeBuf(buffer);
    this._logger.info('Calculating checksum on target...');
    const expectedCrc = calculate(buffer);
    const crc = await this.checksumBuf(buffer.length);
    if (expectedCrc !== crc) {
      throw new Error(`Expected crc ${expectedCrc}, got crc ${crc}`);
    }
    const eraseLen = Math.ceil(buffer.length / 4096) * 4096;
    this._logger.info(`Erasing... addr: ${addr}`);
    await this.eraseFlash(addr, eraseLen, status);
    this._logger.info('Writing...');
    await this.writeFlash(addr, buffer.length, status);
    this._logger.info('Reading from flash to memory...');
    await this.readFlashIntoBuf(addr, buffer.length, status);
    this._logger.info('Calculating checksum...');
    const flashCrc = await this.checksumBuf(buffer.length);
    if (expectedCrc !== flashCrc) {
      throw new Error(`Expected crc ${expectedCrc}, got crc ${flashCrc}`);
    }
  }

  async flashFsbl(fsblMvcmd: Buffer): Promise<any> {
    this._logger.info('Flashing fsbl');
    return this.doFlash(fsblMvcmd, '0x00');
  }

  async setFlashBootState(state: string): Promise<any> {
    this._logger.info(`set flash boot state ${state}`);
    return this._cameraManager.api.setProductInfo({ flash_boot_state: state });
  }

  async initFlash(fsblMvcmd: Buffer, boxfishUpgraderFile: IBoxfishUpgraderFile): Promise<any> {
    this._logger.warn('Initializing flash');
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

  async flashImage(imageType: IMAGE_TYPES, upgraderFile: IBoxfishUpgraderFile, location: string): Promise<any> {
    const data = upgraderFile.getData(imageType);
    if (data.length === 0) {
      throw new Error(`Error starting flashing of image ${IMAGE_TYPES} - could not get data from package`);
    }
    const address = upgraderFile.getFlashAddress(imageType, location);
    return this.doFlash(data, address);
  }

  async setRamBootSelector(selector: string): Promise<any> {
    this._logger.info(`set ram boot selector ${selector}`);
    return this._cameraManager.api.setProductInfo({ bac_fsbl: { ram_boot_selector: selector } });
  }

  async printBootInfo(): Promise<void> {
    const prodInfo = await this._cameraManager.api.getProductInfo();
    this._logger.info(`Current boot decision: ${prodInfo.bac_fsbl.boot_decision}`);
    this._logger.info(`Current flash boot selector: ${prodInfo.flash_boot_state}`);
    this._logger.info(`Current ram boot selector: ${prodInfo.bac_fsbl.ram_boot_selector}`);
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
          await this._cameraManager.transport.clear();
          await this._cameraManager.transport.write('streaming/lock');
        });
      }

      if (prodInfo.bac_fsbl === false && !this.options.flash_fsbl) {
        throw new Error('Unable to upgrade without first stage bootloader.\n' +
          'No first stage bootloader provided');
      } else if (prodInfo.bac_fsbl === false && this.options.flash_fsbl) {
        const fsblBuffer = boxfishUpgraderFile.getImage(IMAGE_TYPES.FSBL);
        await this.initFlash(fsblBuffer, boxfishUpgraderFile);
        await this._cameraManager.reboot();
        return 'C';
      }
      const bootDecision = this.getBootDecision(prodInfo);
      this._logger.info(`Current boot decision ${bootDecision}`);
      const upgradeSelection = bootDecision === 'A' ? 'B' : 'A';

      /* eslint-disable max-len */
      await this.flashImage(IMAGE_TYPES.SSBL_HEADER, boxfishUpgraderFile, upgradeSelection);
      await this.flashImage(IMAGE_TYPES.SSBL, boxfishUpgraderFile, upgradeSelection);
      await this.flashImage(IMAGE_TYPES.APP_HEADER, boxfishUpgraderFile, upgradeSelection);
      await this.flashImage(IMAGE_TYPES.APP, boxfishUpgraderFile, upgradeSelection);
      /* eslint-enable max-len */
      if (semver.gt(currentSwVersion, '0.0.7')) {
        await this.locksmith.executeAsyncFunction(async () => {
          await this._cameraManager.transport.clear();
          await this._cameraManager.transport.write('streaming/unlock');
        });
      }
      await this.setRamBootSelector(upgradeSelection);
      await this.printBootInfo();
      await this._cameraManager.reboot();
      await this._cameraManager.transport.close();

      const finishTime = new Date().getTime();
      const flashTime = (finishTime - startTime) / 1000;
      this._logger.info(`Upgrade completed in ${flashTime} seconds`);

      return upgradeSelection;
    } catch (e) {
      this._logger.error('UPGRADE FAILED');
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

      this._logger.info(`Upgrade status ${JSON.stringify(response)}`);
      return response.status === 0;
    } catch (e) {
      return false;
    }
  }
}
