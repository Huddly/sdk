"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = __importStar(require("chai"));
const sinon_chai_1 = __importDefault(require("sinon-chai"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const boxfishhpk_1 = __importDefault(require("./../../../src/components/upgrader/boxfishhpk"));
const IBoxfishUpgraderFile_1 = require("./../../../src/interfaces/IBoxfishUpgraderFile");
chai_1.default.should();
chai_1.default.use(sinon_chai_1.default);
describe('BoxfishHpk', () => {
    const validBuffer = fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../../testData/dummy.pkg'));
    const invalidHeaderBuffer = fs_1.default.readFileSync(path_1.default.resolve(__dirname, '../../testData/invalidDummy.pkg'));
    describe('#init', () => {
        it('should throw error if can not find hpk marker', () => {
            const upgrader = new boxfishhpk_1.default(new Buffer(''));
            chai_1.expect(upgrader.init).to.throw(Error);
        });
        it('should get and parse header', () => {
            const upgrader = new boxfishhpk_1.default(validBuffer);
            upgrader.init();
            chai_1.expect(upgrader.header).to.be.an('object');
        });
        it('should throw if there is no valid file data', () => {
            const upgrader = new boxfishhpk_1.default(invalidHeaderBuffer);
            chai_1.expect(upgrader.init).to.throw(Error);
        });
    });
    describe('#getData', () => {
        let upgrader;
        beforeEach(() => {
            upgrader = new boxfishhpk_1.default(validBuffer);
            upgrader.init();
        });
        it('should get APP buffer from hpk', () => {
            chai_1.expect(upgrader.getData(IBoxfishUpgraderFile_1.IMAGE_TYPES.APP)).to.have.length(1636240);
        });
        it('should get APP_HEADER buffer from hpk', () => {
            chai_1.expect(upgrader.getData(IBoxfishUpgraderFile_1.IMAGE_TYPES.APP_HEADER)).to.have.length(20);
        });
        it('should get SSBL buffer from hpk', () => {
            chai_1.expect(upgrader.getData(IBoxfishUpgraderFile_1.IMAGE_TYPES.SSBL)).to.have.length(205344);
        });
    });
    describe('#isHpk', () => {
        it('should return true if buffer contains marker', () => {
            chai_1.expect(boxfishhpk_1.default.isHpk(validBuffer)).to.equal(true);
        });
        it('should return false if buffer does not contains marker', () => {
            chai_1.expect(boxfishhpk_1.default.isHpk(new Buffer(''))).to.equal(false);
        });
    });
});
//# sourceMappingURL=boxfishhpk.spec.js.map