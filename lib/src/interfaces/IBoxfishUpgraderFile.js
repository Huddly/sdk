"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var IMAGE_TYPES;
(function (IMAGE_TYPES) {
    IMAGE_TYPES["FSBL"] = "bf_fsbl_mvcmd";
    IMAGE_TYPES["SSBL"] = "bf_ssbl_mvcmd";
    IMAGE_TYPES["SSBL_HEADER"] = "bf_ssbl_header";
    IMAGE_TYPES["APP"] = "bf_app_elf_zlib";
    IMAGE_TYPES["APP_HEADER"] = "bf_app_header";
    IMAGE_TYPES["FSBL_SIGNED"] = "bf_fsbl_mvcmd_signed";
    IMAGE_TYPES["SSBL_SIGNED"] = "bf_ssbl_mvcmd_signed";
    IMAGE_TYPES["SSBL_HEADER_SIGNED"] = "bf_ssbl_header_signed";
    IMAGE_TYPES["APP_SIGNED"] = "bf_app_elf_zlib_signed";
    IMAGE_TYPES["APP_HEADER_SIGNED"] = "bf_app_header_signed";
})(IMAGE_TYPES = exports.IMAGE_TYPES || (exports.IMAGE_TYPES = {}));
exports.FLASH_ADDR_LOCATION = Object.freeze({
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
//# sourceMappingURL=IBoxfishUpgraderFile.js.map