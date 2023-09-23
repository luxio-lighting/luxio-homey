'use strict';

const Homey = require('homey');

module.exports = class LuxioDriver extends Homey.Driver {

  onInit() {
    this.homey.flow.getActionCard('set_effect')
      .registerRunListener(async ({ device, effect }) => {
        return device.triggerCapabilityListener('luxio_effect', effect);
      });

     this.homey.flow.getActionCard('set_gradient')
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

  async onPairListDevices() {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveryResults = discoveryStrategy.getDiscoveryResults();

    return Object.values(discoveryResults).map(discoveryResult => {
      return {
        data: {
          id: discoveryResult.id,
        },
        name: discoveryResult.txt.name,
      };
    });
    
  }

}