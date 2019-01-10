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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const sinon_1 = __importDefault(require("sinon"));
const chai_1 = __importStar(require("chai"));
const sinon_chai_1 = __importDefault(require("sinon-chai"));
const factory_1 = __importDefault(require("./../../../src/components/device/factory"));
const boxfish_1 = __importDefault(require("./../../../src/components/device/boxfish"));
const huddlygo_1 = __importDefault(require("./../../../src/components/device/huddlygo"));
const events_1 = require("events");
chai_1.default.should();
chai_1.default.use(sinon_chai_1.default);
const dummyDevice = {
    serial: '123456',
    productName: 'Huddly IQ'
};
class DummyDeviceApi {
    isUVCControlsSupported(device) { return Promise.resolve(false); }
    getUVCControlAPIForDevice(device) { return Promise.resolve(device); }
    getValidatedTransport(device) { return Promise.resolve(device); }
    registerForHotplugEvents(eventEmitter) { }
    getTransport(device) { return Promise.resolve(device); }
    getDeviceDiscoveryAPI() { return Promise.resolve(undefined); }
    isHIDSupported(device) { return Promise.resolve(false); }
    getHIDAPIForDevice(device) { return Promise.resolve(false); }
    initialize() { }
}
const createNewDummyDeviceApis = () => {
    return [
        sinon_1.default.createStubInstance(DummyDeviceApi),
        sinon_1.default.createStubInstance(DummyDeviceApi)
    ];
};
describe('DeviceFactory', () => {
    let dummyDeviceApis;
    beforeEach(() => {
        dummyDeviceApis = createNewDummyDeviceApis();
    });
    describe('#getTransportImplementation', () => {
        describe('is supported preferred device-api', () => {
            it('should return the transport of the preferred device api', () => __awaiter(this, void 0, void 0, function* () {
                const preferredDeviceApi = dummyDeviceApis[0];
                preferredDeviceApi.getValidatedTransport.resolves({});
                yield factory_1.default.getTransportImplementation(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
                chai_1.expect(preferredDeviceApi.getValidatedTransport.callCount).to.be.equal(1);
                chai_1.expect(preferredDeviceApi.getValidatedTransport.firstCall.args[0]).to.deep.equal(dummyDevice);
            }));
        });
        describe('not supported for preferred device-api', () => {
            it('should return the transport of the secondary device api', () => __awaiter(this, void 0, void 0, function* () {
                dummyDeviceApis[0].getValidatedTransport.resolves(undefined);
                dummyDeviceApis[1].getValidatedTransport.resolves({});
                yield factory_1.default.getTransportImplementation(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
                chai_1.expect(dummyDeviceApis[0].getValidatedTransport.callCount).to.be.equal(2);
                chai_1.expect(dummyDeviceApis[1].getValidatedTransport.callCount).to.be.equal(1);
                chai_1.expect(dummyDeviceApis[1].getValidatedTransport.firstCall.args[0]).to.deep.equal(dummyDevice);
            }));
            it('should throw error when none of device-apis are supported for given device', () => __awaiter(this, void 0, void 0, function* () {
                dummyDeviceApis[0].getValidatedTransport.returns(Promise.resolve(false));
                dummyDeviceApis[1].getValidatedTransport.returns(Promise.resolve(false));
                try {
                    yield factory_1.default.getTransportImplementation(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
                    chai_1.expect(true).to.equal(false);
                }
                catch (e) {
                    chai_1.expect(e.message).to.equal('Unable to find appropriate transport implementation for device: {"serial":"123456","productName":"Huddly IQ"}');
                }
            }));
        });
    });
    describe('#getUVCControlInterface', () => {
        describe('is supported preferred device-api', () => {
            it('should return the transport of the preferred device api', () => __awaiter(this, void 0, void 0, function* () {
                const preferredDeviceApi = dummyDeviceApis[0];
                preferredDeviceApi.isUVCControlsSupported.returns(Promise.resolve(true));
                yield factory_1.default.getUVCControlInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
                chai_1.expect(preferredDeviceApi.getUVCControlAPIForDevice.callCount).to.be.equal(1);
                chai_1.expect(preferredDeviceApi.getUVCControlAPIForDevice.firstCall.args[0]).to.deep.equal(dummyDevice);
            }));
        });
        describe('not supported for preferred device-api', () => {
            it('should return the transport of the secondary device api', () => __awaiter(this, void 0, void 0, function* () {
                dummyDeviceApis[0].isUVCControlsSupported.returns(Promise.resolve(false));
                dummyDeviceApis[1].isUVCControlsSupported.returns(Promise.resolve(true));
                yield factory_1.default.getUVCControlInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
                chai_1.expect(dummyDeviceApis[0].getUVCControlAPIForDevice.callCount).to.be.equal(0);
                chai_1.expect(dummyDeviceApis[1].getUVCControlAPIForDevice.callCount).to.be.equal(1);
                chai_1.expect(dummyDeviceApis[1].getUVCControlAPIForDevice.firstCall.args[0]).to.deep.equal(dummyDevice);
            }));
            it('should return undefined when none of the device-apis support uvc controls', () => __awaiter(this, void 0, void 0, function* () {
                dummyDeviceApis[0].isUVCControlsSupported.returns(Promise.resolve(false));
                dummyDeviceApis[1].isUVCControlsSupported.returns(Promise.resolve(false));
                const uvcImplementation = yield factory_1.default.getUVCControlInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
                chai_1.expect(uvcImplementation).to.be.undefined;
            }));
        });
    });
    describe('#getHIDInterface', () => {
        describe('is supported preferred device-api', () => {
            it('should return the transport of the preferred device api', () => __awaiter(this, void 0, void 0, function* () {
                const preferredDeviceApi = dummyDeviceApis[0];
                preferredDeviceApi.isHIDSupported.returns(Promise.resolve(true));
                yield factory_1.default.getHIDInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
                chai_1.expect(preferredDeviceApi.getHIDAPIForDevice.callCount).to.be.equal(1);
                chai_1.expect(preferredDeviceApi.getHIDAPIForDevice.firstCall.args[0]).to.deep.equal(dummyDevice);
            }));
        });
        describe('not supported for preferred device-api', () => {
            it('should return the transport of the secondary device api', () => __awaiter(this, void 0, void 0, function* () {
                dummyDeviceApis[0].isHIDSupported.returns(Promise.resolve(false));
                dummyDeviceApis[1].isHIDSupported.returns(Promise.resolve(true));
                yield factory_1.default.getHIDInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
                chai_1.expect(dummyDeviceApis[0].getHIDAPIForDevice.callCount).to.be.equal(0);
                chai_1.expect(dummyDeviceApis[1].getHIDAPIForDevice.callCount).to.be.equal(1);
                chai_1.expect(dummyDeviceApis[1].getHIDAPIForDevice.firstCall.args[0]).to.deep.equal(dummyDevice);
            }));
            it('should throw error when none of device-apis are supported for given device', () => __awaiter(this, void 0, void 0, function* () {
                dummyDeviceApis[0].isHIDSupported.returns(Promise.resolve(false));
                dummyDeviceApis[1].isHIDSupported.returns(Promise.resolve(false));
                try {
                    yield factory_1.default.getHIDInterface(dummyDevice, dummyDeviceApis[0], dummyDeviceApis);
                    chai_1.expect(true).to.equal(false);
                }
                catch (e) {
                    chai_1.expect(e.message).to.equal('Unable to find appropriate HID interface for device: {"serial":"123456","productName":"Huddly IQ"}');
                }
            }));
        });
    });
    describe('#getDevice', () => {
        let getTransportImpl;
        let getUvcCtrl;
        let getHidInterface;
        let discoveryEmitter;
        beforeEach(() => {
            getTransportImpl = sinon_1.default.stub(factory_1.default, 'getTransportImplementation');
            getUvcCtrl = sinon_1.default.stub(factory_1.default, 'getUVCControlInterface');
            getHidInterface = sinon_1.default.stub(factory_1.default, 'getHIDInterface').resolves();
            discoveryEmitter = sinon_1.default.createStubInstance(events_1.EventEmitter);
        });
        afterEach(() => {
            getTransportImpl.restore();
            getUvcCtrl.restore();
            getHidInterface.restore();
        });
        it('should throw error for unknown product ids', () => __awaiter(this, void 0, void 0, function* () {
            const dummyNonHuddlyDevice = {
                deviceDescriptor: {
                    idProduct: 1231232
                }
            };
            try {
                getTransportImpl.returns(Promise.resolve());
                getUvcCtrl.returns(Promise.resolve());
                yield factory_1.default.getDevice(1231232, undefined, dummyDeviceApis[0], dummyDeviceApis, dummyNonHuddlyDevice, discoveryEmitter);
            }
            catch (e) {
                chai_1.expect(e.message).to.equal('Unsupported Device. USB ProductId: 1231232');
            }
        }));
        describe('Boxfish', () => {
            it('should initialize boxfish device when product id is 0x21', () => __awaiter(this, void 0, void 0, function* () {
                const dummyIQDevice = {
                    deviceDescriptor: {
                        idProduct: 0x21
                    }
                };
                const deviceManager = yield factory_1.default.getDevice(dummyIQDevice.deviceDescriptor.idProduct, undefined, dummyDeviceApis[0], dummyDeviceApis, dummyIQDevice, discoveryEmitter, false);
                chai_1.expect(deviceManager).to.be.instanceof(boxfish_1.default);
            }));
        });
        describe('HuddlyGo', () => {
            it('should initialize huddlygo device when product id is 0x11', () => __awaiter(this, void 0, void 0, function* () {
                const dummyGODevice = {
                    deviceDescriptor: {
                        idProduct: 0x11
                    }
                };
                const deviceManager = yield factory_1.default.getDevice(dummyGODevice.deviceDescriptor.idProduct, undefined, dummyDeviceApis[0], dummyDeviceApis, dummyGODevice, discoveryEmitter, false);
                chai_1.expect(deviceManager).to.be.instanceof(huddlygo_1.default);
            }));
        });
    });
});
//# sourceMappingURL=factory.spec.js.map