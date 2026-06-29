const BaseChannelAdapter = require('../BaseChannelAdapter');

class InstagramAdapter extends BaseChannelAdapter {
  static get providerMetadata() {
    return {
      channel_type: "instagram",
      name: "Instagram Business",
      providerVersion: "1.0.0",
      apiVersion: "Meta Graph v19.0",
      description: "Connect Instagram DMs using Meta Business Integration",
      helpUrl: "https://developers.facebook.com/docs/instagram-platform",
      capabilities: {
        text: true,
        image: true,
        audio: true,
        video: true,
        document: false,
        typingIndicator: true,
        readReceipts: true
      },
      healthCheckIntervalMs: 300000,
      credentialFields: [
        { key: "instagram_business_account_id", label: "Instagram Business ID", type: "text", required: true },
        { key: "access_token", label: "Access Token", type: "password", required: true, secret: true },
        { key: "username", label: "Username", type: "text", required: true },
        { key: "app_id", label: "App ID", type: "text", required: false }
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
      return { success: true, msg: "Mock Instagram connection successful!" };
    }
    if (!this.config.access_token || !this.config.instagram_business_account_id) {
      return { success: false, msg: "Missing access token or Business ID." };
    }
    try {
      const url = `https://graph.facebook.com/v19.0/${this.config.instagram_business_account_id}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.config.access_token}` }
      });
      const data = await response.json();
      if (data.error) {
        return { success: false, msg: data.error.message };
      }
      return { success: true, msg: "Instagram credentials verified successfully!" };
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
    if (mode === "mock" || this.config.access_token?.startsWith("mock_")) {
      console.log(`[MOCK SEND - Instagram] Sending to ${normalizedOutgoing.recipientId}:`, normalizedOutgoing.text);
      return {
        success: true,
        provider_message_id: "mock-instagram-" + Math.random().toString(36).substring(7),
        timestamp: Date.now()
      };
    }

    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${this.config.access_token}`;
    let messagePayload = {};
    if (normalizedOutgoing.messageType === "text") {
      messagePayload = { text: normalizedOutgoing.text };
    } else {
      const att = normalizedOutgoing.attachments?.[0];
      if (att) {
        messagePayload = {
          attachment: {
            type: normalizedOutgoing.messageType === "document" ? "file" : normalizedOutgoing.messageType,
            payload: { url: att.url }
          }
        };
      }
    }

    const payload = {
      recipient: { id: normalizedOutgoing.recipientId },
      message: messagePayload
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return {
      success: true,
      provider_message_id: data.message_id,
      timestamp: Date.now()
    };
  }

  normalizeIncoming(payload) {
    const entry = payload?.entry?.[0];
    const messaging = entry?.messaging?.[0];
    const message = messaging?.message;
    if (!message) return null;

    let type = "text";
    let text = message.text || "";
    const attachments = [];

    if (message.attachments && message.attachments.length > 0) {
      const att = message.attachments[0];
      type = att.type;
      attachments.push({
        type: att.type,
        url: att.payload?.url,
        caption: message.text || ""
      });
    }

    return {
      channel: "instagram",
      senderId: messaging.sender?.id,
      senderName: "Instagram Contact",
      messageType: type,
      text: text,
      attachments: attachments,
      timestamp: Date.now(),
      metadata: payload
    };
  }
}

module.exports = InstagramAdapter;
