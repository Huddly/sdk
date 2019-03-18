"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class UvcBaseDevice {
    constructor(uvcCamera, uvcControlInterface) {
        this.uvcCamera = uvcCamera;
        this.uvcControlInterface = uvcControlInterface;
        Object.assign(this, uvcCamera);
    }
    getSoftwareVersion() {
        throw new Error('getSoftwareVersion not implemented');
    }
    supportsSoftwareUpgrades() {
        throw new Error('supportsSoftwareUpgrades upgrades not implemented');
    }
    getBinaries() {
        throw new Error('getBinaries not implemented');
    }
    getPowerUsage() {
        throw new Error('getPowerUsage not implemented');
    }
    getTemperature() {
        throw new Error('getTemperature not implemented');
    }
    getWhitePointAdjust() {
        throw new Error('getWhitePointAdjust not implemented');
    }
    setWhitePointAdjust() {
        throw new Error('setWhitePointAdjust not implemented');
    }
    getCameraMode() {
        throw new Error('getCameraMode not implemented');
    }
    setCameraMode(mode) {
        throw new Error('setCameraMode not implemented');
    }
    setFramingConfig(config) {
        throw new Error('setFramingConfig not implemented');
    }
    getErrorLog() {
        throw new Error('getErrorLog not implemented');
    }
    eraseErrorLog() {
        throw new Error('eraseErrorLog not implemented');
    }
    factoryReset() {
        throw new Error('factoryReset not implemented');
    }
    uptime() {
        throw new Error('uptime not implemented');
    }
    // eslint-disable-next-line class-methods-use-this
    getUpdateUrl() {
        throw new Error('updateUrl not implemented');
    }
    getStatus() {
        throw new Error('getStatus not implemented');
    }
    getXUControl(controlNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.uvcControlInterface.getXUControl(controlNumber);
        });
    }
    setXUControl(controlNumber, value) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.uvcControlInterface.setXUControl(controlNumber, value);
        });
    }
    getSupportedSettings() {
        return this.uvcControlInterface.getSupportedSettings();
    }
    getSetting(key, forceRefresh = false) {
        return this.uvcControlInterface.getSetting(key, forceRefresh);
    }
    setSettingValue(key, value) {
        return this.uvcControlInterface.setSettingValue(key, value);
    }
    getSettings(forceRefresh = false) {
        return this.uvcControlInterface.getSettings(forceRefresh);
    }
    resetSettings(excludeList = []) {
        return this.uvcControlInterface.resetSettings(excludeList);
    }
    getPanTilt() {
        return this.uvcControlInterface.getPanTilt();
    }
    setPanTilt(panTilt) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.uvcControlInterface.setPanTilt(panTilt.pan, panTilt.tilt);
        });
    }
    setUVCParam(param, value) {
        if (!param) {
            return Promise.reject('No parameter provided');
        }
        else if (param.toUpperCase() === 'PANTILT') {
            if (!value || !value.pan || !value.tilt) {
                console.log(value);
                return Promise.reject('Pan and/or tilt value was not provided');
            }
            else {
                return this.setPanTilt(value);
            }
        }
        return this.uvcControlInterface.setSettingValue(param, value);
    }
    getUVCParam(param) {
        if (!param) {
            return Promise.reject('No parameter provided');
        }
        else if (param.toUpperCase() === 'PANTILT') {
            return this.getPanTilt();
        }
        return this.uvcControlInterface.getSetting(param);
    }
    usbReEnumerate() {
        return this.uvcControlInterface.usbReEnumerate();
    }
    isAlive() {
        return this.uvcControlInterface.isAlive();
    }
}
exports.default = UvcBaseDevice;
//# sourceMappingURL=uvcbase.js.map