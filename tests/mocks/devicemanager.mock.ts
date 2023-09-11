import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import UpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import DetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import DiagnosticsMessage from '@huddly/sdk-interfaces/lib/abstract_classes/DiagnosticsMessage';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';

export const transportMock = {
  read: (msg, timeout) => {},
  write: (msg) => {},
  receiveMessage: (msg, timeout) => {},
  on: (msg, listener) => {},
  removeListener: (msg, listener) => {},
  subscribe: (msg) => {},
  unsubscribe: (msg) => {},
};

/**
 * @ignore
 *
 * @export
 * @class DeviceManagerMock
 * @implements {IDeviceManager}
 */
export default class DeviceManagerMock implements IDeviceManager {
  transport: any = transportMock;
  api: any = {
    sendAndReceive: (buffer, commands, timeout) => {},
    sendAndReceiveMessagePack: (message, commands, timeout) => {},
    getAutozoomStatus: () => {},
    encode: (msg) => {},
    getProductInfo: () => {},
    transport: this.transport,
  };
  uvcControlInterface: any;
  initialize(): Promise<void> {
    return Promise.resolve();
  }
  closeConnection(): Promise<void> {
    return Promise.resolve();
  }
  getInfo(): Promise<object> {
    return Promise.resolve({ version: '99.99.99' });
  }
  getErrorLog(): Promise<void> {
    return Promise.resolve();
  }
  eraseErrorLog(): Promise<void> {
    return Promise.resolve();
  }
  reboot(mode?: string): Promise<void> {
    return Promise.resolve();
  }
  getUpgrader(): Promise<IDeviceUpgrader> {
    return Promise.resolve(undefined);
  }
  upgrade(opts: UpgradeOpts): Promise<any> {
    return Promise.resolve({});
  }
  getAutozoomControl(opts: AutozoomControlOpts): ICnnControl {
    return undefined;
  }
  getFaceBasedExposureControl(): ICnnControl {
    return undefined;
  }
  getDetector(opts: DetectorOpts): IDetector {
    return undefined;
  }
  getDiagnostics(): Promise<Array<DiagnosticsMessage>> {
    return Promise.resolve([]);
  }
  getState(): Promise<any> {
    return Promise.resolve();
  }
  getPowerUsage(): Promise<any> {
    return Promise.resolve();
  }
  getTemperature(): Promise<any> {
    return Promise.resolve();
  }
  getLatestFirmwareUrl(): Promise<any> {
    return Promise.resolve();
  }
}
