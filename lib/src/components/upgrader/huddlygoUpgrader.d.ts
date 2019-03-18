/// <reference types="node" />
import { EventEmitter } from 'events';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
export default class HuddlyGoUpgrader extends EventEmitter implements IDeviceUpgrader {
    _devInstance: any;
    _cameraDiscovery: EventEmitter;
    _hidApi: any;
    logger: any;
    options: any;
    bootTimeout: number;
    constructor(devInstance: any, cameraDiscovery: EventEmitter, hidAPI: any, logger: any);
    init(opts: UpgradeOpts): void;
    start(): Promise<void>;
    doUpgrade(): Promise<any>;
    postUpgrade(): Promise<any>;
    upgradeIsValid(): Promise<boolean>;
}
