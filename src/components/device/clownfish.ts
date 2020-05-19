import { EventEmitter } from 'events';

import Api from './../api';
import DefaultLogger from './../../utilitis/logger';
import ITransport from './../../interfaces/iTransport';
import Locksmith from './../locksmith';
import Boxfish from './boxfish';

export default class ClownFish extends Boxfish {
  transport: ITransport;
  _api: Api;
  uvcControlInterface: any;
  logger: DefaultLogger;
  locksmith: Locksmith;
  discoveryEmitter: EventEmitter;
  productName: string = 'Huddly IQ';

  constructor(
    uvcCameraInstance: any,
    transport: ITransport,
    uvcControlInterface: any,
    logger: DefaultLogger,
    cameraDiscoveryEmitter: EventEmitter) {
    super(uvcCameraInstance, transport, uvcControlInterface, logger, cameraDiscoveryEmitter);
  }
}
