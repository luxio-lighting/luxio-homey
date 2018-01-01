'use strict';

const Discovery = require('../../').Discovery;
const discovery = new Discovery();

discovery.getDevices()
	.then( devices => {
		devices.forEach( async device => {
			
			await device.sync();
			
			console.log('ID:', device.id);
			console.log('-- Name:', device.name);
			console.log('-- Version:', device.version);
			console.log('-- Pixels:', device.pixels);
			console.log('-- On:', device.on);
			console.log('-- Brightness:', device.brightness);
			console.log('-- Effect:', device.effect);
			console.log('-- Gradient:', device.gradient);
			console.log('-- Mode:', device.mode);
			console.log('');
			
			if( device.name === process.argv[2] ) {
				device.on = true;
				device.brightness = 1;
				device.gradient = [ '#FF0000', '#0000FF' ];
				//device.effect = 'rainbow';
				
				await device.sync();
			}
			
		});
	})
	.catch( console.error );