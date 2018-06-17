'use strict';

const cmd = require('commander')
const Table = require('cli-table');
const chalk = require('chalk');
const helpers = require('./helpers.js')

cmd
	.parse(process.argv)
	
helpers.getDevices().then( devices => {
	return devices.forEach( device => {
		device.sync().then(() => {
			console.log('');
			console.log(chalk.bold.white(` ${device.name} (${device.id})`));
			
			let table = new Table({
				head: [
					'On',
					'Brightness',
					'Mode',
					'Gradient',
					'Effect',
					'Wi-Fi SSID',
					'Connectivity',
				].map(str => chalk.cyan(str))
			});
			
			table.push([
				device.on ? 'Yes' : 'No',
				`${Math.round(device.brightness * 100)}%`,
				device.mode,
				device.gradient ? device.gradient.join(',') : '-',
				device.effect ? device.effect : '-',
				device.wifi.ssid,
				device.connectivity,
			])
			
			console.log(table.toString());
			
		}).catch( err => {
			console.error(`Could not get device state`);
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);