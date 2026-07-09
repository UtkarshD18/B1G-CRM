const fs = require('fs');
const path = require('path');
const { query } = require('../database/dbpromise');
const { default: axios } = require('axios');
const randomstring = require('randomstring');
const { getIOInstance } = () => {};
const { destributeTaskFlow } = require('./chatbot');
const { recordChatbotLog } = require('./chatbotDiagnostics');
const env = require('../env');
const crypto = require('crypto');
const fileHelper = require('./helpers/fileHelper');
const commonHelper = require('./helpers/commonHelper');
const billingHelper = require('./helpers/billingHelper');
const metaHelper = require('./helpers/metaHelper');
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

const executeQueries = commonHelper.executeQueries;

function findTargetNodes(nodes, edges, incomingWord) {
  const matchingEdges = edges.filter((edge) => edge.sourceHandle === incomingWord);
  const targetNodeIds = matchingEdges.map((edge) => edge.target);
  const targetNodes = nodes.filter((node) => targetNodeIds.includes(node.id));
  return targetNodes;
}

function checkAssignAi(nodes) {
  try {
    const check = nodes.filter((x) => x?.data?.msgContent?.assignAi === true);
    return check?.length > 0 ? check : [];
  } catch (err) {
    console.log(err);
    return [];
  }
}

function getReply(nodes, edges, incomingWord) {
  const getNormal = findTargetNodes(nodes, edges, incomingWord);
  if (getNormal.length > 0) {
    return getNormal;
  } else if (checkAssignAi(nodes)?.length > 0) {
    const findAiNodes = checkAssignAi(nodes);
    return findAiNodes;
  } else {
    const getOther = findTargetNodes(nodes, edges, '{{OTHER_MSG}}');
    return getOther;
  }
}

async function runChatbot(i, incomingMsg, uid, senderNumber, toName) {
  try {
    const chatbot = i;
    const forAll = i?.for_all > 0 ? true : false;
    const chatId = convertNumberToRandomString(senderNumber || '');
    const flow = JSON.parse(i?.flow);
    const origin = JSON.parse(i?.origin || '{}')?.code || 'META';
    const selectedTargets = JSON.parse(chatbot?.chats || '[]');

    if (!forAll && !selectedTargets.includes(chatId)) {
      await recordChatbotLog({
        uid,
        chatbot,
        flow,
        senderNumber,
        senderName: toName,
        incomingMessage: incomingMsg,
        origin,
        status: 'skipped',
        detail: { reason: 'chat_not_selected', chatId },
      });
      return;
    }

    const nodePath = `${__dirname}/../flow-json/nodes/${uid}/${flow?.flow_id}.json`;
    const edgePath = `${__dirname}/../flow-json/edges/${uid}/${flow?.flow_id}.json`;

    const nodes = readJsonFromFile(nodePath);
    const edges = readJsonFromFile(edgePath);

    if (nodes.length < 1 || edges.length < 1) {
      await recordChatbotLog({
        uid,
        chatbot,
        flow,
        senderNumber,
        senderName: toName,
        incomingMessage: incomingMsg,
        origin,
        status: 'skipped',
        detail: { reason: 'flow_definition_missing', chatId },
      });
      return;
    }

    const answer = getReply(nodes, edges, incomingMsg);

    await recordChatbotLog({
      uid,
      chatbot,
      flow,
      senderNumber,
      senderName: toName,
      incomingMessage: incomingMsg,
      origin,
      matched: answer.length > 0,
      status: answer.length > 0 ? 'matched' : 'no_match',
      detail: { reply_count: answer.length, chatId, for_all: forAll },
    });

    if (answer.length > 0) {
      for (const k of answer) {
        await destributeTaskFlow({
          uid: uid,
          k: k,
          chatbotFromMysq: chatbot,
          toName: toName,
          senderNumber,
          sendMetaMsg,
          chatId,
          nodes,
          edges,
          incomingMsg,
          flowData: flow,
        });
      }
    }
  } catch (err) {
    await recordChatbotLog({
      uid,
      chatbot: i,
      senderNumber,
      senderName: toName,
      incomingMessage: incomingMsg,
      status: 'error',
      detail: { error: err.message },
    });
    console.log(err);
  }
}

