import HuddlyHex from '@huddly/sdk-interfaces/lib/enums/HuddlyHex';
import EventEmitter from 'events';

export default class DiscoveryApiMock extends EventEmitter {
  emitter: EventEmitter;
  private _boxfishCamera = { productId: HuddlyHex.BOXFISH_PID };
  private _base = { productId: HuddlyHex.BASE_PID };

  get base() {
    return this._base;
  }
  get boxfishCamera() {
    return this._boxfishCamera;
  }
  initialize() {}
  registerForHotplugEvents(emitter: EventEmitter) {
    this.emitter = emitter;
  }
  emitBoxfishCamera() {
    this.emitter.emit('ATTACH', this.boxfishCamera);
  }
  emitBase() {
    this.emitter.emit('ATTACH', this.base);
  }
}
