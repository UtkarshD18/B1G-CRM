const BaseChannelAdapter = require('../BaseChannelAdapter');

class WhatsAppQRAdapter extends BaseChannelAdapter {
  static get providerMetadata() {
    return {
      channel_type: "whatsapp_qr",
      name: "WhatsApp QR Node (Baileys)",
      providerVersion: "1.0.0",
      apiVersion: "Baileys v6.7.16",
      description: "Connect WhatsApp QR session using Baileys library",
      helpUrl: "https://github.com/WhiskeySockets/Baileys",
      capabilities: {
        text: true,
        image: true,
        audio: true,
        video: true,
        document: true,
        typingIndicator: true,
        readReceipts: true
      },
      healthCheckIntervalMs: 60000, // 1 minute
      credentialFields: [
        { key: "session_name", label: "Session Name", type: "text", required: true, helpText: "Unique label for this device" },
        { key: "local_session_path", label: "Local Session Path", type: "text", required: false, helpText: "Optional folder path for auth files" }
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
      return { success: true, msg: "Mock QR connection successful!" };
    }
    // Sandbox or Production: check Baileys session
    try {
      const { getSession } = require("../../addon/qr/index.js");
      const session = getSession(this.config.session_name);
      if (session) {
        return { success: true, msg: "Baileys QR session connected!" };
      }
      return { success: false, msg: "Baileys session not found or inactive." };
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
    if (mode === "mock") {
      console.log(`[MOCK SEND - WhatsApp QR] Sending to ${normalizedOutgoing.recipientId}:`, normalizedOutgoing.text);
      return {
        success: true,
        provider_message_id: "mock-wa-qr-" + Math.random().toString(36).substring(7),
        timestamp: Date.now()
      };
    }

    const { getSession, formatPhone } = require("../../addon/qr/index.js");
    const session = getSession(this.config.session_name);
    if (!session) {
      throw new Error(`Baileys session not active.`);
    }

    const jid = formatPhone(normalizedOutgoing.recipientId);
    let baileysPayload = {};
    if (normalizedOutgoing.messageType === "text") {
      baileysPayload = { text: normalizedOutgoing.text || "" };
    } else {
      const att = normalizedOutgoing.attachments?.[0];
      if (att) {
        baileysPayload = {
          [normalizedOutgoing.messageType]: { url: att.url },
          caption: att.caption || ""
        };
      }
    }

    const response = await session.sendMessage(jid, baileysPayload);
    return {
      success: true,
      provider_message_id: response?.key?.id || "baileys-" + Date.now(),
      timestamp: Date.now()
    };
  }

  normalizeIncoming(payload) {
    // Normalization logic handled inside helper/addon/qr/processThings.js
    return payload;
  }
}

module.exports = WhatsAppQRAdapter;
