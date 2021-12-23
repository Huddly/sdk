import IUVCControls from '@huddly/sdk-interfaces/lib/interfaces/IUVCControlApi';

/**
 * Controller class implementing standard uvc commands for cameras supporting UVC.
 *
 * @export
 * @class UvcBaseDevice
 * @implements {IUVCControls}
 */
export default class UvcBaseDevice implements IUVCControls {
  /**
   * The uvc control instance where uvc commands can be directly targeted to.
   *
   * @type {*}
   * @memberof UvcBaseDevice
   */
  uvcControlInterface: any;

  /**
   * @ignore
   *
   * The uvc camera instance (tyope of IDeviceManager).
   *
   * @type {*}
   * @memberof UvcBaseDevice
   */
  uvcCamera: any;

  constructor(uvcCamera: any, uvcControlInterface: any) {
    this.uvcCamera = uvcCamera;
    this.uvcControlInterface = uvcControlInterface;
    Object.assign(this, uvcCamera);
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  getSoftwareVersion() {
    throw new Error('getSoftwareVersion not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  supportsSoftwareUpgrades() {
    throw new Error('supportsSoftwareUpgrades upgrades not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  getBinaries() {
    throw new Error('getBinaries not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  getPowerUsage() {
    throw new Error('getPowerUsage not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  getTemperature() {
    throw new Error('getTemperature not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  getWhitePointAdjust() {
    throw new Error('getWhitePointAdjust not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  setWhitePointAdjust() {
    throw new Error('setWhitePointAdjust not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  getCameraMode() {
    throw new Error('getCameraMode not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  setCameraMode(mode: any) {
    throw new Error('setCameraMode not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  setFramingConfig(config: any): Promise<any> {
    throw new Error('setFramingConfig not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  getErrorLog() {
    throw new Error('getErrorLog not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  eraseErrorLog() {
    throw new Error('eraseErrorLog not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  factoryReset() {
    throw new Error('factoryReset not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  uptime() {
    throw new Error('uptime not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  getUpdateUrl() {
    throw new Error('updateUrl not implemented');
  }

  /**
   * @ignore
   * Not implemented with standard UVC
   *
   * @memberof UvcBaseDevice
   */
  getStatus() {
    throw new Error('getStatus not implemented');
  }

  /**
   * Gets the value of a custom XU control setting.
   *
   * @param {number} controlNumber Custom XU control number.
   * @return {*}  {Promise<any>} The value of the corresponding XU control number as promise.
   * @memberof UvcBaseDevice
   */
  async getXUControl(controlNumber: number): Promise<any> {
    return this.uvcControlInterface.getXUControl(controlNumber);
  }

  /**
   * Updates XU control value through the uvc control interface.
   *
   * @param {number} controlNumber Custom XU control number.
   * @param {*} value New value to be set for the given XU control number.
   * @return {*}  {Promise<any>} The state of the action performed as promise.
   * @memberof UvcBaseDevice
   */
  async setXUControl(controlNumber: number, value: any): Promise<any> {
    return this.uvcControlInterface.setXUControl(controlNumber, value);
  }

  /**
   * Get the supported settings from the uvc control interface,
   *
   * @return {*}  {*} The supported settings.
   * @memberof UvcBaseDevice
   */
  getSupportedSettings(): any {
    return this.uvcControlInterface.getSupportedSettings();
  }

  /**
   * Gets a setting value from the camera through the uvc control interface.
   *
   * @param {*} key The setting key to be retrieved.
   * @param {boolean} [forceRefresh=false] Whether the camera should ingore the cached setting value.
   * @return {*}  {*} The setting value for the corresponding setting key.
   * @memberof UvcBaseDevice
   */
  getSetting(key, forceRefresh = false): any {
    return this.uvcControlInterface.getSetting(key, forceRefresh);
  }

  /**
   * Sets a setting value on the camera through the uvc control interface.
   *
   * @param {*} key The setting key to be updated.
   * @param {*} value The new value to be associated with the setting key.
   * @return {*}  {*} The state of the action performed.
   * @memberof UvcBaseDevice
   */
  setSettingValue(key, value): any {
    return this.uvcControlInterface.setSettingValue(key, value);
  }

  /**
   * Get the uvc camera settings.
   *
   * @param {boolean} [forceRefresh=false] Whether the camera should ignore the cached settings or not.
   * @return {*}  {*} The uvc camera settings.
   * @memberof UvcBaseDevice
   */
  getSettings(forceRefresh = false): any {
    return this.uvcControlInterface.getSettings(forceRefresh);
  }

  /**
   * Control command for resetting the settings on the uvc control interface.
   *
   * @param {*} [excludeList=[]] Any potential exlusion parameters to be excluded when resetting the settings.
   * @return {*}  {*} The state of the action.
   * @memberof UvcBaseDevice
   */
  resetSettings(excludeList = []): any {
    return this.uvcControlInterface.resetSettings(excludeList);
  }

  /**
   * Gets the uvc PANTILT parameter value.
   *
   * @return {*}  {*} The value of the PANTILT uvc parameter on camera.
   * @memberof UvcBaseDevice
   */
  getPanTilt(): any {
    return this.uvcControlInterface.getPanTilt();
  }

  /**
   * Sets new value for the PANTILT uvc parameter.
   *
   * @param {*} panTilt The new PANTILT value to be set on the camera.
   * @return {*} The state of the action performed as promise.
   * @memberof UvcBaseDevice
   */
  async setPanTilt(panTilt: any) {
    return this.uvcControlInterface.setPanTilt(panTilt.pan, panTilt.tilt);
  }

  /**
   * Sets a new value for the given uvc parameter
   *
   * @param {*} param The uvc parameter to be updated.
   * @param {*} value The new value to be set to the uvc parameter on camera.
   * @return {*} The state of the action.
   * @memberof UvcBaseDevice
   */
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

  /**
   * Helper function for retrieving a uvc parameter value from the device.
   *
   * @param {*} param The requested uvc parameter.
   * @return {*} The value of the uvc parameter on the camera.
   * @memberof UvcBaseDevice
   */
  getUVCParam(param) {
    if (!param) {
      return Promise.reject('No parameter provided');
    } else if (param.toUpperCase() === 'PANTILT') {
      return this.getPanTilt();
    }
    return this.uvcControlInterface.getSetting(param);
  }

  /**
   * Re enumerates the usb interace through the uvc control interface
   *
   * @return {*} A state reporting whether the usb re-enumeration is completed.
   * @memberof UvcBaseDevice
   */
  usbReEnumerate() {
    return this.uvcControlInterface.usbReEnumerate();
  }

  /**
   * Check if the uvc insterface is up/alive.
   *
   * @return {*}  {boolean} A boolean reporting whether the uvc insterface is alive or not.
   * @memberof UvcBaseDevice
   */
  isAlive(): boolean {
    return this.uvcControlInterface.isAlive();
  }
}
