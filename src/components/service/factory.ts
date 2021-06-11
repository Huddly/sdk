import WinIpCameraService from './winIpCameraService';
import ILogger from './../../interfaces/iLogger';
import IServiceOpts from '../../interfaces/IServiceOpts';
import IHuddlyService from './../../interfaces/IHuddlyService';

export default class ServiceFactory {
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
