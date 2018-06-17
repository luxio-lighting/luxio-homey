#!/usr/bin/env node

const pkg = require('../package.json');
const cmd = require('commander');

cmd
	.version( pkg.version )
	.command('discover', 'Discover all Luxio devices on your network')
	.command('state', 'Get the state')
	.command('on', 'Turn on')
	.command('off', 'Turn off')
	.command('brightness', 'Set the brightness')
	.command('gradient', 'Set a gradient')
	.command('effect', 'Set an effect')
	.command('temperature', 'Set a color temperature')
	.command('name', 'Set the name')
	.command('pixels', 'Set the pixel count')
	.command('get-wifi', 'Get a list of Wi-Fi networks')
	.command('set-wifi', 'Set the Wi-Fi network')
	.command('restart', 'Restart a Luxio device')
	.parse(process.argv)