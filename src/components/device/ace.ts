import IGrpcTransport from '@huddly/sdk-interfaces/lib/interfaces/IGrpcTransport';
import { EventEmitter } from 'stream';
import IpBaseDevice from './ipbase';

/**
 * Controller class for Huddly L1 camera.
 *
 * @export
 * @class Ace
 * @extends {IpBaseDevice}
 */
export default class Ace extends IpBaseDevice {
  /**
   * Comercial product name for this controller class.
   *
   * @type {string}
   * @memberof Ace
   */
  productName: string = 'Huddly L1';

  /**
   * Creates an instance of ACE/L1.
   * @param {*} wsdDevice The wsdd device instance retrieved during discovery.
   * @param {IGrpcTransport} transport Grpc transport instance.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly L1 cameras.
   * @memberof Ace
   */
  constructor(wsdDevice: any, transport: IGrpcTransport, cameraDiscoveryEmitter: EventEmitter) {
    super(wsdDevice, transport, cameraDiscoveryEmitter);
  }
}