async function botWebhook(incomingMsg, uid, senderNumber, toName) {
  console.log('botWebhook RAN');

  const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
  if (getUser[0]?.plan) {
    const plan = JSON.parse(getUser[0]?.plan);
    if (plan.allow_chatbot > 0) {
      const chatbots = await query(`SELECT * FROM chatbot WHERE uid = ? AND active = ?`, [uid, 1]);

      if (chatbots.length > 0) {
        await Promise.all(
          chatbots.map((i) => runChatbot(i, incomingMsg, uid, senderNumber, toName)),
        );
      }
    } else {
      await query(`UPDATE chatbot SET active = ? WHERE uid = ?`, [0, uid]);
    }
  }
}

async function saveMessage(body, uid, type, msgContext) {
  try {
    console.log('CAME HERE');

    const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
    const userTimezone = getCurrentTimestampInTimeZone(getUser[0]?.timezone || Date.now() / 1000);

    const chatId = convertNumberToRandomString(
      body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id,
      body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
        : 'NA',
    );

    const actualMsg = {
      type: type,
      metaChatId: body?.entry[0]?.changes[0]?.value?.messages[0]?.id,
      msgContext: msgContext,
      reaction: '',
      timestamp: userTimezone,
      senderName: body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
        : 'NA',
      senderMobile: body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id
        : 'NA',
      status: '',
      star: false,
      route: 'INCOMING',
      context: body?.entry[0]?.changes[0]?.value?.messages[0]
        ? body?.entry[0]?.changes[0]?.value?.messages[0]?.context
        : '',
    };

    // find chat
    const chat = await query(`SELECT * FROM chats WHERE chat_id = ? AND uid = ?`, [chatId, uid]);

    if (chat.length < 1) {
      await query(
        `INSERT INTO chats (chat_id, uid, last_message_came, sender_name, sender_mobile, last_message, is_opened) VALUES (
            ?,?,?,?,?,?,?
        )`,
        [
          chatId,
          uid,
          userTimezone,
          body?.entry[0]?.changes
            ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
            : 'NA',
          body?.entry[0]?.changes ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id : 'NA',
          JSON.stringify(actualMsg),
          0,
        ],
      );
    } else {
      await query(
        `UPDATE chats SET last_message_came = ?, last_message = ?, is_opened = ? WHERE chat_id = ? AND uid = ?`,
        [userTimezone, JSON.stringify(actualMsg), 0, chatId, uid],
      );
    }

    const chatPath = `${__dirname}/../conversations/inbox/${uid}/${chatId}.json`;
    addObjectToFile(actualMsg, chatPath);

    const io = getIOInstance();

    const getId = await query(`SELECT * FROM rooms WHERE uid = ?`, [uid]);

    const chats = await query(`SELECT * FROM chats WHERE uid = ?`, [uid]);

    io.to(getId[0]?.socket_id).emit('update_conversations', { chats: chats });

    io.to(getId[0]?.socket_id).emit('push_new_msg', {
      msg: actualMsg,
      chatId: chatId,
    });

    // checking if the agent has this chat
    const getAgentChat = await query(
      `SELECT * FROM agent_chats WHERE owner_uid = ? AND chat_id = ?`,
      [uid, chatId],
    );

    if (getAgentChat.length > 0) {
      const getMyChatsId = await query(`SELECT * FROM agent_chats WHERE uid = ?`, [
        getAgentChat[0]?.uid,
      ]);

      const chatIds = getMyChatsId.map((i) => i?.chat_id);

      const chatsNew = await query(`SELECT * FROM chats WHERE chat_id IN (?) AND uid = ?`, [
        chatIds,
        uid,
      ]);

      const getAgentSocket = await query(`SELECT * FROM rooms WHERE uid = ?`, [
        getAgentChat[0]?.uid,
      ]);
      io.to(getAgentSocket[0]?.socket_id).emit('update_conversations', {
        chats: chatsNew || [],
      });

      io.to(getAgentSocket[0]?.socket_id).emit('push_new_msg', {
        msg: actualMsg,
        chatId: chatId,
      });
    }
  } catch (err) {
    console.log(`error in saveMessage in function `, err);
  }
}

