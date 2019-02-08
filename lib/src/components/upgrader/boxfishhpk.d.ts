/// <reference types="node" />
import IBoxfishUpgraderFile, { IMAGE_TYPES } from './../../interfaces/IBoxfishUpgraderFile';
declare class BoxfishHpk implements IBoxfishUpgraderFile {
    _buf: Buffer;
    _headerLen: number;
    header: any;
    constructor(buf: any);
    init(): void;
    static findHPKMarkerPos(buf: Buffer): number;
    listFiles(): Array<string>;
    getImage(imageType: IMAGE_TYPES): any;
    getData(imageType: IMAGE_TYPES): Buffer;
    getBufferFromOffset(offset: number, size: number): Buffer;
    getFlashAddress(imageType: IMAGE_TYPES, location: string): string;
    static isHpk(file: Buffer): boolean;
}
export default BoxfishHpk;
