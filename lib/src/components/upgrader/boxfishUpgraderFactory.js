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
const semver_1 = __importDefault(require("semver"));
const boxfishUpgrader_1 = __importDefault(require("./../upgrader/boxfishUpgrader"));
const hpkUpgrader_1 = __importDefault(require("./../upgrader/hpkUpgrader"));
const boxfishpkg_1 = __importDefault(require("./boxfishpkg"));
const boxfishhpk_1 = __importDefault(require("./boxfishhpk"));
exports.HPK_SUPPORT_VERSION = '1.2.0-0';
function createBoxfishUpgrader(manager, sdkDeviceDiscoveryEmitter, logger) {
    return __awaiter(this, void 0, void 0, function* () {
        const info = yield manager.getInfo();
        if (semver_1.default.gte(info.version, exports.HPK_SUPPORT_VERSION)) {
            return new hpkUpgrader_1.default(manager, sdkDeviceDiscoveryEmitter, logger);
        }
        return new boxfishUpgrader_1.default(manager, sdkDeviceDiscoveryEmitter, logger);
    });
}
exports.createBoxfishUpgrader = createBoxfishUpgrader;
function createBoxfishUpgraderFile(file) {
    if (boxfishhpk_1.default.isHpk(file)) {
        return new boxfishhpk_1.default(file);
    }
    return new boxfishpkg_1.default(file);
}
exports.createBoxfishUpgraderFile = createBoxfishUpgraderFile;
//# sourceMappingURL=boxfishUpgraderFactory.js.map