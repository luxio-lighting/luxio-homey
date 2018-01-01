# Luxio

This is a JavaScript library to find and control [Luxio](http://www.luxio.lighting) Wi-Fi LED Strips.

## Installation

### Node.js
```
$ npm install luxio
```

### Browser

Using a Script tag:

```html
<script type="text/javascript" src="./dist/luxio.js"></script>
```

## Usage

### Node.js

```javascript
const Discovery = require('luxio').Discovery;
const discovery = new Discovery();

discovery.getDevices()
	.then( devices => {
		devices.forEach( async device => {
			
			await device.sync();
			
			// print the state
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
			
			// set on, brightness and a gradient
			device.on = true;
			device.brightness = 1;
			device.gradient = [ '#FF0000', '#0000FF' ];
			//device.effect = 'rainbow';
			
			await device.sync();
			
		});
	})
	.catch( console.error );
```

### Browser

```html
<script type="text/javascript">
var Discovery = Luxio.Discovery;
var discovery = new Discovery();
	
discovery.getDevices()
	.then( devices => {
		devices.forEach( device => {
			
			device.sync().then(() => {
			
				// print the state
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
				
				// set on, brightness and a gradient
				device.on = true;
				device.brightness = 1;
				device.gradient = [ '#FF0000', '#0000FF' ];
				//device.effect = 'rainbow';
				
				device.sync()
					.then( console.log )
					.catch( console.error )
			
			})
			.catch( console.error )
			
		});
	})
	.catch( console.error )
</script>
```