async function saveWebhookConversation(body, uid) {
  //  saving simple text
  if (
    body?.entry[0]?.changes[0]?.value?.messages &&
    body?.entry[0]?.changes[0]?.value?.messages[0]?.type === 'text'
  ) {
    saveMessage(body, uid, 'text', {
      type: 'text',
      text: {
        preview_url: true,
        body: body?.entry[0]?.changes[0]?.value?.messages[0]?.text?.body,
      },
    });

    botWebhook(
      body?.entry[0]?.changes[0]?.value?.messages[0]?.text?.body,
      uid,
      body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id,
      body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
        : 'NA',
    );
  }

  // images
  else if (
    body?.entry[0]?.changes[0]?.value?.messages &&
    body?.entry[0]?.changes[0]?.value?.messages[0]?.image
  ) {
    const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);

    let metAPI = await query(`SELECT * FROM meta_api WHERE uid = ?`, [uid]);
    if (metAPI.length === 0) {
      const globalMeta = await query(`SELECT meta_access_token FROM web_private`, []);
      if (globalMeta.length > 0 && globalMeta[0].meta_access_token) {
        metAPI = [{ access_token: globalMeta[0].meta_access_token }];
      }
    }
    const metaToken = metAPI[0]?.access_token;

    if (metaToken) {
      console.log({ metaToken });
      const fileName = await downloadAndSaveMedia(
        metaToken,
        body?.entry[0]?.changes[0]?.value?.messages[0]?.image?.id,
      );
      console.log({ fileName });
      saveMessage(body, uid, 'image', {
        type: 'image',
        image: {
          link: `${env.FRONTEND_URL}/meta-media/${fileName}`,
          caption: body?.entry[0]?.changes[0]?.value?.messages[0]?.image?.caption || '',
        },
      });
    }
    botWebhook(
      body?.entry[0]?.changes[0]?.value?.messages[0]?.image?.caption || 'aU1uLzohPGMncyrwlPIb',
      uid,
      body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id,
      body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
        : 'NA',
    );
  }

  // video
  else if (
    body?.entry[0]?.changes[0]?.value?.messages &&
    body?.entry[0]?.changes[0]?.value?.messages[0]?.video
  ) {
    const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);

    let metAPI = await query(`SELECT * FROM meta_api WHERE uid = ?`, [uid]);
    if (metAPI.length === 0) {
      const globalMeta = await query(`SELECT meta_access_token FROM web_private`, []);
      if (globalMeta.length > 0 && globalMeta[0].meta_access_token) {
        metAPI = [{ access_token: globalMeta[0].meta_access_token }];
      }
    }
    const metaToken = metAPI[0]?.access_token;

    if (metaToken) {
      const fileName = await downloadAndSaveMedia(
        metaToken,
        body?.entry[0]?.changes[0]?.value?.messages[0]?.video?.id,
      );
      saveMessage(body, uid, 'video', {
        type: 'video',
        video: {
          link: `${env.FRONTEND_URL}/meta-media/${fileName}`,
          caption: body?.entry[0]?.changes[0]?.value?.messages[0]?.video?.caption,
        },
      });
    }

    botWebhook(
      body?.entry[0]?.changes[0]?.value?.messages[0]?.video?.caption || 'aU1uLzohPGMncyrwlPIb',
      uid,
      body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id,
      body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
        : 'NA',
    );
  }

  // document
  else if (
    body?.entry[0]?.changes[0]?.value?.messages &&
    body?.entry[0]?.changes[0]?.value?.messages[0]?.document
  ) {
    const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);

    let metAPI = await query(`SELECT * FROM meta_api WHERE uid = ?`, [uid]);
    if (metAPI.length === 0) {
      const globalMeta = await query(`SELECT meta_access_token FROM web_private`, []);
      if (globalMeta.length > 0 && globalMeta[0].meta_access_token) {
        metAPI = [{ access_token: globalMeta[0].meta_access_token }];
      }
    }
    const metaToken = metAPI[0]?.access_token;

    if (metaToken) {
      const fileName = await downloadAndSaveMedia(
        metaToken,
        body?.entry[0]?.changes[0]?.value?.messages[0]?.document?.id,
      );
      saveMessage(body, uid, 'document', {
        type: 'document',
        document: {
          link: `${env.FRONTEND_URL}/meta-media/${fileName}`,
          caption: body?.entry[0]?.changes[0]?.value?.messages[0]?.document?.caption,
        },
      });
    }
    botWebhook(
      body?.entry[0]?.changes[0]?.value?.messages[0]?.document?.caption || 'aU1uLzohPGMncyrwlPIb',
      uid,
      body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id,
      body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
        : 'NA',
    );
  }

  // audio
  else if (
    body?.entry[0]?.changes[0]?.value?.messages &&
    body?.entry[0]?.changes[0]?.value?.messages[0]?.audio
  ) {
    const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);

    let metAPI = await query(`SELECT * FROM meta_api WHERE uid = ?`, [uid]);
    if (metAPI.length === 0) {
      const globalMeta = await query(`SELECT meta_access_token FROM web_private`, []);
      if (globalMeta.length > 0 && globalMeta[0].meta_access_token) {
        metAPI = [{ access_token: globalMeta[0].meta_access_token }];
      }
    }
    const metaToken = metAPI[0]?.access_token;

    if (metaToken) {
      const fileName = await downloadAndSaveMedia(
        metaToken,
        body?.entry[0]?.changes[0]?.value?.messages[0]?.audio?.id,
      );
      saveMessage(body, uid, 'audio', {
        type: 'audio',
        audio: {
          link: `${env.FRONTEND_URL}/meta-media/${fileName}`,
        },
      });
    }

    botWebhook(
      body?.entry[0]?.changes[0]?.value?.messages[0]?.document?.caption || 'aU1uLzohPGMncyrwlPIb',
      uid,
      body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id,
      body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
        : 'NA',
    );
  }

  // adding reactions
  else if (
    body?.entry[0]?.changes[0]?.value?.messages &&
    body?.entry[0]?.changes[0]?.value?.messages[0]?.reaction
  ) {
    const chatId = convertNumberToRandomString(
      body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id,
      body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
        : 'NA',
    );
    const filePath = `${__dirname}/../conversations/inbox/${uid}/${chatId}.json`;
    updateMessageObjectInFile(
      filePath,
      body?.entry[0]?.changes[0]?.value?.messages[0]?.reaction?.message_id,
      'reaction',
      body?.entry[0]?.changes[0]?.value?.messages[0]?.reaction?.emoji,
    );

    const io = getIOInstance();

    const getId = await query(`SELECT * FROM rooms WHERE uid = ?`, [uid]);

    io.to(getId[0]?.socket_id).emit('push_new_reaction', {
      reaction: body?.entry[0]?.changes[0]?.value?.messages[0]?.reaction?.emoji,
      chatId: chatId,
      msgId: body?.entry[0]?.changes[0]?.value?.messages[0]?.reaction?.message_id,
    });

    // setting up for agent
    const getAgentChat = await query(
      `SELECT * FROM agent_chats WHERE owner_uid = ? AND chat_id = ?`,
      [uid, chatId],
    );

    if (getAgentChat.length > 0) {
      const getAgentSocket = await query(`SELECT * FROM rooms WHERE uid = ?`, [
        getAgentChat[0]?.uid,
      ]);

      io.to(getAgentSocket[0]?.socket_id).emit('push_new_reaction', {
        reaction: body?.entry[0]?.changes[0]?.value?.messages[0]?.reaction?.emoji,
        chatId: chatId,
        msgId: body?.entry[0]?.changes[0]?.value?.messages[0]?.reaction?.message_id,
      });
    }
  }

  // for button reply in tempelt message
  else if (
    body?.entry[0]?.changes[0]?.value?.messages &&
    body?.entry[0]?.changes[0]?.value?.messages[0]?.button?.text
  ) {
    saveMessage(body, uid, 'text', {
      type: 'text',
      text: {
        preview_url: true,
        body: body?.entry[0]?.changes[0]?.value?.messages[0]?.button?.text,
      },
    });

    botWebhook(
      body?.entry[0]?.changes[0]?.value?.messages[0]?.button?.text || 'aU1uLzohPGMncyrwlPIb',
      uid,
      body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id,
      body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
        : 'NA',
    );
  }

  // quick reply button
  else if (
    body?.entry[0]?.changes[0]?.value?.messages &&
    body?.entry[0]?.changes[0]?.value?.messages[0]?.interactive?.button_reply
  ) {
    saveMessage(body, uid, 'text', {
      type: 'text',
      text: {
        preview_url: true,
        body: body?.entry[0]?.changes[0]?.value?.messages[0]?.interactive?.button_reply?.title,
      },
    });

    botWebhook(
      body?.entry[0]?.changes[0]?.value?.messages[0]?.interactive?.button_reply?.title ||
        'aU1uLzohPGMncyrwlPIb',
      uid,
      body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id,
      body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
        : 'NA',
    );
  }

  // updating delivery status
  else if (
    body?.entry[0]?.changes[0]?.value?.statuses &&
    body?.entry[0]?.changes[0]?.value?.statuses[0]?.id
  ) {
    const metaMsgId = body?.entry[0]?.changes[0]?.value?.statuses[0]?.id;

    // console.log(`update msg:-`, JSON.stringify(body))

    const chatId = convertNumberToRandomString(
      body?.entry[0]?.changes[0]?.value?.statuses[0]?.recipient_id,
      body?.entry[0]?.changes || 'NA',
    );

    const filePath = `${__dirname}/../conversations/inbox/${uid}/${chatId}.json`;
    updateMessageObjectInFile(
      filePath,
      metaMsgId,
      'status',
      body?.entry[0]?.changes[0]?.value?.statuses[0]?.status,
    );

    const io = getIOInstance();

    const getId = await query(`SELECT * FROM rooms WHERE uid = ?`, [uid]);

    io.to(getId[0]?.socket_id).emit('update_delivery_status', {
      chatId: chatId,
      status: body?.entry[0]?.changes[0]?.value?.statuses[0]?.status,
      msgId: body?.entry[0]?.changes[0]?.value?.statuses[0]?.id,
    });

    // setting up for agent
    const getAgentChat = await query(
      `SELECT * FROM agent_chats WHERE owner_uid = ? AND chat_id = ?`,
      [uid, chatId],
    );

    if (getAgentChat.length > 0) {
      const getAgentSocket = await query(`SELECT * FROM rooms WHERE uid = ?`, [
        getAgentChat[0]?.uid,
      ]);

      io.to(getAgentSocket[0]?.socket_id).emit('update_delivery_status', {
        chatId: chatId,
        status: body?.entry[0]?.changes[0]?.value?.statuses[0]?.status,
        msgId: body?.entry[0]?.changes[0]?.value?.statuses[0]?.id,
      });
    }

    if (body?.entry[0]?.changes[0]?.value?.statuses[0]?.status === 'failed') {
      console.log({
        hey: JSON.stringify(body?.entry[0]?.changes[0]?.value?.statuses[0]?.errors[0]?.message),
      });

      await query(`UPDATE broadcast_log SET delivery_status = ?, err = ? WHERE meta_msg_id = ?`, [
        body?.entry[0]?.changes[0]?.value?.statuses[0]?.status,
        JSON.stringify(body),
        metaMsgId,
      ]);
    } else {
      await query(`UPDATE broadcast_log SET delivery_status = ? WHERE meta_msg_id = ?`, [
        body?.entry[0]?.changes[0]?.value?.statuses[0]?.status,
        metaMsgId,
      ]);
    }
  }

  // list reply button
  else if (
    body?.entry[0]?.changes[0]?.value?.messages &&
    body?.entry[0]?.changes[0]?.value?.messages[0]?.interactive?.list_reply
  ) {
    saveMessage(body, uid, 'text', {
      type: 'text',
      text: {
        preview_url: true,
        body: body?.entry[0]?.changes[0]?.value?.messages[0]?.interactive?.list_reply?.title,
      },
    });
    botWebhook(
      body?.entry[0]?.changes[0]?.value?.messages[0]?.interactive?.list_reply?.title ||
        'aU1uLzohPGMncyrwlPIb',
      uid,
      body?.entry[0]?.changes[0]?.value?.contacts[0]?.wa_id,
      body?.entry[0]?.changes
        ? body?.entry[0]?.changes[0]?.value?.contacts[0]?.profile?.name
        : 'NA',
    );
  }
}

