import crypto from 'crypto';
import IBoxfishUpgraderFile, {
  IMAGE_TYPES,
  FLASH_ADDR_LOCATION,
} from '@huddly/sdk-interfaces/lib/interfaces/IBoxfishUpgraderFile';

const MARKER = Buffer.from('\0\n--97da1ea4-803a-4979-8e5d-f2aaa0799f4d--\n');

class BoxfishHpk implements IBoxfishUpgraderFile {
  _buf: Buffer;
  _headerLen: number;
  header: any;

  constructor(buf: Buffer) {
    this._buf = buf;
  }

  init(): void {
    const markerPos = BoxfishHpk.findHPKMarkerPos(this._buf);
    const signPos = markerPos + MARKER.length;
    const signLen = 64;
    const signHexLen = signLen * 2;

    this._headerLen = signPos + signHexLen + 1;
    this.header = JSON.parse(this._buf.slice(0, markerPos).toString('utf8'));

    this.listFiles().forEach((f) => {
      this.getData(<IMAGE_TYPES>f);
    });
  }

  static findHPKMarkerPos(buf: Buffer) {
    const markerPos = buf.indexOf(MARKER);
    if (markerPos === -1) {
      throw new Error('HPK is not valid, missing header');
    }
    return markerPos;
  }

  listFiles(): string[] {
    return Object.keys(this.header.files);
  }

  getImage(imageType: IMAGE_TYPES): any {
    return {
      ...this.header.files[imageType],
      data: this.getData(imageType),
    };
  }

  getData(imageType: IMAGE_TYPES): Buffer {
    const metaData = this.header.files[imageType];
    const buf = this.getBufferFromOffset(metaData.offset, metaData.size);

    const hash = crypto.createHash('sha256');
    hash.update(buf);
    const fileHash = hash.digest('hex');
    if (fileHash !== metaData.sha256) {
      throw new Error(`Hash ${fileHash} does not match manifest hash ${metaData.sha256}`);
    }
    return buf;
  }

  getBufferFromOffset(offset: number, size: number): Buffer {
    const totalOffset = this._headerLen + offset;
    const endPosition = totalOffset + size;
    if (endPosition > this._buf.length) {
      throw new Error('HPK could not find file');
    }
    return this._buf.slice(totalOffset, endPosition);
  }

  getFlashAddress(imageType: IMAGE_TYPES, location: string): string {
    return FLASH_ADDR_LOCATION[imageType][location];
  }

  static isHpk(file: Buffer): boolean {
    try {
      return BoxfishHpk.findHPKMarkerPos(file) > 0;
    } catch (e) {
      return false;
    }
  }
}

export default BoxfishHpk;
