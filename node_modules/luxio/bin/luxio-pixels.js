'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.option('-p, --pixels <count>', 'Set the pixel count on the device')
	.parse(process.argv)
	
if( typeof cmd.pixels === 'undefined' )
	return console.error('Option `-p, --pixels` is required!')
	
helpers.getDevices({ unique: true }).then( devices => {
	return devices.forEach( device => {
		device.pixels = parseInt(cmd.pixels);
		device.sync().then(() => {
			console.log(`Set device ${device.name} pixel count to ${device.pixels}`)
		}).catch( err => {
			console.error(`Could not set device ${device.name} pixel count to ${device.pixels}`)			
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);