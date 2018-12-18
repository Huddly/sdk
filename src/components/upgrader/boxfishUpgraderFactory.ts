import semver from 'semver';

import IDeviceManager from './../../interfaces/iDeviceManager';
import IDeviceUpgrader from './../../interfaces/IDeviceUpgrader';
import BoxfishUpgrader from './../upgrader/boxfishUpgrader';
import HPKUpgrader from './../upgrader/hpkUpgrader';

import { EventEmitter } from 'events';

const HPK_SUPPORT_VERSION = '1.1.0-0';
export default async function createBoxfishUpgrader(
  manager: IDeviceManager,
  sdkDeviceDiscoveryEmitter: EventEmitter,
  logger: any
): Promise<IDeviceUpgrader> {
  const info = await manager.getInfo();
  if (semver.gte(info.version, HPK_SUPPORT_VERSION)) {
    return new HPKUpgrader(manager, sdkDeviceDiscoveryEmitter, logger);
  }
  return new BoxfishUpgrader(manager, sdkDeviceDiscoveryEmitter, logger);
}