function updateMessageObjectInFile(filePath, metaChatId, key, value) {
  // Read JSON data from the file
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      return;
    }

    try {
      // Parse JSON data
      const dataArray = JSON.parse(data);

      // Find the message object with the given metaChatId
      const message = dataArray.find((obj) => obj.metaChatId === metaChatId);

      // If the message is found, update the key with the new value
      if (message) {
        message[key] = value;
        console.log(`Updated message with metaChatId ${metaChatId}: ${key} set to ${value}`);

        // Write the modified JSON data back to the file
        fs.writeFile(filePath, JSON.stringify(dataArray, null, 2), 'utf8', (err) => {
          if (err) {
            console.error('Error writing file:', err);
            return;
          }
          console.log('File updated successfully');
        });
      } else {
        console.error(`Message with metaChatId ${metaChatId} not found`);
      }
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });
}

async function downloadAndSaveMedia(token, mediaId) {
  try {
    const url = `https://graph.facebook.com/v19.0/${mediaId}/`;
    // retriving url
    const getUrl = await axios(url, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });

    const config = {
      method: 'get',
      url: getUrl?.data?.url, //PASS THE URL HERE, WHICH YOU RECEIVED WITH THE HELP OF MEDIA ID
      headers: {
        Authorization: `Bearer ${token}`,
      },
      responseType: 'arraybuffer',
    };

    const response = await axios(config);
    const ext = response.headers['content-type'].split('/')[1];

    const randomSt = randomstring.generate();
    const savingPath = `${__dirname}/../client/public/meta-media/${randomSt}`;
    fs.writeFileSync(`${savingPath}.${ext}`, response.data);
    return `${randomSt}.${ext}`;
  } catch (error) {
    console.error('Error downloading media:', error);
  }
}

