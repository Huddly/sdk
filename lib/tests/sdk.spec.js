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
const src_1 = __importDefault(require("../src"));
const events_1 = require("events");
const boxfish_1 = __importDefault(require("../src/components/device/boxfish"));
const huddlygo_1 = __importDefault(require("../src/components/device/huddlygo"));
const factory_1 = __importDefault(require("../src/components/device/factory"));
chai_1.default.should();
chai_1.default.use(sinon_chai_1.default);
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
const createNewNodeUsbApi = () => {
    return sinon_1.default.createStubInstance(DummyDeviceApi);
};
describe('HuddlySDK', () => {
    let nodeusbDeviceApi;
    const opts = { eventEmitter: {} };
    beforeEach(() => {
        nodeusbDeviceApi = createNewNodeUsbApi();
        nodeusbDeviceApi.getValidatedTransport.returns(Promise.resolve(true));
        nodeusbDeviceApi.getTransport.returns({});
        nodeusbDeviceApi.isUVCControlsSupported.returns(Promise.resolve(false));
    });
    describe('#constructor', () => {
        it('should set the first deviceapi from list as the main device api', () => {
            const sdk = new src_1.default(nodeusbDeviceApi);
            chai_1.expect(sdk.deviceDiscoveryApi).to.deep.equals(nodeusbDeviceApi);
            chai_1.expect(sdk.mainDeviceApi).to.deep.equals(nodeusbDeviceApi);
        });
        it('it should initialize the list of device apis', () => {
            const sdk = new src_1.default(nodeusbDeviceApi);
            chai_1.expect(sdk.deviceApis.length).to.equals(1);
        });
        it('should setup hotplug events for the device discovery api', () => {
            nodeusbDeviceApi.registerForHotplugEvents.returns({});
            const sdk = new src_1.default(nodeusbDeviceApi);
            chai_1.expect(nodeusbDeviceApi.registerForHotplugEvents.callCount).to.equals(1);
            chai_1.expect(nodeusbDeviceApi.registerForHotplugEvents.firstCall.args[0]).to.be.instanceof(events_1.EventEmitter);
        });
        it('should throw error if no device apis are provided', () => {
            try {
                new src_1.default(undefined);
                chai_1.expect(true).to.equals(false);
            }
            catch (e) {
                chai_1.expect(e.message).to.equals('A default device api should be provided to the sdk!');
            }
        });
    });
    describe('#setupDeviceDiscoveryListeners', () => {
        const dummyGO = {
            productId: 0x11
        };
        const dummyIQ = {
            productId: 0x21
        };
        let huddlygoInitStub;
        let boxfishInitStub;
        let discoveryEmitter;
        let otherEmitter;
        let hidInterfaceStub;
        beforeEach(() => {
            huddlygoInitStub = sinon_1.default.stub(huddlygo_1.default.prototype, 'initialize').resolves();
            boxfishInitStub = sinon_1.default.stub(boxfish_1.default.prototype, 'initialize').resolves();
            hidInterfaceStub = sinon_1.default.stub(factory_1.default, 'getHIDInterface').resolves();
            discoveryEmitter = new events_1.EventEmitter();
            otherEmitter = new events_1.EventEmitter();
            new src_1.default(nodeusbDeviceApi, [nodeusbDeviceApi], { emitter: otherEmitter, apiDiscoveryEmitter: discoveryEmitter });
        });
        afterEach(() => {
            huddlygoInitStub.restore();
            boxfishInitStub.restore();
            hidInterfaceStub.restore();
        });
        it('should emit ATTACH event with Boxfish instance when attached device is boxfish', (done) => {
            otherEmitter.on('ATTACH', (d) => {
                chai_1.expect(d).to.be.instanceof(boxfish_1.default);
                done();
            });
            discoveryEmitter.emit('ATTACH', dummyIQ);
        });
        it('should emit ATTACH event with HuddlyGo instance when attached device is go', (done) => {
            otherEmitter.on('ATTACH', (d) => {
                chai_1.expect(d).to.be.instanceof(huddlygo_1.default);
                done();
            });
            discoveryEmitter.emit('ATTACH', dummyGO);
        });
        it('should not emit ATTACH event when device api emits attach with undefined device instance', () => {
            const attachSpy = sinon_1.default.spy();
            otherEmitter.on('ATTACH', attachSpy);
            discoveryEmitter.emit('ATTACH', undefined);
            chai_1.expect(attachSpy.callCount).to.equals(0);
        });
        it('should emit DETACH event when device discovery api emits DETACH for a huddly device', (done) => {
            otherEmitter.on('DETACH', (d) => {
                chai_1.expect(d).to.deep.equals(dummyIQ);
                done();
            });
            discoveryEmitter.emit('DETACH', dummyIQ);
        });
        it('should not emit DETACH event when device api emits detach with undefined device instance', () => {
            const detachSpy = sinon_1.default.spy();
            otherEmitter.on('DETACH', detachSpy);
            discoveryEmitter.emit('DETACH', undefined);
            chai_1.expect(detachSpy.callCount).to.equals(0);
        });
    });
    describe('#init', () => {
        it('should call initialize on the device discovery api', () => __awaiter(this, void 0, void 0, function* () {
            nodeusbDeviceApi.initialize.resolves();
            const sdk = new src_1.default(nodeusbDeviceApi, [nodeusbDeviceApi], {});
            yield sdk.init();
            chai_1.expect(nodeusbDeviceApi.initialize.callCount).to.equals(1);
        }));
    });
});
//# sourceMappingURL=sdk.spec.js.map