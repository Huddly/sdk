/// <reference types="node" />
export declare enum IMAGE_TYPES {
    FSBL = "bf_fsbl_mvcmd",
    SSBL = "bf_ssbl_mvcmd",
    SSBL_HEADER = "bf_ssbl_header",
    APP = "bf_app_elf_zlib",
    APP_HEADER = "bf_app_header",
    FSBL_SIGNED = "bf_fsbl_mvcmd_signed",
    SSBL_SIGNED = "bf_ssbl_mvcmd_signed",
    SSBL_HEADER_SIGNED = "bf_ssbl_header_signed",
    APP_SIGNED = "bf_app_elf_zlib_signed",
    APP_HEADER_SIGNED = "bf_app_header_signed"
}
export declare const FLASH_ADDR_LOCATION: Readonly<{
    bf_fsbl_mvcmd: string;
    bf_app_elf_zlib: {
        A: string;
        B: string;
        C: string;
    };
    bf_app_header: {
        A: string;
        B: string;
        C: string;
    };
    bf_ssbl_mvcmd: {
        A: string;
        B: string;
        C: string;
    };
    bf_ssbl_header: {
        A: string;
        B: string;
        C: string;
    };
}>;
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
    getFlashAddress(imageType: IMAGE_TYPES, location: any): string;
}
