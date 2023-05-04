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
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

export default class UsbAdapterCamera implements IIpDeviceManager {
  productName: string;
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
   * @memberof UsbAdapterCamera
   */
  constructor(
    deviceInstance: any,
    transport: IUsbTransport,
    cameraDiscoveryEmitter: EventEmitter,
    productName: string = 'Huddly L1'
  ) {
    this.transport = transport;
    this.locksmith = new Locksmith();
    this.grpcClient = new HuddlyGrpcTunnelClient(this.transport, this.locksmith);
    this.api = new Api(transport, this.locksmith);
    this.productName = productName;
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

  getCnnFeatureStatus(cnnFeature: huddly.CnnFeature): Promise<any> {
    return this.ipDevice.getCnnFeatureStatus(cnnFeature);
  }
  initialize(developmentMode?: boolean): Promise<void> {
    return;
  }
  getInfo(): Promise<any> {
    return this.ipDevice.getInfo();
  }
  async getErrorLog(timeout: number): Promise<any> {
    return await this.api.getErrorLog(timeout);
  }

  eraseErrorLog(timeout: number): Promise<void> {
    return this.ipDevice.eraseErrorLog();
  }
  reboot(mode?: string): Promise<void> {
    return this.ipDevice.reboot();
  }

  getState(): Promise<any> {
    return this.ipDevice.getState();
  }

  getTemperature(): Promise<any> {
    return this.ipDevice.getTemperature();
  }

  getAutozoomControl(opts: AutozoomControlOpts): ICnnControl {
    return new IpAutozoomControl(this, opts);
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

  getSupportedSettings() {
    return this.ipDevice.getSupportedSettings();
  }

  resetSettings(excludedList: string[] = []) {
    return this.ipDevice.resetSettings(excludedList);
  }

  getOptionCertificates() {
    return this.ipDevice.getOptionCertificates();
  }

  get uvcControlInterface() {
    throw new Error('Not Supported');
  }

  closeConnection(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  getPowerUsage(): Promise<any> {
    throw new Error('Method not implemented.');
  }

  isAlive(): Boolean {
    throw new Error('Method not implemented.');
  }

  usbReEnumerate(): Promise<void> {
    throw new Error('Method not implemented.');
  }

  getUpgrader(): Promise<IDeviceUpgrader> {
    throw new Error('Please call this method from Ace or See controller instead!');
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

  getLatestFirmwareUrl(releaseChannel: ReleaseChannel) {
    throw new Error('Method not implemented.');
  }

  getDetector(opts?: DetectorOpts): IDetector {
    throw new Error('Please call this method from Ace or See controller instead!');
  }

  getXUControl(controlNumber: number): Promise<Buffer> {
    throw new Error('Method not implemented.');
  }

  setXUControl(controlNumber: number, value: any): Promise<any> {
    throw new Error('Method not implemented.');
  }
}