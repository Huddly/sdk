import semver from 'semver';

import IDeviceManager from './../../interfaces/iDeviceManager';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import BoxfishUpgrader from './../upgrader/boxfishUpgrader';
import HPKUpgrader from './../upgrader/hpkUpgrader';
import Logger from './../../utilitis/logger';

import BoxfishPkg from './boxfishpkg';
import BoxfishHpk from './boxfishhpk';

import { EventEmitter } from 'events';

export const HPK_SUPPORT_VERSION = process.env.HPK_SUPPORT_VERSION || '1.2.1-0';

export async function createBoxfishUpgrader(
  manager: IDeviceManager,
  sdkDeviceDiscoveryEmitter: EventEmitter
): Promise<IDeviceUpgrader> {
  const info = await manager.getInfo();
  if (semver.gte(info.version, HPK_SUPPORT_VERSION)) {
    Logger.warn('Initializing HPKUpgrader', 'Boxfish Upgrader Factory');
    return new HPKUpgrader(manager, sdkDeviceDiscoveryEmitter);
  }
  Logger.warn(
    `Camera version is ${info.version} which is not supported by HPK Upgrader. Using BoxfishUpgrader as fallback.`,
    'Boxfish Upgrader Factory'
  );
  return new BoxfishUpgrader(manager, sdkDeviceDiscoveryEmitter);
}

export function createBoxfishUpgraderFile(file: Buffer) {
  if (BoxfishHpk.isHpk(file)) {
    return new BoxfishHpk(file);
  }
  return new BoxfishPkg(file);
}
