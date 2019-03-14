/**
 * Interface used to perform standard UVC-XU control commands on the device.
 *
 * @ignore
 * @interface IUVCControls
 */
export default interface IUVCControls {
  getXUControl(controlNumber: number): Promise<Buffer>;

  setXUControl(controlNumber: number, value: any): Promise<any>;

  getSupportedSettings(): Promise<Object>;

  getSetting(key: string, forceRefresh?: Boolean): Promise<Object>;

  setSettingValue(key: string, value: any): Promise<void>;

  getSettings(forceRefresh?: Boolean): Promise<Object>;

  resetSettings(excludeList: Array<String>): Promise<void>;

  getPanTilt(): Promise<Object>;

  setPanTilt(panTilt: Object): Promise<void>;

  usbReEnumerate(): Promise<void>;

  isAlive(): Boolean;
}
