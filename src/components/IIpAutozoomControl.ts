import IAutozoomControl from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControl';

export default interface IIpAutozoomControl extends IAutozoomControl {
  getSupportedDirectorModes(): Promise<any>;
  getDirectorMode(): Promise<any>;
}
