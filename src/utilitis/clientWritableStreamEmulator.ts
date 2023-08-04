import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';

/**
 * Emulates the behaviour of the grpc.ClientWritableStream to make it easier to have
 * a uniform approach for both the old and new cpio format to run the verify step.
 *
 * The need for this based on the old verify method returning a stream for writing to
 * where we with the new method are supposed to pass the verification data through when
 * invoking the method.
 *
 */
export default class ClientWritableStreamEmulator {
  private data: Array<string | Uint8Array> = [];
  private endCallback: Function;

  constructor(endCallback: Function) {
    this.endCallback = endCallback;
  }

  write(huddlyChunk: huddly.Chunk) {
    this.data.push(huddlyChunk.getContent());
  }

  end() {
    const callbackData = this._concatenateData(this.data);
    this.endCallback(callbackData);
  }

  private _concatenateData(arr: Array<Uint8Array | string>): Uint8Array | string {
    if (arr.length === 0) {
      return ''; // Empty list, return an empty string
    }

    if (arr[0] instanceof Uint8Array) {
      // If the first element is Uint8Array, concatenate Uint8Array elements
      return arr.reduce((accumulator: Uint8Array, current: Uint8Array) => {
        const newUint8Array = new Uint8Array(accumulator.length + current.length);
        newUint8Array.set(accumulator, 0);
        newUint8Array.set(current, accumulator.length);
        return newUint8Array;
      });
    } else {
      // If the first element is a string, concatenate string elements
      return arr.join('');
    }
  }
}
