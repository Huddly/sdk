"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jszip_1 = __importDefault(require("jszip"));
const crypto_1 = __importDefault(require("crypto"));
const IBoxfishUpgraderFile_1 = require("./../../interfaces/IBoxfishUpgraderFile");
const SUPPORTED_MANIFEST_VERSIONS = Object.freeze([4, 5]);
class BoxfishPackage {
    constructor(zipFileBuffer) {
        this.files = {};
        this.supportedImageTypes = Object.keys(IBoxfishUpgraderFile_1.IMAGE_TYPES).map(key => IBoxfishUpgraderFile_1.IMAGE_TYPES[key]);
        this.zipFileBuffer = zipFileBuffer;
    }
    init(parsedArchive = undefined) {
        return __awaiter(this, void 0, void 0, function* () {
            const pkg = yield jszip_1.default.loadAsync(this.zipFileBuffer);
            const binaries = {};
            const manifest = pkg.files['manifest.json'];
            binaries.manifest = yield manifest.async('string');
            let jsonManifest = {};
            try {
                jsonManifest = JSON.parse(binaries.manifest);
            }
            catch (e) {
                throw new Error('Could not parse the manifest json file');
            }
            const isThis = x => x === jsonManifest.manifest_version;
            if (!SUPPORTED_MANIFEST_VERSIONS.some(isThis)) {
                throw new Error(`Unsupported manifest version ${jsonManifest.manifest_version}`);
            }
            for (const file of jsonManifest.files) {
                const bf = {};
                bf.name = file.name;
                bf.data = yield pkg.files[bf.name].async('nodebuffer');
                const version = file.version;
                bf.version = {
                    appVersion: version.app_version,
                    gitDesc: version['git-descr'],
                };
                if (bf.data.length !== file.size) {
                    throw new Error(`Data size ${bf.data.length} does not match manifest ${file.size}`);
                }
                const hash = crypto_1.default.createHash('sha256');
                hash.update(bf.data);
                const fileHash = hash.digest('hex');
                if (fileHash !== file.sha256) {
                    throw new Error(`Hash ${fileHash} does not match manifest hash ${file.sha256}`);
                }
                bf.imageType = file.type;
                this.validateImageType(bf.imageType);
                this.files[bf.imageType] = bf;
            }
        });
    }
    validateImageType(imageType) {
        if (this.supportedImageTypes.indexOf(imageType) === -1) {
            throw new Error(`Image type ${imageType} not supported`);
        }
    }
    getImage(imageType) {
        this.validateImageType(imageType);
        const signed = `${imageType}_signed`;
        if (this.files[signed] !== undefined) {
            this.validateImageType(this.files[signed].imageType);
            return this.files[signed];
        }
        return this.files[imageType];
    }
    getData(imageType) {
        return this.getImage(imageType).data;
    }
    getFlashAddress(imageType, location) {
        return IBoxfishUpgraderFile_1.FLASH_ADDR_LOCATION[imageType][location];
    }
}
exports.default = BoxfishPackage;
//# sourceMappingURL=boxfishpkg.js.map