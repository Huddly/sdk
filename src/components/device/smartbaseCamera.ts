import AutozoomControlOpts from '@huddly/sdk-interfaces/lib/interfaces/IAutozoomControlOpts';
import ICnnControl from '@huddly/sdk-interfaces/lib/interfaces/ICnnControl';
import IDetector from '@huddly/sdk-interfaces/lib/interfaces/IDetector';
import DetectorOpts from '@huddly/sdk-interfaces/lib/interfaces/IDetectorOpts';
import EventEmitter from 'events';
import IUsbTransport from '@huddly/sdk-interfaces/lib/interfaces/IUsbTransport';
import AutozoomControl from '../autozoomControl';
import Detector from '../detector';
import Smartbase from './smartbase';

export default class SmartbaseCamera extends Smartbase {
  productName: string = 'Huddly L1';
  /**
   * Creates an instance of an ip camera that is connected through the smartbase.
   * @param {IUsbTransport} transport The transport instance for communicating with the camera.
   * @param {EventEmitter} cameraDiscoveryEmitter Emitter instance sending attach & detach events for Huddly cameras.
   * @memberof SmartbaseCamera
   */
  constructor(deviceInstance: any, transport: IUsbTransport, cameraDiscoveryEmitter: EventEmitter) {
    super(deviceInstance, transport, cameraDiscoveryEmitter);
  }

  getAutozoomControl(opts: AutozoomControlOpts): ICnnControl {
    return new AutozoomControl(this, opts);
  }

  getDetector(opts?: DetectorOpts): IDetector {
    return new Detector(this, opts);
  }
}
