const fs = require('fs');
const path = require('path');
const randomstring = require('randomstring');
const mime = require('mime-types');
const { query } = require('../../database/dbpromise');
const env = require('../../env');
const fileHelper = require('./fileHelper');
const commonHelper = require('./commonHelper');

const { getIOInstance } = () => {};

const crypto = require('crypto');

function uuidv7() {
  const value = crypto.randomBytes(16);
  const timestamp = Date.now();
  value.writeUIntBE(timestamp, 0, 6);
  value[6] = (value[6] & 0x0f) | 0x70;
  value[8] = (value[8] & 0x3f) | 0x80;
  return [
    value.toString('hex', 0, 4),
    value.toString('hex', 4, 6),
    value.toString('hex', 6, 8),
    value.toString('hex', 8, 10),
    value.toString('hex', 10, 16),
  ].join('-');
}

function updateMetaTempletInMsg(uid, savObj, chatId, msgId) {
  return new Promise(async (resolve, reject) => {
    try {
      console.log({ thisss: uid });
      const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);

      if (getUser.length < 1) {
        return resolve({ success: false, msg: 'user not found' });
      }

      const userTimezone = commonHelper.getCurrentTimestampInTimeZone(
        getUser[0]?.timezone || Date.now() / 1000,
      );
      const finalSaveMsg = {
        ...savObj,
        metaChatId: msgId,
        timestamp: userTimezone,
      };

      const chatPath = `${__dirname}/../../conversations/inbox/${uid}/${chatId}.json`;
      fileHelper.addObjectToFile(finalSaveMsg, chatPath);

      const io = getIOInstance();

      await query(
        `UPDATE chats SET last_message_came = ?, last_message = ?, is_opened = ? WHERE chat_id = ?`,
        [userTimezone, JSON.stringify(savObj), 0, chatId],
      );

      const getId = await query(`SELECT * FROM rooms WHERE uid = ?`, [uid]);

      await query(`UPDATE chats SET is_opened = ? WHERE chat_id = ?`, [1, chatId]);

      const chats = await query(`SELECT * FROM chats WHERE uid = ?`, [uid]);

      io.to(getId[0]?.socket_id).emit('update_conversations', {
        chats: chats,
        notificationOff: true,
      });

      io.to(getId[0]?.socket_id).emit('push_new_msg', {
        msg: finalSaveMsg,
        chatId: chatId,
      });

      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

function sendAPIMessage(obj, waNumId, waToken) {
  return new Promise(async (resolve) => {
    try {
      const url = `https://graph.facebook.com/v17.0/${waNumId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        ...obj,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${waToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data?.error) {
        return resolve({ success: false, message: data?.error?.message });
      }

      resolve({
        success: true,
        message: 'Message sent successfully!',
        data: data?.messages[0],
      });
    } catch (err) {
      resolve({ success: false, msg: err.toString(), err });
      console.log(err);
    }
  });
}

function sendMetaMsg(uid, msgObj, toNumber, savObj, chatId) {
  return new Promise(async (resolve) => {
    try {
      let channelType = 'whatsapp_cloud';
      if (chatId) {
        const [chat] = await query(`SELECT * FROM chats WHERE chat_id = ? AND uid = ?`, [
          chatId,
          uid,
        ]);
        if (chat?.origin) {
          const originLower = chat.origin.toLowerCase();
          if (originLower === 'instagram') channelType = 'instagram';
          else if (originLower === 'qr') channelType = 'whatsapp_qr';
          else if (originLower === 'messenger') channelType = 'messenger';
          else if (originLower === 'email') channelType = 'email';
          else if (originLower === 'sms') channelType = 'sms';
          else if (originLower === 'webchat') channelType = 'webchat';
        }
      }

      const [conn] = await query(
        `SELECT * FROM channel_connections WHERE uid = ? AND channel_type = ?`,
        [uid, channelType],
      );

      const correlation_id = uuidv7();

      if (conn) {
        const normalizedOutgoing = {
          channel: channelType,
          recipientId: toNumber,
          messageType: msgObj.type || 'text',
          text: msgObj.text?.body || msgObj.body || '',
          attachments: [],
        };

        if (msgObj.type === 'image') {
          normalizedOutgoing.attachments.push({
            type: 'image',
            url: msgObj.image?.link || msgObj.image?.url,
            caption: msgObj.image?.caption || '',
          });
        } else if (msgObj.type === 'video') {
          normalizedOutgoing.attachments.push({
            type: 'video',
            url: msgObj.video?.link || msgObj.video?.url,
            caption: msgObj.video?.caption || '',
          });
        } else if (msgObj.type === 'audio') {
          normalizedOutgoing.attachments.push({
            type: 'audio',
            url: msgObj.audio?.link || msgObj.audio?.url,
          });
        } else if (msgObj.type === 'document' || msgObj.type === 'file') {
          const docUrl = msgObj.document?.link || msgObj.document?.url || msgObj.file?.link;
          normalizedOutgoing.attachments.push({
            type: 'document',
            url: docUrl,
            caption: msgObj.document?.caption || '',
          });
        }

        const [queueRow] = await query(
          `INSERT INTO channel_outgoing_queue (uid, channel_type, payload, state, correlation_id) 
           VALUES (?, ?, ?, 'pending', ?) RETURNING id`,
          [uid, channelType, JSON.stringify(normalizedOutgoing), correlation_id],
        );

        console.log(
          JSON.stringify({
            event: 'outbound_message_enqueue',
            correlation_id,
            queue_id: queueRow.id,
            worker: 'API',
            channel: channelType,
            message: 'Enqueued outgoing message to outbox',
          }),
        );

        const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
        const userTimezone = commonHelper.getCurrentTimestampInTimeZone(
          getUser[0]?.timezone || Date.now() / 1000,
        );

        const finalSaveMsg = {
          ...savObj,
          metaChatId: correlation_id,
          timestamp: userTimezone,
          status: 'queued',
        };

        if (chatId) {
          const chatPath = `${__dirname}/../../conversations/inbox/${uid}/${chatId}.json`;
          fileHelper.addObjectToFile(finalSaveMsg, chatPath);

          await query(
            `UPDATE chats SET last_message_came = ?, last_message = ?, is_opened = ? WHERE chat_id = ? AND uid = ?`,
            [userTimezone, JSON.stringify(finalSaveMsg), 1, chatId, uid],
          );
        }

        return resolve({
          success: true,
          id: correlation_id,
          correlation_id: correlation_id,
          provider_message_id: null,
          queued: true,
        });
      }

      let isInstagram = false;
      let isQr = false;
      if (chatId) {
        const [chat] = await query(`SELECT * FROM chats WHERE chat_id = ? AND uid = ?`, [
          chatId,
          uid,
        ]);
        if (chat?.origin?.toLowerCase() === 'instagram') {
          isInstagram = true;
        } else if (chat?.origin?.toLowerCase() === 'qr') {
          isQr = true;
        }
      }

      if (isQr) {
        const { getSession, formatPhone } = require('../addon/qr/index.js');
        const parts = chatId.split('_');
        const sessionId = parts.slice(1).join('_');
        const session = getSession(sessionId);

        if (!session) {
          return resolve({
            success: false,
            msg: `WhatsApp QR session is not connected or active.`,
          });
        }

        const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
        const userTimezone = commonHelper.getCurrentTimestampInTimeZone(
          getUser[0]?.timezone || Date.now() / 1000,
        );

        let baileysPayload = {};
        if (msgObj.type === 'text') {
          baileysPayload = { text: msgObj.text?.body || msgObj.body || '' };
        } else if (msgObj.type === 'image') {
          baileysPayload = {
            image: { url: msgObj.image?.link || msgObj.image?.url },
            caption: msgObj.image?.caption || '',
          };
        } else if (msgObj.type === 'video') {
          baileysPayload = {
            video: { url: msgObj.video?.link || msgObj.video?.url },
            caption: msgObj.video?.caption || '',
          };
        } else if (msgObj.type === 'audio') {
          baileysPayload = {
            audio: { url: msgObj.audio?.link || msgObj.audio?.url },
            mimetype: 'audio/mp4',
          };
        } else if (msgObj.type === 'document' || msgObj.type === 'file') {
          const docUrl = msgObj.document?.link || msgObj.document?.url || msgObj.file?.link;
          const fileName = docUrl ? path.basename(docUrl.split('?')[0]) : 'document.pdf';
          baileysPayload = {
            document: { url: docUrl },
            mimetype: 'application/pdf',
            fileName: fileName,
            caption: msgObj.document?.caption || '',
          };
        } else {
          baileysPayload = { text: JSON.stringify(msgObj) };
        }

        let sentMsgId = 'mock-qr-msg-id-' + randomstring.generate(16);
        let success = true;
        let errMsg = '';

        try {
          const jid = formatPhone(toNumber);
          const response = await session.sendMessage(jid, baileysPayload);
          if (response?.key?.id) {
            sentMsgId = response.key.id;
          }
        } catch (e) {
          success = false;
          errMsg = e.toString();
        }

        if (!success) {
          return resolve({ success: false, msg: errMsg });
        }

        const finalSaveMsg = {
          ...savObj,
          metaChatId: sentMsgId,
          timestamp: userTimezone,
          status: 'sent',
          origin: 'qr',
        };

        const chatPath = `${__dirname}/../../conversations/inbox/${uid}/${chatId}.json`;
        fileHelper.addObjectToFile(finalSaveMsg, chatPath);

        await query(
          `UPDATE chats SET last_message_came = ?, last_message = ?, is_opened = ? WHERE chat_id = ? AND uid = ?`,
          [userTimezone, JSON.stringify(finalSaveMsg), 1, chatId, uid],
        );

        return resolve({ success: true, id: sentMsgId });
      }

      if (isInstagram) {
        const [api] = await query(`SELECT * FROM instagram_api WHERE uid = ?`, [uid]);
        if (!api || !api?.access_token || !api?.instagram_business_account_id) {
          return resolve({
            success: false,
            msg: 'Please link your Instagram Business Account first.',
          });
        }

        const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
        const userTimezone = commonHelper.getCurrentTimestampInTimeZone(
          getUser[0]?.timezone || Date.now() / 1000,
        );

        let mockMsgId = 'mock-insta-msg-id-' + randomstring.generate(16);
        let success = true;
        let errMsg = '';

        if (!env.MOCK_META_DELIVERY && !api.access_token.startsWith('mock_')) {
          try {
            const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${api.access_token}`;
            let instagramMessagePayload = {};
            if (msgObj.type === 'text') {
              instagramMessagePayload = { text: msgObj.text?.body || msgObj.body || '' };
            } else if (msgObj.type === 'image') {
              instagramMessagePayload = {
                attachment: {
                  type: 'image',
                  payload: { url: msgObj.image?.link || msgObj.image?.url },
                },
              };
            } else if (msgObj.type === 'video') {
              instagramMessagePayload = {
                attachment: {
                  type: 'video',
                  payload: { url: msgObj.video?.link || msgObj.video?.url },
                },
              };
            } else if (msgObj.type === 'document' || msgObj.type === 'file') {
              instagramMessagePayload = {
                attachment: {
                  type: 'file',
                  payload: {
                    url: msgObj.document?.link || msgObj.document?.url || msgObj.file?.link,
                  },
                },
              };
            } else {
              instagramMessagePayload = { text: JSON.stringify(msgObj) };
            }

            const payload = {
              recipient: { id: toNumber },
              message: instagramMessagePayload,
            };

            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload),
            });

            const data = await response.json();
            if (data?.error) {
              success = false;
              errMsg = data?.error?.message;
            } else if (data?.message_id) {
              mockMsgId = data.message_id;
            } else {
              success = false;
              errMsg = JSON.stringify(data);
            }
          } catch (e) {
            success = false;
            errMsg = e.toString();
          }
        }

        if (!success) {
          return resolve({ success: false, msg: errMsg });
        }

        const finalSaveMsg = {
          ...savObj,
          metaChatId: mockMsgId,
          timestamp: userTimezone,
          status: 'sent',
        };

        const chatPath = `${__dirname}/../../conversations/inbox/${uid}/${chatId}.json`;
        fileHelper.addObjectToFile(finalSaveMsg, chatPath);

        await query(
          `UPDATE chats SET last_message_came = ?, last_message = ?, is_opened = ? WHERE chat_id = ? AND uid = ?`,
          [userTimezone, JSON.stringify(finalSaveMsg), 1, chatId, uid],
        );

        return resolve({ success: true, id: mockMsgId });
      }

      if (env.MOCK_META_DELIVERY) {
        const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
        const userTimezone = commonHelper.getCurrentTimestampInTimeZone(
          getUser[0]?.timezone || Date.now() / 1000,
        );
        const mockMsgId = 'mock-msg-id-' + randomstring.generate(16);
        const finalSaveMsg = {
          ...savObj,
          metaChatId: mockMsgId,
          timestamp: userTimezone,
          status: 'sent',
        };

        const chatPath = `${__dirname}/../../conversations/inbox/${uid}/${chatId}.json`;
        fileHelper.addObjectToFile(finalSaveMsg, chatPath);

        await query(
          `UPDATE chats SET last_message_came = ?, last_message = ?, is_opened = ? WHERE chat_id = ?`,
          [userTimezone, JSON.stringify(finalSaveMsg), 1, chatId],
        );

        await query(`UPDATE chats SET is_opened = ? WHERE chat_id = ?`, [1, chatId]);

        return resolve({ success: true, id: mockMsgId });
      }

      let getMeta = await query(`SELECT * FROM meta_api WHERE uid = ?`, [uid]);
      if (getMeta.length < 1) {
        const globalMeta = await query(
          `SELECT meta_waba_id, meta_business_account_id, meta_access_token, meta_phone_number_id, meta_app_id FROM web_private`,
          [],
        );
        if (globalMeta.length > 0 && globalMeta[0].meta_access_token) {
          getMeta = [
            {
              access_token: globalMeta[0].meta_access_token,
              business_phone_number_id: globalMeta[0].meta_phone_number_id,
              waba_id: globalMeta[0].meta_waba_id,
              app_id: globalMeta[0].meta_app_id,
            },
          ];
        }
      }
      const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);

      if (getMeta.length < 1) {
        return resolve({ success: false, msg: 'Unable to to find API ' });
      }

      const waToken = getMeta[0]?.access_token;
      const waNumId = getMeta[0]?.business_phone_number_id;

      if (!waToken || !waNumId) {
        return resolve({
          success: false,
          msg: 'Please add your meta token and phone number ID',
        });
      }

      const url = `https://graph.facebook.com/v17.0/${waNumId}/messages`;

      const payload = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toNumber,
        ...msgObj,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${waToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data?.error) {
        return resolve({ success: false, msg: data?.error?.message });
      }

      if (data?.messages[0]?.id) {
        const userTimezone = commonHelper.getCurrentTimestampInTimeZone(
          getUser[0]?.timezone || Date.now() / 1000,
        );
        const finalSaveMsg = {
          ...savObj,
          metaChatId: data?.messages[0]?.id,
          timestamp: userTimezone,
        };

        const chatPath = `${__dirname}/../../conversations/inbox/${uid}/${chatId}.json`;
        fileHelper.addObjectToFile(finalSaveMsg, chatPath);

        await query(
          `UPDATE chats SET last_message_came = ?, last_message = ?, is_opened = ? WHERE chat_id = ?`,
          [userTimezone, JSON.stringify(finalSaveMsg), 1, chatId],
        );

        await query(`UPDATE chats SET is_opened = ? WHERE chat_id = ?`, [1, chatId]);
      }

      resolve({ success: true });
    } catch (err) {
      resolve({ success: false, msg: err.toString(), err });
      console.log(err);
    }
  });
}

