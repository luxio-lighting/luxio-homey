/* eslint-disable @typescript-eslint/no-misused-promises */
// All methods are awaited, but some of the types are outdated.

import Homey from 'homey';

export default class MyDevice extends Homey.Device {

  public override async onInit() {
    this.log('MyDevice has been initialized');
  }

}
