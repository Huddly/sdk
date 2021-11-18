import { EventEmitter } from 'events';

import Api from './../api';
import Locksmith from './../locksmith';
import Boxfish from './boxfish';
import IUsbTransport from './../../interfaces/IUsbTransport';

export default class ClownFish extends Boxfish {
  transport: IUsbTransport;
  _api: Api;
  uvcControlInterface: any;
  locksmith: Locksmith;
  discoveryEmitter: EventEmitter;
  productName: string = 'Huddly IQ';

  constructor(
    uvcCameraInstance: any,
    transport: IUsbTransport,
    uvcControlInterface: any,
    cameraDiscoveryEmitter: EventEmitter
  ) {
    super(uvcCameraInstance, transport, uvcControlInterface, cameraDiscoveryEmitter);
  }
}
