'use strict';

const cmd = require('commander')
const timeago = require('timeago.js');
const Table = require('cli-table');
const chalk = require('chalk');
const { Discovery } = require('..');

cmd.parse(process.argv)
	
const discovery = new Discovery();
discovery.getDevices().then( devices => {
	
	let table = new Table({
		head: [
			'ID',
			'Name',
			'Version',
			'Address',
			'Pixels',
			'Last seen',
			'Wi-Fi SSID',
			'Connectivity',
		].map(str => chalk.cyan(str))
	});
	
	devices.sort((a, b) => {
		return b.lastseen - a.lastseen;
	})
	
	devices.forEach(device => { 
		table.push([
			device.id,
			device.name,
			device.version,
			device.address,
			device.pixels,
			timeago().format(device.lastseen),
			device.wifiSsid,
			device.connectivity,
		].map(prop => {
			if( typeof prop === 'undefined' || prop === null )
				return '-';
				
			try {
				return String(prop);
			} catch( err ) {
				return '-';
			}
		}))
	})
	
	console.log(table.toString());
}).catch(console.error);