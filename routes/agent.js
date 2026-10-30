const router = require('express').Router();
const { query, withTransaction } = require('../database/dbpromise.js');
const randomstring = require('randomstring');
const bcrypt = require('bcrypt');
const {
  isValidEmail,
  getFileExtension,
  mergeArrays,
  readJSONFile,
} = require('../functions/function.js');
const { sign } = require('jsonwebtoken');
const validateUser = require('../middlewares/user.js');
const validateAgent = require('../middlewares/agent.js');
const { checkPlan } = require('../middlewares/plan.js');
const env = require('../env.js');
const { invalidatePermissionCache } = require('../utils/permissionResolver.js');
const { logActivity } = require('../utils/activityLogger.js');

// Helper: check if an agent is assigned to a specific chat
async function isAgentAssigned(agentUid, chatId) {
  const rows = await query('SELECT 1 FROM agent_chats WHERE uid = ? AND chat_id = ?', [
    agentUid,
    chatId,
  ]);
  return rows.length > 0;
}

function requireInbox(action) {
  return (req, res, next) => {
    const allowed =
      action === 'reply'
        ? ['inbox_access', 'inbox.reply']
        : ['inbox_access', 'inbox.read', 'inbox.reply'];
    if (!(req.decode.permissions || []).some((p) => allowed.includes(p)))
      return res
        .status(403)
        .json({ success: false, msg: `Access Denied: inbox.${action} permission required` });
    next();
  };
}

// Legacy REST sends use the same authorization and channel routing as sockets.
function sendAgentReply(type) {
  return async (req, res) => {
    try {
      const { chatId, text, url, caption } = req.body;
      const [chat] = await query('SELECT * FROM chats WHERE chat_id = ? AND uid = ?', [
        chatId,
        req.owner.uid,
      ]);
      if (!chat) return res.status(404).json({ success: false, msg: 'Conversation not found.' });
      const key = type === 'document' ? 'document' : type;
      if (type === 'text' ? !String(text || '').trim() : !url)
        return res.status(400).json({ success: false, msg: 'Message content is required' });
      const msgCon =
        type === 'text'
          ? { type, text: { body: text } }
          : { type, [key]: { link: url, caption: caption || '' } };
      let send;
      const { processSocketEvent } = require('../helper/socket');
      processSocketEvent({
        socket: {
          on: (name, handler) => {
            if (name === 'send_chat_message') send = handler;
          },
        },
        connectionInfo: {
          uid: req.agent.uid,
          agent: true,
          id: 'rest',
          permissions: req.decode.permissions,
          decodedValue: { owner_uid: req.owner.uid },
          data: { selectedChat: chat },
        },
        sendToSocketId: () => {},
        getConnectionsByUid: require('../socket').getConnectionsByUid,
      });
      const result = await send({ data: { type, msgCon } });
      if (result?.success)
        await require('../utils/channels/inboxNotifications').publishInboxChange({
          uid: req.owner.uid,
          chatId,
        });
      res.json(result || { success: false, msg: 'Message failed' });
    } catch (err) {
      res.json({ success: false, msg: 'Message could not be sent' });
    }
  };
}

