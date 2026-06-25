const BaseChannelAdapter = require('../BaseChannelAdapter');
const nodemailer = require('nodemailer');

class SMTPAdapter extends BaseChannelAdapter {
  static get providerMetadata() {
    return {
      channel_type: "email",
      name: "SMTP Email Server",
      providerVersion: "1.0.0",
      apiVersion: "Nodemailer v6.9",
      description: "Send outbound emails using tenant SMTP configuration",
      helpUrl: "https://nodemailer.com",
      capabilities: {
        text: true,
        image: true,
        audio: false,
        video: false,
        document: true,
        typingIndicator: false,
        readReceipts: false
      },
      healthCheckIntervalMs: 900000, // 15 minutes
      credentialFields: [
        { key: "host", label: "SMTP Host", type: "text", required: true, helpText: "e.g. smtp.gmail.com" },
        { key: "port", label: "SMTP Port", type: "number", required: true, helpText: "e.g. 587 or 465" },
        { key: "username", label: "Username", type: "text", required: true, helpText: "Email account name" },
        { key: "password", label: "Password", type: "password", required: true, secret: true }
      ],
      settingFields: [
        { key: "mode", label: "Operation Mode", type: "select", options: ["mock", "sandbox", "production"], default: "mock" },
        { key: "from_email", label: "From Email Address", type: "text", required: true, helpText: "Visible sender address" },
        { key: "encryption", label: "Encryption", type: "select", options: ["tls", "ssl", "none"], default: "tls" }
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
      return { success: true, msg: "Mock SMTP verification successful!" };
    }
    if (!this.config.host || !this.config.port || !this.config.username) {
      return { success: false, msg: "Missing host, port, or credentials." };
    }

    try {
      const transporter = nodemailer.createTransport({
        host: this.config.host,
        port: parseInt(this.config.port),
        secure: this.settings.encryption === "ssl",
        auth: {
          user: this.config.username,
          pass: this.config.password
        },
        connectionTimeout: 5000
      });
      await transporter.verify();
      return { success: true, msg: "SMTP Server connection verified successfully!" };
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
    if (mode === "mock" || this.config.host?.startsWith("mock")) {
      console.log(`[MOCK SEND - Email] Sending to ${normalizedOutgoing.recipientId}:`, normalizedOutgoing.text);
      return {
        success: true,
        provider_message_id: "mock-email-" + Math.random().toString(36).substring(7),
        timestamp: Date.now()
      };
    }

    const transporter = nodemailer.createTransport({
      host: this.config.host,
      port: parseInt(this.config.port),
      secure: this.settings.encryption === "ssl",
      auth: {
        user: this.config.username,
        pass: this.config.password
      }
    });

    const mailOptions = {
      from: this.settings.from_email || this.config.username,
      to: normalizedOutgoing.recipientId,
      subject: normalizedOutgoing.metadata?.subject || "New Message from B1GCRM",
      text: normalizedOutgoing.text
    };

    if (normalizedOutgoing.attachments && normalizedOutgoing.attachments.length > 0) {
      mailOptions.attachments = normalizedOutgoing.attachments.map(att => ({
        path: att.url,
        filename: att.caption || undefined
      }));
    }

    const info = await transporter.sendMail(mailOptions);
    return {
      success: true,
      provider_message_id: info.messageId,
      timestamp: Date.now()
    };
  }

  normalizeIncoming(payload) {
    // Normalization of incoming raw email webhook or parsed email structure
    return {
      channel: "email",
      senderId: payload.from?.address || payload.from || "unknown@domain.com",
      senderName: payload.from?.name || "Email Sender",
      messageType: "text",
      text: payload.text || payload.body || "",
      attachments: (payload.attachments || []).map(att => ({
        type: "document",
        url: att.url || att.path,
        caption: att.filename
      })),
      timestamp: Date.now(),
      metadata: payload
    };
  }
}

module.exports = SMTPAdapter;
