'use strict';

const cmd = require('commander')
const Table = require('cli-table');
const chalk = require('chalk');
const helpers = require('./helpers.js')

cmd
	.parse(process.argv)
	
helpers.getDevices({
	sync: false,
	unique: true
}).then( devices => {
	return devices.forEach( device => {
		device.getWifiNetworks().then(networks => {
			console.log('');
			console.log(chalk.bold.white(` ${device.name} `));
			
			let table = new Table({
				head: [
					'SSID',
					'RSSI',
					'Security',
				].map(str => chalk.cyan(str))
			});
			
			networks.forEach(network => {
				table.push([
					network.ssid,
					network.rssi,
					(typeof network.security !== 'undefined') ? network.security ? network.security : 'open' : '-',
				]);
			});
			
			console.log(table.toString());
			
		}).catch( err => {
			console.error(`Could not get device networks`);
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);