/// <reference types="node" />
import Api from './../api';
import DefaultLogger from './../../utilitis/logger';
import UvcBaseDevice from './uvcbase';
import ITransport from './../../interfaces/iTransport';
import IDeviceManager from './../../interfaces/iDeviceManager';
import IDetector from './../../interfaces/IDetector';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import DetectorOpts from './../../interfaces/IDetectorOpts';
import Locksmith from './../locksmith';
import { EventEmitter } from 'events';
export default class Boxfish extends UvcBaseDevice implements IDeviceManager {
    transport: ITransport;
    _api: Api;
    uvcControlInterface: any;
    logger: DefaultLogger;
    locksmith: Locksmith;
    discoveryEmitter: EventEmitter;
    constructor(uvcCameraInstance: any, transport: ITransport, uvcControlInterface: any, logger: DefaultLogger, cameraDiscoveryEmitter: EventEmitter);
    readonly api: Api;
    initialize(): Promise<void>;
    closeConnection(): Promise<any>;
    getInfo(): Promise<any>;
    extractSemanticSoftwareVersion(appVer: string): string;
    ensureAppMode(currentMode: string, timeout?: number): Promise<void>;
    getErrorLog(): Promise<any>;
    eraseErrorLog(): Promise<void>;
    reboot(mode?: string): Promise<void>;
    uptime(): Promise<any>;
    getUpgrader(): Promise<IDeviceUpgrader>;
    createAndRunUpgrade(opts: UpgradeOpts, deviceManager: IDeviceManager): Promise<{}>;
    upgrade(opts: UpgradeOpts): Promise<any>;
    getDetector(opts?: DetectorOpts): IDetector;
    getState(): Promise<any>;
}
