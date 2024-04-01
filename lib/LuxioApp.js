'use strict';

const Homey = require('homey');
const WebSocket = require('ws');

global.WebSocket = WebSocket;

module.exports = class LuxioApp extends Homey.App {

  async onInit() {
    this.log('LuxioApp is running...');
  }

}