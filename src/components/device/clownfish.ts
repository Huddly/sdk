import { EventEmitter } from 'events';

import Api from './../api';
import DefaultLogger from './../../utilitis/logger';
import Locksmith from './../locksmith';
import Boxfish from './boxfish';
import IUsbTransport from './../../interfaces/IUsbTransport';

export default class ClownFish extends Boxfish {
  transport: IUsbTransport;
  _api: Api;
  uvcControlInterface: any;
  logger: DefaultLogger;
  locksmith: Locksmith;
  discoveryEmitter: EventEmitter;
  productName: string = 'Huddly IQ';

  constructor(
    uvcCameraInstance: any,
    transport: IUsbTransport,
    uvcControlInterface: any,
    logger: DefaultLogger,
    cameraDiscoveryEmitter: EventEmitter) {
    super(uvcCameraInstance, transport, uvcControlInterface, logger, cameraDiscoveryEmitter);
  }
}
