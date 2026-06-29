const BaseChannelAdapter = require('../BaseChannelAdapter');

class WebChatAdapter extends BaseChannelAdapter {
  static get providerMetadata() {
    return {
      channel_type: "webchat",
      name: "Website Live Chat Widget",
      providerVersion: "1.0.0",
      apiVersion: "WebSockets v1",
      description: "Embeddable live chat widget for websites",
      helpUrl: "/user/chat-widget",
      capabilities: {
        text: true,
        image: true,
        audio: false,
        video: false,
        document: true,
        typingIndicator: true,
        readReceipts: true
      },
      healthCheckIntervalMs: 60000, // 1 minute
      credentialFields: [
        { key: "widget_key", label: "Widget Key", type: "text", required: true, helpText: "Unique identifier for the embedded script" }
      ],
      settingFields: [
        { key: "mode", label: "Operation Mode", type: "select", options: ["mock", "sandbox", "production"], default: "mock" },
        { key: "allowed_domains", label: "Allowed Domains (JSON array)", type: "text", required: false, helpText: 'e.g. ["mywebsite.com"]' },
        { key: "welcome_message", label: "Welcome Message", type: "text", default: "Hello! How can we help you today?" },
        { key: "theme_color", label: "Theme Color (HEX)", type: "text", default: "#4f46e5" }
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
    // Web chat widget relies on public socket connection, always considered ready or warning if widget key is missing
    if (!this.config.widget_key) {
      return { success: false, msg: "Missing widget key setting." };
    }
    return { success: true, msg: "Web chat widget is active and ready." };
  }

  async healthCheck() {
    const res = await this.verify();
    return res.success;
  }

  async send(normalizedOutgoing) {
    const mode = this.settings.mode || "mock";
    console.log(`[SEND - WebChat] Sending message to socket session ${normalizedOutgoing.recipientId}:`, normalizedOutgoing.text);

    // Emit live WebSocket event if user is active, otherwise mock dispatch
    try {
      const io = require('../../socket.js').getIOInstance?.();
      if (io) {
        io.to(`room_${normalizedOutgoing.recipientId}`).emit("push_new_msg", {
          msg: normalizedOutgoing,
          chatId: normalizedOutgoing.recipientId
        });
      }
    } catch (e) {
      console.warn("WebSocket IO instance check skipped:", e.message);
    }

    return {
      success: true,
      provider_message_id: "webchat-msg-" + Date.now(),
      timestamp: Date.now()
    };
  }

  normalizeIncoming(payload) {
    return {
      channel: "webchat",
      senderId: payload.senderId || payload.chatId,
      senderName: payload.senderName || "Web visitor",
      messageType: payload.messageType || "text",
      text: payload.text || "",
      attachments: payload.attachments || [],
      timestamp: Date.now(),
      metadata: payload
    };
  }
}

module.exports = WebChatAdapter;
