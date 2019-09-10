'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.option('-n, --name <name>', 'Rename the device')
	.parse(process.argv)
	
const {
  name,
} = cmd;
	
if( typeof name === 'undefined' )
	return console.error('Option `-n, --name` is required!')
	
helpers.getDevices({ unique: true }).then( devices => {
	return devices.forEach( device => {
  	const oldname = device.name;
		device.name = name;
		device.sync().then(() => {
			console.log(`Set device ${oldname} name to ${name}`)
		}).catch( err => {
			console.error(`Could not set device ${oldname} name to ${name}`)			
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);