import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import SmartbaseCamera from './smartbaseCamera';
import EventEmitter from 'events';

export default class SmartbaseAce extends SmartbaseCamera {
  productName: string = 'Huddly L1';
  constructor(deviceInstance: any, transport: IUsbTransport, cameraDiscoveryEmitter: EventEmitter) {
    super(deviceInstance, transport, cameraDiscoveryEmitter);
  }
}
