import IServiceOpts from './IServiceOpts';

/**
 * Interface used for communicating with a huddly service that facilitates and improves the experiences
 * with the huddly network cameras.
 */
export default interface IHuddlyService {
  /**
   * Service options used to initialize and setup up the communication channel with the
   * huddly service running on host machine
   *
   * @type {IServiceOpts}
   * @memberof IHuddlyService
   */
  options: IServiceOpts;

  /**
   * Initialize all communication channels with the huddly service and make sure service api
   * endpoints are ready to be consumed.
   * @returns A promise that resolves when the initialization is successful or rejects
   * otherwise
   */
  init(): Promise<void>;

  /**
   * Teardiwn all communication channels with the huddly service.
   * @returns A promise that resolves when the teardown is successful or rejects
   * otherwise
   */
  close(): Promise<void>;
}
