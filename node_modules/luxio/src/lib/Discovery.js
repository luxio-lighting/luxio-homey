'use strict';

const { nupnpAddress, apAddress, minimumVersion } = require('../config');
const { fetch, timeoutRace } = require('../util');

const Device = require('./Device.js');

class Discovery {
	
	constructor() {
		this._devices = {};
	}
	
	async getDevices({ ap = true, nupnp = true, timeout } = {}) {
		const deviceIds = [];
		return Promise.all([
  		ap && this._getAPDevices({ timeout }),
  		nupnp && this._getNupnpDevices({ timeout }),
		]).then(results => {
			return [].concat(...results).filter(device => {
				if( deviceIds.includes(device.id) ) return false;
				deviceIds.push(device.id);
				return true;
			}).map(device => {
				this._onDevice(device);
				return device;
			}).map(device => {
				return this._devices[device.id];
			});
		})
	}
	
	_onDevice( device ) {
		const { id, address } = device;
		if( this._devices[id] ) {
			this._devices[id].address = address;
		} else {
			this._devices[id] = device;
		}
	}
	
	async _getAPDevices({ timeout = 2500 } = {}) {
		try {
			const req = fetch(`http://${apAddress}/state`, { timeout });
			const res = await timeoutRace(req, timeout);
			if( !res.ok )
				throw new Error('unknown_error');
			
			const json = await res.json();
			if( json.version < minimumVersion )
				return [];
				
			const device = new Device(json.id, {
				...json,
				type: 'luxio',
				address: apAddress,
				lastseen: new Date(),
			});
			return [ device ];
		} catch( err ) {
			return [];
		}
	}
	
	async _getNupnpDevices({ timeout = 2500 } = {}) {
		try {
  		const req = fetch(nupnpAddress);
			const res = await timeoutRace(req, timeout);
			if( !res.ok )
				throw new Error('unknown_error');
			
  		const devices = await res.json();
  		
  		return Object.keys(devices).filter(deviceId => {
  			const device = devices[deviceId];
  			if( device.version < minimumVersion ) return false;
  			return true;
  		}).map(deviceId => {
  			const device = devices[deviceId];
  			device.lastseen = new Date(device.lastseen);
  			return new Device(deviceId, {
    			...device,
    			lastseen: new Date(device.lastseen),
  			});
  		})
		} catch( err ) {
  		return [];
		}
	}
	
}

module.exports = Discovery;