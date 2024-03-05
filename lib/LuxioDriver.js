'use strict';

const Homey = require('homey');
const tinycolor = require('tinycolor2');

// Patch fetch for Node.js
global.fetch = global.fetch ?? require('node-fetch');

module.exports = class LuxioDriver extends Homey.Driver {

  async onInit() {
    this.homey.flow.getActionCard('set_gradient')
      .registerRunListener(async ({
        device,
        color1,
        color2,
        color3,
        color4,
        color5,
      }) => {
        const colorsRgb = [
          color1,
          color2,
          color3,
          color4,
          color5,
        ].map(colorHex => {
          const { r, g, b } = tinycolor(colorHex).toRgb();
          return { r, g, b };
        });

        await device.setGradient(colorsRgb);
      });
  }

  async onPairListDevices() {
    const discoveryStrategy = this.getDiscoveryStrategy();
    const discoveredDevices = await discoveryStrategy.getDiscoveryResults();

    return Object.values(discoveredDevices).map(discoveredDevice => {
      return {
        data: {
          id: discoveredDevice.id,
        },
        name: discoveredDevice.txt.name,
      };
    });
  }

}