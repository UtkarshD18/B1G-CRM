const fs = require("fs");
const path = require("path");
const { query } = require("../../database/dbpromise");
const fetch = require("node-fetch");
const mime = require("mime-types");
const env = require("../../env");
const { v7: uuidv7 } = require("uuid");

function mergeArraysWithPhonebook(chatArray, phonebookArray) {
  // Iterate through the chat array and enrich with phonebook data
  return chatArray.map((chat) => {
    // Find matching phonebook entry where sender_mobile matches mobile
    const phonebookEntry = phonebookArray.find(
      (phonebook) => phonebook.mobile === chat.sender_mobile
    );

    // Add phonebook data if a match is found
    return {
      ...chat,
      phonebook: phonebookEntry || null, // Add phonebook data or null if no match
    };
  });
}

function extractFileName(url) {
  try {
    const decodedUrl = decodeURIComponent(url.split("?")[0]); // Remove query params
    return decodedUrl.substring(decodedUrl.lastIndexOf("/") + 1);
  } catch (error) {
    console.error("Error extracting file name:", error.message);
    return null;
  }
}

async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Failed to fetch image: ${response.status}`);

    const buffer = await response.buffer();
    const base64Image = `data:${response.headers.get(
      "content-type"
    )};base64,${buffer.toString("base64")}`;

    return base64Image;
  } catch (error) {
    console.error("Error fetching image:", error.message);
    return null;
  }
}

function timeoutPromise(promise, ms) {
  const timeout = new Promise(
    (resolve) => setTimeout(() => resolve(null), ms) // Instead of rejecting, resolve null
  );
  return Promise.race([promise, timeout]);
}

function getSessionIdFromChatIdQr(str) {
  const index = str.indexOf("_");
  if (index === -1) return null;
  return str.substring(index + 1);
}

function extractPhoneNumber(str) {
  if (!str) return null;
  const match = str.match(/^(\d+)(?=:|\@)/);
  return match ? match[1] : null;
}

function extractFinalNumber(chatInfo) {
  try {
    const otherData = JSON.parse(chatInfo?.other);
    const number = extractPhoneNumber(otherData?.id);
    return number;
  } catch (error) {
    return null;
  }
}

function deleteMediaFromConversation(jsonFilePath, mediaFolderPath, type) {
  try {
    if (!fs.existsSync(jsonFilePath)) {
      console.error("JSON file does not exist:", jsonFilePath);
      return;
    }

    switch (type) {
      case "media":
        // Handle "media" type: Remove media-related messages and their files
        const conversationData = JSON.parse(
          fs.readFileSync(jsonFilePath, "utf8")
        );

        const filteredConversation = conversationData.filter((msg) => {
          if (["image", "video", "document", "audio"].includes(msg.type)) {
            // Collect file link to delete
            const mediaLink = msg.msgContext[msg.type]?.link;
            if (mediaLink) {
              const filePath = path.join(
                mediaFolderPath,
                mediaLink.split("/").pop()
              );
              // Delete the file
              if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                console.log(`Deleted file: ${filePath}`);
              } else {
                console.warn(`File not found: ${filePath}`);
              }
            }
            return false; // Exclude this message from the updated conversation
          }
          return true; // Include non-media messages
        });

        // Write updated conversation back to the JSON file
        fs.writeFileSync(
          jsonFilePath,
          JSON.stringify(filteredConversation, null, 2),
          "utf8"
        );
        console.log("Media messages removed, and JSON updated successfully.");
        break;

      case "clear":
        // Handle "clear" type: Clear the entire conversation JSON
        fs.writeFileSync(jsonFilePath, JSON.stringify([], null, 2), "utf8");
        console.log("Conversation JSON cleared successfully.");
        break;

      case "delete":
        // Handle "delete" type: Delete the JSON file
        fs.unlinkSync(jsonFilePath);
        console.log("Conversation JSON file deleted successfully.");
        break;

      default:
        console.error(
          "Invalid type provided. Use 'media', 'clear', or 'delete'."
        );
    }
  } catch (error) {
    console.error("Error processing conversation JSON:", error.message);
  }
}

function returnMsgObjAfterAddingKey(overrides = {}) {
  const defaultObj = {
    type: "text",
    metaChatId: "",
    msgContext: { type: "text", text: { preview_url: true, body: "hey yo" } },
    reaction: "",
    timestamp: "",
    senderName: "codeyon.com",
    senderMobile: "918430088300",
    status: "",
    star: false,
    route: "OUTGOING",
    context: "",
    origin: "meta",
    err: "",
  };

  // Merge overrides with the default object
  return { ...defaultObj, ...overrides };
}

async function sendMetaMsg({ uid, to, msgObj }) {
  try {
    if (env.MOCK_META_DELIVERY) {
      return { success: true, id: "mock-msg-id-" + Math.random().toString(36).substring(2, 15) };
    }
    
    // Check if this is a Phase 4 adapter connection first
    const [conn] = await query(
      `SELECT * FROM channel_connections WHERE uid = ? AND channel_type = 'whatsapp'`,
      [uid]
    );

    function formatNumber(number) {
      return number?.replace("+", "");
    }

    if (conn) {
      // Phase 4 Outbox logic
      const correlation_id = uuidv7();
      const channelType = 'whatsapp';
      const toNumber = formatNumber(to);

      const normalizedOutgoing = {
        channel: channelType,
        recipientId: toNumber,
        messageType: msgObj.type || "text",
        text: msgObj.text?.body || msgObj.body || "",
        attachments: []
      };

      if (msgObj.type === "image") {
        normalizedOutgoing.attachments.push({
          type: "image",
          url: msgObj.image?.link || msgObj.image?.url,
          caption: msgObj.image?.caption || ""
        });
      } else if (msgObj.type === "video") {
        normalizedOutgoing.attachments.push({
          type: "video",
          url: msgObj.video?.link || msgObj.video?.url,
          caption: msgObj.video?.caption || ""
        });
      } else if (msgObj.type === "audio") {
        normalizedOutgoing.attachments.push({
          type: "audio",
          url: msgObj.audio?.link || msgObj.audio?.url
        });
      } else if (msgObj.type === "document" || msgObj.type === "file") {
        const docUrl = msgObj.document?.link || msgObj.document?.url || msgObj.file?.link;
        normalizedOutgoing.attachments.push({
          type: "document",
          url: docUrl,
          caption: msgObj.document?.caption || ""
        });
      }

      // Enqueue to worker
      await query(
        `INSERT INTO channel_outgoing_queue (uid, channel_type, payload, state, correlation_id) 
         VALUES (?, ?, ?, 'pending', ?) RETURNING id`,
        [uid, channelType, JSON.stringify(normalizedOutgoing), correlation_id]
      );

      return { 
        success: true, 
        id: correlation_id, 
        correlation_id: correlation_id, 
        provider_message_id: null, 
        queued: true 
      };
    }

    // Legacy fallback logic
    const [api] = await query(`SELECT * FROM meta_api WHERE uid = ?`, [uid]);
    if (!api || !api?.access_token || !api?.business_phone_number_id) {
      return { success: false, msg: "Please add your meta API keys" };
    }

    const waToken = api?.access_token;
    const waNumId = api?.business_phone_number_id;

    const url = `https://graph.facebook.com/v17.0/${waNumId}/messages`;

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: formatNumber(to),
      ...msgObj,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${waToken}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data?.error) {
      return { success: false, msg: data?.error?.message };
    }

    if (data?.messages && data.messages[0]?.id) {
      const metaMsgId = data?.messages[0]?.id;
      return { success: true, id: metaMsgId };
    } else {
      return { success: false, msg: JSON.stringify(data) };
    }
  } catch (err) {
    return { success: false, msg: err?.toString() };
  }
}

