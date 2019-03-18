/// <reference types="node" />
import Api from '../api';
import DefaultLogger from './../../utilitis/logger';
import UvcBaseDevice from './uvcbase';
import ITransport from './../../interfaces/iTransport';
import IDeviceManager from './../../interfaces/iDeviceManager';
import IDetector from './../../interfaces/IDetector';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import Locksmith from './../locksmith';
import { EventEmitter } from 'events';
export default class HuddlyGo extends UvcBaseDevice implements IDeviceManager {
    transport: ITransport;
    api: Api;
    uvcControlInterface: any;
    hidApi: any;
    logger: DefaultLogger;
    locksmith: Locksmith;
    softwareVersion: any;
    discoveryEmitter: EventEmitter;
    constructor(uvcCameraInstance: any, transport: ITransport, uvcControlInterface: any, hidAPI: any, logger: DefaultLogger, cameraDiscoveryEmitter: EventEmitter);
    initialize(): Promise<void>;
    closeConnection(): Promise<any>;
    getSoftwareVersion(retryAttempts?: number): Promise<"0.0.4" | {
        mv2_boot: any;
        mv2_app: any;
    }>;
    getInfo(): Promise<any>;
    ensureAppMode(currentMode: string, timeout?: number): Promise<any>;
    getErrorLog(): Promise<any>;
    eraseErrorLog(): Promise<void>;
    getPowerUsage(): Promise<any>;
    getTemperature(): Promise<any>;
    getWhitePointAdjust(): Promise<any>;
    reboot(mode: string): Promise<void>;
    setCameraMode(mode: any): Promise<void>;
    getCameraMode(): Promise<"normal" | "dual" | "high-res" | "unknown">;
    uptime(): Promise<any>;
    getUpgrader(): Promise<IDeviceUpgrader>;
    upgrade(opts: UpgradeOpts): Promise<any>;
    getDetector(): IDetector;
    getState(): Promise<any>;
}
