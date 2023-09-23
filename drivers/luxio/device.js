'use strict';

const Homey = require('homey');
const tinycolor = require('tinycolor2');

const LuxioAPI = require('../../lib/LuxioAPI');

module.exports = class extends Homey.Device {

  static SYNC_INTERVAL = 5000;

  constructor(...props) {
    super(...props);

    this.onSync = this.onSync.bind(this);
  }

  onInit() {
    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
    this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], this.onCapabilityLightHueSat.bind(this), 200);
    this.registerCapabilityListener('luxio_effect', this.onCapabilityLuxioEffect.bind(this));
    this.registerCapabilityListener('luxio_gradient', this.onCapabilityLuxioGradient.bind(this));
  }

  onDiscoveryResult({ id }) {
    return id === this.getData().id;
  }

  async onDiscoveryAvailable({ id, address, txt }) {
    this.log(`Found Luxio ${id} at ${address}`);

    const pixels = txt.pixels
      ? Number(txt.pixels)
      : undefined;

    this.api = new LuxioAPI({ address, pixels });

    this.onSyncInterval = setInterval(this.onSync, this.constructor.SYNC_INTERVAL);
    this.onSync();
  }

  onDiscoveryAddressChanged({ address }) {
    this.api.setAddress({ address });
  }

  async onRenamed(value) {
    await this.api.setName({ value });
  }

  onDeleted() {
    if (this.onSyncInterval)
      clearInterval(this.onSyncInterval);
  }

  onSync() {
    Promise.resolve().then(async () => {
      const {
        on,
        brightness,
        gradient_source,
        effect,
        mode,
      } = await this.api.getState();

      await this.setCapabilityValue('onoff', on);
      await this.setCapabilityValue('dim', brightness);

      switch (mode) {
        case 'gradient': {
          const color = tinycolor(`#${gradient_source[0]}`);
          const { h, s } = color.toHsv();
          await this.setCapabilityValue('light_hue', h / 360);
          await this.setCapabilityValue('light_saturation', s);
          await this.setCapabilityValue('luxio_gradient', gradient_source.join(','));
          break;
        }
        case 'effect': {
          await this.setCapabilityValue('light_hue', 0);
          await this.setCapabilityValue('light_saturation', 0);
          await this.setCapabilityValue('luxio_effect', effect);
          break;
        }
      }

      this.setAvailable();
    }).catch(err => {
      this.error(err);
      this.setUnavailable(err);
    });
  }

  async onCapabilityOnoff(value) {
    await this.api.setOn({ value });
  }

  async onCapabilityDim(value) {
    await this.api.setBrightness({ value });
  }

  async onCapabilityLightHueSat({
    light_hue = this.getCapabilityValue('light_hue'),
    light_saturation = this.getCapabilityValue('light_saturation'),
  }) {
    const value = tinycolor({
      h: light_hue * 360,
      s: light_saturation * 100,
      l: 50,
    }).toHex();

    await this.api.setColor({ value });
  }

  async onCapabilityLuxioEffect(value) {
    await this.api.setEffect({ value });
  }

  async onCapabilityLuxioGradient(value) {
    await this.api.setGradient({
      value: value.split(',').map(color => color.trim()),
    });
  }

}