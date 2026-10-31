import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { readFile } from 'node:fs/promises';
import protobuf from 'protobufjs';
import { WebSocketServer } from 'ws';
import { schema } from '../.homeybuild/drivers/luxio/schema.js';
import { presets } from '../.homeybuild/drivers/luxio/presets.js';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'homey') return { url: new URL('./homey.mjs', import.meta.url).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
const { default: LuxioDevice } = await import('../.homeybuild/drivers/luxio/device.js');
const { default: LuxioDriver } = await import('../.homeybuild/drivers/luxio/driver.js');
const root = protobuf.parse(schema).root;
const Request = root.lookupType('luxio.Request');
const Response = root.lookupType('luxio.Response');
let server, sockets, device, state, requests, resultOverride, discovery;

beforeEach(async () => {
  requests = [];
  resultOverride = undefined;
  state = {
    deviceId: 'luxio-test', config: { stripType: 'WS2805', ledCount: 60 },
    on: true, brightness: 128, mode: 0,
    color: { red: 255, green: 0, blue: 0, white: 0, warmWhite: 0, coolWhite: 0 },
  };
  server = createServer((_req, res) => { res.writeHead(404).end(); });
  sockets = new WebSocketServer({ server, path: '/api/ws' });
  sockets.on('connection', socket => {
    socket.on('message', (data, isBinary) => {
      assert.equal(isBinary, true);
      const message = Request.toObject(Request.decode(data), { defaults: true });
      requests.push(message);
      if (message.operation === 1) { state.color = message.color; state.mode = 0; state.on = true; }
      if (message.operation === 2) state.brightness = message.brightness;
      if (message.operation === 15) state.on = message.on;
      if ([10, 31].includes(message.operation)) { state.mode = 2; state.on = true; }
      if ([17, 23].includes(message.operation)) { state.mode = 1; state.on = true; }
      const result = resultOverride ? resultOverride(message) : { id: message.id, state };
      if (result) socket.send(Response.encode(result).finish());
    });
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  discovery = { id: 'luxio-test', address: '127.0.0.1', port: server.address().port, name: 'Desk', txt: {} };
  device = new LuxioDevice();
  await device.onInit();
});

afterEach(async () => {
  device?.onDeleted();
  for (const socket of sockets.clients) socket.terminate();
  await new Promise(resolve => sockets.close(resolve));
  await new Promise(resolve => server.close(resolve));
});

test('pairs mDNS devices by stable ID and connects using the advertised port', async () => {
  const driver = new LuxioDriver();
  driver.getDiscoveryStrategy = () => ({ getDiscoveryResults: () => ({ first: discovery }) });
  assert.deepEqual(await driver.onPairListDevices(), [{ name: 'Desk', data: { id: 'luxio-test' } }]);
  assert.equal(device.onDiscoveryResult(discovery), true);
  assert.equal(device.onDiscoveryResult({ id: 'someone-else' }), false);
  await device.onDiscoveryAvailable(discovery);
  assert.equal(device.getAvailable(), true);
  assert.equal(device.getCapabilityValue('onoff'), true);
  assert.equal(device.getCapabilityValue('dim'), 0.5);
});

test('adds and removes both white capabilities as the configured strip changes', async () => {
  await device.onDiscoveryAvailable(discovery);
  for (const strip of ['WS2812', 'WS2814', 'SK6812', 'WS2811', 'WS2805', 'WS2815']) {
    state.config.stripType = strip;
    const received = once(device.socket, 'message');
    for (const socket of sockets.clients) socket.send(Response.encode({ id: 0, state }).finish());
    await received;
    await device.incomingQueue;
    const white = ['WS2805', 'WS2814', 'SK6812'].includes(strip);
    assert.equal(device.hasCapability('light_mode'), white, strip);
    assert.equal(device.hasCapability('light_temperature'), white, strip);
    if (white) assert.ok(device.listeners.has('light_temperature'));
  }
});

test('power, dim, HSV and native CCT commands map to the firmware channels', async () => {
  await device.onDiscoveryAvailable(discovery);
  await device.listeners.get('onoff')(false);
  assert.equal(state.on, false);
  await device.listeners.get('dim')(0.25);
  assert.equal(state.brightness, 64);
  assert.equal(state.on, true);
  await device.listeners.get('dim')(0);
  assert.equal(state.brightness, 64);
  assert.equal(state.on, false);
  await device.multipleListener({ light_hue: 1 / 3, light_saturation: 1 });
  assert.deepEqual(state.color, { red: 0, green: 255, blue: 0, white: 0, warmWhite: 0, coolWhite: 0 });
  await device.listeners.get('light_temperature')(1);
  assert.equal(state.color.warmWhite, 255);
  assert.equal(state.color.coolWhite, 0);
  assert.equal(device.getCapabilityValue('light_mode'), 'temperature');
  await device.listeners.get('light_temperature')(0);
  assert.equal(state.color.coolWhite, 255);
  assert.equal(state.color.warmWhite, 0);
  await device.listeners.get('light_mode')('color');
  assert.equal(state.color.green, 255);
  assert.equal(state.color.coolWhite, 0);
});

test('RGBW temperature uses RGB plus white and survives updates and restart', async () => {
  for (const strip of ['WS2814', 'SK6812']) {
    state.config.stripType = strip;
    await device.onDiscoveryAvailable(discovery);
    for (const temperature of [0, 0.1, 0.25, 0.5, 0.7, 0.9, 1]) {
      await device.listeners.get('light_temperature')(temperature);
      assert.equal(state.color.warmWhite + state.color.coolWhite, 0);
      assert.ok(state.color.white > 0);
      if (temperature < 0.5) assert.ok(state.color.blue > state.color.red);
      if (temperature > 0.5) assert.ok(state.color.red > state.color.blue);
      if (temperature === 0.5) assert.equal(state.color.white, 255);
      const restarted = new LuxioDevice();
      try {
        await restarted.onInit();
        await restarted.onDiscoveryAvailable(discovery);
        assert.equal(restarted.getCapabilityValue('light_mode'), 'temperature');
        assert.ok(Math.abs(restarted.getCapabilityValue('light_temperature') - temperature) < 0.01);
      } finally { restarted.onUninit(); }
    }
  }
});

test('manual gradient, all preset kinds and saved kinds use their own operations', async () => {
  await device.onDiscoveryAvailable(discovery);
  await device.setGradient(['#ff0000', '00ff00', '#0000FF']);
  assert.equal(requests.at(-1).operation, 17);
  assert.deepEqual(requests.at(-1).gradient.colors.map(c => [c.red, c.green, c.blue]), [[255, 0, 0], [0, 255, 0], [0, 0, 255]]);
  await assert.rejects(device.setGradient(['bad', '#ffffff', '#000000']), /six-digit/);
  for (const [kind, operation, field] of [['color', 30, 'colorId'], ['gradient', 23, 'gradientId'], ['animation', 10, 'scriptId']]) {
    await device.setSavedItem(kind, 'saved-id');
    assert.equal(requests.at(-1).operation, operation);
    assert.equal(requests.at(-1)[field], 'saved-id');
  }
  for (const [kind, operation] of [['color', 1], ['gradient', 17], ['animation', 31]]) {
    const preset = presets.find(item => item.kind === kind);
    await device.setPreset(kind, preset.id);
    assert.equal(requests.at(-1).operation, operation);
    if (kind === 'animation') assert.equal(requests.at(-1).script.source, preset.source);
    await assert.rejects(device.setPreset(kind, 'missing'), /Unknown/);
  }
});

test('saved libraries use one request even when firmware reports more entries', async () => {
  await device.onDiscoveryAvailable(discovery);
  for (const [kind, operation, key, next] of [
    ['color', 25, 'colors', 'nextColorOffset'],
    ['gradient', 18, 'gradients', 'nextGradientOffset'],
    ['animation', 5, 'scripts', 'nextScriptOffset'],
  ]) {
    resultOverride = message => {
      assert.equal(message.operation, operation);
      return { id: message.id, [key]: [{ id: '1', name: 'Evening' }], [next]: 64 };
    };
    const before = requests.length;
    assert.deepEqual(await device.getSavedItems(kind), [{ id: '1', name: 'Evening' }]);
    assert.equal(requests.length, before + 1);
  }
});

test('six separate Flow cards filter their own catalogs and dispatch the selection', async () => {
  const cards = new Map();
  const driver = new LuxioDriver();
  driver.homey = { flow: { getActionCard(id) {
    const card = {
      registerRunListener(listener) { this.run = listener; return this; },
      getArgument(name) { this.argument = name; return this; },
      registerAutocompleteListener(listener) { this.autocomplete = listener; return this; },
    };
    cards.set(id, card);
    return card;
  } } };
  await driver.onInit();
  const flow = JSON.parse(await readFile(new URL('../drivers/luxio/driver.flow.compose.json', import.meta.url)));
  assert.deepEqual([...cards.keys()].sort(), flow.actions.map(action => action.id).sort());
  for (const kind of ['color', 'gradient', 'animation']) {
    const saved = cards.get(`set-saved-${kind}`);
    const preset = cards.get(`set-preset-${kind}`);
    assert.equal(saved.argument, kind);
    assert.equal(preset.argument, kind);
    const calls = [];
    const selected = {
      async getSavedItems(actualKind) { assert.equal(actualKind, kind); return [{ id: '1', name: 'Evening' }, { id: '2', name: 'Morning' }]; },
      async setSavedItem(...args) { calls.push(['saved', ...args]); },
      async setPreset(...args) { calls.push(['preset', ...args]); },
    };
    assert.deepEqual(await saved.autocomplete('  EVEN ', { device: selected }), [{ id: '1', name: 'Evening' }]);
    assert.deepEqual(await saved.autocomplete('', {}), []);
    const first = presets.find(item => item.kind === kind);
    const found = await preset.autocomplete(first.name.toUpperCase(), {});
    assert.ok(found.some(item => item.id === first.id));
    assert.ok(found.every(item => item.name.toLowerCase().includes(first.name.toLowerCase())));
    assert.deepEqual(await preset.autocomplete('no-such-preset', {}), []);
    await saved.run({ device: selected, [kind]: { id: '1' } });
    await preset.run({ device: selected, [kind]: { id: first.id } });
    assert.deepEqual(calls, [['saved', kind, '1'], ['preset', kind, first.id]]);
  }
});

test('reports command errors without disconnecting and rejects a different device identity', async () => {
  await device.onDiscoveryAvailable(discovery);
  resultOverride = message => ({ id: message.id, error: 'Saved animation not found' });
  await assert.rejects(device.setSavedItem('animation', 'missing'), /not found/);
  assert.equal(device.getAvailable(), true);
  const socket = device.socket;
  state.deviceId = 'different-device';
  resultOverride = message => ({ id: message.id, state });
  await assert.rejects(device.setSavedItem('animation', 'id'), /identity/);
  await device.incomingQueue;
  assert.equal(device.getAvailable(), false);
  assert.notEqual(device.socket, socket);
});

test('uses pushed state immediately without sending another GET_STATE', async () => {
  await device.onDiscoveryAvailable(discovery);
  const before = requests.length;
  state.on = false;
  state.brightness = 32;
  state.color = { red: 0, green: 0, blue: 255 };
  const received = once(device.socket, 'message');
  for (const socket of sockets.clients) socket.send(Response.encode({ id: 0, state }).finish());
  await received;
  await device.incomingQueue;
  assert.equal(device.getCapabilityValue('onoff'), false);
  assert.equal(device.getCapabilityValue('dim'), 0.125);
  assert.ok(Math.abs(device.getCapabilityValue('light_hue') - 2 / 3) < 1e-10);
  await device.onDiscoveryLastSeenChanged(discovery);
  assert.equal(requests.length, before);
  assert.equal(sockets.clients.size, 1);
});

test('reconnects automatically after eviction and refreshes state once', async () => {
  device.homey.setTimeout = (callback, ms) => setTimeout(callback, ms === 1000 ? 10 : ms);
  await device.onDiscoveryAvailable(discovery);
  const old = device.socket;
  const reconnected = once(sockets, 'connection');
  for (const socket of sockets.clients) socket.close();
  await once(old, 'close');
  await device.incomingQueue;
  assert.equal(device.getAvailable(), false);
  state.brightness = 256;
  await reconnected;
  await device.connectionPromise;
  assert.equal(device.getAvailable(), true);
  assert.equal(device.getCapabilityValue('dim'), 1);
  assert.notEqual(device.socket, old);
  assert.equal(requests.filter(request => request.operation === 0).length, 2);
});

test('moves to a changed discovery address and closes the old socket', async () => {
  await device.onDiscoveryAvailable(discovery);
  const old = device.socket;
  const oldClosed = once(old, 'close');
  const replacement = new WebSocketServer({ port: 0, host: '127.0.0.1' });
  replacement.on('connection', socket => socket.on('message', data => {
    const message = Request.decode(data);
    socket.send(Response.encode({ id: message.id, state: { ...state, brightness: 64 } }).finish());
  }));
  await once(replacement, 'listening');
  try {
    await device.onDiscoveryLastSeenChanged({ ...discovery, port: replacement.address().port });
    await oldClosed;
    assert.equal(device.getCapabilityValue('dim'), 0.25);
    assert.equal(device.getAvailable(), true);
    assert.notEqual(device.socket, old);
  } finally {
    device.onDeleted();
    for (const socket of replacement.clients) socket.terminate();
    await new Promise(resolve => replacement.close(resolve));
  }
});

test('push messages do not resolve requests, and later pushes win over command responses', async () => {
  await device.onDiscoveryAvailable(discovery);
  resultOverride = () => undefined;
  const pending = device.setSavedItem('animation', 'id');
  const peer = [...sockets.clients][0];
  await once(peer, 'message');
  const id = requests.at(-1).id;
  let settled = false;
  void pending.then(() => { settled = true; });
  const received = once(device.socket, 'message');
  peer.send(Response.encode({ id: 0, state: { ...state, brightness: 32 } }).finish());
  await received;
  await device.incomingQueue;
  assert.equal(settled, false);
  const finalReceived = new Promise(resolve => device.socket.on('message', data => {
    if (Response.decode(data).state?.brightness === 256) resolve();
  }));
  peer.send(Response.encode({ id, state: { ...state, brightness: 64 } }).finish());
  peer.send(Response.encode({ id: 0, state: { ...state, brightness: 256 } }).finish());
  await pending;
  await finalReceived;
  await device.incomingQueue;
  assert.equal(device.getCapabilityValue('dim'), 1);
});

test('bounds request timeouts and rejects requests when the socket closes', async () => {
  device.homey.setTimeout = (callback, ms) => setTimeout(callback, ms === 10000 ? 20 : ms);
  await device.onDiscoveryAvailable(discovery);
  resultOverride = () => undefined;
  await assert.rejects(device.setSavedItem('animation', 'id'), /timed out/);
  await device.incomingQueue;
  assert.equal(device.getAvailable(), false);
  assert.equal(device.pendingRequests.size, 0);
  resultOverride = undefined;
  await device.onDiscoveryLastSeenChanged(discovery);
  resultOverride = () => undefined;
  const peer = [...sockets.clients].find(socket => socket.readyState === 1);
  const pending = device.setSavedItem('color', 'id');
  const rejected = assert.rejects(pending, /disconnected/);
  await once(peer, 'message');
  peer.terminate();
  await rejected;
});

test('heartbeat detects a silent connection without polling state', async () => {
  let heartbeat;
  device.homey.setInterval = callback => { heartbeat = callback; return setInterval(() => {}, 30000); };
  await device.onDiscoveryAvailable(discovery);
  const peer = [...sockets.clients][0];
  const pong = once(device.socket, 'pong');
  heartbeat();
  await pong;
  assert.equal(requests.length, 1);
  peer._autoPong = false;
  heartbeat();
  heartbeat();
  await device.incomingQueue;
  assert.equal(device.getAvailable(), false);
  assert.match(device.unavailableMessage, /heartbeat/);
});

test('malformed messages and mismatched replies close the connection', async () => {
  await device.onDiscoveryAvailable(discovery);
  resultOverride = message => ({ id: message.id + 1 });
  await assert.rejects(device.setSavedItem('color', 'id'), /mismatched/);
  await device.incomingQueue;
  assert.equal(device.getAvailable(), false);
  resultOverride = undefined;
  await device.onDiscoveryLastSeenChanged(discovery);
  const socket = device.socket;
  const closed = once(socket, 'close');
  for (const peer of sockets.clients) peer.send('invalid text');
  await closed;
  await device.incomingQueue;
  assert.equal(device.getAvailable(), false);
});

test('deletion clears heartbeat and reconnect timers and rejects pending work', async () => {
  await device.onDiscoveryAvailable(discovery);
  const timer = device.heartbeatTimer;
  resultOverride = () => undefined;
  const pending = device.setSavedItem('color', 'id');
  const rejected = assert.rejects(pending, /stopped/);
  await once([...sockets.clients][0], 'message');
  device.onDeleted();
  await rejected;
  assert.equal(timer._destroyed, true);
  assert.equal(device.socket, undefined);
  assert.equal(device.reconnectTimer, undefined);
  await assert.rejects(device.setSavedItem('color', 'id'), /not connected/);
});

test('gradient state displays its first RGB, CCT or RGBW color', async () => {
  await device.onDiscoveryAvailable(discovery);
  for (const [stripType, first, hue, temperature, mode] of [
    ['WS2812', { green: 255 }, 1 / 3, undefined, undefined],
    ['WS2805', { warmWhite: 255 }, undefined, 1, 'temperature'],
    ['SK6812', { red: 155, green: 90, white: 100 }, undefined, 1, 'temperature'],
    ['WS2805', { blue: 255 }, 2 / 3, undefined, 'color'],
  ]) {
    state.config.stripType = stripType;
    state.mode = 1;
    state.gradient = { colors: [first, { red: 255 }] };
    const received = once(device.socket, 'message');
    for (const socket of sockets.clients) socket.send(Response.encode({ id: 0, state }).finish());
    await received;
    await device.incomingQueue;
    if (hue !== undefined) {
      assert.ok(Math.abs(device.getCapabilityValue('light_hue') - hue) < 1e-10);
      assert.equal(device.getCapabilityValue('light_saturation'), 1);
    }
    if (temperature !== undefined) assert.equal(device.getCapabilityValue('light_temperature'), temperature);
    if (mode !== undefined) assert.equal(device.getCapabilityValue('light_mode'), mode);
  }
});

test('animations clear color controls while preserving power and dim, then restore on a solid color', async () => {
  await device.onDiscoveryAvailable(discovery);
  for (const stripType of ['WS2805', 'SK6812', 'WS2812']) {
    state.config.stripType = stripType;
    state.mode = 2;
    state.on = false;
    state.brightness = 64;
    const received = once(device.socket, 'message');
    for (const socket of sockets.clients) socket.send(Response.encode({ id: 0, state }).finish());
    await received;
    await device.incomingQueue;
    for (const capability of ['light_hue', 'light_saturation', 'light_temperature', 'light_mode']) {
      if (device.hasCapability(capability)) assert.equal(device.getCapabilityValue(capability), null);
    }
    assert.equal(device.getCapabilityValue('onoff'), false);
    assert.equal(device.getCapabilityValue('dim'), 0.25);
    await device.multipleListener({ light_hue: 1 / 3, light_saturation: 1 });
    assert.ok(Math.abs(device.getCapabilityValue('light_hue') - 1 / 3) < 1e-10);
    assert.equal(device.getCapabilityValue('light_saturation'), 1);
    if (device.hasCapability('light_mode')) {
      assert.equal(device.getCapabilityValue('light_mode'), 'color');
      await device.listeners.get('light_temperature')(1);
      assert.equal(device.getCapabilityValue('light_temperature'), 1);
      assert.equal(device.getCapabilityValue('light_mode'), 'temperature');
    }
  }
});
