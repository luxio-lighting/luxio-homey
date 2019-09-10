'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.option('-p, --pixels <count>', 'Set the pixel count on the device')
	.parse(process.argv)
	
const {
  pixels,
} = cmd;
	
if( typeof pixels === 'undefined' )
	return console.error('Option `-p, --pixels` is required!')
	
helpers.getDevices({ unique: true }).then( devices => {
	return devices.forEach( device => {
		device.pixels = parseInt(pixels);
		device.sync().then(() => {
			console.log(`Set device ${device.name} pixel count to ${pixels}`)
		}).catch( err => {
			console.error(`Could not set device ${device.name} pixel count to ${pixels}`)			
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);