const getCurrentTimestampInTimeZone = commonHelper.getCurrentTimestampInTimeZone;
const convertNumberToRandomString = commonHelper.convertNumberToRandomString;
const isValidEmail = commonHelper.isValidEmail;
const areMobileNumbersFilled = commonHelper.areMobileNumbersFilled;
const addObjectToFile = fileHelper.addObjectToFile;
const saveJsonToFile = fileHelper.saveJsonToFile;
const getFileExtension = fileHelper.getFileExtension;
const validateMagicBytes = fileHelper.validateMagicBytes;

const writeJsonToFile = fileHelper.writeJsonToFile;
const deleteFileIfExists = fileHelper.deleteFileIfExists;
const readJsonFromFile = fileHelper.readJsonFromFile;
const readJSONFile = fileHelper.readJSONFile;

const updateMetaTempletInMsg = metaHelper.updateMetaTempletInMsg;
const sendAPIMessage = metaHelper.sendAPIMessage;

const sendMetaMsg = metaHelper.sendMetaMsg;

const mergeArrays = commonHelper.mergeArrays;

const getBusinessPhoneNumber = metaHelper.getBusinessPhoneNumber;
const createMetaTemplet = metaHelper.createMetaTemplet;
const getAllTempletsMeta = metaHelper.getAllTempletsMeta;
const delMetaTemplet = metaHelper.delMetaTemplet;
const sendMetatemplet = metaHelper.sendMetatemplet;

