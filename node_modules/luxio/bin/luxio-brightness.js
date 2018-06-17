'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.option('-b, --brightness <percentage>', 'Brightness in % [0-100]')
	.parse(process.argv)
	
if( typeof cmd.brightness === 'undefined' )
	return console.error('Option `-b, --brightness` is required!')
	
helpers.getDevices().then( devices => {
	return devices.forEach( device => {
		device.brightness = ( parseFloat(cmd.brightness) / 100 );
		device.on = true;
		device.sync().then(() => {
			console.log(`Set device ${device.name} brightness to ${cmd.brightness}%`)
		}).catch( err => {
			console.error(`Could not set device ${device.name} brightness to ${cmd.brightness}%`)			
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);