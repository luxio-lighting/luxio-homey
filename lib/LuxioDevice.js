'use strict';

const Homey = require('homey');
const tinycolor = require('tinycolor2');
const tinygradient = require('tinygradient');

module.exports = class LuxioDevice extends Homey.Device {

  async onInit() {
    this.luxioDevice = null;

    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
    this.registerMultipleCapabilityListener(['light_hue', 'light_saturation', 'light_mode', 'light_temperature'], this.onCapabilityLight.bind(this), 200);
  }

  async getLuxioDevice() {
    if (!this.luxioDevice) {
      throw new Error('Not Discovered');
    }

    return this.luxioDevice;
  }

  onDiscoveryResult({ id }) {
    return id === this.getData().id;
  }

  onStateLed({
    on,
    brightness,
    colors,
  }) {
    // Set the on/off state
    if (typeof on === 'boolean') {
      this.setCapabilityValue('onoff', on)
        .catch(err => this.error(err));
    }

    // Set the brightness
    if (typeof brightness === 'number') {
      this.setCapabilityValue('dim', (brightness - 10) / (255 - 10))
        .catch(err => this.error(err));
    }

    // Set the first color of the gradient
    if (Array.isArray(colors)) {
      const [color] = colors;
      const { h, s, v } = tinycolor(color).toHsv();

      this.setCapabilityValue('light_hue', h / 360)
        .catch(err => this.error(err));

      this.setCapabilityValue('light_saturation', s / 100)
        .catch(err => this.error(err));
    }
  }

  onConfigLed({
    count,
    pin,
    type,
  }) {
    const newSettings = {};
    if (typeof count === 'number') {
      newSettings.led_count = count;
    }

    if (typeof pin === 'number') {
      newSettings.led_pin = pin;
    }

    if (typeof type === 'string') {
      newSettings.led_type = type;
    }

    if (Object.keys(newSettings).length > 0) {
      this.setSettings(newSettings)
        .catch(err => this.error(err));
    }
  }

  async onDiscoveryAvailable(discoveryResult) {
    // Ensure firmware version 100 or higher
    if (discoveryResult.txt?.version) {
      const version = parseInt(discoveryResult.txt.version);
      if (version < 100) {
        throw new Error('This Luxio device runs an unsupported firmware version. Please update the firmware at https://flash.luxio.lighting.');
      }
    }

    if (this.luxioDevice) {
      this.luxioDevice.setAddress(discoveryResult.address);
    } else {
      const { LuxioDevice } = await import('@luxio-lighting/lib');
      this.luxioDevice = new LuxioDevice({
        id: discoveryResult.id,
        address: discoveryResult.address,
        name: discoveryResult.txt.name,
        version: parseInt(discoveryResult.txt.version),
      });
      this.luxioDevice.addEventListener('led.state', ledState => {
        this.onStateLed(ledState).catch(err => this.error(err));
      });
      this.luxioDevice.addEventListener('led.config', ledConfig => {
        this.onConfigLed(ledConfig).catch(err => this.error(err));
      });
      this.luxioDevice.connect()
        .then(() => this.log('Connected'))
        .catch(err => this.error(`Error Connecting: ${err.message}`));

      // TODO: On Disconnected?
    }

    const fullState = await this.luxioDevice.getFullState();
    if (fullState.led?.state) this.onStateLed(fullState.led.state);
    if (fullState.led?.config) this.onConfigLed(fullState.led.config);
  }

  onDiscoveryAddressChanged({ address }) {
    if (this.luxioDevice) {
      this.luxioDevice.setAddress(address);

      // TODO: Reconnect?
    }
  }

  async onRenamed(name) {
    const luxioDevice = await this.getLuxioDevice();
    await luxioDevice.system.setName({
      name,
    });
  }

  async onDeleted() {
    // TODO: Disconnect ?
  }

  async onSettings({ newSettings, changedKeys }) {
    if (changedKeys.includes('led_count')) {
      const luxioDevice = await this.getLuxioDevice();
      await luxioDevice.led.setCount({
        count: newSettings.led_count,
      });
    }

    if (changedKeys.includes('led_pin')) {
      const luxioDevice = await this.getLuxioDevice();
      await luxioDevice.led.setPin({
        pin: newSettings.led_pin,
      });
    }

    if (changedKeys.includes('led_type')) {
      const luxioDevice = await this.getLuxioDevice();
      await luxioDevice.led.setType({
        type: newSettings.led_type,
      });
    }
  }

  async onCapabilityOnoff(isOn) {
    const luxioDevice = await this.getLuxioDevice();
    await luxioDevice.led.setOn({
      on: !!isOn,
    });
  }

  async onCapabilityDim(value) {
    const luxioDevice = await this.getLuxioDevice();
    await luxioDevice.led.setBrightness({
      brightness: 10 + Math.round(value * (255 - 10)),
    });
  }

  async onCapabilityLight({
    light_mode = this.getCapabilityValue('light_mode'),
    light_hue = this.getCapabilityValue('light_hue'),
    light_saturation = this.getCapabilityValue('light_saturation'),
    light_temperature = this.getCapabilityValue('light_temperature'),
  }) {
    const { led_type } = this.getSettings();

    switch (led_type) {
      // RGB
      case 'WS2812': {

        // Set R, G, B
        switch (light_mode) {
          case null:
          case 'color': {
            const { r, g, b } = tinycolor({
              h: light_hue * 360,
              s: light_saturation * 100,
              l: 50,
            }).toRgb();

            const luxioDevice = await this.getLuxioDevice();
            await luxioDevice.led.setColor({ r, g, b });
            break;
          }

          // Simulate temperature with R, G and B
          case 'temperature': {
            const gradient = tinygradient([
              { r: 201, g: 226, b: 255 }, // 7000K
              { r: 255, g: 250, b: 244 }, // 5200K
              { r: 255, g: 147, b: 41 }, // 1900K
            ]);

            const { r, g, b } = gradient
              .rgbAt(light_temperature)
              .toRgb();

            const luxioDevice = await this.getLuxioDevice();
            await luxioDevice.led.setColor({ r, g, b });

            break;
          }
        }

        break;
      }
      // RGBW
      case 'SK6812': {

        // Set R, G, B
        // W is always 0
        switch (light_mode) {
          case null:
          case 'color': {
            const { r, g, b } = tinycolor({
              h: light_hue * 360,
              s: light_saturation * 100,
              l: 50,
            }).toRgb();

            const luxioDevice = await this.getLuxioDevice();
            await luxioDevice.led.setColor({ r, g, b, w: 0 });

            break;
          }

          // Set W to full, and mix with a little bit of R or B to add extra warm/cool
          case 'temperature': {
            let w = 255;
            let r = 0;
            let g = 0;
            let b = 0;

            const delta = (light_temperature - 0.5) * 2; // -1 = blue, +1 = red
            if (delta < 0) {
              b = Math.round(delta * -255);
            } else if (delta > 0) {
              r = Math.round(delta * 255);
            }

            const luxioDevice = await this.getLuxioDevice();
            await luxioDevice.led.setColor({ r, g, b, w });

            break;
          }
        }

        break;
      }
    }
  }

  async setGradient(colorsRgb) {
    const luxioDevice = await this.getLuxioDevice();
    await luxioDevice.led.setGradient({
      colors: colorsRgb,
    });
  }

}