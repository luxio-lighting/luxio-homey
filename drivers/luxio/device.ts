import Homey, { type DiscoveryResultMDNSSD } from 'homey';
import protobuf from 'protobufjs';
import WebSocket from 'ws';
import { schema } from './schema.js';
import { presets } from './presets.js';

const protocol = protobuf.parse(schema).root;
const RequestMessage = protocol.lookupType('luxio.Request');
const ResponseMessage = protocol.lookupType('luxio.Response');
const operations = protocol.lookupEnum('luxio.Operation').values;

interface Color {
  red: number; green: number; blue: number;
  white: number; warmWhite: number; coolWhite: number;
}

interface State {
  deviceId: string;
  config: { stripType: string; ledCount: number };
  on: boolean;
  brightness: number;
  mode: number;
  color: Color;
  gradient?: { colors: Color[] };
}

interface Response {
  id: number;
  error: string;
  state?: State;
  scripts: { id: string; name: string }[];
  gradients: { id: string; name: string }[];
  colors: { id: string; name: string }[];
}

export default class LuxioDevice extends Homey.Device {
  private address?: string;
  private state?: State;
  private requestId = 0;
  private queue: Promise<unknown> = Promise.resolve();
  private socket?: WebSocket;
  private connectionPromise?: Promise<void>;
  private incomingQueue: Promise<void> = Promise.resolve();
  private pendingRequests = new Map<number, {
    resolve: (response: Response) => void;
    reject: (error: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>();
  private reconnectTimer?: ReturnType<typeof setTimeout>;
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private reconnectDelay = 1000;
  private stopped = false;

  public override async onInit() {
    this.registerCapabilityListener('onoff', async (on: boolean) => {
      await this.request({ operation: operations.SET_POWER, on });
    });
    this.registerCapabilityListener('dim', async (dim: number) => {
      if (dim === 0) {
        await this.request({ operation: operations.SET_POWER, on: false });
      } else {
        await this.request({ operation: operations.SET_BRIGHTNESS, brightness: Math.max(1, Math.round(dim * 256)) });
        await this.request({ operation: operations.SET_POWER, on: true });
      }
    });
    this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], async values => {
      await this.setLight(values);
    }, 100);
    // Existing devices can already have these capabilities when the app restarts.
    if (this.hasCapability('light_mode')) {
      this.registerCapabilityListener('light_mode', async light_mode => this.setLight({ light_mode }));
    }
    if (this.hasCapability('light_temperature')) {
      this.registerCapabilityListener('light_temperature', async light_temperature => this.setLight({ light_temperature }));
    }
  }

  public override onDiscoveryResult(result: DiscoveryResultMDNSSD) {
    return result.id === this.getData().id;
  }

  public override async onDiscoveryAvailable(result: DiscoveryResultMDNSSD) {
    await this.onDiscoveryAddressChanged(result);
  }

  public override async onDiscoveryAddressChanged(result: DiscoveryResultMDNSSD) {
    const host = result.address.includes(':') ? `[${result.address}]` : result.address;
    const address = `ws://${host}:${result.port || 80}/api/ws`;
    if (address !== this.address) {
      this.address = address;
      this.disconnect(new Error('Luxio address changed'));
    }
    await this.connect();
  }

  public override async onDiscoveryLastSeenChanged(result: DiscoveryResultMDNSSD) {
    await this.onDiscoveryAddressChanged(result);
  }

