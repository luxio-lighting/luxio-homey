'use strict';

const Homey = require('homey');
const tinycolor = require('tinycolor2');
const tinygradient = require('tinygradient');

const POLL_INTERVAL = 7500;

class LuxioDevice extends Homey.Device {
	
	onInit() {		
		this.id = this.getData().id;
		this._driver = this.getDriver();
		this._driver.ready(() => {
			this._device = this._driver.getDevice( this.id );
			
			if( typeof this._device === 'undefined' ) {
				
				this.setUnavailable( new Error('Offline') );
				
				this._driver.once(`device_${this.id}`, device => {
					this._device = device;
					this._init();
				})
			} else {
				this._init();
			}
			
			this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
			this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
			this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], this.onCapabilityLightHueSat.bind(this));
			this.registerCapabilityListener('light_temperature', this.onCapabilityLightTemperature.bind(this));
			this.registerCapabilityListener('light_mode', this.onCapabilityLightMode.bind(this));
		
		});
		
	}
	
	_init() {
		
		this._hue = this.getCapabilityValue('light_hue');
		if( this._hue === null ) this._hue = 0;
		
		this._saturation = this.getCapabilityValue('light_saturation');
		if( this._saturation === null ) this._saturation = 1;
		
		this._temperature = this.getCapabilityValue('light_saturation');
		if( this._temperature === null ) this._temperature = 0.5;
		
		this._mode = this.getCapabilityValue('light_mode');
		if( this._mode === null ) this._mode = 'color';
		
		if( this._syncStateInterval ) clearInterval(this._syncStateInterval);
		this._syncStateInterval = setInterval(this._sync.bind(this), POLL_INTERVAL);
		
		this._sync().catch( this.error );
	}
	
	_sync() {
		return this._device.sync().then(() => {
			this.setCapabilityValue('onoff', this._device.on);
			this.setCapabilityValue('dim', this._device.brightness);
			
			let color = this._device.gradient[0];
				color = tinycolor(`${color}`);
			
			let hsv = color.toHsv();
			
			if( this._mode === 'color' ) {
				this._hue = hsv.h/360;
				this._saturation = hsv.s;
				
				this.setCapabilityValue('light_hue', this._hue);
				this.setCapabilityValue('light_saturation', this._saturation);
			} else if( this._mode === 'temperature' ) {
				// TODO: Somehow figure out how to determine temperature from the gradient
				// this.setCapabilityValue('light_temperature', );
			}
			
			this.setAvailable();
		}).catch( err => {
			this.setUnavailable( err );
			throw err;
		})
		
	}
	
	onRenamed( name ) {
		this._device.name = name;
		return this._sync();
	}
	
	onDeleted() {
		if( this._syncStateInterval ) clearInterval(this._syncStateInterval);
	}
	
	onCapabilityOnoff( value ) {
		this._device.on = value;
		return this._sync();
	}
	
	onCapabilityDim( value ) {
		this._device.on = ( value > 0 );
		this._device.brightness = value;
		return this._sync();
	}
	
	onCapabilityLightHueSat( values ) {
		if( typeof values.light_hue === 'number' )
			this._hue = values.light_hue;
			
		if( typeof values.light_saturation === 'number' )
			this._saturation = values.light_saturation;
			
		this._mode = 'color';
		return this._setColor();
	}
	
	onCapabilityLightTemperature( value ) {
		this._temperature = value;
		this._mode = 'temperature';
		return this._setColor();	
		
	}
	
	onCapabilityLightMode( value ) {
		this._mode = value;
		return this._setColor();		
	}
	
	_setColor() {
		let color;
		
		if( this._mode === 'color' ) {
			color = tinycolor({
				h: this._hue * 360,
				s: this._saturation,
				l: 0.5
			})
		
		} else if( this._mode === 'temperature' ) {
			let g = tinygradient('#CCFBFD', '#FFFFFF', '#FFDA73').hsv(99);
			color = g[Math.floor(this._temperature*98)]
		}
				
		color = color
			.toHexString()
			.substring(1) // remove #
			.toUpperCase();
				
		this._device.gradient = [ color, color ];
		return this._sync();
	}
	
	setEffect( effect ) {
		this._device.effect = effect;
		return this._sync();
	}
	
}

module.exports = LuxioDevice;