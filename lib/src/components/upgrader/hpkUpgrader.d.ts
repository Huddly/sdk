/// <reference types="node" />
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import IDeviceManager from './../../interfaces/iDeviceManager';
import UpgradeOpts from './../../interfaces/IUpgradeOpts';
import { EventEmitter } from 'events';
export default class HPKUpgrader extends EventEmitter implements IDeviceUpgrader {
    verboseStatusLog: boolean;
    _cameraManager: IDeviceManager;
    _sdkDeviceDiscoveryEmitter: EventEmitter;
    _fileBuffer: Buffer;
    _logger: any;
    constructor(manager: IDeviceManager, sdkDeviceDiscoveryEmitter: EventEmitter, logger: any);
    init(opts: UpgradeOpts): void;
    onAttach: (devManager: any) => void;
    onDetach: () => void;
    registerHotPlugEvents(): void;
    deRegisterHotPlugEvents(): void;
    upload(hpkBuffer: Buffer): Promise<void>;
    start(): Promise<void>;
    awaitHPKCompletion(): Promise<boolean>;
    runHPKScript(): Promise<void>;
    doUpgrade(): Promise<boolean>;
    upgradeIsValid(): Promise<boolean>;
}
