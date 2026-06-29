const BaseChannelAdapter = require('../BaseChannelAdapter');

class WhatsAppCloudAdapter extends BaseChannelAdapter {
  static get providerMetadata() {
    return {
      channel_type: "whatsapp_cloud",
      name: "Meta WhatsApp Cloud API",
      providerVersion: "1.0.0",
      apiVersion: "Meta v23.0",
      description: "Connect WhatsApp using Meta's Cloud API",
      helpUrl: "https://developers.facebook.com/docs/whatsapp/cloud-api",
      capabilities: {
        text: true,
        image: true,
        audio: true,
        video: true,
        document: true,
        typingIndicator: false,
        readReceipts: true
      },
      healthCheckIntervalMs: 300000, // 5 minutes
      credentialFields: [
        { key: "phone_number_id", label: "Phone Number ID", type: "text", required: true, helpText: "From your Meta App settings" },
        { key: "business_account_id", label: "Business Account ID", type: "text", required: true, helpText: "From your Meta Business Account" },
        { key: "access_token", label: "Access Token", type: "password", required: true, secret: true, helpText: "Permanent Page Access Token" },
        { key: "verify_token", label: "Webhook Verify Token", type: "text", required: true, helpText: "Used to verify your webhook subscription" }
      ],
      settingFields: [
        { key: "mode", label: "Operation Mode", type: "select", options: ["mock", "sandbox", "production"], default: "mock" }
      ]
    };
  }

  async connect() {
    return true;
  }

  async disconnect() {
    return true;
  }

  async verify() {
    const mode = this.settings.mode || "mock";
    if (mode === "mock") {
      return { success: true, msg: "Mock connection verification successful!" };
    }
    // Sandbox or Production: verify tokens
    if (!this.config.access_token || !this.config.phone_number_id) {
      return { success: false, msg: "Missing access token or phone number ID." };
    }
    try {
      const url = `https://graph.facebook.com/v19.0/${this.config.phone_number_id}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.config.access_token}` }
      });
      const data = await response.json();
      if (data.error) {
        return { success: false, msg: data.error.message };
      }
      return { success: true, msg: "Meta credentials verified successfully!" };
    } catch (err) {
      return { success: false, msg: err.message };
    }
  }

  async healthCheck() {
    const res = await this.verify();
    return res.success;
  }

  async send(normalizedOutgoing) {
    const mode = this.settings.mode || "mock";
    
    // Simulate or Call SDK
    if (mode === "mock" || this.config.access_token?.startsWith("mock_")) {
      console.log(`[MOCK SEND - WhatsApp Cloud] Sending to ${normalizedOutgoing.recipientId}:`, normalizedOutgoing.text);
      return {
        success: true,
        provider_message_id: "mock-wa-cloud-" + Math.random().toString(36).substring(7),
        timestamp: Date.now()
      };
    }

    // Call Facebook Graph API
    const url = `https://graph.facebook.com/v19.0/${this.config.phone_number_id}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: normalizedOutgoing.recipientId,
      type: "text",
      text: { body: normalizedOutgoing.text }
    };

    if (normalizedOutgoing.messageType !== "text") {
      const att = normalizedOutgoing.attachments?.[0];
      if (att) {
        payload.type = normalizedOutgoing.messageType;
        payload[normalizedOutgoing.messageType] = {
          link: att.url,
          caption: att.caption || ""
        };
      }
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.config.access_token}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      success: true,
      provider_message_id: data.messages?.[0]?.id,
      timestamp: Date.now()
    };
  }

  normalizeIncoming(payload) {
    // Standard Meta WhatsApp Webhook payload normalization
    const entry = payload?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];
    const contact = value?.contacts?.[0];

    if (!message) return null;

    let type = "text";
    let text = message?.text?.body || "";
    const attachments = [];

    if (message.type && message.type !== "text") {
      type = message.type;
      const mediaObj = message[message.type];
      if (mediaObj?.id) {
        attachments.push({
          type: message.type,
          url: `media_id:${mediaObj.id}`, // Resolved later
          caption: mediaObj.caption || ""
        });
      }
    }

    return {
      channel: "whatsapp_cloud",
      senderId: message.from,
      senderName: contact?.profile?.name || message.from,
      messageType: type,
      text: text,
      attachments: attachments,
      timestamp: parseInt(message.timestamp) * 1000,
      metadata: payload
    };
  }
}

module.exports = WhatsAppCloudAdapter;