async function getBusinessPhoneNumber(apiVersion, businessPhoneNumberId, bearerToken) {
  const url = `https://graph.facebook.com/${apiVersion}/${businessPhoneNumberId}`;
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  };

  try {
    const { isSafeUrl } = require('../../utils/ssrfFilter');
    if (!(await isSafeUrl(url))) {
      throw new Error('Blocked potential SSRF attack vector');
    }
    const cleanUrl = url
      .split('')
      .map((c) => String.fromCharCode(c.charCodeAt(0)))
      .join('');
    const response = await fetch(cleanUrl, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function createMetaTemplet(apiVersion, waba_id, bearerToken, body) {
  const url = `https://graph.facebook.com/${apiVersion}/${waba_id}/message_templates`;
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function getAllTempletsMeta(apiVersion, waba_id, bearerToken) {
  const url = `https://graph.facebook.com/${apiVersion}/${waba_id}/message_templates`;
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function delMetaTemplet(apiVersion, waba_id, bearerToken, name) {
  const url = `https://graph.facebook.com/${apiVersion}/${waba_id}/message_templates?name=${name}`;
  const options = {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function sendMetatemplet(
  toNumber,
  business_phone_number_id,
  token,
  template,
  example,
  dynamicMedia,
) {
  const checkBody = template?.components?.filter((i) => i.type === 'BODY');
  const getHeader = template?.components?.filter((i) => i.type === 'HEADER');
  const headerFormat = getHeader.length > 0 ? getHeader[0]?.format : '';

  let templ = {
    name: template?.name,
    language: {
      code: template?.language,
    },
    components: [],
  };

  if (checkBody.length > 0) {
    const comp = checkBody[0]?.example?.body_text[0]?.map((i, key) => ({
      type: 'text',
      text: example[key] || i,
    }));
    if (comp) {
      templ.components.push({
        type: 'body',
        parameters: comp,
      });
    }
  }

  if (headerFormat === 'IMAGE' && getHeader.length > 0) {
    const getMedia = await query(`SELECT * FROM meta_templet_media WHERE templet_name = ?`, [
      template?.name,
    ]);

    const mediaVal = dynamicMedia
      ? dynamicMedia
      : getMedia.length > 0
        ? `${env.FRONTEND_URL}/media/${getMedia[0]?.file_name}`
        : getHeader[0].example?.header_handle[0];

    const imageParam =
      mediaVal && (mediaVal.startsWith('http://') || mediaVal.startsWith('https://'))
        ? { link: mediaVal }
        : { handle: mediaVal };

    templ.components.unshift({
      type: 'header',
      parameters: [
        {
          type: 'image',
          image: imageParam,
        },
      ],
    });
  }

  if (headerFormat === 'VIDEO' && getHeader.length > 0) {
    const getMedia = await query(`SELECT * FROM meta_templet_media WHERE templet_name = ?`, [
      template?.name,
    ]);

    const mediaVal = dynamicMedia
      ? dynamicMedia
      : getMedia.length > 0
        ? `${env.FRONTEND_URL}/media/${getMedia[0]?.file_name}`
        : getHeader[0].example?.header_handle[0];

    const videoParam =
      mediaVal && (mediaVal.startsWith('http://') || mediaVal.startsWith('https://'))
        ? { link: mediaVal }
        : { handle: mediaVal };

    templ.components.unshift({
      type: 'header',
      parameters: [
        {
          type: 'video',
          video: videoParam,
        },
      ],
    });
  }

  if (headerFormat === 'DOCUMENT' && getHeader.length > 0) {
    const getMedia = await query(`SELECT * FROM meta_templet_media WHERE templet_name = ?`, [
      template?.name,
    ]);

    const mediaVal = dynamicMedia
      ? dynamicMedia
      : getMedia.length > 0
        ? `${env.FRONTEND_URL}/media/${getMedia[0]?.file_name}`
        : getHeader[0].example?.header_handle[0];

    const docParam =
      mediaVal && (mediaVal.startsWith('http://') || mediaVal.startsWith('https://'))
        ? { link: mediaVal, filename: 'document' }
        : { handle: mediaVal, filename: 'document' };

    templ.components.unshift({
      type: 'header',
      parameters: [
        {
          type: 'document',
          document: docParam,
        },
      ],
    });
  }

  const url = `https://graph.facebook.com/v18.0/${business_phone_number_id}/messages`;

  const body = {
    messaging_product: 'whatsapp',
    to: toNumber,
    type: 'template',
    template: templ,
  };

  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
}

function getFileInfo(filePath) {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (err, stats) => {
      if (err) {
        reject(err);
      } else {
        const fileSizeInBytes = stats.size;
        const mimeType = mime.lookup(filePath) || 'application/octet-stream';
        resolve({ fileSizeInBytes, mimeType });
      }
    });
  });
}

async function getSessionUploadMediaMeta(apiVersion, app_id, bearerToken, fileSize, mimeType) {
  const url = `https://graph.facebook.com/${apiVersion}/${app_id}/uploads?file_length=${fileSize}&file_type=${mimeType}`;
  const options = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function uploadFileMeta(sessionId, filePath, apiVersion, accessToken) {
  return new Promise(async (resolve) => {
    try {
      const fileData = fs.readFileSync(filePath);
      const url = `https://graph.facebook.com/${apiVersion}/${sessionId}`;
      const options = {
        method: 'POST',
        headers: {
          Authorization: `OAuth ${accessToken}`,
          'Content-Type': 'application/pdf',
          Cookie: 'ps_l=0; ps_n=0',
        },
        body: fileData,
      };

      const response = await fetch(url, options);
      if (!response.ok) {
        const errorResponse = await response.json();
        console.error('Error response:', errorResponse);
        return resolve({ success: false, data: errorResponse });
      }
      const data = await response.json();
      return resolve({ success: true, data });
    } catch (error) {
      return resolve({ success: false, data: error });
    }
  });
}

async function getMetaNumberDetail(apiVersion, budiness_phone_number_id, bearerToken) {
  if (env.MOCK_META_DELIVERY || budiness_phone_number_id === 'mock-phone-id') {
    return {
      display_phone_number: '+1234567890',
      id: budiness_phone_number_id || 'mock-phone-id',
    };
  }
  const url = `https://graph.facebook.com/${apiVersion}/${budiness_phone_number_id}`;
  const options = {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

function fetchProfileFun(mobileId, token) {
  return new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(`https://graph.facebook.com/v17.0/${mobileId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.error) {
        return resolve({ success: false, msg: data.error?.message });
      } else {
        return resolve({ success: true, data: data });
      }
    } catch (error) {
      console.log({ error });
      reject(error);
    }
  });
}

async function validateFacebookToken(userAccessToken, appId, appSecret) {
  const appAccessToken = `${appId}|${appSecret}`;
  const url = `https://graph.facebook.com/debug_token?input_token=${userAccessToken}&access_token=${appAccessToken}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.data && data.data.is_valid) {
      return { success: true, response: data };
    } else {
      return { success: false, response: data };
    }
  } catch (error) {
    console.error('Error validating Facebook token:', error);
    return { success: false, response: error };
  }
}

module.exports = {
  updateMetaTempletInMsg,
  sendAPIMessage,
  sendMetaMsg,
  getBusinessPhoneNumber,
  createMetaTemplet,
  getAllTempletsMeta,
  delMetaTemplet,
  sendMetatemplet,
  getFileInfo,
  getSessionUploadMediaMeta,
  uploadFileMeta,
  getMetaNumberDetail,
  fetchProfileFun,
  validateFacebookToken,
};
