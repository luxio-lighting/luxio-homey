'use strict';

const { apAddress } = require('../config');
const {
	createGradient,
	getColorTemperature,
	fetch
} = require('../util');

class Device {
	
	constructor( id, opts ) {
		
		Object.defineProperty(this, 'id', {
			value: id,
			enumerable: true,
		});
				
		this._opts = {};
		this._state = {};
		this._stateSynced = false;
		this._putQueue = {};
		
		for( let key in opts ) {
			Object.defineProperty(this._opts, key, {
				value: opts[key],
				enumerable: true,
				writable: true,
			});			
		}		
		
	}
	
	async _fetch( path, opts ) {		
		return fetch(`http://${this._opts.address}/${path}`, {
			method: 'GET',
			body: undefined,
			compress: false,
			timeout: 5000,
			...opts,
		})
			.then( res => {
				if( !res.ok ) throw new Error(res.statusText || res.status);
				return res;
			})
			.then( res => {
				if( res.status === 200 ) return res.json();
				return;
			})
	}
	
	async _getState() {
		return this._fetch('state', {
			method: 'GET'
		}).then(result => {
			this._stateSynced = true;
			this._state = result;
		});
	}
	
	/*
		Read-only properties
	*/
	get connectivity() {
		return this.address === apAddress ? 'ap' : 'lan';
	}
	
	get version() {
		return this._state.version || this._opts.version;
	}
	
	get lastseen() {
		return this._opts.lastseen;
	}
	
	get address() {
		return this._opts.address;
	}
	
	set address(value) {
		this._opts.address = value;
	}
	
	get wifiSsid() {
		return this._opts.wifi_ssid;
	}
	
	get wifi() {
		if( !this._stateSynced )
			throw new Error('Device not synced');
			
		return {
			ssid: this._state.wifi_ssid,
			ip_lan: this._state.wifi_ip_lan,
			ip_ap: this._state.wifi_ip_ap,
			connected: !!this._state.wifi_connected,
			ap: !!this._state.wifi_ap
		};
	}
	
	get mode() {
		if( !this._stateSynced )
			throw new Error('Device not synced');
			
		return this._state.mode;
	}
	
	/*
		Read-Write properties
	*/
	get name() {
		return this._state.name || this._opts.name;
	}
	
	set name( value ) {			
		if( typeof value !== 'string' )
			throw new Error('Invalid type for name, expected: String');
		
		this._putQueue['name'] = { value };
		this._state.name = value;
	}
	
	
	get pixels() {
		return this._state.pixels || this._opts.pixels;
	}
	
	set pixels( value ) {			
		if( typeof value !== 'number' )
			throw new Error('Invalid type for pixels, expected: Number');
		
		this._putQueue['pixels'] = { value };
		this._state.pixels = value;
	}
	
	
	get on() {
		if( typeof this._state.on === 'undefined' )
			throw new Error('Device not synced');
			
		return this._state.on;
	}
	
	set on( value ) {			
		if( typeof value !== 'boolean' )
			throw new Error('Invalid type for on, expected: Boolean');
		
		this._putQueue['on'] = { value };
		this._state.on = value;
	}
	
	
	get brightness() {
		if( !this._stateSynced )
			throw new Error('Device not synced');
			
		return this._state.brightness;
	}
	
	set brightness( value ) {			
		if( typeof value !== 'number' )
			throw new Error('Invalid type for brightness, expected: Number');
		
		this._putQueue['brightness'] = { value };
		this._state.brightness = value;
	}
	
	
	get effect() {
		if( !this._stateSynced )
			throw new Error('Device not synced');
			
		return this._state.effect;
	}
	
	set effect( value ) {						
		if( typeof value !== 'string' )
			throw new Error('Invalid type for brightness, expected: String');
					
		if( !this._state.effects.includes(value) )
			throw new Error('Invalid effect: ' + value);
		
		this._putQueue['effect'] = { value };
		this._state.effect = value;
	}
	
	
	get gradient() {
		if( !this._stateSynced )
			throw new Error('Device not synced');
			
		if( this._state.gradient_source === null ) 
			return null;
						
		const colors = this._state.gradient_source.map(color => {
			if( color.charAt(0) !== '#' ) return `#${color}`;
			return color;
		});
		
		if( colors.length === 1 ) return colors.concat( colors[0] );
		return colors;
	}
	
	set gradient( value ) {			
		if( !Array.isArray(value) )
			throw new Error('Invalid type for gradient, expected: Array');
			
		let gradientSource = value.map( color => {
			if( color.charAt(0) === '#' ) return color.substring(1);
			return color;
		});			
		let gradientPixels = createGradient({
			source: gradientSource,
			pixels: this.pixels
		});
			
		this._putQueue['gradient'] = {
			source: gradientSource,
			pixels: gradientPixels,
		}
		this._state.gradient_source = gradientSource;
		this._state.gradient_pixels = gradientPixels;
	}
	
	
	set color( value ) {
		this.gradient = [ value ];
	}
	
	set colorTemperature( value ) {
		const color = getColorTemperature(value);
		this.color = color;
	}
	
	
	async restart() {
		return this._fetch('restart', { method: 'PUT' });
	}
	
	async getWifiNetworks() {
		return this._fetch('network');			
	}
	
	async setWifiNetwork({ ssid, pass }) {
		return this._fetch('network', {
			method: 'PUT',
			body: JSON.stringify({ ssid, pass })
		});		
	}
	
	async sync() {
		return Promise.all(Object.keys(this._putQueue).map(key => {
			let value = this._putQueue[key];
			let req = this._fetch(key, {
				method: 'PUT',
				body: JSON.stringify(value)
			})
			delete this._putQueue[key];	
			return req;		
		}))
			.then(() => this._getState())
			.then(() => this)
	}
	
}

module.exports = Device;