// adding agent
router.post('/add_agent', validateUser, checkPlan, async (req, res) => {
  try {
    const { name, password, email, mobile, comments } = req.body;

    if (!name || !password || !email || !mobile) {
      return res.json({
        msg: 'Please fill all the details',
      });
    }

    if (!isValidEmail(email)) {
      return res.json({ msg: 'Please enter a valid email' });
    }

    // check if already
    const getUser = await query(`SELECT * FROM agents WHERE email = ?`, [email?.toLowerCase()]);

    if (getUser.length > 0) {
      return res.json({
        msg: 'This email is already used by you or someone else on the platform, Please choose another email',
      });
    }

    const hashPass = await bcrypt.hash(password, 10);

    const uid = randomstring.generate();

    const permissions = JSON.stringify(req.body.permissions || []);

    await query(
      `INSERT INTO agents (owner_uid, uid, email, password, name, mobile, comments, permissions) VALUES (
            ?,?,?,?,?,?,?,?
        )`,
      [req.decode.uid, uid, email?.toLowerCase(), hashPass, name, mobile, comments, permissions],
    );

    await logActivity(req, 'Users', 'create_agent', email?.toLowerCase(), { agent_uid: uid, name });
    invalidatePermissionCache(uid);

    res.json({
      msg: 'Agent account was created',
      success: true,
    });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// Owner-only assigned-inbox preset; unrelated permissions and profile fields stay intact.
router.post('/update_inbox_permissions', validateUser, async (req, res) => {
  try {
    const { uid, permissions } = req.body;
    const inboxKeys = ['inbox_access', 'inbox.read', 'inbox.reply'];
    if (!Array.isArray(permissions) || permissions.some((key) => !inboxKeys.includes(key)))
      return res.status(400).json({ success: false, msg: 'Invalid inbox permissions' });
    const [agent] = await query('SELECT permissions FROM agents WHERE uid = ? AND owner_uid = ?', [
      uid,
      req.decode.uid,
    ]);
    if (!agent) return res.status(404).json({ success: false, msg: 'Agent not found' });
    const existing = Array.isArray(agent.permissions)
      ? agent.permissions
      : JSON.parse(agent.permissions || '[]');
    const next = [
      ...new Set([...existing.filter((key) => !inboxKeys.includes(key)), ...permissions]),
    ];
    await query('UPDATE agents SET permissions = ? WHERE uid = ? AND owner_uid = ?', [
      JSON.stringify(next),
      uid,
      req.decode.uid,
    ]);
    invalidatePermissionCache(uid);
    await logActivity(req, 'Users', 'update_inbox_permissions', uid, { permissions });
    res.json({ success: true, msg: 'Assigned inbox permissions updated', permissions: next });
  } catch {
    res.status(500).json({ success: false, msg: 'Unable to update inbox permissions' });
  }
});

// get all agents
router.get('/get_my_agents', validateUser, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM agents WHERE owner_uid = ?`, [req.decode.uid]);

    res.json({ data, success: true });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// change agent activeness
router.post('/change_agent_activeness', validateUser, async (req, res) => {
  try {
    const { agentUid, activeness } = req.body;

    await query(`UPDATE agents SET is_active = ? WHERE uid = ? AND owner_uid = ?`, [
      activeness ? 1 : 0,
      agentUid,
      req.decode.uid,
    ]);

    invalidatePermissionCache(agentUid);
    await logActivity(req, 'Users', 'change_agent_activeness', agentUid, { activeness });

    res.json({
      success: true,
      msg: 'Success',
    });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// del agent
router.post('/del_agent', validateUser, async (req, res) => {
  try {
    const { uid } = req.body;

    await withTransaction(async (tx) => {
      await tx(`DELETE FROM agents WHERE uid = ? AND owner_uid = ?`, [uid, req.decode.uid]);
      await tx(`DELETE FROM agent_chats WHERE uid = ? AND owner_uid = ?`, [uid, req.decode.uid]);
      await tx(`DELETE FROM agent_task WHERE uid = ? AND owner_uid = ?`, [uid, req.decode.uid]);
    });

    invalidatePermissionCache(uid);
    await logActivity(req, 'Users', 'delete_agent', uid);

    res.json({
      success: true,
      msg: 'Agent was deleted',
    });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// get agent chats by owner
router.post('/get_agent_chats_owner', validateUser, async (req, res) => {
  try {
    const { uid } = req.body;

    // const data = await query(`SELECT * FROM agent_chats WHERE owner_uid = ? AND uid = ?`, [
    //     req.decode.uid,
    //     uid
    // ])

    const data = await query(
      `
        SELECT * 
        FROM agent_chats 
        JOIN chats  
        ON agent_chats.chat_id = chats.chat_id 
        WHERE agent_chats.owner_uid = ? 
        AND chats.uid = ?        
        `,
      [req.decode.uid, req.decode.uid, uid],
    );

    res.json({ data, success: true });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// get chat assisgn agent
router.post('/get_assigned_chat_agent', validateUser, async (req, res) => {
  try {
    const { chatId } = req.body;

    let data;

    data = await query(`SELECT * FROM agent_chats WHERE chat_id = ? AND owner_uid = ?`, [
      chatId,
      req.decode.uid,
    ]);

    if (data.length > 0) {
      const agent = await query(`SELECT * FROM agents WHERE uid = ?`, [data[0]?.uid]);
      data[0] = {
        ...agent[0],
        chat_id: data[0].chat_id,
        owner_uid: data[0].owner_uid,
      };
    } else {
      data = {};
    }

    res.json({ data: data[0], success: true });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// update agent in chat

// update agent in chat
router.post('/update_agent_in_chat', validateUser, async (req, res) => {
  try {
    const { assignChat } = require('../services/chatAssignment');
    await assignChat({
      ownerUid: req.decode.uid,
      chatId: req.body.chatId,
      agentUid: req.body.assignAgent?.uid || null,
    });
    res.json({ success: true, msg: 'Updated' });
  } catch (err) {
    res.json({ success: false, msg: err.message });
  }
});

router.post('/del_assign_chat_by_owner', validateUser, async (req, res) => {
  try {
    const { assignChat } = require('../services/chatAssignment');
    await assignChat({ ownerUid: req.decode.uid, chatId: req.body.chat_id });
    res.json({ success: true, msg: 'Chat was removed from the agent' });
  } catch (err) {
    res.json({ success: false, msg: err.message });
  }
});

// login agent
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        msg: 'Please provide email and password',
      });
    }

    // check for user
    const agentFind = await query(`SELECT * FROM agents WHERE email = ?`, [email]);
    if (agentFind.length < 1) {
      return res.json({ msg: 'Invalid credentials' });
    }

    const compare = await bcrypt.compare(password, agentFind[0].password);

    if (!compare) {
      return res.json({ msg: 'Invalid credentials' });
    } else {
      const permissions = JSON.parse(agentFind[0].permissions || '[]');
      const token = sign(
        {
          uid: agentFind[0].uid,
          role: 'agent',
          email: agentFind[0].email,
          owner_uid: agentFind[0]?.owner_uid,
          permissions,
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRY },
      );
      res.json({
        success: true,
        token,
      });
    }
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// get me agent
router.get('/get_me', validateAgent, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM agents WHERE uid = ?`, [req.decode.uid]);
    if (!data.length) {
      return res.json({ success: false, msg: 'Agent not found' });
    }

    const [chatsCountResult] = await query(
      `SELECT COUNT(*)::int AS count FROM agent_chats WHERE uid = ?`,
      [req.decode.uid],
    );
    const [tasksCountResult] = await query(
      `SELECT COUNT(*)::int AS count FROM agent_task WHERE uid = ? AND status != 'COMPLETED'`,
      [req.decode.uid],
    );
    const [resolvedCountResult] = await query(
      `SELECT COUNT(*)::int AS count FROM chats c 
       JOIN agent_chats ac ON c.chat_id = ac.chat_id
       WHERE ac.uid = ? AND (c.chat_status = 'solved' OR c.chat_status = 'SOLVED')`,
      [req.decode.uid],
    );

    const { password, ...safeAgent } = data[0];
    const agentData = {
      ...safeAgent,
      assignedChatsCount: chatsCountResult?.count || 0,
      pendingTasksCount: tasksCountResult?.count || 0,
      resolvedConversationsCount: resolvedCountResult?.count || 0,
      averageResponseTime: '11 mins',
    };

    res.json({ data: agentData, success: true });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// get agent assign chats
router.get('/get_my_assigned_chats', validateAgent, requireInbox('read'), async (req, res) => {
  try {
    let data = [];

    const getMyChatsId = await query(`SELECT * FROM agent_chats WHERE uid = ?`, [req.decode.uid]);

    console.log({
      getMyChatsId,
    });

    if (getMyChatsId.length < 1) {
      return res.json({ data: [], success: true });
    }

    const chatIds = getMyChatsId.map((i) => i?.chat_id);

    console.log({
      chatIds,
    });

    data = await query(
      `SELECT c.*, a.name AS agent_name, a.email AS agent_email 
       FROM chats c 
       LEFT JOIN agents a ON c.assigned_agent_uid = a.uid 
       WHERE c.chat_id IN (?) AND c.uid = ?
       ORDER BY c.kanban_order ASC, c.last_message_came DESC`,
      [chatIds, req.owner?.uid],
    );

    console.log({
      data,
    });

    const getContacts = await query(`SELECT * FROM contact WHERE uid = ?`, [req.owner.uid]);

    if (data.length > 0 && getContacts.length > 0) {
      data = mergeArrays(getContacts, data);
    } else {
      data = data;
    }

    res.json({ data, success: true });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// get chat conversatio
router.post('/get_convo', validateAgent, requireInbox('read'), async (req, res) => {
  try {
    const { chatId } = req.body;

    // Verify agent is assigned to this chat
    if (!(await isAgentAssigned(req.decode.uid, chatId))) {
      return res.json({ success: false, msg: 'Not assigned to this chat' });
    }

    const filePath = `${__dirname}/../conversations/inbox/${req.owner.uid}/${chatId}.json`;
    const data = readJSONFile(filePath, 100);

    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ err, success: false, msg: 'Something went wrong' });
  }
});

// send chat text
router.post('/send_text', validateAgent, requireInbox('reply'), checkPlan, sendAgentReply('text'));

// send audio
router.post(
  '/send_audio',
  validateAgent,
  requireInbox('reply'),
  checkPlan,
  sendAgentReply('audio'),
);

// return image url
router.post('/return_media_url', validateAgent, requireInbox('reply'), async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.json({ success: false, msg: 'No files were uploaded' });
    }

    const randomString = randomstring.generate();
    const file = req.files.file;

    const filename = `${randomString}.${getFileExtension(file.name)}`;

    file.mv(`${__dirname}/../client/public/media/${filename}`, (err) => {
      if (err) {
        console.log(err);
        return res.json({ err });
      }
    });

    const url = `${env.FRONTEND_URL}/media/${filename}`;
    res.json({ success: true, url });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// send document
router.post(
  '/send_doc',
  validateAgent,
  requireInbox('reply'),
  checkPlan,
  sendAgentReply('document'),
);

// send video
router.post(
  '/send_video',
  validateAgent,
  requireInbox('reply'),
  checkPlan,
  sendAgentReply('video'),
);

// send image
router.post(
  '/send_image',
  validateAgent,
  requireInbox('reply'),
  checkPlan,
  sendAgentReply('image'),
);

// get my tasks
router.get('/get_my_task', validateAgent, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM agent_task WHERE uid = ?`, [req.decode.uid]);

    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ err, success: false, msg: 'Something went wrong' });
  }
});

// mark task complete
router.post('/mark_task_complete', validateAgent, async (req, res) => {
  try {
    const { id, comment } = req.body;

    if (!comment) {
      return res.json({ msg: 'Please type your comments.' });
    }

    // Only allow agent to complete their own tasks
    await query(`UPDATE agent_task SET status = ?, agent_comments = ? WHERE id = ? AND uid = ?`, [
      'COMPLETED',
      comment,
      id,
      req.decode.uid,
    ]);

    res.json({ msg: 'Task updated', success: true });
  } catch (err) {
    console.log(err);
    res.json({ err, success: false, msg: 'Something went wrong' });
  }
});

// change chat status
router.post(
  '/change_chat_ticket_status',
  validateAgent,
  requireInbox('reply'),
  async (req, res) => {
    try {
      const { status, chatId } = req.body;

      if (!status || !chatId) {
        return res.json({ msg: 'invalid request' });
      }

      // Verify agent is assigned to this chat
      if (!(await isAgentAssigned(req.decode.uid, chatId))) {
        return res.json({ success: false, msg: 'Not assigned to this chat' });
      }

      const result = await query(
        `UPDATE chats SET chat_status = ? WHERE chat_id = ? AND uid = ? RETURNING id`,
        [status, chatId, req.decode.owner_uid],
      );

      if (result.length === 0) {
        return res.status(403).json({ success: false, msg: 'Unauthorized or not found' });
      }

      res.json({
        success: true,
        msg: 'Chat status updated',
      });
    } catch (err) {
      console.log(err);
      res.json({ err, success: false, msg: 'Something went wrong' });
    }
  },
);

// save chat note
router.post('/save_note', validateAgent, requireInbox('reply'), async (req, res) => {
  try {
    const { chatId, note } = req.body;
    if (!chatId) {
      return res.json({ success: false, msg: 'chatId is required' });
    }
    // Verify agent is assigned to this chat
    if (!(await isAgentAssigned(req.decode.uid, chatId))) {
      return res.json({ success: false, msg: 'Not assigned to this chat' });
    }
    await query('UPDATE chats SET chat_note = ? WHERE chat_id = ? AND uid = ?', [
      note,
      chatId,
      req.decode.owner_uid,
    ]);
    res.json({ success: true, msg: 'Note updated' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// get templets for agent
router.get('/get_templets', validateAgent, requireInbox('read'), async (req, res) => {
  try {
    const data = await query('SELECT * FROM templets WHERE uid = ?', [req.decode.owner_uid]);
    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ err, success: false, msg: 'Something went wrong' });
  }
});

module.exports = router;
