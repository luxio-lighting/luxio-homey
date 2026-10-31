import Homey from 'homey';

export default class MyDriver extends Homey.Driver {

  public override async onInit() {
    this.log('MyDriver has been initialized');

    this.homey.flow.getActionCard('set-gradient')
      .registerRunListener(async ({ device, color1, color2, color3 }, state) => {
        this.log('Set Gradient action triggered with args:', { device, color1, color2, color3 });
        // TODO
      });

    this.homey.flow.getActionCard('set-animation')
      .registerRunListener(async ({ device, animation }, state) => {
        this.log('Set Animation action triggered with args:', { device, animation });
        // TODO
      })
      .getArgument('animation')
      .registerAutocompleteListener(async query => {
        // TODO
      });
  }

  public override async onPairListDevices() {
    return [
      // TODO
    ];
  }

}
