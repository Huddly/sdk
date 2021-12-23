import IHuddlyDeviceDiscoveryAPI from '@huddly/sdk-interfaces/lib/interfaces/IHuddlyDeviceDiscoveryAPI';

/**
 * Helper class for grouping device discovery api objects and subsequently calling their init and
 * hot plug event register all at once.
 *
 * @ignore
 * @class AllDeviceDiscovery
 * @implements {IHuddlyDeviceDiscoveryAPI}
 */
class AllDeviceDiscovery implements IHuddlyDeviceDiscoveryAPI {
  apis: Array<IHuddlyDeviceDiscoveryAPI> = [];

  constructor(apis: Array<IHuddlyDeviceDiscoveryAPI>) {
    this.apis = apis;
  }

  initialize() {
    for (let i = 0; i < this.apis.length; i++) {
      this.apis[i].initialize();
    }
  }

  registerForHotplugEvents(deviceDiscovery) {
    for (let i = 0; i < this.apis.length; i++) {
      this.apis[i].registerForHotplugEvents(deviceDiscovery);
    }
  }
}

export default AllDeviceDiscovery;
