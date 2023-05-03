import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import DetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import EventEmitter from 'events';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import IIpDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IIpDeviceManager';
import DiagnosticsMessage from '@huddly/sdk-interfaces/lib/abstract_classes/DiagnosticsMessage';
import ReleaseChannel from '@huddly/sdk-interfaces/lib/enums/ReleaseChannel';
import IDeviceCommonApi from '@huddly/sdk-interfaces/lib/interfaces/IDeviceCommonApi';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import UpgradeOpts from '@huddly/sdk-interfaces/lib/interfaces/IUpgradeOpts';
import Api from '../api';
import Locksmith from '../locksmith';
import HuddlyGrpcTunnelClient from './huddlyGrpcTunnelClient';
import IpBaseDevice from './ipbase';
import IGrpcTransport from '@huddly/sdk-interfaces/lib/interfaces/IGrpcTransport';
import IpAutozoomControl from '../ipAutozoomControl';
import IpDetector from '../ipDetector';

export default class SmartbaseCamera implements IIpDeviceManager {
  productName: string = 'Huddly L1';
  transport: IUsbTransport;
  api: IDeviceCommonApi;
  grpcClient: any;
  locksmith: Locksmith;
  ipDevice: IpBaseDevice;
  cameraDiscoveryEmitter: EventEmitter;
  wsdDevice: any;
  /**
   * Creates an instance of an ip camera that is connected through the smartbase.
   * @param {IUsbTransport} transport The transport instance for communicating with the camera.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly cameras.
   * @memberof SmartbaseCamera
   */
  constructor(deviceInstance: any, transport: IUsbTransport, cameraDiscoveryEmitter: EventEmitter) {
    this.transport = transport;
    this.locksmith = new Locksmith();
    this.grpcClient = new HuddlyGrpcTunnelClient(this.transport, this.locksmith);
    this.api = new Api(transport, this.locksmith);
    this.ipDevice = new IpBaseDevice(
      {
        infoObject: () => {
          return {
            ...deviceInstance,
          };
        },
      },
      { close: () => {} } as IGrpcTransport,
      cameraDiscoveryEmitter
    );

    this.ipDevice.grpcClient = new HuddlyGrpcTunnelClient(transport, this.locksmith);
    Object.assign(this, deviceInstance);
  }

  /**
   * @ignore
   * Not applicable
   *
   * @readonly
   * @memberof IpBaseDevice
   */
  get uvcControlInterface() {
    throw new Error('Not Supported');
  }

  getCnnFeatureStatus(cnnFeature: any): Promise<any> {
    return this.ipDevice.getCnnFeatureStatus(cnnFeature);
  }
  initialize(developmentMode?: boolean): Promise<void> {
    return;
  }
  closeConnection(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getInfo(): Promise<any> {
    return this.ipDevice.getInfo();
  }
  async getErrorLog(timeout: number): Promise<any> {
    return await this.api.getErrorLog(timeout);
  }
  async eraseErrorLog(timeout: number): Promise<void> {
    return this.ipDevice.eraseErrorLog();
  }
  reboot(mode?: string): Promise<void> {
    return this.ipDevice.reboot();
  }
  getUpgrader(): Promise<IDeviceUpgrader> {
    throw new Error('Method not implemented.');
  }
  upgrade(opts: UpgradeOpts): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getFaceBasedExposureControl(): ICnnControl {
    throw new Error('Method not implemented.');
  }
  getDiagnostics(): Promise<DiagnosticsMessage[]> {
    throw new Error('Method not implemented.');
  }
  async getState(): Promise<any> {
    return this.ipDevice.getState();
  }
  getPowerUsage(): Promise<any> {
    throw new Error('Method not implemented.');
  }
  getTemperature(): Promise<any> {
    return this.ipDevice.getTemperature();
  }
  getLatestFirmwareUrl(releaseChannel: ReleaseChannel) {
    throw new Error('Method not implemented.');
  }

  getAutozoomControl(opts: AutozoomControlOpts): ICnnControl {
    return new IpAutozoomControl(this, opts);
  }

  getDetector(opts?: DetectorOpts): IDetector {
    throw new Error('Please call this method from Ace or See controller instead!');
  }

  getSettings() {
    return this.ipDevice.getSettings();
  }

  getSetting(setting: string) {
    return this.ipDevice.getSetting(setting);
  }

  setSettingValue(key: string, value: any) {
    return this.ipDevice.setSettingValue(key, value);
  }

  getPanTilt() {
    return this.ipDevice.getPanTilt();
  }

  setPanTilt(panTilt) {
    return this.ipDevice.setPanTilt(panTilt);
  }

  getPanTiltZoom() {
    return this.ipDevice.getPanTiltZoom();
  }

  setPanTiltZoom(ptz) {
    return this.ipDevice.setPanTiltZoom(ptz);
  }

  getSlot() {
    return this.ipDevice.getSlot();
  }

  uptime() {
    return this.ipDevice.uptime();
  }

  getXUControl(controlNumber: number): Promise<Buffer> {
    throw new Error('Method not implemented.');
  }

  setXUControl(controlNumber: number, value: any): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getSupportedSettings() {
    return this.ipDevice.getSupportedSettings();
  }

  resetSettings(excludedList: string[] = []) {
    return this.ipDevice.resetSettings(excludedList);
  }

  getOptionCertificates() {
    return this.ipDevice.getOptionCertificates();
  }

  usbReEnumerate(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  isAlive(): Boolean {
    throw new Error('Method not implemented.');
  }
}
