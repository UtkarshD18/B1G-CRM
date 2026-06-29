const EventEmitter = require('events');

class ChannelEventBus extends EventEmitter {}

const eventBus = new ChannelEventBus();

module.exports = eventBus;