function setQrMsgObj(obj) {
  if (!obj || typeof obj !== "object") return null;

  switch (obj.type) {
    case "text":
      return { text: obj.text?.body || "" };
    case "image":
      return {
        image: {
          url: obj?.image?.link,
        },
        caption: obj?.caption || null,
        jpegThumbnail: fetchImageAsBase64(obj?.image?.link),
      };

    case "video":
      return {
        video: {
          url: obj?.video?.link,
        },
        caption: obj?.caption || null,
      };

    case "audio":
      const mp3FileName = extractFileName(obj?.audio?.link);
      const mp3FilePath = `${__dirname}/../../client/public/media/${mp3FileName}`;

      return {
        audio: {
          url: mp3FilePath,
        },
        ptt: true,
        mimetype: "audio/aac",
      };

    case "document":
      return {
        document: {
          url: obj?.document?.link,
        },
        caption: obj?.caption || null,
        fileName: extractFileName(obj?.document?.link),
      };

    case "location":
      return {
        location: {
          degreesLatitude: obj?.location?.latitude,
          degreesLongitude: obj?.location?.longitude,
          name: obj?.location?.name,
        },
      };

    default:
      return null;
  }
}

async function sendQrMsg({ uid, to, msgObj, chatInfo }) {
  try {
    const sessionMobileNumber = extractFinalNumber(chatInfo);
    if (!sessionMobileNumber) {
      return {
        success: false,
        msg: "Session is not ready yet to send message please wait for few seconds and refresh the page to continue",
      };
    }

    const qrObj = setQrMsgObj(msgObj);

    if (!qrObj) {
      return { success: false, msg: "Invalid message type" };
    }

    // getting session
    const sessionId = getSessionIdFromChatIdQr(chatInfo?.chat_id);

    const {
      getSession,
      formatGroup,
      formatPhone,
    } = require("../../helper/addon/qr");

    console.log({ sessionId });

    // extracting session from local
    const session = await timeoutPromise(getSession(sessionId || "a"), 60000);
    if (!session) {
      return { success: false, msg: "Session not found locally" };
    }

    const jid = chatInfo?.isGroup ? formatGroup(to) : formatPhone(to);

    console.log({ qrObj });

    const send = await timeoutPromise(session?.sendMessage(jid, qrObj), 60000);

    const msgId = send?.key?.id;
    if (!msgId) {
      return {
        success: false,
        msg: `Could not send message: ${send?.toString()}`,
      };
    } else {
      return { success: true, id: msgId };
    }
  } catch (err) {
    console.log(err);
    return { success: false, msg: err?.toString() };
  }
}

