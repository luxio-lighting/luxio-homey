export class Device {
  values = new Map(['onoff', 'dim', 'light_hue', 'light_saturation'].map(id => [id, null]));
  listeners = new Map();
  available = false;
  homey = { setTimeout, clearTimeout, setInterval, clearInterval };
  getData() { return { id: 'luxio-test' }; }
  hasCapability(id) { return this.values.has(id); }
  async addCapability(id) { this.values.set(id, null); }
  async removeCapability(id) { this.values.delete(id); this.listeners.delete(id); }
  async setCapabilityValue(id, value) {
    if (!this.hasCapability(id)) throw new Error(`Unknown capability: ${id}`);
    this.values.set(id, value);
  }
  getCapabilityValue(id) { return this.values.get(id); }
  registerCapabilityListener(id, listener) { this.listeners.set(id, listener); }
  registerMultipleCapabilityListener(ids, listener) { this.multipleListener = listener; }
  getAvailable() { return this.available; }
  async setAvailable() { this.available = true; }
  async setUnavailable(message) { this.available = false; this.unavailableMessage = message; }
  error() {}
}
export class Driver {}
export default { Device, Driver };
