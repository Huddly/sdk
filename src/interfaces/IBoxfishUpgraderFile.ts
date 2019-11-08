/**
 * @ignore
 */
export enum IMAGE_TYPES {
  FSBL = 'bf_fsbl_mvcmd',
  SSBL = 'bf_ssbl_mvcmd',
  SSBL_HEADER = 'bf_ssbl_header',
  APP = 'bf_app_elf_zlib',
  APP_HEADER = 'bf_app_header',

  FSBL_SIGNED = 'bf_fsbl_mvcmd_signed',
  SSBL_SIGNED = 'bf_ssbl_mvcmd_signed',
  SSBL_HEADER_SIGNED = 'bf_ssbl_header_signed',
  APP_SIGNED = 'bf_app_elf_zlib_signed',
  APP_HEADER_SIGNED = 'bf_app_header_signed',
}

/**
 * @ignore
 */
export const FLASH_ADDR_LOCATION = Object.freeze({
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

/**
 * Interface describing the boxfish upgrade file types
 *
 * @ignore
 * @export
 * @interface IBoxfishUpgraderFile
 */
export default interface IBoxfishUpgraderFile {
  /**
   * @ignore
   * Initilizes the upgrader, reads provided file buffer
   *
   * @memberof IBoxfishUpgraderFile
   */
  init(): void;

  /**
   * @ignore
   * Get image data for specified image provided by IMAGE_TYPES
   *
   * @param {IMAGE_TYPES} Image type from IMAGE_TYPES
   * @returns {any} object with data property containing buffer data, with additional header information
   * @memberof IBoxfishUpgraderFile
   */
  getImage(imageType: IMAGE_TYPES): any;

  /**
   * @ignore
   * Get image only buffer adta for specified image provided by IMAGE_TYPES
   *
   * @param {IMAGE_TYPES} Image type from IMAGE_TYPES
   * @returns {Buffer} image buffer
   * @memberof IBoxfishUpgraderFile
   */
  getData(imageType: IMAGE_TYPES): Buffer;

  /**
   * @ignore
   * Get address for the provided image type from IMAGE_TYPE
   *
   * @param {string} Image type from IMAGE_TYPES
   * @param {string} locatino of image
   * @returns {Buffer} string hex address
   * @memberof IBoxfishUpgraderFile
   */
  getFlashAddress(imageType: IMAGE_TYPES, location): string;
}
