'use strict';

const cmd = require('commander')
const Discovery = require('..').Discovery
const Device = require('..').Device

cmd.option('-d, --device <id>', 'ID or Name of the device. Default: "*" (all devices)')

const getDevices = async ({
	sync = true,
	unique = false,
} = {}) => {
	
	if( unique && typeof cmd.device === 'undefined'  ) {
		console.error('Option `-d, --device` is required!');
		return [];
	}	
	
	const discovery = new Discovery();
	return discovery.getDevices().then( devices => {
		if( typeof cmd.device === 'undefined' || cmd.device === '*' )
			return devices;
			
		return devices.filter( device => {
			if( device.id === cmd.device ) return true;
			if( device.name === cmd.device ) return true;
			return false;
		})
	}).then(devices => {
		if( !sync ) return devices;
		return Promise.all(devices.map(device => {
			return device.sync().catch(err => null);
		}));
	}).then(devices => {
		return devices.filter(device => {
			return device instanceof Device;
		});
	});
}

module.exports = {
	getDevices,
}