  private connect(): Promise<void> {
    if (this.stopped || !this.address) return Promise.reject(new Error('Luxio has not been discovered'));
    if (this.connectionPromise) return this.connectionPromise;
    if (this.reconnectTimer) this.homey.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    const socket = new WebSocket(this.address, {
      handshakeTimeout: 10000, maxPayload: 32768, perMessageDeflate: false,
    });
    this.socket = socket;
    this.connectionPromise = new Promise<void>((resolve, reject) => {
      socket.once('open', () => {
        let alive = true;
        socket.on('pong', () => { alive = true; });
        this.heartbeatTimer = this.homey.setInterval(() => {
          if (!alive) {
            this.disconnect(new Error('Luxio WebSocket heartbeat timed out'), socket);
            return;
          }
          alive = false;
          socket.ping();
        }, 30000);
        // Firmware only broadcasts changes, so explicitly fetch state once per connection.
        void this.request({ operation: operations.GET_STATE }).then(response => {
          if (!response.state) throw new Error('Luxio did not return its state');
          if (this.socket !== socket || this.stopped) throw new Error('Luxio connection changed');
          this.reconnectDelay = 1000;
          resolve();
        }).catch(error => {
          this.disconnect(error, socket);
          reject(error);
        });
      });
      socket.on('message', (data, isBinary) => {
        // Process replies and pushed state in wire order, independently of the command queue.
        this.incomingQueue = this.incomingQueue.then(async () => {
          if (this.socket !== socket || this.stopped) return;
          if (!isBinary) throw new Error('Luxio sent a non-binary WebSocket message');
          const bytes = Array.isArray(data) ? Buffer.concat(data) : Buffer.from(data as ArrayBuffer);
          const result = ResponseMessage.toObject(ResponseMessage.decode(bytes), { defaults: true }) as Response;
          const pending = this.pendingRequests.get(result.id);
          if (result.id !== 0 && !pending) throw new Error('Luxio returned a mismatched request ID');
          if (result.state) {
            if (result.state.deviceId !== this.getData().id) throw new Error('Luxio device identity changed');
            await this.updateState(result.state);
            if (this.socket !== socket || this.stopped) return;
            await this.setAvailable();
          }
          if (pending) {
            this.homey.clearTimeout(pending.timer);
            this.pendingRequests.delete(result.id);
            if (result.error) pending.reject(new Error(result.error));
            else pending.resolve(result);
          } else if (result.error) {
            this.error(new Error(result.error));
          }
        }).catch(error => {
          this.error(error);
          this.disconnect(error, socket);
        });
      });
      socket.on('error', error => {
        this.disconnect(error, socket);
        reject(error);
      });
      socket.once('close', () => {
        const error = new Error('Luxio WebSocket disconnected');
        this.disconnect(error, socket);
        reject(error);
      });
    });
    return this.connectionPromise;
  }

