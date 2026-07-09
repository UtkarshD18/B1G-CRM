const router = require('express').Router();
const { query } = require('../database/dbpromise.js');
const randomstring = require('randomstring');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const {
  isValidEmail,
  getFileExtension,
  validateMagicBytes,
  getFileInfo,
  getUserOrderssByMonth,
  sendEmail,
  returnWidget,
  generateWhatsAppURL,
  validateFacebookToken,
  writeJsonToFile,
} = require('../functions/function.js');
const { sign } = require('jsonwebtoken');
const validateUser = require('../middlewares/user.js');
const { checkPlan, checkNote, checkTags, checkContactLimit } = require('../middlewares/plan.js');
const { recoverEmail } = require('../emails/returnEmails.js');
const moment = require('moment');
const jwt = require('jsonwebtoken');
const { checkQr } = require('../helper/addon/qr/index.js');
const env = require('../env.js');
const { addON } = env;
const { invalidatePermissionCache } = require('../utils/permissionResolver.js');
const { logActivity } = require('../utils/activityLogger.js');
const authController = require('../controllers/authController.js');
const userController = require('../controllers/userController.js');
const metaController = require('../controllers/metaController.js');
const billingController = require('../controllers/billingController.js');
const { syncMetaApiKeys } = require('../services/metaService.js');

