const BaseChannelAdapter = require('../BaseChannelAdapter');

class TwilioAdapter extends BaseChannelAdapter {
  static get providerMetadata() {
    return {
      channel_type: "sms",
      name: "Twilio SMS",
      providerVersion: "1.0.0",
      apiVersion: "Twilio v2010",
      description: "Send text messages globally using Twilio gateway",
      helpUrl: "https://www.twilio.com/docs/sms",
      capabilities: {
        text: true,
        image: true,
        audio: false,
        video: false,
        document: false,
        typingIndicator: false,
        readReceipts: false
      },
      healthCheckIntervalMs: 600000, // 10 minutes
      credentialFields: [
        { key: "account_sid", label: "Account SID", type: "text", required: true },
        { key: "auth_token", label: "Auth Token", type: "password", required: true, secret: true }
      ],
      settingFields: [
        { key: "mode", label: "Operation Mode", type: "select", options: ["mock", "sandbox", "production"], default: "mock" },
        { key: "from_number", label: "Twilio Phone Number", type: "text", required: true }
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
      return { success: true, msg: "Mock Twilio verification successful!" };
    }
    if (!this.config.account_sid || !this.config.auth_token) {
      return { success: false, msg: "Missing Twilio Account SID or Auth Token." };
    }

    try {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.account_sid}.json`;
      const auth = Buffer.from(`${this.config.account_sid}:${this.config.auth_token}`).toString('base64');
      const response = await fetch(url, {
        headers: { Authorization: `Basic ${auth}` }
      });
      const data = await response.json();
      if (response.status !== 200) {
        return { success: false, msg: data.message || "Twilio authorization failed." };
      }
      return { success: true, msg: "Twilio credentials verified successfully!" };
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
    if (mode === "mock" || this.config.account_sid?.startsWith("mock")) {
      console.log(`[MOCK SEND - Twilio SMS] Sending to ${normalizedOutgoing.recipientId}:`, normalizedOutgoing.text);
      return {
        success: true,
        provider_message_id: "mock-sms-" + Math.random().toString(36).substring(7),
        timestamp: Date.now()
      };
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.config.account_sid}/Messages.json`;
    const auth = Buffer.from(`${this.config.account_sid}:${this.config.auth_token}`).toString('base64');

    const params = new URLSearchParams();
    params.append("To", normalizedOutgoing.recipientId);
    params.append("From", this.settings.from_number);
    params.append("Body", normalizedOutgoing.text);

    if (normalizedOutgoing.messageType === "image" && normalizedOutgoing.attachments?.[0]?.url) {
      params.append("MediaUrl", normalizedOutgoing.attachments[0].url);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    const data = await response.json();
    if (response.status !== 200 && response.status !== 201) {
      throw new Error(data.message || "Twilio request failed");
    }

    return {
      success: true,
      provider_message_id: data.sid,
      timestamp: Date.now()
    };
  }

  normalizeIncoming(payload) {
    return {
      channel: "sms",
      senderId: payload.From,
      senderName: "SMS Sender",
      messageType: payload.NumMedia > 0 ? "image" : "text",
      text: payload.Body || "",
      attachments: payload.MediaUrl0 ? [{ type: "image", url: payload.MediaUrl0 }] : [],
      timestamp: Date.now(),
      metadata: payload
    };
  }
}

module.exports = TwilioAdapter;
