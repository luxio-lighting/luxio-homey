'use strict';

const cmd = require('commander')
const helpers = require('./helpers.js')

cmd
	.option('-c, --colors <colors>', 'Colors, seperated by a comma, e.g. FF0000,00FF00,0000FF')
	.parse(process.argv)
	
if( typeof cmd.colors === 'undefined' )
	return console.error('Option `-c, --colors` is required!')
	
helpers.getDevices().then( devices => {
	return devices.forEach( device => {
		let gradient = cmd.colors.split(',');
		device.gradient = gradient;
		device.on = true;
		device.sync().then(() => {
			console.log(`Set gradient ${gradient} to device ${device.name}`)
		}).catch( err => {
			console.error(`Could not set gradient ${gradient} to device ${device.name}`)			
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);