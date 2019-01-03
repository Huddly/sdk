import JSZip from 'jszip';
import crypto from 'crypto';
import IBoxfishUpgraderFile, { IMAGE_TYPES, FLASH_ADDR_LOCATION } from './../../interfaces/IBoxfishUpgraderFile';

const SUPPORTED_MANIFEST_VERSIONS = Object.freeze([4, 5]);

class BoxfishPackage implements IBoxfishUpgraderFile {
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

  validateImageType(imageType: IMAGE_TYPES): void {
    if (this.supportedImageTypes.indexOf(imageType) === -1) {
      throw new Error(`Image type ${imageType} not supported`);
    }
  }

  getImage(imageType: IMAGE_TYPES): any {
    this.validateImageType(imageType);
    const signed = `${imageType}_signed`;
    if (this.files[signed] !== undefined) {
      this.validateImageType(IMAGE_TYPES[signed]);
      return this.files[signed];
    }
    return this.files[imageType];
  }

  getData(imageType: IMAGE_TYPES): any {
    return this.getImage(imageType).data;
  }

  getFlashAddress(imageType: IMAGE_TYPES, location: string): string {
    return FLASH_ADDR_LOCATION[imageType][location];
  }
}

export default BoxfishPackage;
