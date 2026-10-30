const EventEmitter = require('events');

class ChannelEventBus extends EventEmitter {
  async emitAsync(eventName, payload) {
    const handlers = this.listeners(eventName);
    if (!handlers.length) throw new Error(`No handler registered for ${eventName}`);
    for (const handler of handlers) await handler(payload);
  }
}

const eventBus = new ChannelEventBus();

module.exports = eventBus;
