import CameraSwitchService from './cameraSwitchService';
import IServiceOpts from '@huddly/sdk-interfaces/lib/interfaces/IServiceOpts';
import IHuddlyService from '@huddly/sdk-interfaces/lib/interfaces/IHuddlyService';

/**
 * Factory class for controlling what service implementation is supported on the corresponding
 * operating system running on host machine.
 *
 * @ignore
 * @class ServiceFactory
 */
export default class ServiceFactory {
  /**
   * Get a concrete IHuddlyService implementation.
   *
   * @static
   * @param {IServiceOpts} serviceOpts Service options for initializing and seting up the service communication.
   * @return {*}  {IHuddlyService} An intance of IHuddlyService that can be used to communicate with the corresponding
   * huddly service running on host.
   * @memberof ServiceFactory
   */
  static getService(serviceOpts: IServiceOpts): IHuddlyService {
    switch (process.platform) {
      case 'win32': // Currently supported only on windows platforms
        return new CameraSwitchService(serviceOpts);
      default:
        throw new Error(
          `Currently there is no Huddly Service support for platform ${process.platform}`
        );
    }
  }
}
