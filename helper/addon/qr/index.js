const fs = require("fs");
const path = require("path");
const pino = require("pino");
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, getUrlInfo, downloadMediaMessage, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { toDataURL } = require("qrcode");
const { query } = require("../../../database/dbpromise");

const sessions = new Map();

const isSessionExists = (uniqueId) => {
  return sessions.has(uniqueId) || fs.existsSync(path.join(__dirname, "../../../sessions", `auth-${uniqueId}`));
};

const createSession = async (uniqueId, title = "Session") => {
  if (sessions.has(uniqueId)) {
    return sessions.get(uniqueId);
  }

  const sessionPath = path.join(__dirname, "../../../sessions", `auth-${uniqueId}`);
  
  try {
    const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
    
    let version = [2, 3000, 1017539710];
    try {
      const latest = await fetchLatestBaileysVersion();
      if (latest && latest.version) {
        version = latest.version;
        console.log(`[Baileys] Using latest WhatsApp Web version: ${version.join(".")}`);
      }
    } catch (e) {
      console.log(`[Baileys] Failed to fetch latest version, using fallback: ${version.join(".")}`);
    }

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: "silent" }),
      printQRInTerminal: false,
      version,
    });

    sessions.set(uniqueId, sock);

    sock.ev.on("creds.update", saveCreds);

    sock.ev.on("messages.upsert", async (m) => {
      const { messages, type } = m;
      for (const msg of messages) {
        if (!msg.message) continue;
        try {
          const [instance] = await query("SELECT uid FROM instance WHERE uniqueId = ?", [uniqueId]);
          if (instance) {
            const { processMessage } = require("../../inbox/inbox");
            await processMessage({
              body: msg,
              uid: instance.uid,
              origin: "qr",
              getSession,
              sessionId: uniqueId,
              qrType: type,
            });
          }
        } catch (err) {
          console.error(`[Baileys] Error processing upsert message:`, err);
        }
      }
    });

    sock.ev.on("messages.update", async (updates) => {
      for (const update of updates) {
        try {
          const [instance] = await query("SELECT uid FROM instance WHERE uniqueId = ?", [uniqueId]);
          if (instance) {
            const { processMessage } = require("../../inbox/inbox");
            await processMessage({
              body: update,
              uid: instance.uid,
              origin: "qr",
              getSession,
              sessionId: uniqueId,
              qrType: "update",
            });
          }
        } catch (err) {
          console.error(`[Baileys] Error processing message update:`, err);
        }
      }
    });

    sock.ev.on("connection.update", async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          const qrDataUrl = await toDataURL(qr);
          await query("UPDATE instance SET status = ?, other = ? WHERE uniqueId = ?", [
            "SCAN_QR",
            JSON.stringify({ qr: qrDataUrl }),
            uniqueId,
          ]);
          console.log(`[Baileys] QR code generated for session ${uniqueId}`);
        } catch (qrErr) {
          console.error(`[Baileys] QR generation error:`, qrErr);
        }
      }

      if (connection === "open") {
        await query("UPDATE instance SET status = ? WHERE uniqueId = ?", [
          "CONNECTED",
          uniqueId,
        ]);
        console.log(`[Baileys] Session ${uniqueId} connected successfully!`);
      }

      if (connection === "close") {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.log(`[Baileys] Session ${uniqueId} closed. Error:`, lastDisconnect?.error, `Reconnecting: ${shouldReconnect}`);
        
        if (shouldReconnect) {
          sessions.delete(uniqueId);
          createSession(uniqueId, title);
        } else {
          sessions.delete(uniqueId);
          try {
            fs.rmSync(sessionPath, { recursive: true, force: true });
          } catch {}
          await query("UPDATE instance SET status = ? WHERE uniqueId = ?", [
            "INACTIVE",
            uniqueId,
          ]);
        }
      }
    });

    return sock;
  } catch (err) {
    console.error(`[Baileys] Failed to create session ${uniqueId}:`, err);
    throw err;
  }
};

const getSession = (uniqueId) => {
  return sessions.get(uniqueId) || null;
};

const deleteSession = async (uniqueId) => {
  const sock = sessions.get(uniqueId);
  if (sock) {
    try {
      sock.end();
    } catch {}
    sessions.delete(uniqueId);
  }
  
  const sessionPath = path.join(__dirname, "../../../sessions", `auth-${uniqueId}`);
  try {
    fs.rmSync(sessionPath, { recursive: true, force: true });
  } catch {}
};

const getChatList = () => [];

const isExists = async (uniqueId, jid) => {
  const sock = getSession(uniqueId);
  if (!sock) return false;
  try {
    const [result] = await sock.onKeysExist([jid]);
    return !!result;
  } catch {
    return false;
  }
};

const sendMessage = async (uniqueId, to, content) => {
  const sock = getSession(uniqueId);
  if (!sock) throw new Error("No active session for instance");
  return sock.sendMessage(to, content);
};

const formatPhone = (phone) => {
  let clean = phone.replace(/\D/g, "");
  if (!clean.endsWith("@s.whatsapp.net")) {
    clean = `${clean}@s.whatsapp.net`;
  }
  return clean;
};

const formatGroup = (group) => {
  let clean = group.replace(/\D/g, "");
  if (!clean.endsWith("@g.us")) {
    clean = `${clean}@g.us`;
  }
  return clean;
};

const cleanup = () => {
  for (const [uniqueId] of sessions) {
    sessions.delete(uniqueId);
  }
};

const init = async () => {
  try {
    const instances = await query("SELECT uniqueId, title FROM instance WHERE status = 'CONNECTED'");
    for (const inst of instances) {
      console.log(`[Baileys] Auto-initializing active session: ${inst.uniqueId}`);
      createSession(inst.uniqueId, inst.title);
    }
  } catch (err) {
    console.error(`[Baileys] Auto-init failed:`, err);
  }
};

const getGroupData = async () => {};
const replaceWithRandom = (inputText) => inputText;
const checkQr = () => false;

module.exports = {
  isSessionExists,
  createSession,
  getSession,
  deleteSession,
  getChatList,
  isExists,
  sendMessage,
  formatPhone,
  formatGroup,
  cleanup,
  init,
  getGroupData,
  getUrlInfo,
  downloadMediaMessage,
  replaceWithRandom,
  checkQr,
};
