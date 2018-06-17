'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.option('-i, --id <id>', 'ID of the effect')
	.parse(process.argv)
	
if( typeof cmd.id === 'undefined' )
	return console.error('Option `-i, --id` is required!')
	
helpers.getDevices().then( devices => {
	return devices.forEach( device => {
		device.effect = cmd.id;
		device.on = true;
		device.sync().then(() => {
			console.log(`Set effect ${cmd.id} to device ${device.name}`)
		}).catch( err => {
			console.error(`Could not set effect ${cmd.id} to device ${device.name}`)			
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);