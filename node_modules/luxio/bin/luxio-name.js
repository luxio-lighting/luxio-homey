'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.option('-n, --newname <name>', 'Rename the device')
	.parse(process.argv)
	
if( typeof cmd.newname === 'undefined' )
	return console.error('Option `-n, --newname` is required!')
	
helpers.getDevices({ unique: true }).then( devices => {
	return devices.forEach( device => {
		device.name = cmd.newname;
		device.sync().then(() => {
			console.log(`Set device ${device.name} name to ${device.name}`)
		}).catch( err => {
			console.error(`Could not set device ${device.name} name to ${device.name}`)			
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);