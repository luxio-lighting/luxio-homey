#!/usr/bin/env node

const pkg = require('../package.json');
const cmd = require('commander');

cmd
	.version( pkg.version )
	
	// List devices
	.command('devices', 'List Luxio devices on your network')
	
	// Device state
	.command('on', 'Turn on')
	.command('off', 'Turn off')
	.command('brightness', 'Set the brightness')
	.command('gradient', 'Set a gradient')
	.command('effect', 'Set an effect')
	.command('temperature', 'Set a color temperature')
	
	// Device settings
	.command('set-name', 'Set the name')
	.command('set-pixels', 'Set the pixel count')
	.command('get-wifi', 'Get a list of Wi-Fi networks')
	.command('set-wifi', 'Set the Wi-Fi network')
	
	// System
	.command('state', 'Get the state')
	.command('restart', 'Restart a Luxio device')
	
	.parse(process.argv)