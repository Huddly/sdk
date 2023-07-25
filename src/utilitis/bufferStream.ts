import { Readable } from 'stream';

/**
 * Helper class used for reading information from a .cpio file
 *
 * @ignore
 * @class BufferStream
 * @extends {Readable}
 */
export default class BufferStream extends Readable {
  /**
   * Copy of the original buffer to be converted into a readable stream
   * @type Buffer
   * @memberof BufferStream
   */
  source: Buffer;

  /**
   * Offset number to keep track of which portion of the source buffer is
   * currently being pushed onto the internal stream buffer during read actions
   * @type number
   * @memberof BufferStream
   */
  offset: number;

  /**
   * Length of the original buffer
   * @type number
   * @memberof BufferStream
   */
  length: number;

  /**
   * Turns the given source Buffer into a Readable stream.
   * @param  {Buffer} source
   */
  constructor(source: Buffer) {
    super();

    this.source = source;

    this.offset = 0;
    this.length = source.length;

    // When the stream has ended, try to clean up the memory references.
    this.on('end', this.destroy);
  }

  /**
   * Clean up variable references once the stream has been ended.
   */
  destroy(): this {
    this.source = this.offset = this.length = undefined;
    this.destroyed = true;
    return this;
  }

  /**
   * Read chunks from the source buffer into the underlying stream buffer.
   * @param  {number} size The size of the chunk to read from buffer into the stream.
   */
  _read(size: number): void {
    if (this.offset < this.length) {
      this.push(this.source.slice(this.offset, this.offset + size));
      this.offset += size;
    }

    if (this.offset >= this.length) {
      // Pushing null to signal end of stream
      // tslint:disable-next-line
      this.push(null);
    }
  }
}
