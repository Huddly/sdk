"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = __importDefault(require("crypto"));
const IBoxfishUpgraderFile_1 = require("./../../interfaces/IBoxfishUpgraderFile");
const MARKER = new Buffer('\0\n--97da1ea4-803a-4979-8e5d-f2aaa0799f4d--\n');
class BoxfishHpk {
    constructor(buf) {
        this._buf = buf;
    }
    init() {
        const markerPos = BoxfishHpk.findHPKMarkerPos(this._buf);
        const signPos = markerPos + MARKER.length;
        const signLen = 64;
        const signHexLen = signLen * 2;
        this._headerLen = signPos + signHexLen + 1;
        this.header = JSON.parse(this._buf.slice(0, markerPos).toString('utf8'));
        this.listFiles().forEach(f => {
            this.getData(f);
        });
    }
    static findHPKMarkerPos(buf) {
        const markerPos = buf.indexOf(MARKER);
        if (markerPos === -1) {
            throw new Error('HPK is not valid, missing header');
        }
        return markerPos;
    }
    listFiles() {
        return Object.keys(this.header.files);
    }
    getImage(imageType) {
        return Object.assign({}, this.header.files[imageType], { data: this.getData(imageType) });
    }
    getData(imageType) {
        const metaData = this.header.files[imageType];
        const buf = this.getBufferFromOffset(metaData.offset, metaData.size);
        const hash = crypto_1.default.createHash('sha256');
        hash.update(buf);
        const fileHash = hash.digest('hex');
        if (fileHash !== metaData.sha256) {
            throw new Error(`Hash ${fileHash} does not match manifest hash ${metaData.sha256}`);
        }
        return buf;
    }
    getBufferFromOffset(offset, size) {
        const totalOffset = this._headerLen + offset;
        const endPosition = totalOffset + size;
        if (endPosition > this._buf.length) {
            throw new Error('HPK could not find file');
        }
        return this._buf.slice(totalOffset, endPosition);
    }
    getFlashAddress(imageType, location) {
        return IBoxfishUpgraderFile_1.FLASH_ADDR_LOCATION[imageType][location];
    }
    static isHpk(file) {
        try {
            return BoxfishHpk.findHPKMarkerPos(file) > 0;
        }
        catch (e) {
            return false;
        }
    }
}
exports.default = BoxfishHpk;
//# sourceMappingURL=boxfishhpk.js.map