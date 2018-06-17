'use strict';

const Homey = require('homey');
const Discovery = require('luxio').Discovery;

class LuxioDriver extends Homey.Driver {
	
	onInit() {		
		this._devices = {};		
		this._discovery = new Discovery();
		
		this.refreshDevices();
		setInterval(this.refreshDevices.bind(this), 1000 * 30);
			
		new Homey.FlowCardAction('set_effect')
			.register()
			.registerRunListener(( args, state ) => {
				return args.device.setEffect( args.effect );
			})
		
	}
	
	getDevice( luxioId ) {
		return this._devices[ luxioId ];
	}
	
	refreshDevices() {		
		this._discovery.getDevices().then( devices => {
			for( let deviceId in devices ) {
				let device = devices[deviceId];
				if( typeof this._devices[deviceId] === 'undefined' ) {
					this._devices[deviceId] = device;
					this.emit(`device_${deviceId}`, device);
				}
			}
		}).catch( this.error );
	}
	
	onPairListDevices( data, callback ) {
		const devices = [];
		for( let deviceId in this._devices ) {
			let device = this._devices[ deviceId ];
			
			devices.push({
				data: {
					id: deviceId
				},
				name: device.name
			});
		}
				
		callback( null, devices );
		
	}
	
}

module.exports = LuxioDriver;