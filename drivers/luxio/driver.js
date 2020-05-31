'use strict';

const Homey = require('homey');

module.exports = class LuxioDriver extends Homey.Driver {

  onInit() {
    new Homey.FlowCardAction('set_effect')
      .register()
      .registerRunListener(async ({ device, effect }) => {
        return device.triggerCapabilityListener('luxio_effect', effect);
      });

    new Homey.FlowCardAction('set_gradient')
      .register()
      .registerRunListener(async ({ device, color1, color2, color3, color4, color5 }) => {
        return device.triggerCapabilityListener('luxio_gradient', [
          color1,
          color2,
          color3,
          color4,
          color5,
        ].map(color => {
          return color.substring(1).toUpperCase();
        }).join(','));
      });
  }

  onPairListDevices(_, callback) {
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
    callback(null, devices);
  }

}