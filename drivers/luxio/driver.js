'use strict';

const Homey = require('homey');
const Discovery = require('luxio').Discovery;

const POLL_INTERVAL = 1000 * 30;

module.exports = class LuxioDriver extends Homey.Driver {
  
  onInit() {    
    this._devices = {};    
    this._discovery = new Discovery();
    
    this.pollDevices = this.pollDevices.bind(this);
    this.pollDevices();
    setInterval(this.pollDevices, POLL_INTERVAL);
      
    new Homey.FlowCardAction('set_effect')
      .register()
      .registerRunListener(async args => {
        return args.device.setEffect(args.effect);
      })
    
  }
  
  async getDevice(id) {
    const device = this._devices[id];
    if(device) return device;
    
    return new Promise(resolve => {
      this.once(`device_${id}`, resolve);
    });
  }
  
  pollDevices() {    
    this._discovery.getDevices().then(devices => {
      Object.values(devices).forEach(device => {
        if( this._devices[device.id] ) return;
        
        this._devices[device.id] = device;
        this.emit(`device_${device.id}`, device);
      });
    }).catch( this.error );
  }
  
  onPairListDevices( data, callback ) {
    const devices = Object.values(this._devices).map(device => {      
      return {
        data: {
          id: device.id,
        },
        name: device.name
      };
    });
    callback( null, devices );
  }
  
}