async function sendInstagramMsg({ uid, to, msgObj }) {
  try {
    const [api] = await query(`SELECT * FROM instagram_api WHERE uid = ?`, [uid]);
    if (!api || !api?.access_token || !api?.instagram_business_account_id) {
      return { success: false, msg: "Please link your Instagram Business Account first." };
    }

    if (env.MOCK_META_DELIVERY || api.access_token.startsWith("mock_")) {
      return { success: true, id: "mock-insta-msg-id-" + Math.random().toString(36).substring(2, 15) };
    }

    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${api.access_token}`;
    
    let instagramMessagePayload = {};
    if (msgObj.type === "text") {
      instagramMessagePayload = { text: msgObj.text?.body || msgObj.body || "" };
    } else if (msgObj.type === "image") {
      instagramMessagePayload = {
        attachment: {
          type: "image",
          payload: { url: msgObj.image?.link || msgObj.image?.url }
        }
      };
    } else if (msgObj.type === "video") {
      instagramMessagePayload = {
        attachment: {
          type: "video",
          payload: { url: msgObj.video?.link || msgObj.video?.url }
        }
      };
    } else if (msgObj.type === "document" || msgObj.type === "file") {
      instagramMessagePayload = {
        attachment: {
          type: "file",
          payload: { url: msgObj.document?.link || msgObj.document?.url || msgObj.file?.link }
        }
      };
    } else {
      instagramMessagePayload = { text: JSON.stringify(msgObj) };
    }

    const payload = {
      recipient: { id: to },
      message: instagramMessagePayload
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (data?.error) {
      return { success: false, msg: data?.error?.message };
    }

    if (data?.message_id) {
      return { success: true, id: data.message_id };
    } else {
      return { success: false, msg: JSON.stringify(data) };
    }
  } catch (err) {
    return { success: false, msg: err?.toString() };
  }
}

module.exports = {
  mergeArraysWithPhonebook,
  deleteMediaFromConversation,
  returnMsgObjAfterAddingKey,
  sendMetaMsg,
  sendQrMsg,
  sendInstagramMsg,
};
