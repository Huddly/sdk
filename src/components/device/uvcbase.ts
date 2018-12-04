import IUVCControls from './../../interfaces/iUVCControlApi';

export default class UvcBaseDevice implements IUVCControls {
  uvcControlInterface: any;
  uvcCamera: any;

  constructor(uvcCamera: any, uvcControlInterface: any) {
    this.uvcCamera = uvcCamera;
    this.uvcControlInterface = uvcControlInterface;
    Object.assign(this, uvcCamera);
  }

  getSoftwareVersion() {
    throw new Error('getSoftwareVersion not implemented');
  }

  supportsSoftwareUpgrades() {
    throw new Error('supportsSoftwareUpgrades upgrades not implemented');
  }

  getBinaries() {
    throw new Error('getBinaries not implemented');
  }

  getPowerUsage() {
    throw new Error('getPowerUsage not implemented');
  }

  getTemperature() {
    throw new Error('getTemperature not implemented');
  }

  getWhitePointAdjust() {
    throw new Error('getWhitePointAdjust not implemented');
  }

  setWhitePointAdjust() {
    throw new Error('setWhitePointAdjust not implemented');
  }

  getCameraMode() {
    throw new Error('getCameraMode not implemented');
  }

  setCameraMode(mode: any) {
    throw new Error('setCameraMode not implemented');
  }

  setFramingConfig(config: any): Promise<any> {
    throw new Error('setFramingConfig not implemented');
  }

  getErrorLog() {
    throw new Error('getErrorLog not implemented');
  }

  eraseErrorLog() {
    throw new Error('eraseErrorLog not implemented');
  }

  factoryReset() {
    throw new Error('factoryReset not implemented');
  }

  uptime() {
    throw new Error('uptime not implemented');
  }

  // eslint-disable-next-line class-methods-use-this
  getUpdateUrl() {
    throw new Error('updateUrl not implemented');
  }

  getStatus() {
    throw new Error('getStatus not implemented');
  }

  async getXUControl(controlNumber): Promise<any> {
    return this.uvcControlInterface.getXUControl(controlNumber);
  }

  async setXUControl(controlNumber, value): Promise<any> {
    return this.uvcControlInterface.setXUControl(controlNumber, value);
  }

  getSupportedSettings(): any {
    return this.uvcControlInterface.getSupportedSettings();
  }

  getSetting(key, forceRefresh = false): any {
    return this.uvcControlInterface.getSetting(key, forceRefresh);
  }

  setSettingValue(key, value): any {
    return this.uvcControlInterface.setSettingValue(key, value);
  }

  getSettings(forceRefresh = false): any {
    return this.uvcControlInterface.getSettings(forceRefresh);
  }

  resetSettings(excludeList = []): any {
    return this.uvcControlInterface.resetSettings(excludeList);
  }

  getPanTilt(): any {
    return this.uvcControlInterface.getPanTilt();
  }

  async setPanTilt(panTilt: any) {
    return this.uvcControlInterface.setPanTilt(panTilt.pan, panTilt.tilt);
  }

  setUVCParam(param, value) {
    if (!param) {
      return Promise.reject('No parameter provided');
    } else if (param.toUpperCase() === 'PANTILT') {
      if (!value || !value.pan || !value.tilt) {
        console.log(value);
        return Promise.reject('Pan and/or tilt value was not provided');
      } else {
        return this.setPanTilt(value);
      }
    }
    return this.uvcControlInterface.setSettingValue(param, value);
  }

  getUVCParam(param) {
    if (!param) {
      return Promise.reject('No parameter provided');
    } else if (param.toUpperCase() === 'PANTILT') {
      return this.getPanTilt();
    }
    return this.uvcControlInterface.getSetting(param);
  }

  usbReEnumerate() {
    return this.uvcControlInterface.usbReEnumerate();
  }

  isAlive(): boolean {
    return this.uvcControlInterface.isAlive();
  }
}
