import sinon from 'sinon';
import chai, { expect } from 'chai';
import sinonChai from 'sinon-chai';
import BufferStream from './../../src/utilitis/bufferStream';

chai.should();
chai.use(sinonChai);

describe('BufferStream', () => {
  describe('#constructor', () => {
    let destroySpy;
    beforeEach(() => {
      destroySpy = sinon.spy(BufferStream.prototype, 'destroy');
    });
    afterEach(() => {
      destroySpy?.restore();
    });

    it('should initialize attributes', () => {
      const dummyBuffer = Buffer.alloc(10);
      const bufferStream = new BufferStream(dummyBuffer);
      expect(bufferStream.length).to.equal(dummyBuffer.length);
      expect(bufferStream.offset).to.equal(0);
      expect(bufferStream.source).to.deep.equal(dummyBuffer);
    });

    it('should destroy  buffer stream on "end" event from super class', () => {
      const bufferStream = new BufferStream(Buffer.alloc(0));
      bufferStream.emit('end');
      expect(destroySpy).to.have.been.called;
    });
  });

  describe('#destroy', () => {
    it('should reset attributes', () => {
      const bufferStream = new BufferStream(Buffer.alloc(0));
      bufferStream.destroy();
      expect(bufferStream.source).to.be.undefined;
      expect(bufferStream.length).to.be.undefined;
      expect(bufferStream.offset).to.be.undefined;
    });
  });

  describe('#read', () => {
    let pushSpy;
    beforeEach(() => {
      pushSpy = sinon.spy(BufferStream.prototype, 'push');
    });
    afterEach(() => {
      pushSpy?.restore();
    });

    it('should push chunks of bytes from the original buffer into the stream', () => {
      const sourceBuffer = Buffer.from('HelloWorld');
      const bufferStream = new BufferStream(sourceBuffer);
      bufferStream._read(5);
      expect(pushSpy.getCall(0).args[0]).to.deep.equal(Buffer.from('Hello'));
      bufferStream._read(5);
      expect(pushSpy.getCall(1).args[0]).to.deep.equal(Buffer.from('World'));
    });

    it('should push null/undefined at the end of the buffer to signalize the end of the read stream', () => {
      const sourceBuffer = Buffer.from('Hello');
      const bufferStream = new BufferStream(sourceBuffer);
      bufferStream._read(100);
      expect(pushSpy.getCall(1).args[0]).to.be.undefined;
    });
  });
});
