'use strict';

const cmd = require('commander')
const timeago = require('timeago.js');
const Table = require('cli-table');
const chalk = require('chalk');
const Discovery = require('..').Discovery;

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
			'Connectivity',
		].map(str => chalk.cyan(str))
	});
	
	devices.forEach( device => { 
		table.push([
			device.id,
			device.name,
			device.version,
			device.address,
			device.pixels,
			timeago().format(device.lastseen),
			device.connectivity,
		].map(prop => {
			if( typeof prop === 'undefined' )
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