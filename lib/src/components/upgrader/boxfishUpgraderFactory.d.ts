/// <reference types="node" />
import IDeviceManager from './../../interfaces/iDeviceManager';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import BoxfishPkg from './boxfishpkg';
import BoxfishHpk from './boxfishhpk';
import { EventEmitter } from 'events';
export declare const HPK_SUPPORT_VERSION = "1.2.0-0";
export declare function createBoxfishUpgrader(manager: IDeviceManager, sdkDeviceDiscoveryEmitter: EventEmitter, logger: any): Promise<IDeviceUpgrader>;
export declare function createBoxfishUpgraderFile(file: Buffer): BoxfishHpk | BoxfishPkg;
