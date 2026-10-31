import Homey, { type DiscoveryResultMDNSSD } from 'homey';
import type LuxioDevice from './device.js';
import { presets } from './presets.js';

export default class LuxioDriver extends Homey.Driver {

  public override async onInit() {
    this.homey.flow.getActionCard('set-gradient')
      .registerRunListener(async ({ device, color1, color2, color3 }: {
        device: LuxioDevice; color1: string; color2: string; color3: string;
      }) => {
        await device.setGradient([color1, color2, color3]);
      });

    for (const kind of ['color', 'gradient', 'animation'] as const) {
      this.homey.flow.getActionCard(`set-saved-${kind}`)
        .registerRunListener(async args => {
          await (args.device as LuxioDevice).setSavedItem(kind, args[kind].id);
        })
        .getArgument(kind)
        .registerAutocompleteListener(async (query, { device }) => {
          if (!device) return [];
          const items = await (device as LuxioDevice).getSavedItems(kind);
          return items.filter(item => item.name.toLowerCase().includes(query.trim().toLowerCase()));
        });

      this.homey.flow.getActionCard(`set-preset-${kind}`)
        .registerRunListener(async args => {
          await (args.device as LuxioDevice).setPreset(kind, args[kind].id);
        })
        .getArgument(kind)
        .registerAutocompleteListener(async query => presets
          .filter(item => item.kind === kind && item.name.toLowerCase().includes(query.trim().toLowerCase()))
          .map(({ id, name }) => ({ id, name })));
    }
  }

  public override async onPairListDevices() {
    const results = this.getDiscoveryStrategy()?.getDiscoveryResults() as Record<string, DiscoveryResultMDNSSD> | undefined;
    return Object.values(results ?? {}).map(result => ({
      name: result.txt.name || result.name || 'Luxio',
      data: { id: result.id },
    }));
  }

}
