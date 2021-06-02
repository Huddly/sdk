import * as fs from 'fs';

export class CpioFile {
  fileDescriptor: number;
  name: string;
  size: number;
  offset: number;
  pos: number = 0;

  constructor(fileDesc: number, name: string, size: number, offset: number) {
    this.fileDescriptor = fileDesc;
    this.name = name;
    this.size = size;
    this.offset = offset;
    this.pos = offset;
  }

  read(buffer: Buffer, count: number): number {
    const bytesRead = fs.readSync(this.fileDescriptor, buffer, 0, Math.min(count, this.size - this.pos), this.pos);
    this.pos += bytesRead;
    return bytesRead;
  }

  reset(): void {
    this.pos = this.offset;
  }

  close(): void {
    if (this.fileDescriptor) {
      fs.closeSync(this.fileDescriptor);
    }
  }
}

export default class CpioReader {
  fileDescriptor: number;
  files: any = {};

  private position: number = undefined;
  private readonly TRAILER_FILENAME: string = 'TRAILER!!!';

  constructor(cpioPath: string) {
    this.fileDescriptor = fs.openSync(cpioPath, 'r+');
    this.readFiles();
  }

  getFile(name: string): CpioFile {
    if (this.files) {
      return this.files[name];
    }
    return undefined;
  }

  readFiles(): void {
    while (true) {
      const headersize: number = 6 + 13 * 8;
      const fileData: Buffer = Buffer.alloc(headersize);
      fs.readSync(this.fileDescriptor, fileData, 0, headersize, this.position);
      this.updatePosition(headersize);

      const header: Buffer = fileData.slice(6);
      const actualMagic: string = fileData.slice(0, 6).toString();
      const expectedMagic: string = Buffer.from('070702').toString();
      if (actualMagic != expectedMagic) {
        throw new Error(`Invalid header magic, expected ${expectedMagic} but got ${actualMagic}`);
      }
      const nameSize: number = parseInt(header.slice(11 * 8, 11 * 8 + 8).toString(), 16);
      const fileSize: number = parseInt(header.slice(6 * 8, 6 * 8 + 8).toString(), 16);
      const nameBuff: Buffer = Buffer.alloc(nameSize);
      fs.readSync(this.fileDescriptor, nameBuff, 0, nameSize, this.position);
      this.updatePosition(nameSize);
      const name: string = nameBuff.slice(0, -1).toString();
      if (name.toString() == this.TRAILER_FILENAME) {
        break;
      }

      if (this.position && this.position % 4 !== 0) {
        this.relativeSeek();
      }

      this.files[name] = new CpioFile(this.fileDescriptor, name, fileSize, this.position);
      this.updatePosition(fileSize);

      if (this.position && this.position % 4 !== 0) {
        this.relativeSeek();
      }
    }
  }

  updatePosition(increment: number): void {
    if (!this.position) { // If undefined we set it to the increment
      this.position = increment;
    } else {
      this.position += increment;
    }
  }

  relativeSeek(): void {
    const amount: number = 4 - this.position % 4;
    fs.readSync(this.fileDescriptor, Buffer.alloc(amount), 0, amount, this.position);
    this.updatePosition(amount);
  }

  close(): void {
    if (this.fileDescriptor) {
      fs.closeSync(this.fileDescriptor);
    }
  }
}
