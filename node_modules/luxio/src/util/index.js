'use strict';

const tinygradient = require('tinygradient');

function createGradient({ source, pixels }) {
	if( !Array.isArray(source) )
		throw new Error('Invalid type for createGradient, expected: Array');
	
	// add # to color
	const colors = source.map( color => {
		if( color.charAt(0) !== '#' ) return `#${color}`;
		return color;
	});
	
	// at least 2 colors
	if( colors.length === 1 )
		colors.push( colors[0] );
	
	return tinygradient(colors)
		.rgb(pixels)
		.map(color => {
			return color
				.toString('hex')
				.substring(1)
				.toUpperCase()
		})
}
	
/*
	Get a color temperature, based on cool (0) or warm (1)
*/
function getColorTemperature(temperature) {
	if( temperature < 0 || temperature > 1 )
		throw new Error('Color Temperature is out of bounds');
		
	const gradient = tinygradient('#CCFBFD', '#FFFFFF', '#FFDA73').hsv(99);
	const color = gradient[Math.floor(temperature*98)];
	return color
		.toHexString()
		.substring(1) // remove #
		.toUpperCase();
}

async function msleep(timeout) {	
	return new Promise((resolve, reject) => {
		setTimeout(() => resolve(), timeout);
	})
}

async function timeoutAfter(timeout) {	
	await msleep(timeout);
	throw new Error('Timeout');
}

async function timeoutRace(promise, timeout) {
	return Promise.race([
		promise,
		timeoutAfter(timeout)
	]);
}

module.exports = {
	msleep,
	timeoutAfter,
	timeoutRace,
	createGradient,
	getColorTemperature,
}

if( typeof window !== 'undefined' ) {
	module.exports.fetch = require('./fetch.js');
} else {
	module.exports.fetch = require('node-fetch');
}