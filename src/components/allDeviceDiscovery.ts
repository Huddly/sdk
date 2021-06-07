import IHuddlyDeviceDiscoveryAPI from '../interfaces/IHuddlyDeviceDiscoveryAPI';

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
