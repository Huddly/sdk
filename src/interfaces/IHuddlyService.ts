import IServiceOpts from './IServiceOpts';

export default interface IHuddlyService {
  options: IServiceOpts;

  init(): Promise<void>;
  close(): Promise<void>;
}
