import JSZip from 'jszip';
import crypto from 'crypto';

export const IMAGE_TYPES = Object.freeze({
  FSBL: 'bf_fsbl_mvcmd',
  SSBL: 'bf_ssbl_mvcmd',
  SSBL_HEADER: 'bf_ssbl_header',
  APP: 'bf_app_elf_zlib',
  APP_HEADER: 'bf_app_header',

  FSBL_SIGNED: 'bf_fsbl_mvcmd_signed',
  SSBL_SIGNED: 'bf_ssbl_mvcmd_signed',
  SSBL_HEADER_SIGNED: 'bf_ssbl_header_signed',
  APP_SIGNED: 'bf_app_elf_zlib_signed',
  APP_HEADER_SIGNED: 'bf_app_header_signed',
});

const FLASH_ADDR_LOCATION = Object.freeze({
  bf_fsbl_mvcmd: '0x000000',
  bf_app_elf_zlib: {
    A: '0x662000',
    B: '0xB72000',
    C: '0x145000',
  },
  bf_app_header: {
    A: '0x661000',
    B: '0xB71000',
    C: '0x144000',
  },
  bf_ssbl_mvcmd: {
    A: '0x561000',
    B: '0xA71000',
    C: '0x044000',
  },
  bf_ssbl_header: {
    A: '0x560000',
    B: '0xA70000',
    C: '0x043000',
  },
});
const SUPPORTED_MANIFEST_VERSIONS = Object.freeze([4, 5]);

export class BoxfishPackage {
  zipFileBuffer: Buffer;
  files: any = {};
  readonly supportedImageTypes: Array<string> = Object.keys(IMAGE_TYPES).map(key => IMAGE_TYPES[key]);

  constructor(zipFileBuffer: Buffer) {
    this.zipFileBuffer = zipFileBuffer;
  }

  async init(parsedArchive: any = undefined): Promise<void> {
    const pkg = await JSZip.loadAsync(this.zipFileBuffer);
    const binaries: any = {};
    const manifest = pkg.files['manifest.json'];
    binaries.manifest = await manifest.async('string');

    let jsonManifest: any = {};
    try {
      jsonManifest = JSON.parse(binaries.manifest);
    } catch (e) {
      throw new Error('Could not parse the manifest json file');
    }

    const isThis = x => x === jsonManifest.manifest_version;
    if (!SUPPORTED_MANIFEST_VERSIONS.some(isThis)) {
      throw new Error(`Unsupported manifest version ${jsonManifest.manifest_version}`);
    }
    for (const file of jsonManifest.files) {
      const bf: any = {};
      bf.name = file.name;

      bf.data = await pkg.files[bf.name].async('nodebuffer');
      const version = file.version;
      bf.version = {
        appVersion: version.app_version,
        gitDesc: version['git-descr'],
      };

      if (bf.data.length !== file.size) {
        throw new Error(`Data size ${bf.data.length} does not match manifest ${file.size}`);
      }

      const hash = crypto.createHash('sha256');
      hash.update(bf.data);
      const fileHash = hash.digest('hex');
      if (fileHash !== file.sha256) {
        throw new Error(`Hash ${fileHash} does not match manifest hash ${file.sha256}`);
      }

      bf.imageType = file.type;
      this.validateImageType(bf.imageType);
      this.files[bf.imageType] = bf;
    }
  }

  validateImageType(imageType): void {
    if (this.supportedImageTypes.indexOf(imageType) === -1) {
      throw new Error(`Image type ${imageType} not supported`);
    }
  }

  getImage(imageType): any {
    this.validateImageType(imageType);
    const signed = `${imageType}_signed`;
    if (this.files[signed] !== undefined) {
      this.validateImageType(signed);
      return this.files[signed];
    }
    return this.files[imageType];
  }

  getData(imageType): any {
    return this.getImage(imageType).data;
  }

  getVersion(imageType): any {
    return this.getImage(imageType).version;
  }

  getAppVersion(): any {
    return this.getVersion(IMAGE_TYPES.APP);
  }

  static makeFromFile(path): BoxfishPackage {
    return new BoxfishPackage(path);
  }

  static getFlashAddress(imageType, location): string {
    return FLASH_ADDR_LOCATION[imageType][location];
  }
}
