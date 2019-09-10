'use strict';

const Homey = require('homey');

module.exports = class LuxioDriver extends Homey.Driver {

  onInit() {
    new Homey.FlowCardAction('set_effect')
      .register()
      .registerRunListener(async args => {
        return args.device.setEffect(args.effect);
      })
  }

  onPairListDevices( data, callback ) {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();

    const devices = Object.values(discoveryResults).map(discoveryResult => {
      return {
        data: {
          id: discoveryResult.id,
        },
        name: discoveryResult.txt.name,
      };
    });
    callback( null, devices );
  }

}