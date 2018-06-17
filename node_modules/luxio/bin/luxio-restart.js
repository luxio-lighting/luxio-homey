'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.parse(process.argv)
	
helpers.getDevices({ unique: true }).then( devices => {
	return devices.forEach( device => {
		device.restart().then(() => {
			console.log(`Device ${device.id} has been restarted`)
		}).catch( err => {
			console.error(`Could not restart device ${device.id}`)			
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);