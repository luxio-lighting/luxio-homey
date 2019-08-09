'use strict';

const Homey = require('homey');
const tinycolor = require('tinycolor2');

const SYNC_INTERVAL = 7500;

module.exports = class LuxioDevice extends Homey.Device {
  
  onInit() {
    this.sync = this.sync.bind(this);
    
    this.id = this.getData().id;
    this._driver = this.getDriver();
    this.setUnavailable( new Error('Offline') );
    
    this._driver.ready(() => {
      this._driver.getDevice(this.id).then(device => {
        this._device = device;
        
        this._hue = this.getCapabilityValue('light_hue');
        if( this._hue === null ) this._hue = 0;
        
        this._saturation = this.getCapabilityValue('light_saturation');
        if( this._saturation === null ) this._saturation = 1;
        
        this._temperature = this.getCapabilityValue('light_saturation');
        if( this._temperature === null ) this._temperature = 0.5;
        
        this._mode = this.getCapabilityValue('light_mode');
        if( this._mode === null ) this._mode = 'color';
        
        this.syncInterval = setInterval(this.sync, SYNC_INTERVAL);
        this.sync();
        
      }).catch(err => {
        this.error(err);
        this.setUnavailable(err);
      });    
    });
      
    this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
    this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], this.onCapabilityLightHueSat.bind(this));
    this.registerCapabilityListener('light_temperature', this.onCapabilityLightTemperature.bind(this));
    this.registerCapabilityListener('light_mode', this.onCapabilityLightMode.bind(this));
    
  }
  
  onRenamed( name ) {
    this._device.name = name;
    this._device.sync().catch(this.error);
  }
  
  onDeleted() {
    if( this.syncInterval )
      clearInterval(this.syncInterval);
  }
  
  sync() {
    this._device.sync().then(() => {
      this.setCapabilityValue('onoff', this._device.on);
      this.setCapabilityValue('dim', this._device.brightness);
      
      if( this._device.mode === 'gradient' ) {    
        const color = this._device.gradient[0];
        const hsv = tinycolor(`${color}`).toHsv();
        
        if( this._mode === 'color' ) {          
          this._hue = hsv.h/360;
          this._saturation = hsv.s;
          
          this.setCapabilityValue('light_hue', this._hue);
          this.setCapabilityValue('light_saturation', this._saturation);
        } else if( this._mode === 'temperature' ) {
          // TODO: Somehow figure out how to determine temperature from the gradient
          // this.setCapabilityValue('light_temperature', );
        }
      } else if( this._device.mode === 'effect' ) {
        // ...
      }
      
      this.setAvailable();
    }).catch( err => {
      this.error(err);
      this.setUnavailable(err);
    });    
  }
  
  async onCapabilityOnoff( value ) {
    this._device.on = value;
    return this.sync();
  }
  
  async onCapabilityDim( value ) {
    this._device.on = ( value > 0 );
    this._device.brightness = value;
    return this.sync();
  }
  
  async onCapabilityLightHueSat( values ) {
    if( typeof values.light_hue === 'number' )
      this._hue = values.light_hue;
      
    if( typeof values.light_saturation === 'number' )
      this._saturation = values.light_saturation;
      
    this._mode = 'color';
    return this._setColor();
  }
  
  async onCapabilityLightTemperature( value ) {
    this._temperature = value;
    this._mode = 'temperature';
    return this._setColor();  
    
  }
  
  async onCapabilityLightMode( value ) {
    this._mode = value;
    return this._setColor();    
  }
  
  async _setColor() {    
    if( this._mode === 'color' ) {
      this._device.color = tinycolor({
        h: this._hue * 360,
        s: this._saturation,
        l: 0.5
      }).toHexString();    
    } else if( this._mode === 'temperature' ) {
      this._device.colorTemperature = this._temperature;
    }
    
    return this.sync();
  }
  
  async setEffect( effect ) {
    this._device.effect = effect;
    return this.sync();
  }
  
}