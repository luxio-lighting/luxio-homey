'use strict';

try {
	module.exports = require('./dist/js');
} catch( err ) {
	module.exports = require('./src');
}