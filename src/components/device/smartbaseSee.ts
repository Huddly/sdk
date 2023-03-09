import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import SmartbaseCamera from './smartbaseCamera';
import EventEmitter from 'events';

export default class SmartbaseSee extends SmartbaseCamera {
  productName: string = 'Huddly S1';
  constructor(deviceInstance: any, transport: IUsbTransport, cameraDiscoveryEmitter: EventEmitter) {
    super(deviceInstance, transport, cameraDiscoveryEmitter);
  }
}
