import WinIpCameraService from './winIpCameraService';
import ILogger from './../../interfaces/iLogger';
import IServiceOpts from '../../interfaces/IServiceOpts';
import IHuddlyService from './../../interfaces/IHuddlyService';

export default class ServiceFactory {
  /**
   * Get a concrete IHuddlyService implementation
   * @param  {ILogger} logger Logger instance
   * @param  {IServiceOpts} serviceOpts Service options for initializing and seting up the service communication
   * @returns An intance of IHuddlyService that can be used to communicate with the corresponding
   * huddly service running on host.
   */
  static getService(logger: ILogger, serviceOpts: IServiceOpts): IHuddlyService {
    switch (process.platform) {
      case 'win32':
        return new WinIpCameraService(logger, serviceOpts);
      default:
        throw new Error(
          `Currently there is no Huddly Service support for platform ${process.platform}`
        );
    }
  }
}
