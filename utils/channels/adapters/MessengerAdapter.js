const BaseChannelAdapter = require('../BaseChannelAdapter');

class MessengerAdapter extends BaseChannelAdapter {
  static get providerMetadata() {
    return {
      channel_type: "messenger",
      name: "Meta Messenger",
      providerVersion: "1.0.0",
      apiVersion: "Meta Graph v19.0",
      description: "Connect Meta Messenger page for direct messaging",
      helpUrl: "https://developers.facebook.com/docs/messenger-platform",
      capabilities: {
        text: true,
        image: true,
        audio: true,
        video: true,
        document: true,
        typingIndicator: true,
        readReceipts: true
      },
      healthCheckIntervalMs: 300000,
      credentialFields: [
        { key: "page_id", label: "Page ID", type: "text", required: true },
        { key: "access_token", label: "Page Access Token", type: "password", required: true, secret: true },
        { key: "app_id", label: "App ID", type: "text", required: false },
        { key: "verify_token", label: "Verify Token", type: "text", required: true }
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
      return { success: true, msg: "Mock Messenger connection successful!" };
    }
    if (!this.config.access_token || !this.config.page_id) {
      return { success: false, msg: "Missing access token or Page ID." };
    }
    try {
      const url = `https://graph.facebook.com/v19.0/${this.config.page_id}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${this.config.access_token}` }
      });
      const data = await response.json();
      if (data.error) {
        return { success: false, msg: data.error.message };
      }
      return { success: true, msg: "Messenger credentials verified successfully!" };
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
      console.log(`[MOCK SEND - Messenger] Sending to ${normalizedOutgoing.recipientId}:`, normalizedOutgoing.text);
      return {
        success: true,
        provider_message_id: "mock-messenger-" + Math.random().toString(36).substring(7),
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
      channel: "messenger",
      senderId: messaging.sender?.id,
      senderName: "Messenger Contact",
      messageType: type,
      text: text,
      attachments: attachments,
      timestamp: Date.now(),
      metadata: payload
    };
  }
}

module.exports = MessengerAdapter;