const getFileInfo = metaHelper.getFileInfo;
const getSessionUploadMediaMeta = metaHelper.getSessionUploadMediaMeta;
const uploadFileMeta = metaHelper.uploadFileMeta;
const getMetaNumberDetail = metaHelper.getMetaNumberDetail;

const updateUserPlan = billingHelper.updateUserPlan;

const validateEmail = commonHelper.validateEmail;

const { sendEmail } = require('./helpers/notificationHelper');

const getUserSignupsByMonth = billingHelper.getUserSignupsByMonth;
const getUserOrderssByMonth = billingHelper.getUserOrderssByMonth;
const getNumberOfDaysFromTimestamp = billingHelper.getNumberOfDaysFromTimestamp;
const getUserPlayDays = billingHelper.getUserPlayDays;

const folderExists = fileHelper.folderExists;
const downloadAndExtractFile = fileHelper.downloadAndExtractFile;

const fetchProfileFun = metaHelper.fetchProfileFun;

const returnWidget = commonHelper.returnWidget;
const generateWhatsAppURL = commonHelper.generateWhatsAppURL;
const makeRequest = commonHelper.makeRequest;
const replacePlaceholders = commonHelper.replacePlaceholders;

const rzCapturePayment = billingHelper.rzCapturePayment;

const validateFacebookToken = metaHelper.validateFacebookToken;

module.exports = {
  isValidEmail,
  downloadAndExtractFile,
  folderExists,
  sendAPIMessage,
  sendEmail,
  getUserPlayDays,
  getNumberOfDaysFromTimestamp,
  getUserOrderssByMonth,
  getUserSignupsByMonth,
  validateEmail,
  updateUserPlan,
  getFileInfo,
  uploadFileMeta,
  getMetaNumberDetail,
  getSessionUploadMediaMeta,
  sendMetaMsg,
  updateMetaTempletInMsg,
  sendMetatemplet,
  delMetaTemplet,
  getAllTempletsMeta,
  createMetaTemplet,
  getBusinessPhoneNumber,
  botWebhook,
  mergeArrays,
  readJSONFile,
  writeJsonToFile,
  getCurrentTimestampInTimeZone,
  saveWebhookConversation,
  saveJsonToFile,
  readJsonFromFile,
  deleteFileIfExists,
  areMobileNumbersFilled,
  getFileExtension,
  validateMagicBytes,
  executeQueries,
  fetchProfileFun,
  returnWidget,
  generateWhatsAppURL,
  makeRequest,
  replacePlaceholders,
  runChatbot,
  rzCapturePayment,
  validateFacebookToken,
  addObjectToFile,
};
