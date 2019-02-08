/// <reference types="node" />
import IBoxfishUpgraderFile, { IMAGE_TYPES } from './../../interfaces/IBoxfishUpgraderFile';
declare class BoxfishPackage implements IBoxfishUpgraderFile {
    zipFileBuffer: Buffer;
    files: any;
    readonly supportedImageTypes: Array<string>;
    constructor(zipFileBuffer: Buffer);
    init(parsedArchive?: any): Promise<void>;
    validateImageType(imageType: IMAGE_TYPES): void;
    getImage(imageType: IMAGE_TYPES): any;
    getData(imageType: IMAGE_TYPES): any;
    getFlashAddress(imageType: IMAGE_TYPES, location: string): string;
}
export default BoxfishPackage;
