'use strict';

const fetch = require('node-fetch');
const tinygradient = require('tinygradient');

const LuxioError = require('./LuxioError');

module.exports = class LuxioAPI {

  constructor({ address, pixels = 60 }) {
    this.address = address;
    this.pixels = pixels;
  }

  setAddress({ address }) {
    this.address = address;
  }

  setPixels({ pixels }) {
    this.pixels = pixels;
  }

  async call({ method = 'get', path = '/', json }) {
    const opts = {
      method,
      headers: {},
    };

    if (json) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(json);
    }

    const res = await fetch(`http://${this.address}${path}`, opts);
    if (res.status === 204)
      return undefined;

    const body = await res.json();

    if (!res.ok)
      throw new LuxioError(body.error || body || res.statusText);

    return body;
  }

  async get({ path }) {
    return this.call({
      path,
      method: 'get',
    });
  }

  async post({ path, json }) {
    return this.call({
      path,
      json,
      method: 'post',
    });
  }

  async put({ path, json }) {
    return this.call({
      path,
      json,
      method: 'put',
    });
  }

  async delete({ path }) {
    return this.call({
      path,
      json,
      method: 'delete',
    });
  }

  async getState() {
    const state = await this.get({
      path: '/state',
    });

    this.pixels = state.pixels;

    return state;
  }

  async setOn({ value = true }) {
    await this.put({
      path: '/on',
      json: { value },
    });
  }

  async setBrightness({ value = 1 }) {
    await this.put({
      path: '/brightness',
      json: { value },
    });
  }

  async setEffect({ value = 'rainbow' }) {
    await this.put({
      path: '/effect',
      json: { value },
    });
  }

  async setColor({ value }) {
    await this.setGradient({
      value: [value, value],
    });
  }

  async setGradient({ value = ['FF0000', '00FF00'] }) {
    if (value.length < 2)
      throw new LuxioError(`Provide at least 2 colors`);

    const source = value.map(color => {
      return color.toUpperCase();
    });
    const pixels = tinygradient(source).hsv(this.pixels).map(pixel => {
      return pixel.toHex().toUpperCase();
    });

    await this.put({
      path: '/gradient',
      json: {
        source,
        pixels,
      },
    });
  }

  async setName({ value }) {
    await this.put({
      path: '/name',
      json: { value },
    });
  }

}