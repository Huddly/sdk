import IDeviceManager from './../../src/interfaces/iDeviceManager';
import IDeviceUpgrader from './../../src/interfaces/IDeviceUpgrader';
import UpgradeOpts from './../../src/interfaces/IUpgradeOpts';
import IDetector from './../../src/interfaces/IDetector';
import IAutozoomControl from '../../src/interfaces/IAutozoomControl';
import AutozoomControlOpts from '../../src/interfaces/IAutozoomControlOpts';
import DetectorOpts from './../../src//interfaces/IDetectorOpts';
import DiagnosticsMessage from './../../src//components/diagnosticsMessage';
import ICnnControl from '../../src/interfaces/ICnnControl';

/**
 * @ignore
 *
 * @export
 * @class DeviceManagerMock
 * @implements {IDeviceManager}
 */
export default class DeviceManagerMock implements IDeviceManager {
  transport: any = {
    read: (msg, timeout) => { },
    write: (msg) => { },
    receiveMessage: (msg, timeout) => { },
    on: (msg, listener) => { },
    removeListener: (msg, listener) => { },
    subscribe: (msg) => { },
    unsubscribe: (msg) => { }
  };
  api: any = {
    sendAndReceive: (buffer, commands, timeout) => { },
    sendAndReceiveMessagePack: (message, commands, timeout) => { },
    getAutozoomStatus: () => { },
    encode: (msg) => { },
    getProductInfo: () => { },
    transport: this.transport,
  };
  uvcControlInterface: any;
  logger: any;
  initialize(): Promise<void> { return Promise.resolve(); }
  closeConnection(): Promise<void> { return Promise.resolve(); }
  getInfo(): Promise<object> { return Promise.resolve({ version: '99.99.99' }); }
  getErrorLog(): Promise<void> { return Promise.resolve(); }
  eraseErrorLog(): Promise<void> { return Promise.resolve(); }
  reboot(mode?: string): Promise<void> { return Promise.resolve(); }
  getUpgrader(): Promise<IDeviceUpgrader> { return Promise.resolve(undefined); }
  upgrade(opts: UpgradeOpts): Promise<any> { return Promise.resolve({}); }
  getAutozoomControl(opts: AutozoomControlOpts): IAutozoomControl { return undefined; }
  getFaceBasedExposureControl(): ICnnControl { return undefined; }
  getDetector(opts: DetectorOpts): IDetector { return undefined; }
  getDiagnostics(): Promise<Array<DiagnosticsMessage>> { return Promise.resolve([]); }
  getState(): Promise<any> { return Promise.resolve(); }
  getPowerUsage(): Promise<any> { return Promise.resolve(); }
  getTemperature(): Promise<any> { return Promise.resolve(); }
  getLatestFirmwareUrl(): Promise<any> { return Promise.resolve(); }
}
