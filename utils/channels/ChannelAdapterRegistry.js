class ChannelAdapterRegistry {
  constructor() {
    this.adapters = new Map();
    this.registerCoreAdapters();
  }

  register(type, adapterClass) {
    this.adapters.set(type.toLowerCase(), adapterClass);
  }

  getAdapterClass(type) {
    return this.adapters.get(type.toLowerCase());
  }

  getAllMetadata() {
    return Array.from(this.adapters.values()).map(ac => ac.providerMetadata);
  }

  registerCoreAdapters() {
    // Statically register core adapters
    this.register("whatsapp_cloud", require("./adapters/WhatsAppCloudAdapter"));
    this.register("whatsapp_qr", require("./adapters/WhatsAppQRAdapter"));
    this.register("instagram", require("./adapters/InstagramAdapter"));
    this.register("messenger", require("./adapters/MessengerAdapter"));
    this.register("email", require("./adapters/SMTPAdapter"));
    this.register("sms", require("./adapters/TwilioAdapter"));
    this.register("webchat", require("./adapters/WebChatAdapter"));
  }
}

const registry = new ChannelAdapterRegistry();
module.exports = registry;