  private disconnect(error: Error, socket = this.socket) {
    if (!socket || this.socket !== socket) return;
    this.socket = undefined;
    this.connectionPromise = undefined;
    if (this.heartbeatTimer) this.homey.clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = undefined;
    socket.terminate();
    for (const pending of this.pendingRequests.values()) {
      this.homey.clearTimeout(pending.timer);
      pending.reject(error);
    }
    this.pendingRequests.clear();
    this.incomingQueue = this.incomingQueue.then(async () => {
      if (!this.stopped && !this.socket) await this.setUnavailable(error.message);
    }).catch(error => this.error(error));
    if (!this.stopped) {
      this.reconnectTimer = this.homey.setTimeout(() => {
        this.reconnectTimer = undefined;
        void this.connect().catch(error => this.error(error));
      }, this.reconnectDelay);
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000);
    }
  }

  private request(command: Record<string, unknown>): Promise<Response> {
    const socket = this.socket;
    const pending = this.queue.then(async () => {
      if (this.stopped || !socket || socket !== this.socket || socket.readyState !== WebSocket.OPEN) {
        throw new Error('Luxio is not connected');
      }
      const id = this.requestId = (this.requestId % 0xffffffff) + 1;
      const message = { ...command, id };
      const error = RequestMessage.verify(message);
      if (error) throw new Error(error);
      const body = RequestMessage.encode(message).finish();
      if (body.length > 32768) throw new Error('Luxio request exceeds 32 KiB');
      return new Promise<Response>((resolve, reject) => {
        const timer = this.homey.setTimeout(() => {
          this.disconnect(new Error('Luxio request timed out'), socket);
        }, 10000);
        this.pendingRequests.set(id, { resolve, reject, timer });
        socket.send(body, { binary: true }, error => {
          if (error) this.disconnect(error, socket);
        });
      });
    });
    this.queue = pending.catch(() => undefined);
    return pending;
  }

  private async updateState(state: State) {
    this.state = state;
    const white = ['WS2805', 'WS2814', 'SK6812'].includes(state.config.stripType);
    const cct = state.config.stripType === 'WS2805';
    for (const capability of ['light_mode', 'light_temperature']) {
      const supported = white;
      if (supported && !this.hasCapability(capability)) {
        await this.addCapability(capability);
        this.registerCapabilityListener(capability, async value => this.setLight({ [capability]: value }));
      } else if (!supported && this.hasCapability(capability)) {
        await this.removeCapability(capability);
      }
    }
    await this.setCapabilityValue('onoff', state.on);
    await this.setCapabilityValue('dim', state.brightness / 256);
    const color = state.mode === 1 ? state.gradient?.colors[0] : state.color;
    if (state.mode === 2 || !color) {
      for (const capability of ['light_hue', 'light_saturation', 'light_temperature', 'light_mode']) {
        if (this.hasCapability(capability)) await this.setCapabilityValue(capability, null);
      }
      return;
    }
    const { red, green, blue, warmWhite, coolWhite } = color;
    // Recognize the RGB tint produced by setLight, including after app restarts.
    const rgbwTemperature = red > 0 ? 0.5 + red / 310 : 0.5 - blue / 110;
    const rgbwWhite = !cct && color.white > 0 && rgbwTemperature >= 0 && rgbwTemperature <= 1
      && (red > 0
        ? blue === 0 && Math.abs(green - red * 90 / 155) <= 1 && Math.abs(color.white + red - 255) <= 1
        : Math.abs(green - blue * 30 / 55) <= 1 && Math.abs(color.white + blue - 255) <= 1);
    const isWhite = rgbwWhite || (red === 0 && green === 0 && blue === 0
      && (color.white > 0 || warmWhite > 0 || coolWhite > 0));
    if (white) await this.setCapabilityValue('light_mode', isWhite ? 'temperature' : 'color');
    if (cct && warmWhite + coolWhite > 0) {
      // Homey runs from cool (0) to warm (1).
      await this.setCapabilityValue('light_temperature', warmWhite / (warmWhite + coolWhite));
    } else if (white && !cct && isWhite) {
      await this.setCapabilityValue('light_temperature', rgbwTemperature);
    }
    // Keep the last chosen hue/saturation while displaying white light.
    if (!isWhite) {
      const max = Math.max(red, green, blue);
      const min = Math.min(red, green, blue);
      const delta = max - min;
      if (delta > 0) {
        const hue = max === red ? (green - blue) / delta
          : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
        await this.setCapabilityValue('light_hue', ((hue / 6) + 1) % 1);
      }
      await this.setCapabilityValue('light_saturation', max === 0 ? 0 : delta / max);
    }
  }

  private async setLight(values: Record<string, number | string>) {
    const color: Color = { red: 0, green: 0, blue: 0, white: 0, warmWhite: 0, coolWhite: 0 };
    const mode = values.light_mode ?? (values.light_temperature !== undefined ? 'temperature'
      : values.light_hue !== undefined || values.light_saturation !== undefined ? 'color'
        : this.getCapabilityValue('light_mode'));
    if (mode === 'temperature') {
      const temperature = Number(values.light_temperature ?? this.getCapabilityValue('light_temperature') ?? 0.5);
      if (this.state?.config.stripType === 'WS2805') {
        color.warmWhite = Math.round(temperature * 255);
        color.coolWhite = 255 - color.warmWhite;
      } else if (['WS2814', 'SK6812'].includes(this.state?.config.stripType ?? '')) {
        // Mix RGB with the white LED: neutral at 0.5, blue tint at 0, amber at 1.
        // Extract the neutral component into W to preserve output across the slider.
        if (temperature >= 0.5) {
          color.red = Math.round((temperature - 0.5) * 310);
          color.green = Math.round((temperature - 0.5) * 180);
          color.white = 255 - color.red;
        } else {
          color.blue = Math.round((0.5 - temperature) * 110);
          color.green = Math.round((0.5 - temperature) * 60);
          color.white = 255 - color.blue;
        }
      } else {
        throw new Error('This strip does not have a white channel');
      }
    } else {
      const hue = Number(values.light_hue ?? this.getCapabilityValue('light_hue') ?? 0);
      const saturation = Number(values.light_saturation ?? this.getCapabilityValue('light_saturation') ?? 1);
      const h = (hue % 1) * 6;
      const chroma = saturation * 255;
      const x = chroma * (1 - Math.abs(h % 2 - 1));
      const rgb = h < 1 ? [chroma, x, 0] : h < 2 ? [x, chroma, 0] : h < 3 ? [0, chroma, x]
        : h < 4 ? [0, x, chroma] : h < 5 ? [x, 0, chroma] : [chroma, 0, x];
      [color.red, color.green, color.blue] = rgb.map(channel => Math.round(channel + 255 - chroma));
    }
    await this.request({ operation: operations.SET_COLOR, color });
  }

  public async setGradient(hexes: string[]) {
    const colors = hexes.map(value => {
      const hex = value.trim().replace(/^#/, '');
      if (!/^[a-f\d]{6}$/i.test(hex)) throw new Error('Use a six-digit hex color');
      return { red: parseInt(hex.slice(0, 2), 16), green: parseInt(hex.slice(2, 4), 16), blue: parseInt(hex.slice(4, 6), 16) };
    });
    await this.request({ operation: operations.SET_GRADIENT, gradient: { colors } });
  }

  public async getSavedItems(kind: 'color' | 'gradient' | 'animation') {
    const operation = kind === 'color' ? operations.LIST_COLORS : kind === 'gradient' ? operations.LIST_GRADIENTS : operations.LIST_SCRIPTS;
    const response = await this.request({ operation });
    const items = kind === 'color' ? response.colors : kind === 'gradient' ? response.gradients : response.scripts;
    return items.map(({ id, name }) => ({ id, name }));
  }

  public async setSavedItem(kind: 'color' | 'gradient' | 'animation', id: string) {
    if (!id) throw new Error(`Select a saved ${kind}`);
    if (kind === 'color') await this.request({ operation: operations.RUN_COLOR, colorId: id });
    if (kind === 'gradient') await this.request({ operation: operations.RUN_GRADIENT, gradientId: id });
    if (kind === 'animation') await this.request({ operation: operations.RUN_SCRIPT, scriptId: id });
  }

  public async setPreset(kind: 'color' | 'gradient' | 'animation', id: string) {
    const preset = presets.find(item => item.id === id && item.kind === kind);
    if (!preset) throw new Error(`Unknown Luxio ${kind} preset`);
    if (preset.kind === 'color') await this.request({ operation: operations.SET_COLOR, color: preset.color });
    if (preset.kind === 'gradient') await this.request({ operation: operations.SET_GRADIENT, gradient: { colors: preset.colors } });
    if (preset.kind === 'animation') {
      await this.request({ operation: operations.SET_SCRIPT, script: { name: preset.name, source: preset.source, mode: 2 } });
    }
  }

  public override onUninit() {
    this.stopped = true;
    if (this.reconnectTimer) this.homey.clearTimeout(this.reconnectTimer);
    this.reconnectTimer = undefined;
    this.disconnect(new Error('Luxio device stopped'));
  }

  public override onDeleted() {
    this.onUninit();
  }
}