// facebook login
router.post('/login_with_facebook', async (req, res) => {
  try {
    const { token, userId, email, name } = req.body;

    if (!token || !userId || !email || !name) {
      return res.json({
        msg: 'Login can not be completed, Input not provided',
      });
    }

    // getting app id and secrect
    const [getWeb] = await query(`SELECT * FROM web_public`, []);
    const appId = getWeb?.fb_login_app_id;
    const appSec = getWeb?.fb_login_app_sec;

    if (!appId || !appSec) {
      return res.json({
        msg: 'Please fill the app ID and secrect from the admin panel to complete facebook login',
      });
    }

    const checkToken = await validateFacebookToken(token, appId, appSec);
    if (!checkToken?.success) {
      return res.json({
        msg: 'Can not complete your facebook login some perameteres could not match',
      });
    }

    const resp = checkToken?.response?.data;

    console.log({ resp: JSON.stringify(checkToken) });

    const decodedUserId = resp?.user_id;

    if (decodedUserId == userId && resp?.is_valid) {
      const getUser = await query(`SELECT * FROM user WHERE email = ?`, [email]);

      if (getUser?.length < 1) {
        const uid = randomstring.generate();
        const password = userId;
        const hasPass = await bcrypt.hash(password, 10);
        await query(`INSERT INTO user (name, uid, email, password) VALUES (?,?,?,?)`, [
          name,
          uid,
          email,
          hasPass,
        ]);

        const loginToken = sign(
          {
            uid: uid,
            role: 'user',
            email: email,
          },
          env.JWT_SECRET,
          { expiresIn: env.JWT_EXPIRY },
        );

        res.json({ token: loginToken, success: true });
      } else {
        const loginToken = sign(
          {
            uid: getUser[0].uid,
            role: 'user',
            email: getUser[0].email,
          },
          env.JWT_SECRET,
          { expiresIn: env.JWT_EXPIRY },
        );
        res.json({
          success: true,
          token: loginToken,
        });
      }
    } else {
      res.json({ msg: 'The login token found invalid' });
    }
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// google login
router.post('/login_with_google', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.json({ msg: 'Please check your token its not valid' });
    }

    const decoded = jwt.decode(token, { complete: true });

    if (decoded?.payload?.email && decoded?.payload?.email_verified) {
      const email = decoded?.payload?.email;
      const name = decoded?.payload?.name;

      const getUser = await query(`SELECT * FROM user WHERE email = ?`, [email]);
      if (getUser?.length < 1) {
        const uid = randomstring.generate();
        const password = decoded.header?.kid;
        const hasPass = await bcrypt.hash(password, 10);
        await query(`INSERT INTO user (name, uid, email, password) VALUES (?,?,?,?)`, [
          name,
          uid,
          email,
          hasPass,
        ]);

        const loginToken = sign(
          {
            uid: uid,
            role: 'user',
            email: email,
          },
          env.JWT_SECRET,
          { expiresIn: env.JWT_EXPIRY },
        );

        res.json({ token: loginToken, success: true });
      } else {
        const loginToken = sign(
          {
            uid: getUser[0].uid,
            role: 'user',
            email: getUser[0].email,
          },
          env.JWT_SECRET,
          { expiresIn: env.JWT_EXPIRY },
        );
        res.json({
          success: true,
          token: loginToken,
        });
      }
    } else {
      res.json({
        success: false,
        msg: 'Count not complete google login',
      });
    }
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// signup user
router.post('/signup', authController.signup);

// login user
router.post('/login', authController.login);

// return image url
router.post('/return_media_url', validateUser, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.json({ success: false, msg: 'No files were uploaded' });
    }

    const randomString = randomstring.generate();
    const file = req.files.file;

    if (!validateMagicBytes(file.data, file.name)) {
      return res.json({ success: false, msg: 'File type does not match the file extension' });
    }

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

// get user
router.get('/get_me', validateUser, userController.getMe);

// update notes
router.post('/save_note', validateUser, checkPlan, checkNote, async (req, res) => {
  try {
    const { chatId, note } = req.body;

    const result = await query(
      `UPDATE chats SET chat_note = ? WHERE chat_id = ? AND uid = ? RETURNING id`,
      [note, chatId, req.decode.uid],
    );

    if (result.length === 0) {
      return res.status(403).json({ success: false, msg: 'Unauthorized or not found' });
    }

    res.json({ success: true, msg: 'Notes were updated' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// update tags
router.post('/push_tag', validateUser, checkPlan, checkTags, async (req, res) => {
  try {
    const { tag, chatId } = req.body;

    if (!tag) {
      return res.json({ success: false, msg: 'Please type a tag' });
    }

    const getChat = await query(`SELECT * FROM chats WHERE chat_id = ? AND uid = ?`, [
      chatId,
      req.decode.uid,
    ]);

    if (getChat.length < 1) {
      return res.json({ success: false, msg: 'Chat not found' });
    }
    const getTags = getChat[0]?.chat_tags ? JSON.parse(getChat[0]?.chat_tags) : [];
    const addNew = [...getTags, tag];

    const result = await query(
      `UPDATE chats SET chat_tags = ? WHERE chat_id = ? AND uid = ? RETURNING id`,
      [JSON.stringify(addNew), chatId, req.decode.uid],
    );

    if (result.length === 0) {
      return res.status(403).json({ success: false, msg: 'Unauthorized or not found' });
    }

    res.json({ success: true, msg: 'Tag was added' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// del a tag
router.post('/del_tag', validateUser, async (req, res) => {
  try {
    const { tag, chatId } = req.body;

    const getAll = await query(`SELECT * FROM chats WHERE chat_id = ? AND uid = ?`, [
      chatId,
      req.decode.uid,
    ]);
    if (getAll.length < 1) {
      return res.json({ success: false, msg: 'Chat not found' });
    }

    const getAllTags = getAll[0]?.chat_tags ? JSON.parse(getAll[0]?.chat_tags) : [];

    const newOne = getAllTags?.filter((i) => i !== tag);

    console.log({ newOne });

    const result = await query(
      `UPDATE chats SET chat_tags = ? WHERE chat_id = ? AND uid = ? RETURNING id`,
      [JSON.stringify(newOne), chatId, req.decode.uid],
    );

    if (result.length === 0) {
      return res.status(403).json({ success: false, msg: 'Unauthorized or not found' });
    }

    res.json({ success: true, msg: 'Tag was deleted' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// check contact exist
router.post('/check_contact', validateUser, async (req, res) => {
  try {
    const { mobile } = req.body;

    const findFirst = await query(`SELECT * FROM contact WHERE mobile = ? AND uid = ? `, [
      mobile,
      req.decode.uid,
    ]);
    const getAllPhonebook = await query(`SELECT * FROM phonebook WHERE uid = ?`, [req.decode.uid]);

    if (findFirst.length < 1) {
      return res.json({
        success: false,
        msg: 'Contact not found in phonebook',
        phonebook: getAllPhonebook,
      });
    }

    res.json({
      success: true,
      phonebook: getAllPhonebook,
      contact: findFirst[0],
    });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// save the contact
router.post('/save_contact', validateUser, checkPlan, checkContactLimit, async (req, res) => {
  try {
    const { phoneBookName, phoneBookId, phoneNumber, contactName, var1, var2, var3, var4, var5 } =
      req.body;

    if (!phoneBookName || !phoneBookId || !phoneNumber || !contactName) {
      return res.json({ success: false, msg: 'incomplete input provided' });
    }

    const findExist = await query(`SELECT * FROM contact WHERE mobile = ? AND uid = ?`, [
      phoneNumber,
      req.decode.uid,
    ]);
    if (findExist.length > 0) {
      return res.json({ success: false, msg: 'Contact already existed' });
    }

    await query(
      `INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile, var1, var2, var3, var4, var5) VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [
        req.decode.uid,
        phoneBookId,
        phoneBookName,
        contactName,
        phoneNumber,
        var1 || '',
        var2 || '',
        var3 || '',
        var4 || '',
        var5 || '',
      ],
    );

    res.json({ success: true, msg: 'Contact was added' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

// del contact
router.post('/del_contact', validateUser, async (req, res) => {
  try {
    const { id } = req.body;
    const result = await query(`DELETE FROM contact WHERE id = ? AND uid = ? RETURNING id`, [
      id,
      req.decode.uid,
    ]);
    if (result.length === 0) {
      return res.status(403).json({ success: false, msg: 'Unauthorized or not found' });
    }
    res.json({ success: true, msg: 'Contact was deleted' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong', err });
    console.log(err);
  }
});

router.post('/update_meta', validateUser, metaController.updateMeta);

// get meta keys
router.get('/get_meta_keys', validateUser, metaController.getMetaKeys);

// add meta templet
router.post('/add_meta_templet', validateUser, checkPlan, metaController.addTemplate);

// get user meta templet
router.get('/get_my_meta_templets', validateUser, metaController.getMyTemplates);

// del meta templet
router.post('/del_meta_templet', validateUser, metaController.deleteTemplate);

// update meta templet
router.post('/update_meta_templet', validateUser, metaController.updateTemplate);

// return meta media url
router.post('/return_media_url_meta', validateUser, metaController.uploadMedia);

// get plan detail
router.post('/get_plan_details', validateUser, billingController.getPlanDetails);

// get payment gateway
router.get('/get_payment_details', validateUser, billingController.getPaymentDetails);

router.post('/create_stripe_session', validateUser, billingController.createStripeSession);

router.post('/pay_with_rz', validateUser, billingController.payWithRazorpay);

// pay offline/custom
router.post('/pay_offline', validateUser, billingController.payOffline);

// pay with paypal
router.post('/pay_with_paypal', validateUser, billingController.payWithPaypal);

router.get('/stripe_payment', billingController.stripePaymentCallback);

// pay with paystack
router.post('/pay_with_paystack', validateUser, billingController.payWithPaystack);

// update profile
router.post('/update_profile', validateUser, userController.updateProfile);

// get dashboard
router.get('/get_dashboard', validateUser, async (req, res) => {
  try {
    const getOpenChat = await query(`SELECT * FROM chats WHERE uid = ? AND chat_status = ?`, [
      req.decode.uid,
      'open',
    ]);
    const getOpenPending = await query(`SELECT * FROM chats WHERE uid = ? AND chat_status = ?`, [
      req.decode.uid,
      'pending',
    ]);
    const getOpenResolved = await query(`SELECT * FROM chats WHERE uid = ? AND chat_status = ?`, [
      req.decode.uid,
      'solved',
    ]);

    const getActiveChatbots = await query(`SELECT * FROM chatbot WHERE active = ? AND uid = ?`, [
      1,
      req.decode.uid,
    ]);
    const getDActiveChatbots = await query(`SELECT * FROM chatbot WHERE active = ? AND uid = ?`, [
      0,
      req.decode.uid,
    ]);

    const opened = getUserOrderssByMonth(getOpenChat);
    const pending = getUserOrderssByMonth(getOpenPending);
    const resolved = getUserOrderssByMonth(getOpenResolved);
    const activeBot = getUserOrderssByMonth(getActiveChatbots);
    const dActiveBot = getUserOrderssByMonth(getDActiveChatbots);

    // get total chats
    const totalChats = await query(`SELECT * FROM chats WHERE uid = ?`, [req.decode.uid]);
    const totalChatbots = await query(`SELECT * FROM chatbot WHERE uid = ?`, [req.decode.uid]);
    const totalContacts = await query(`SELECT * FROM contact WHERE uid = ?`, [req.decode.uid]);
    const totalFlows = await query(`SELECT * FROM flow WHERE uid = ?`, [req.decode.uid]);
    const totalBroadcast = await query(`SELECT * FROM broadcast WHERE uid = ?`, [req.decode.uid]);
    const totalTemplets = await query(`SELECT * FROM templets WHERE uid = ?`, [req.decode.uid]);

    res.json({
      success: true,
      opened,
      pending,
      resolved,
      activeBot,
      dActiveBot,
      totalChats: totalChats.length,
      totalChatbots: totalChatbots?.length,
      totalContacts: totalContacts?.length,
      totalFlows: totalFlows?.length,
      totalBroadcast: totalBroadcast?.length,
      totalTemplets: totalTemplets?.length,
    });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'Something went wrong', err, success: false });
  }
});

// enroll free plan
router.post('/start_free_trial', validateUser, billingController.startFreeTrial);

// send recover
router.post('/send_resovery', authController.sendRecovery);

// modify recpvery passwrod
router.get('/modify_password', validateUser, authController.modifyRecoveryPassword);

// generate api keys
router.get('/generate_api_keys', validateUser, async (req, res) => {
  try {
    const token = sign({ uid: req.decode.uid, role: 'user' }, env.JWT_SECRET, {});

    // saving keys to user
    await query(`UPDATE user SET api_key = ? WHERE uid = ?`, [token, req.decode.uid]);

    res.json({ success: true, token, msg: 'New keys has been generated' });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'Something went wrong', err, success: false });
  }
});

router.get('/fetch_profile', validateUser, metaController.fetchProfile);

// adding task for agent
router.post('/add_task_for_agent', validateUser, async (req, res) => {
  try {
    const { title, des, agent_uid } = req.body;
    if (!title || !des) {
      return res.json({ msg: 'Please give title and description' });
    }

    if (!agent_uid) {
      return res.json({ msg: 'Please select an agent' });
    }

    await query(
      `INSERT INTO agent_task (owner_uid, uid, title, description, status) VALUES (?,?,?,?,?)`,
      [req.decode.uid, agent_uid, title, des, 'PENDING'],
    );

    res.json({ success: true, msg: 'Task was added' });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'something went wrong', err });
  }
});

// get my agent tasks
router.get('/get_my_agent_tasks', validateUser, async (req, res) => {
  try {
    const data = await query(
      `
            SELECT agent_task.*, agents.email AS agent_email
            FROM agent_task
            JOIN agents ON agents.uid = agent_task.uid
            WHERE agent_task.owner_uid = ?
        `,
      [req.decode.uid],
    );

    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'something went wrong', err });
  }
});

// delete task for agent
router.post('/del_task_for_agent', validateUser, async (req, res) => {
  try {
    const { id } = req.body;
    await query(`DELETE FROM agent_task WHERE id = ? AND owner_uid = ?`, [id, req.decode.uid]);

    res.json({ msg: 'Task was deleted', success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'something went wrong', err });
  }
});

// add widget
router.post('/add_widget', validateUser, async (req, res) => {
  try {
    const { title, whatsapp_number, place, selectedIcon, logoType, size } = req.body;

    if (!title || !whatsapp_number || !place) {
      return res.json({ msg: 'Please fill the details' });
    }

    const allowedPlaces = [
      'BOTTOM_RIGHT',
      'BOTTOM_LEFT',
      'TOP_RIGHT',
      'TOP_LEFT',
      'BOTTOM_CENTER',
      'TOP_CENTER',
      'ALL_CENTER',
    ];
    const finalPlace = allowedPlaces.includes(place) ? place : 'BOTTOM_RIGHT';

    const parsedSize = parseInt(size, 10);
    const finalSize = isNaN(parsedSize) || parsedSize <= 0 ? 60 : parsedSize;

    const sanitizedNumber = String(whatsapp_number)
      .replace(/[^+\d]/g, '')
      .slice(0, 100);

    let filename;

    if (logoType === 'UPLOAD') {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.json({ success: false, msg: 'Please upload a logo' });
      }

      const randomString = randomstring.generate();
      const file = req.files.file;

      if (!validateMagicBytes(file.data, file.name)) {
        return res.json({ success: false, msg: 'File type does not match the file extension' });
      }

      filename = `${randomString}.${getFileExtension(file.name)}`;

      file.mv(`${__dirname}/../client/public/media/${filename}`, (err) => {
        if (err) {
          console.log(err);
          return res.json({ err });
        }
      });
    } else {
      filename = selectedIcon;
    }

    const unique_id = randomstring.generate(10);

    await query(
      `INSERT INTO chat_widget (unique_id, uid, title, whatsapp_number, logo, place, size) VALUES (?,?,?,?,?,?,?)`,
      [unique_id, req.decode.uid, title, sanitizedNumber, filename, finalPlace, finalSize],
    );

    res.json({
      msg: 'Widget was added',
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'something went wrong', err });
  }
});

// get my widget
router.get('/get_my_widget', validateUser, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM chat_widget WHERE uid = ?`, [req.decode.uid]);

    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'something went wrong', err });
  }
});

// del widget
router.post('/del_widget', validateUser, async (req, res) => {
  try {
    const { id } = req.body;

    const result = await query(`DELETE FROM chat_widget WHERE id = ? AND uid = ? RETURNING id`, [
      id,
      req.decode.uid,
    ]);

    if (result.length === 0) {
      return res.status(403).json({ success: false, msg: 'Unauthorized or not found' });
    }

    res.json({ msg: 'Widget was deleted', success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'something went wrong', err });
  }
});

router.get('/widget', async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.send(``);
    }

    const getWidget = await query(`SELECT * FROM chat_widget WHERE unique_id = ?`, [id]);

    if (getWidget.length < 1) {
      return res.send(``);
    }

    const url = generateWhatsAppURL(getWidget[0]?.whatsapp_number, getWidget[0]?.title);

    res.send(
      returnWidget(
        `${env.FRONTEND_URL}/media/${getWidget[0]?.logo}`,
        getWidget[0]?.size,
        url,
        getWidget[0]?.place,
      ),
    );
  } catch (err) {
    console.log(err);
    res.json({ msg: 'something went wrong', err });
  }
});

// update agent profile
router.post('/update_agent_profile', validateUser, async (req, res) => {
  try {
    const { email, name, mobile, newPas, uid, permissions } = req.body;

    if (!email || !name || !mobile) {
      return res.json({
        msg: 'You can not remove any detail of agent',
      });
    }

    const permissionsJson = JSON.stringify(permissions || []);

    if (newPas) {
      const hasPas = await bcrypt.hash(newPas, 10);
      await query(
        `UPDATE agents SET email = ?, name = ?, mobile = ?, password = ?, permissions = ? WHERE uid = ? AND owner_uid = ?`,
        [email, name, mobile, hasPas, permissionsJson, uid, req.decode.uid],
      );
    } else {
      await query(
        `UPDATE agents SET email = ?, name = ?, mobile = ?, permissions = ? WHERE uid = ? AND owner_uid = ?`,
        [email, name, mobile, permissionsJson, uid, req.decode.uid],
      );
    }

    invalidatePermissionCache(uid);
    await logActivity(req, 'Users', 'update_agent_profile', email, { agent_uid: uid });

    res.json({ msg: 'Agent profile was updated', success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'something went wrong', err });
  }
});

// auto login agent
router.post('/auto_agent_login', validateUser, async (req, res) => {
  try {
    const { uid } = req.body;
    const agentFind = await query(`SELECT * FROM agents WHERE uid = ? AND owner_uid = ?`, [
      uid,
      req.decode.uid,
    ]);
    if (agentFind.length < 1) {
      return res.json({ success: false, msg: 'Agent not found or unauthorized' });
    }

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

    res.json({ token, success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'something went wrong', err });
  }
});

// seed demo crm data
router.post('/seed_demo_data', validateUser, async (req, res) => {
  try {
    const pbName = 'Demo Leads Phonebook';
    // Insert phonebook
    let pbId;
    const existingPb = await query(`SELECT * FROM phonebook WHERE uid = ? AND name = ?`, [
      req.decode.uid,
      pbName,
    ]);
    if (existingPb.length > 0) {
      pbId = existingPb[0].id;
    } else {
      const insertPb = await query(`INSERT INTO phonebook (uid, name) VALUES (?, ?) RETURNING id`, [
        req.decode.uid,
        pbName,
      ]);
      if (insertPb && insertPb.length > 0) {
        pbId = insertPb[0].id;
      } else {
        const getPb = await query(`SELECT id FROM phonebook WHERE uid = ? AND name = ?`, [
          req.decode.uid,
          pbName,
        ]);
        pbId = getPb[0]?.id;
      }
    }

    if (!pbId) {
      return res.json({ success: false, msg: 'Failed to initialize demo phonebook' });
    }

    // 10 Contacts
    const contacts = [
      {
        name: 'Aarav Mehta',
        mobile: '+919999900001',
        var1: 'VIP',
        var2: 'Retail',
        var3: 'Mumbai',
        var4: 'Interested',
        var5: 'Ref-01',
      },
      {
        name: 'Diya Sharma',
        mobile: '+919999900002',
        var1: 'Regular',
        var2: 'Wholesale',
        var3: 'Delhi',
        var4: 'FollowUp',
        var5: 'Ref-02',
      },
      {
        name: 'Kabir Singh',
        mobile: 'demo-chat-insta-3',
        var1: 'New',
        var2: 'Retail',
        var3: 'Bangalore',
        var4: 'Interested',
        var5: 'Ref-03',
      },
      {
        name: 'Ananya Goel',
        mobile: '+919999900004',
        var1: 'VIP',
        var2: 'Enterprise',
        var3: 'Hyderabad',
        var4: 'Active',
        var5: 'Ref-04',
      },
      {
        name: 'Vivaan Shah',
        mobile: '+919999900005',
        var1: 'Inactive',
        var2: 'Retail',
        var3: 'Pune',
        var4: 'Cold',
        var5: 'Ref-05',
      },
      {
        name: 'Ira Patel',
        mobile: '+919999900006',
        var1: 'Regular',
        var2: 'Retail',
        var3: 'Ahmedabad',
        var4: 'Interested',
        var5: 'Ref-06',
      },
      {
        name: 'Reyansh Gupta',
        mobile: '+919999900007',
        var1: 'VIP',
        var2: 'Enterprise',
        var3: 'Chennai',
        var4: 'Negotiation',
        var5: 'Ref-07',
      },
      {
        name: 'Myra Sen',
        mobile: '+919999900008',
        var1: 'New',
        var2: 'Retail',
        var3: 'Kolkata',
        var4: 'FollowUp',
        var5: 'Ref-08',
      },
      {
        name: 'Arjun Verma',
        mobile: '+919999900009',
        var1: 'VIP',
        var2: 'Wholesale',
        var3: 'Jaipur',
        var4: 'Interested',
        var5: 'Ref-09',
      },
      {
        name: 'Sai Reddy',
        mobile: '+919999900010',
        var1: 'Regular',
        var2: 'Retail',
        var3: 'Kochi',
        var4: 'Warm',
        var5: 'Ref-10',
      },
    ];

    for (const c of contacts) {
      const checkContact = await query(`SELECT * FROM contact WHERE uid = ? AND mobile = ?`, [
        req.decode.uid,
        c.mobile,
      ]);
      if (checkContact.length === 0) {
        await query(
          `INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile, var1, var2, var3, var4, var5) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [req.decode.uid, pbId, pbName, c.name, c.mobile, c.var1, c.var2, c.var3, c.var4, c.var5],
        );
      }
    }

    // 1 Campaign
    const broadcastId = 'bc_demo_' + randomstring.generate(6);
    const existingBc = await query(`SELECT * FROM broadcast WHERE uid = ? AND title = ?`, [
      req.decode.uid,
      'Demo Launch Campaign',
    ]);
    if (existingBc.length === 0) {
      await query(
        `INSERT INTO broadcast (broadcast_id, uid, title, templet, phonebook, status, schedule, timezone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          broadcastId,
          req.decode.uid,
          'Demo Launch Campaign',
          JSON.stringify({ name: 'demo_welcome_template', language: 'en_US', category: 'UTILITY' }),
          JSON.stringify({ id: pbId, name: pbName }),
          'COMPLETED',
          new Date(),
          'Asia/Kolkata',
        ],
      );

      // Seed 10 logs for campaign analytics
      const deliveryStatuses = [
        'read',
        'delivered',
        'read',
        'failed',
        'read',
        'delivered',
        'sent',
        'read',
        'read',
        'delivered',
      ];
      const errors = [
        null,
        null,
        null,
        'Meta rate limit reached',
        null,
        null,
        null,
        null,
        null,
        null,
      ];
      for (let i = 0; i < contacts.length; i++) {
        await query(
          `INSERT INTO broadcast_log (uid, broadcast_id, templet_name, sender_mobile, send_to, delivery_status, example, contact, meta_msg_id, delivery_time, err) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            req.decode.uid,
            broadcastId,
            'demo_welcome_template',
            '+12025550184',
            contacts[i].mobile,
            deliveryStatuses[i],
            JSON.stringify([contacts[i].name]),
            JSON.stringify(contacts[i]),
            'wamid.' + randomstring.generate(16),
            Date.now() - i * 3600 * 1000,
            errors[i],
          ],
        );
      }
    }

    // Seed templates
    const existingTemp1 = await query(`SELECT * FROM templets WHERE uid = ? AND title = ?`, [
      req.decode.uid,
      'demo_welcome_template',
    ]);
    if (existingTemp1.length === 0) {
      await query(`INSERT INTO templets (uid, content, type, title) VALUES (?, ?, ?, ?)`, [
        req.decode.uid,
        JSON.stringify('Hello {{1}}, welcome to our CRM service!'),
        'text',
        'demo_welcome_template',
      ]);
    }
    const existingTemp2 = await query(`SELECT * FROM templets WHERE uid = ? AND title = ?`, [
      req.decode.uid,
      'order_update',
    ]);
    if (existingTemp2.length === 0) {
      await query(`INSERT INTO templets (uid, content, type, title) VALUES (?, ?, ?, ?)`, [
        req.decode.uid,
        JSON.stringify('Hello {{1}}, your order {{2}} has been shipped.'),
        'text',
        'order_update',
      ]);
    }

    // 1 Flow
    const flowId = `flow_demo_welcome_${req.decode.uid.slice(0, 10)}`;
    const flowTitle = 'Demo Welcome Visual Flow';
    const existingFlow = await query(`SELECT * FROM flow WHERE uid = ? AND flow_id = ?`, [
      req.decode.uid,
      flowId,
    ]);
    if (existingFlow.length === 0) {
      await query(`INSERT INTO flow (uid, flow_id, title) VALUES (?, ?, ?)`, [
        req.decode.uid,
        flowId,
        flowTitle,
      ]);
    }
    const nodes = [
      { id: '1', type: 'START', data: { label: 'Start Trigger' } },
      { id: '2', type: 'MESSAGE', data: { label: 'Send Welcome Text' } },
    ];
    const edges = [{ id: 'e1-2', source: '1', target: '2' }];
    const nodepath = path.join(__dirname, `../flow-json/nodes/${req.decode.uid}/${flowId}.json`);
    const edgepath = path.join(__dirname, `../flow-json/edges/${req.decode.uid}/${flowId}.json`);
    await writeJsonToFile(nodepath, nodes);
    await writeJsonToFile(edgepath, edges);

    // 1 Chatbot
    const existingBot = await query(`SELECT * FROM chatbot WHERE uid = ? AND flow_id = ?`, [
      req.decode.uid,
      flowId,
    ]);
    let botId;
    if (existingBot.length > 0) {
      botId = existingBot[0].id;
    } else {
      const insertBot = await query(
        `INSERT INTO chatbot (uid, title, for_all, chats, flow, flow_id, active, origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
        [
          req.decode.uid,
          'Demo Welcome Autopilot',
          1,
          '[]',
          JSON.stringify({ id: flowId, flow_id: flowId, title: flowTitle }),
          flowId,
          1,
          JSON.stringify({ title: 'Meta', code: 'META', data: {} }),
        ],
      );
      if (insertBot && insertBot.length > 0) {
        botId = insertBot[0].id;
      } else {
        const getBot = await query(`SELECT id FROM chatbot WHERE uid = ? AND flow_id = ?`, [
          req.decode.uid,
          flowId,
        ]);
        botId = getBot[0]?.id;
      }
    }

    // Seed chatbot logs for diagnostics
    const incomingMessages = ['hi', 'hello', 'need help', 'get price', 'operator'];
    const matchedStatuses = [1, 1, 1, 0, 1];
    const logStatuses = ['replied', 'replied', 'replied', 'unmatched', 'escalated'];
    const details = [
      { reply_count: 1 },
      { reply_count: 1 },
      { reply_count: 2 },
      { reason: 'No matching text intent block' },
      { reason: 'Assigned to human agent' },
    ];
    for (let i = 0; i < incomingMessages.length; i++) {
      await query(
        `INSERT INTO chatbot_log (uid, chatbot_id, chatbot_title, flow_id, sender_number, sender_name, incoming_message, origin, matched, status, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.decode.uid,
          botId || 999,
          'Demo Welcome Autopilot',
          flowId,
          contacts[i].mobile,
          contacts[i].name,
          incomingMessages[i],
          'META',
          matchedStatuses[i],
          logStatuses[i],
          JSON.stringify(details[i]),
        ],
      );
    }

    // 1 Agent
    const agentEmail = `demo_agent_${req.decode.uid.slice(0, 6)}@example.com`;
    const agentUid = `agent_${randomstring.generate(8)}`;
    const existingAgent = await query(`SELECT * FROM agents WHERE owner_uid = ? AND email = ?`, [
      req.decode.uid,
      agentEmail,
    ]);
    let actualAgentUid;
    if (existingAgent.length > 0) {
      actualAgentUid = existingAgent[0].uid;
    } else {
      const demoAgentPassword = process.env.DEMO_AGENT_PASSWORD || 'CHANGE_ME';
      const hasPass = await bcrypt.hash(demoAgentPassword, 10);
      await query(
        `INSERT INTO agents (owner_uid, uid, email, password, role, name, comments, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          req.decode.uid,
          agentUid,
          agentEmail,
          hasPass,
          'agent',
          'Demo Agent',
          'Demo workspace agent account',
          1,
        ],
      );
      actualAgentUid = agentUid;
    }

    // 1 Task
    const existingTask = await query(`SELECT * FROM agent_task WHERE owner_uid = ? AND uid = ?`, [
      req.decode.uid,
      actualAgentUid,
    ]);
    if (existingTask.length === 0) {
      await query(
        `INSERT INTO agent_task (owner_uid, uid, title, description, status) VALUES (?, ?, ?, ?, ?)`,
        [
          req.decode.uid,
          actualAgentUid,
          'Follow up with Aarav Mehta',
          'Aarav is marked as VIP Retail client. Contact him to discuss custom integration discount pricing options.',
          'PENDING',
        ],
      );
    }

    // 3 Conversations
    const sampleChats = [
      {
        chatId: 'demo-chat-wa-1',
        senderName: 'Aarav Mehta',
        senderMobile: '+919999900001',
        origin: 'META',
        tag: 'lead',
        note: 'Interested in Enterprise pricing plan.',
        messages: [
          {
            type: 'text',
            metaChatId: 'msg-wa-1',
            msgContext: {
              type: 'text',
              text: { body: 'Hello! I am trying to connect my business phone.' },
            },
            timestamp: Math.floor(Date.now() / 1000) - 3600,
            senderName: 'Aarav Mehta',
            senderMobile: '+919999900001',
            status: 'received',
            star: false,
            route: 'INCOMING',
            context: '',
            origin: 'META',
          },
        ],
      },
      {
        chatId: 'demo-chat-qr-2',
        senderName: 'Diya Sharma',
        senderMobile: '+919999900002',
        origin: 'QR',
        tag: 'support',
        note: 'Struggling with setting up templates.',
        messages: [
          {
            type: 'text',
            metaChatId: 'msg-qr-2',
            msgContext: {
              type: 'text',
              text: { body: 'Hi, can you verify why my campaign status says PAUSED?' },
            },
            timestamp: Math.floor(Date.now() / 1000) - 1800,
            senderName: 'Diya Sharma',
            senderMobile: '+919999900002',
            status: 'received',
            star: false,
            route: 'INCOMING',
            context: '',
            origin: 'QR',
          },
        ],
      },
      {
        chatId: 'demo-chat-insta-3',
        senderName: 'Kabir Singh',
        senderMobile: 'demo-chat-insta-3',
        origin: 'instagram',
        tag: 'general',
        note: 'Asking about European delivery options.',
        messages: [
          {
            type: 'text',
            metaChatId: 'msg-insta-3',
            msgContext: {
              type: 'text',
              text: { body: 'Hey! Do you offer bulk discounts on custom orders?' },
            },
            timestamp: Math.floor(Date.now() / 1000) - 600,
            senderName: 'Kabir Singh',
            senderMobile: 'demo-chat-insta-3',
            status: 'received',
            star: false,
            route: 'INCOMING',
            context: '',
            origin: 'instagram',
          },
        ],
      },
    ];

    for (const sc of sampleChats) {
      const checkChat = await query(`SELECT * FROM chats WHERE chat_id = ? AND uid = ?`, [
        sc.chatId,
        req.decode.uid,
      ]);
      if (checkChat.length === 0) {
        await query(
          `INSERT INTO chats (chat_id, uid, last_message_came, sender_name, sender_mobile, last_message, is_opened, chat_status, chat_note, chat_tags, origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            sc.chatId,
            req.decode.uid,
            sc.messages[0].timestamp,
            sc.senderName,
            sc.senderMobile,
            JSON.stringify(sc.messages[0]),
            0,
            'open',
            sc.note,
            JSON.stringify([sc.tag]),
            sc.origin,
          ],
        );
      }

      const convPath = path.join(
        __dirname,
        `../conversations/inbox/${req.decode.uid}/${sc.chatId}.json`,
      );
      await writeJsonToFile(convPath, sc.messages);
    }

    res.json({ success: true, msg: 'Demo CRM workspace successfully seeded!' });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: 'something went wrong', error: err.message });
  }
});

module.exports = router;
