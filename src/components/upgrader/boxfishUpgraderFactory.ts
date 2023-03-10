import semver from 'semver';

import IDeviceManager from '@huddly/sdk-interfaces/lib/interfaces/IDeviceManager';
import IDeviceUpgrader from '@huddly/sdk-interfaces/lib/interfaces/IDeviceUpgrader';
import Logger from '@huddly/sdk-interfaces/lib/statics/Logger';

import BoxfishUpgrader from './../upgrader/boxfishUpgrader';
import HPKUpgrader from './../upgrader/hpkUpgrader';

import BoxfishPkg from './boxfishpkg';
import BoxfishHpk from './boxfishhpk';

import { EventEmitter } from 'events';

/** @ignore */
export const HPK_SUPPORT_VERSION = process.env.HPK_SUPPORT_VERSION || '1.2.1-0';

/**
 * @ignore
 * Helper function for checking which upgrade controller class should be used for upgrading the IQ camera
 * based on the version running on target.
 *
 * @export
 * @param {IDeviceManager} manager The camera controller class
 * @param {EventEmitter} sdkDeviceDiscoveryEmitter Event emitter instance responsible for reporting camera attach and detach events
 * @return {*}  {Promise<IDeviceUpgrader>}  Return the appropriate upgrade controller class that should be used to upgrade target
 */
export async function createBoxfishUpgrader(
  manager: IDeviceManager,
  sdkDeviceDiscoveryEmitter: EventEmitter
): Promise<IDeviceUpgrader> {
  const info = await manager.getInfo();
  if (true) {
    Logger.warn('Initializing HPKUpgrader', 'Boxfish Upgrader Factory');
    return new HPKUpgrader(manager, sdkDeviceDiscoveryEmitter);
  }
  Logger.warn(
    `Camera version is ${info.version} which is not supported by HPK Upgrader. Using BoxfishUpgrader as fallback.`,
    'Boxfish Upgrader Factory'
  );
  return new BoxfishUpgrader(manager, sdkDeviceDiscoveryEmitter);
}

/**
 * @ignore
 * Helper funtion for checing which firmware image file class wrapper should be used for upgradeing IQ.
 *
 * @export
 * @param {Buffer} file The firmware image file
 * @return {*} A wrapper class for reading the firmware image file
 */
export function createBoxfishUpgraderFile(file: Buffer) {
  if (BoxfishHpk.isHpk(file)) {
    return new BoxfishHpk(file);
  }
  return new BoxfishPkg(file);
}
