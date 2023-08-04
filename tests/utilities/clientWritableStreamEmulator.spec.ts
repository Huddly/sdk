import { expect } from 'chai';
import ClientWritableStreamEmulator from '../../src/utilitis/clientWritableStreamEmulator';
import * as huddly from '@huddly/camera-proto/lib/api/huddly_pb';
import sinon, { SinonSpy } from 'sinon';

describe('ClientWritableStreamEmulator', () => {
  describe('_concatenateData()', () => {
    it('should return an empty string for an empty array', () => {
      const emulator = new ClientWritableStreamEmulator(() => {});
      const result = emulator['_concatenateData']([]);
      expect(result).to.equal('');
    });

    it('should concatenate string elements in the array', () => {
      const emulator = new ClientWritableStreamEmulator(() => {});
      const result = emulator['_concatenateData'](['Hello, ', 'world!']);
      expect(result).to.equal('Hello, world!');
    });

    it('should concatenate Uint8Array elements in the array', () => {
      const emulator = new ClientWritableStreamEmulator(() => {});
      const data1 = new Uint8Array([72, 101, 108, 108, 111]);
      const data2 = new Uint8Array([32, 119, 111, 114, 108, 100]);
      const result = emulator['_concatenateData']([data1, data2]);
      expect(result).to.deep.equal(
        new Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
      );
    });

    it('should return an empty string for an array containing only empty strings', () => {
      const emulator = new ClientWritableStreamEmulator(() => {});
      const result = emulator['_concatenateData'](['', '', '']);
      expect(result).to.equal('');
    });

    it('should return an empty Uint8Array for an array containing only empty Uint8Arrays', () => {
      const emulator = new ClientWritableStreamEmulator(() => {});
      const result = emulator['_concatenateData']([
        new Uint8Array(),
        new Uint8Array(),
        new Uint8Array(),
      ]);
      expect(result).to.deep.equal(new Uint8Array());
    });
  });

  describe('end()', () => {
    it('should call endCallback with concatenated data', () => {
      const endCallbackSpy: SinonSpy = sinon.spy();
      const emulator = new ClientWritableStreamEmulator(endCallbackSpy);
      const huddlyChunk1 = new huddly.Chunk();
      huddlyChunk1.setContent('Hello, ');
      const huddlyChunk2 = new huddly.Chunk();
      huddlyChunk2.setContent('world!');
      emulator.write(huddlyChunk1);
      emulator.write(huddlyChunk2);
      emulator.end();

      // The data from the two chunks should be concatenated and passed to endCallback
      expect(endCallbackSpy.calledOnce).to.be.true;
      expect(endCallbackSpy.firstCall.args[0]).to.equal('Hello, world!');
    });
  });
});
