'use strict';

const fetch = require('node-fetch');
const tinygradient = require('tinygradient');

class Device {
	
	constructor( id, opts ) {
		
		Object.defineProperty(this, 'id', {
			value: id,
			enumerable: true,
		});
		
		this._opts = {};
		
		for( let key in opts ) {
			Object.defineProperty(this._opts, key, {
				value: opts[key],
				enumerable: true,
			});			
		}
		
		this._state = {
			on: null,
			brightness: null,
			effect: null,
			gradient_source: null,
			gradient_pixels: null,
			mode: null
		};
		this._propsChanged = {};
		
	}
	
	_fetch( path, opts ) {
		opts = Object.assign({
			method: 'GET',
			body: undefined,
			compress: false,
			headers: {
				'User-Agent': 'Luxio Client (JavaScript)'
			}
		}, opts || {});
		
		return fetch( `http://${this._opts.address}/${path}`, opts )
			.then( res => res.text() )
	}
	
	_getState() {
		return this._fetch('state', {
			method: 'GET'
		})
			.then(result => {
				this._state = {};				
				result.split('\n').map( line => {
					line = line.split('=');
					this._state[ line[0] ] = line[1]; 
				});
			})
	}
	
	_parseResult( result ) {
		let resultObj = {};
		return resultObj;
	}
	
	get on() {
		return this._state.on === 'true';
	}
	
	set on( value ) {
		if( typeof value !== 'boolean' )
			throw new Error('Invalid type for on, expected: Boolean');
		
		this._propsChanged['on'] = value.toString();
	}
	
	get brightness() {
		return parseInt(this._state.brightness) / 255;
	}
	
	set brightness( value ) {
		if( typeof value !== 'number' )
			throw new Error('Invalid type for brightness, expected: Number');
		
		this._propsChanged['brightness'] = Math.ceil(value * 255).toString();
	}
	
	get effect() {
		return this._state.effect;
	}
	
	set effect( value ) {
		if( typeof value !== 'string' )
			throw new Error('Invalid type for brightness, expected: String');
		
		this._propsChanged['effect'] = value;
	}
	
	get mode() {
		return this._state.mode;
	}
	
	get version() {
		return parseInt(this._opts.version);
	}
	
	get name() {
		return this._state.name || this._opts.name;
	}
	
	set name( value ) {
		if( typeof value !== 'string' )
			throw new Error('Invalid type for name, expected: String');
		
		this._propsChanged['name'] = value;		
	}
	
	get pixels() {
		return parseInt(this._state.pixels) || this._opts.pixels;
	}
	
	set pixels( value ) {
		if( typeof value !== 'number' )
			throw new Error('Invalid type for pixels, expected: Number');
		
		this._propsChanged['pixels'] = value;	
	}
	
	get gradient() {
		return this._state.gradient_source.split(',').map( color => `#${color}` );
	}
	
	set gradient( value ) {
		if( !Array.isArray(value) )
			throw new Error('Invalid type for gradient, expected: Array');
			
		let gradientSource = value;			
		let gradientPixels = this._createGradient( gradientSource );
			
		this._propsChanged['gradient'] = `${gradientSource.join(',')};${gradientPixels.join(',')}`;
	}
	
	_createGradient( inputArray ) {
		if( !Array.isArray(inputArray) )
			throw new Error('Invalid type for createGradient, expected: Array');
		
		// add # to color
		inputArray = inputArray.map( color => {
			if( color.charAt(0) !== '#' ) return `#${color}`;
			return color;
		});
		
		// at least 2 colors
		if( inputArray.length === 1 )
			inputArray.push( inputArray[0] );
		
		return tinygradient(inputArray)
			.rgb(this.pixels)
			.map( color => {
				return color
					.toString('hex')
					.substring(1)
					.toUpperCase()
			})
			
	}
	
	restart() {
		return this._fetch('restart', { method: 'PUT' });
	}
	
	sync() {
		
		const promises = [];
		
		for( let key in this._propsChanged ) {
			let value = this._propsChanged[key];
			let req = this._fetch(key, {
				method: 'PUT',
				body: value
			})
			promises.push(req);
			delete this._propsChanged[key];
		}
		
		return Promise.all(promises)
			.then(() => {
				return this._getState();
			})
			.then(() => {
				return;
			})
	}
	
}

module.exports = Device;