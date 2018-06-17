'use strict';

const cmd = require('commander')
const Table = require('cli-table');
const chalk = require('chalk');
const helpers = require('./helpers.js')

cmd
	.option('-s, --ssid <ssid>', 'SSID of the Wi-Fi Network')
	.option('-p, --pass <pass>', 'Password of the Wi-Fi Network')
	.parse(process.argv)
	
if( typeof cmd.ssid === 'undefined' )
	return console.error('Option `-s, --ssid` is required!')
	
if( typeof cmd.ssid === 'undefined' )
	return console.error('Option `-p, --pass` is required!')
	
helpers.getDevices({
	sync: false,
	unique: true
}).then( devices => {
	return devices.forEach( device => {
		device.setWifiNetwork({
			ssid: cmd.ssid,
			pass: cmd.pass
		}).then(() => {
			console.log(`Set device ${device.id} Wi-Fi to ${cmd.ssid}`)
		}).catch( err => {
			console.error(`Could not set device network`);
			console.error( err.message || err.toString() )
		})
	})
}).catch(console.error);