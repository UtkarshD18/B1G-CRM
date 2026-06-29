class BaseChannelAdapter {
  constructor(uid, config, settings) {
    this.uid = uid;
    this.config = config || {};     // Decrypted credentials
    this.settings = settings || {}; // Settings (e.g., Mode, Allowed Domains)
    this.circuitState = "CLOSED";    // "CLOSED", "OPEN", "HALF_OPEN"
    this.failureCount = 0;
  }

  // Feature Negotiation Check
  supports(capability) {
    const caps = this.constructor.providerMetadata.capabilities;
    return !!caps[capability];
  }

  // Retry Policy
  get retryPolicy() {
    return {
      maxAttempts: 5,
      initialDelayMs: 1000,
      backoff: "exponential",
      retryableStatusCodes: [408, 429, 500, 502, 503, 504]
    };
  }

  // Rate Limiting Parameters
  get limits() {
    return {
      requestsPerMinute: 60,
      burst: 10
    };
  }

  // Core Adapter Methods to override
  async connect() { throw new Error("connect() Not implemented"); }
  async disconnect() { throw new Error("disconnect() Not implemented"); }
  async verify() { throw new Error("verify() Not implemented"); }
  async healthCheck() { throw new Error("healthCheck() Not implemented"); }
  async send(normalizedOutgoing) { throw new Error("send() Not implemented"); }
  async receive(payload) { throw new Error("receive() Not implemented"); }
  
  normalizeIncoming(payload) { throw new Error("normalizeIncoming() Not implemented"); }
  normalizeOutgoing(payload) { throw new Error("normalizeOutgoing() Not implemented"); }

  // Lifecycle Hooks
  async beforeConnect() {}
  async afterConnect() {}
  async beforeSend(outgoingMsg) {}
  async afterSend(outgoingMsg, result) {}
  async beforeReceive(payload) {}
  async afterReceive(payload, normalizedMsg) {}
  async beforeDisconnect() {}
  async afterDisconnect() {}
}

module.exports = BaseChannelAdapter;
