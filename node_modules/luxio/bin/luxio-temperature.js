'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')
const util = require('..').Device;

cmd
	.option('-t, --temperature <temperature>', 'Temperature, a number between 0 (cool) and 1 (warm)')
	.parse(process.argv)
	
if( typeof cmd.temperature === 'undefined' )
	return console.error('Option `-t, --temperature` is required!')
	
helpers.getDevices().then( devices => {
	return devices.forEach( device => {
		device.colorTemperature = parseFloat(cmd.temperature);
		device.on = true;
		device.sync().then(() => {
			console.log(`Set temperature ${cmd.temperature} to device ${device.name}`)
		}).catch( err => {
			console.error(`Could not set temperature ${cmd.temperature} to device ${device.name}`)			
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);