'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.parse(process.argv)
	
helpers.getDevices({ sync: false }).then( devices => {
	return devices.forEach( device => {
		device.on = true;
		device.sync().then(() => {
			console.log(`Turned device ${device.name} on`)
		}).catch( err => {
			console.error(`Could not turn device ${device.name} on`)			
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);