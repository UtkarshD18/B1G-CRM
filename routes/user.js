const router = require("express").Router();
const { query } = require("../database/dbpromise.js");
const randomstring = require("randomstring");
const bcrypt = require("bcrypt");
const fs = require("fs");
const path = require("path");
const {
  isValidEmail,
  getFileExtension,
  getBusinessPhoneNumber,
  createMetaTemplet,
  getAllTempletsMeta,
  delMetaTemplet,
  getFileInfo,
  getSessionUploadMediaMeta,
  uploadFileMeta,
  updateUserPlan,
  getUserOrderssByMonth,
  sendEmail,
  fetchProfileFun,
  returnWidget,
  generateWhatsAppURL,
  rzCapturePayment,
  validateFacebookToken,
  writeJsonToFile,
} = require("../functions/function.js");
const { sign } = require("jsonwebtoken");
const validateUser = require("../middlewares/user.js");
const Stripe = require("stripe");
const {
  checkPlan,
  checkNote,
  checkTags,
  checkContactLimit,
} = require("../middlewares/plan.js");
const { recoverEmail } = require("../emails/returnEmails.js");
const moment = require("moment");
const fetch = require("node-fetch");
const jwt = require("jsonwebtoken");
const { checkQr } = require("../helper/addon/qr/index.js");
const env = require("../env.js");
const { addON } = env;

// facebook login
router.post("/login_with_facebook", async (req, res) => {
  try {
    const { token, userId, email, name } = req.body;

    if (!token || !userId || !email || !name) {
      return res.json({
        msg: "Login can not be completed, Input not provided",
      });
    }

    // getting app id and secrect
    const [getWeb] = await query(`SELECT * FROM web_public`, []);
    const appId = getWeb?.fb_login_app_id;
    const appSec = getWeb?.fb_login_app_sec;

    if (!appId || !appSec) {
      return res.json({
        msg: "Please fill the app ID and secrect from the admin panel to complete facebook login",
      });
    }

    const checkToken = await validateFacebookToken(token, appId, appSec);
    if (!checkToken?.success) {
      return res.json({
        msg: "Can not complete your facebook login some perameteres could not match",
      });
    }

    const resp = checkToken?.response?.data;

    console.log({ resp: JSON.stringify(checkToken) });

    const decodedUserId = resp?.user_id;

    if (decodedUserId == userId && resp?.is_valid) {
      const getUser = await query(`SELECT * FROM user WHERE email = ?`, [
        email,
      ]);

      if (getUser?.length < 1) {
        const uid = randomstring.generate();
        const password = userId;
        const hasPass = await bcrypt.hash(password, 10);
        await query(
          `INSERT INTO user (name, uid, email, password) VALUES (?,?,?,?)`,
          [name, uid, email, hasPass]
        );

        const loginToken = sign(
          {
            uid: uid,
            role: "user",
            password: hasPass,
            email: email,
          },
          env.JWT_SECRET,
          {}
        );

        res.json({ token: loginToken, success: true });
      } else {
        const loginToken = sign(
          {
            uid: getUser[0].uid,
            role: "user",
            password: getUser[0].password,
            email: getUser[0].email,
          },
          env.JWT_SECRET,
          {}
        );
        res.json({
          success: true,
          token: loginToken,
        });
      }
    } else {
      res.json({ msg: "The login token found invalid" });
    }
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// google login
router.post("/login_with_google", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.json({ msg: "Please check your token its not valid" });
    }

    const decoded = jwt.decode(token, { complete: true });

    if (decoded?.payload?.email && decoded?.payload?.email_verified) {
      const email = decoded?.payload?.email;
      const name = decoded?.payload?.name;

      const getUser = await query(`SELECT * FROM user WHERE email = ?`, [
        email,
      ]);
      if (getUser?.length < 1) {
        const uid = randomstring.generate();
        const password = decoded.header?.kid;
        const hasPass = await bcrypt.hash(password, 10);
        await query(
          `INSERT INTO user (name, uid, email, password) VALUES (?,?,?,?)`,
          [name, uid, email, hasPass]
        );

        const loginToken = sign(
          {
            uid: uid,
            role: "user",
            password: hasPass,
            email: email,
          },
          env.JWT_SECRET,
          {}
        );

        res.json({ token: loginToken, success: true });
      } else {
        const loginToken = sign(
          {
            uid: getUser[0].uid,
            role: "user",
            password: getUser[0].password,
            email: getUser[0].email,
          },
          env.JWT_SECRET,
          {}
        );
        res.json({
          success: true,
          token: loginToken,
        });
      }
    } else {
      res.json({
        success: false,
        msg: "Count not complete google login",
      });
    }
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// aignup user
router.post("/signup", async (req, res) => {
  try {
    const { email, name, password, mobile_with_country_code, acceptPolicy } =
      req.body;

    if (!email || !name || !password || !mobile_with_country_code) {
      return res.json({ msg: "Please fill the details", success: false });
    }

    if (!acceptPolicy) {
      return res.json({
        msg: "You did not click on checkbox of Privacy & Terms",
        success: false,
      });
    }

    if (!isValidEmail(email)) {
      return res.json({ msg: "Please enter a valid email", success: false });
    }

    // check if user already has same email
    const findEx = await query(`SELECT * FROM user WHERE email = ?`, email);
    if (findEx.length > 0) {
      return res.json({ msg: "A user already exist with this email" });
    }

    const haspass = await bcrypt.hash(password, 10);
    const uid = randomstring.generate();

    await query(
      `INSERT INTO user (name, uid, email, password, mobile_with_country_code) VALUES (?,?,?,?,?)`,
      [name, uid, email, haspass, mobile_with_country_code]
    );

    res.json({ msg: "Signup Success", success: true });
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// login user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({
        success: false,
        msg: "Please provide email and password",
      });
    }

    // check for user
    const userFind = await query(`SELECT * FROM user WHERE email = ?`, [email]);
    if (userFind.length < 1) {
      return res.json({ msg: "Invalid credentials" });
    }

    const compare = await bcrypt.compare(password, userFind[0].password);

    if (!compare) {
      return res.json({ msg: "Invalid credentials" });
    } else {
      const token = sign(
        {
          uid: userFind[0].uid,
          role: "user",
          password: userFind[0].password,
          email: userFind[0].email,
        },
        env.JWT_SECRET,
        {}
      );
      res.json({
        success: true,
        token,
      });
    }
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// return image url
router.post("/return_media_url", validateUser, async (req, res) => {
  try {
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.json({ success: false, msg: "No files were uploaded" });
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
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// get user
router.get("/get_me", validateUser, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM user WHERE uid = ?`, [
      req.decode.uid,
    ]);

    const qrCheck = checkQr();
    const finalAddon = qrCheck ? [...addON, "QR"] : addON;

    // getting phonebook
    const contact = await query(`SELECT * FROM contact WHERE uid = ?`, [
      req.decode.uid,
    ]);

    res.json({
      data: { ...data[0], contact: contact.length },
      success: true,
      addon: finalAddon,
    });
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// update notes
router.post(
  "/save_note",
  validateUser,
  checkPlan,
  checkNote,
  async (req, res) => {
    try {
      const { chatId, note } = req.body;

      await query(`UPDATE chats SET chat_note = ? WHERE chat_id = ?`, [
        note,
        chatId,
      ]);
      res.json({ success: true, msg: "Notes were updated" });
    } catch (err) {
      res.json({ success: false, msg: "something went wrong", err });
      console.log(err);
    }
  }
);

// update tags
router.post(
  "/push_tag",
  validateUser,
  checkPlan,
  checkTags,
  async (req, res) => {
    try {
      const { tag, chatId } = req.body;

      if (!tag) {
        return res.json({ success: false, msg: "Please type a tag" });
      }

      const getChat = await query(`SELECT * FROM chats WHERE chat_id = ?`, [
        chatId,
      ]);

      if (getChat.length < 1) {
        return res.json({ success: false, msg: "Chat not found" });
      }
      const getTags = getChat[0]?.chat_tags
        ? JSON.parse(getChat[0]?.chat_tags)
        : [];
      const addNew = [...getTags, tag];

      await query(`UPDATE chats SET chat_tags = ? WHERE chat_id = ?`, [
        JSON.stringify(addNew),
        chatId,
      ]);

      res.json({ success: true, msg: "Tag was added" });
    } catch (err) {
      res.json({ success: false, msg: "something went wrong", err });
      console.log(err);
    }
  }
);

// del a tag
router.post("/del_tag", validateUser, async (req, res) => {
  try {
    const { tag, chatId } = req.body;

    const getAll = await query(`SELECT * FROM chats WHERE chat_id = ?`, [
      chatId,
    ]);
    if (getAll.length < 1) {
      return res.json({ success: false, msg: "Chat not found" });
    }

    const getAllTags = getAll[0]?.chat_tags
      ? JSON.parse(getAll[0]?.chat_tags)
      : [];

    const newOne = getAllTags?.filter((i) => i !== tag);

    console.log({ newOne });

    await query(`UPDATE chats SET chat_tags = ? WHERE chat_id = ?`, [
      JSON.stringify(newOne),
      chatId,
    ]);

    res.json({ success: true, msg: "Tag was deleted" });
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// check contact exist
router.post("/check_contact", validateUser, async (req, res) => {
  try {
    const { mobile } = req.body;

    const findFirst = await query(
      `SELECT * FROM contact WHERE mobile = ? AND uid = ? `,
      [mobile, req.decode.uid]
    );
    const getAllPhonebook = await query(
      `SELECT * FROM phonebook WHERE uid = ?`,
      [req.decode.uid]
    );

    if (findFirst.length < 1) {
      return res.json({
        success: false,
        msg: "Contact not found in phonebook",
        phonebook: getAllPhonebook,
      });
    }

    res.json({
      success: true,
      phonebook: getAllPhonebook,
      contact: findFirst[0],
    });
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// save the contact
router.post(
  "/save_contact",
  validateUser,
  checkPlan,
  checkContactLimit,
  async (req, res) => {
    try {
      const {
        phoneBookName,
        phoneBookId,
        phoneNumber,
        contactName,
        var1,
        var2,
        var3,
        var4,
        var5,
      } = req.body;

      if (!phoneBookName || !phoneBookId || !phoneNumber || !contactName) {
        return res.json({ success: false, msg: "incomplete input provided" });
      }

      const findExist = await query(
        `SELECT * FROM contact WHERE mobile = ? AND uid = ?`,
        [phoneNumber, req.decode.uid]
      );
      if (findExist.length > 0) {
        return res.json({ success: false, msg: "Contact already existed" });
      }

      await query(
        `INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile, var1, var2, var3, var4, var5) VALUES (?,?,?,?,?,?,?,?,?,?)`,
        [
          req.decode.uid,
          phoneBookId,
          phoneBookName,
          contactName,
          phoneNumber,
          var1 || "",
          var2 || "",
          var3 || "",
          var4 || "",
          var5 || "",
        ]
      );

      res.json({ success: true, msg: "Contact was added" });
    } catch (err) {
      res.json({ success: false, msg: "something went wrong", err });
      console.log(err);
    }
  }
);

// del contact
router.post("/del_contact", validateUser, async (req, res) => {
  try {
    const { id } = req.body;
    await query(`DELETE FROM contact WHERE id = ?`, [id]);
    res.json({ success: true, msg: "Contact was deleted" });
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

router.post("/update_meta", validateUser, async (req, res) => {
  try {
    const {
      waba_id,
      business_account_id,
      access_token,
      business_phone_number_id,
      app_id,
    } = req.body;

    if (
      !waba_id ||
      !business_account_id ||
      !access_token ||
      !business_phone_number_id ||
      !app_id
    ) {
      return res.json({ success: false, msg: "Please fill all the fields" });
    }

    const resp = await getBusinessPhoneNumber(
      "v18.0",
      business_phone_number_id,
      access_token
    );

    if (resp?.error) {
      return res.json({
        success: false,
        msg: resp?.error?.message || "Please check your details",
      });
    }

    const findOne = await query(`SELECT * FROM meta_api WHERE uid = ?`, [
      req.decode.uid,
    ]);
    if (findOne.length > 0) {
      await query(
        `UPDATE meta_api SET waba_id = ?, business_account_id = ?, access_token = ?, business_phone_number_id = ?, app_id = ? WHERE uid = ?`,
        [
          waba_id,
          business_account_id,
          access_token,
          business_phone_number_id,
          app_id,
          req.decode.uid,
        ]
      );
    } else {
      await query(
        `INSERT INTO meta_api (uid, waba_id, business_account_id, access_token, business_phone_number_id, app_id) VALUES (?,?,?,?,?,?)`,
        [
          req.decode.uid,
          waba_id,
          business_account_id,
          access_token,
          business_phone_number_id,
          app_id,
        ]
      );
    }

    res.json({
      success: true,
      msg: "Your meta settings were updated successfully!",
    });
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// get meta keys
router.get("/get_meta_keys", validateUser, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM meta_api WHERE uid = ?`, [
      req.decode.uid,
    ]);
    if (data.length < 1) {
      res.json({ success: true, data: {} });
    } else {
      res.json({ success: true, data: data[0] });
    }
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// add meta templet
router.post("/add_meta_templet", validateUser, checkPlan, async (req, res) => {
  try {
    console.log(JSON.stringify(req.body));

    if (env.MOCK_META_DELIVERY) {
      const mockFilePath = path.join(__dirname, "../conversations", `mock_meta_templates_${req.decode.uid}.json`);
      let mockTemplates = [];
      if (fs.existsSync(mockFilePath)) {
        mockTemplates = JSON.parse(fs.readFileSync(mockFilePath, "utf8"));
      }
      const newTemplate = {
        name: req.body.name,
        language: req.body.language || "en_US",
        category: req.body.category || "UTILITY",
        status: "APPROVED",
        components: req.body.components || []
      };
      const idx = mockTemplates.findIndex(t => t.name === newTemplate.name);
      if (idx >= 0) {
        mockTemplates[idx] = newTemplate;
      } else {
        mockTemplates.push(newTemplate);
      }
      fs.writeFileSync(mockFilePath, JSON.stringify(mockTemplates, null, 2), "utf8");
      return res.json({
        msg: "Templet was added and waiting for the review",
        success: true,
      });
    }

    const getAPIKEYS = await query(`SELECT * FROM meta_api WHERE uid = ?`, [
      req.decode.uid,
    ]);

    if (getAPIKEYS.length < 1) {
      return res.json({
        success: false,
        msg: "Please fill your meta API keys",
      });
    }

    const resp = await createMetaTemplet(
      "v18.0",
      getAPIKEYS[0]?.waba_id,
      getAPIKEYS[0]?.access_token,
      req.body
    );

    if (resp.error) {
      res.json({ msg: resp?.error?.error_user_msg || resp?.error?.message });
    } else {
      console.log(resp);
      res.json({
        msg: "Templet was added and waiting for the review",
        success: true,
      });
    }
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// get user meta templet
router.get("/get_my_meta_templets", validateUser, async (req, res) => {
  try {
    if (env.MOCK_META_DELIVERY) {
      const mockFilePath = path.join(__dirname, "../conversations", `mock_meta_templates_${req.decode.uid}.json`);
      let mockTemplates = [];
      if (fs.existsSync(mockFilePath)) {
        mockTemplates = JSON.parse(fs.readFileSync(mockFilePath, "utf8"));
      } else {
        mockTemplates = [
          {
            name: "order_update",
            language: "en_US",
            category: "UTILITY",
            status: "APPROVED",
            components: [
              { type: "BODY", text: "Hello {{1}}, your order {{2}} has been shipped." }
            ]
          }
        ];
        fs.writeFileSync(mockFilePath, JSON.stringify(mockTemplates, null, 2), "utf8");
      }
      return res.json({ success: true, data: mockTemplates });
    }

    const getMETA = await query(`SELECT * FROM meta_api WHERE uid = ?`, [
      req.decode.uid,
    ]);
    if (getMETA.length < 1) {
      return res.json({
        success: false,
        msg: "Please check your meta API keys",
      });
    }

    const resp = await getAllTempletsMeta(
      "v18.0",
      getMETA[0]?.waba_id,
      getMETA[0]?.access_token
    );

    if (resp?.error) {
      res.json({
        success: false,
        msg: resp?.error?.message || "Please check your API",
      });
    } else {
      res.json({ success: true, data: resp?.data || [] });
    }
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// del meta templet
router.post("/del_meta_templet", validateUser, async (req, res) => {
  try {
    const { name } = req.body;

    if (env.MOCK_META_DELIVERY) {
      const mockFilePath = path.join(__dirname, "../conversations", `mock_meta_templates_${req.decode.uid}.json`);
      let mockTemplates = [];
      if (fs.existsSync(mockFilePath)) {
        mockTemplates = JSON.parse(fs.readFileSync(mockFilePath, "utf8"));
      }
      mockTemplates = mockTemplates.filter(t => t.name !== name);
      fs.writeFileSync(mockFilePath, JSON.stringify(mockTemplates, null, 2), "utf8");
      return res.json({
        success: true,
        data: mockTemplates,
        msg: "Templet was deleted",
      });
    }

    const getMETA = await query(`SELECT * FROM meta_api WHERE uid = ?`, [
      req.decode.uid,
    ]);
    if (getMETA.length < 1) {
      return res.json({
        success: false,
        msg: "Please check your meta API keys",
      });
    }

    const resp = await delMetaTemplet(
      "v18.0",
      getMETA[0]?.waba_id,
      getMETA[0]?.access_token,
      name
    );

    if (resp.error) {
      return res.json({
        success: false,
        msg: resp?.error?.error_user_title || "Please check your API",
      });
    } else {
      res.json({
        success: true,
        data: resp?.data || [],
        msg: "Templet was deleted",
      });
    }
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// update meta templet
router.post("/update_meta_templet", validateUser, async (req, res) => {
  try {
    const { name, language, category, components } = req.body;

    if (env.MOCK_META_DELIVERY) {
      const mockFilePath = path.join(__dirname, "../conversations", `mock_meta_templates_${req.decode.uid}.json`);
      let mockTemplates = [];
      if (fs.existsSync(mockFilePath)) {
        mockTemplates = JSON.parse(fs.readFileSync(mockFilePath, "utf8"));
      }
      const idx = mockTemplates.findIndex(t => t.name === name);
      if (idx < 0) {
        return res.json({ success: false, msg: "Template not found" });
      }
      mockTemplates[idx] = {
        ...mockTemplates[idx],
        language: language || mockTemplates[idx].language,
        category: category || mockTemplates[idx].category,
        components: components || mockTemplates[idx].components
      };
      fs.writeFileSync(mockFilePath, JSON.stringify(mockTemplates, null, 2), "utf8");
      return res.json({ success: true, msg: "Template was updated successfully" });
    }

    res.json({ success: false, msg: "Direct template updates are not supported by the Meta API. Please delete and recreate the template." });
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// return meta media url
router.post("/return_media_url_meta", validateUser, async (req, res) => {
  try {
    if (!req.body?.templet_name) {
      return res.json({
        success: false,
        msg: "Please give a templet name first ",
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.json({ success: false, msg: "No files were uploaded" });
    }

    const getMETA = await query(`SELECT * FROM meta_api WHERE uid = ?`, [
      req.decode.uid,
    ]);
    if (getMETA.length < 1) {
      return res.json({
        success: false,
        msg: "Please check your meta API keys",
      });
    }

    const randomString = randomstring.generate();
    const file = req.files.file;

    const filename = `${randomString}.${getFileExtension(file.name)}`;

    // Move the file and wait for it to complete
    await new Promise((resolve, reject) => {
      file.mv(`${__dirname}/../client/public/media/${filename}`, (err) => {
        if (err) {
          console.log(err);
          reject(err);
        } else {
          resolve();
        }
      });
    });

    setTimeout(async () => {
      const { fileSizeInBytes, mimeType } = await getFileInfo(
        `${__dirname}/../client/public/media/${filename}`
      );

      const getSession = await getSessionUploadMediaMeta(
        "v18.0",
        getMETA[0]?.app_id,
        getMETA[0]?.access_token,
        fileSizeInBytes,
        mimeType
      );

      const uploadFile = await uploadFileMeta(
        getSession?.id,
        `${__dirname}/../client/public/media/${filename}`,
        "v18.0",
        getMETA[0]?.access_token
      );

      if (!uploadFile?.success) {
        return res.json({ success: false, msg: "Please check your meta API" });
      }

      const url = `${env.FRONTEND_URL}/media/${filename}`;

      await query(
        `INSERT INTO meta_templet_media (uid, templet_name, meta_hash, file_name) VALUES (?,?,?,?)`,
        [req.decode.uid, req.body?.templet_name, uploadFile?.data?.h, filename]
      );

      res.json({ success: true, url, hash: uploadFile?.data?.h });
    }, 1000);
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// get plan detail
router.post("/get_plan_details", validateUser, async (req, res) => {
  try {
    const { id } = req.body;

    const data = await query(`SELECT * FROM plan WHERE id = ?`, [id]);
    if (data.length < 1) {
      return res.json({ success: false, data: null });
    } else {
      res.json({ success: true, data: data[0] });
    }
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// get payment gateway
router.get("/get_payment_details", validateUser, async (req, res) => {
  try {
    const resp = await query(`SELECT * FROM web_private`, []);
    let data = resp[0];
    const [userData] = await query(`SELECT * FROM user WHERE uid = ?`, [
      req.decode.uid,
    ]);

    data.pay_stripe_key = "";
    res.json({ data, userData, success: true });
  } catch (err) {
    res.json({ success: false, msg: "something went wrong", err });
    console.log(err);
  }
});

// creating stripe pay session
router.post("/create_stripe_session", validateUser, async (req, res) => {
  try {
    const getWeb = await query(`SELECT * FROM web_private`, []);

    if (
      getWeb.length < 1 ||
      !getWeb[0]?.pay_stripe_key ||
      !getWeb[0]?.pay_stripe_id
    ) {
      return res.json({
        success: false,
        msg: "Opss.. payment keys found not found",
      });
    }

    const stripeKeys = getWeb[0]?.pay_stripe_key;

    const stripeClient = new Stripe(stripeKeys);

    const { planId } = req.body;

    const plan = await query(`SELECT * FROM plan WHERE id = ?`, [planId]);

    if (plan.length < 1) {
      return res.json({ msg: "No plan found with the id" });
    }

    const randomSt = randomstring.generate();
    const orderID = `STRIPE_${randomSt}`;

    await query(
      `INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?,?,?,?)`,
      [req.decode.uid, "STRIPE", plan[0]?.price, orderID]
    );

    const web = await query(`SELECT * FROM web_public`, []);

    const productStripe = [
      {
        price_data: {
          currency: web[0]?.currency_code,
          product_data: {
            name: plan[0]?.title,
            // images:[product.imgdata]
          },
          unit_amount: plan[0]?.price * 100,
        },
        quantity: 1,
      },
    ];

    const session = await stripeClient.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: productStripe,
      mode: "payment",
      success_url: `${env.BACKEND_URL}/api/user/stripe_payment?order=${orderID}&plan=${plan[0]?.id}`,
      cancel_url: `${env.BACKEND_URL}/api/user/stripe_payment?order=${orderID}&plan=${plan[0]?.id}`,
      locale: env.STRIPE_LANG,
    });

    await query(`UPDATE orders SET s_token = ? WHERE data = ?`, [
      session?.id,
      orderID,
    ]);

    res.json({ success: true, session: session });
  } catch (err) {
    res.json({ msg: err.toString(), err });
    console.log({ err, msg: JSON.stringify(err), string: err.toString() });
  }
});

router.post("/pay_with_rz", validateUser, async (req, res) => {
  try {
    const { rz_payment_id, plan, amount } = req.body;
    if (!rz_payment_id || !plan || !amount) {
      return res.json({ msg: "please send required fields" });
    }

    // getting plan
    const getPlan = await query(`SELECT * FROM plan WHERE id = ?`, [plan?.id]);

    if (getPlan.length < 1) {
      return res.json({
        msg: "Invalid plan found",
      });
    }

    // getting private web
    const [webPrivate] = await query(`SELECT * from web_private`, []);
    const [webPublic] = await query(`SELECT * FROM web_public`, []);

    const rzId = webPrivate?.rz_id;
    const rzKeys = webPrivate?.rz_key;

    if (!rzId || !rzKeys) {
      return res.json({
        msg: `Please fill your razorpay credentials! if: ${rzId} keys: ${rzKeys}`,
      });
    }

    const finalamt =
      (parseInt(amount) / parseInt(webPublic.exchange_rate)) * 80;

    const resp = await rzCapturePayment(
      rz_payment_id,
      Math.round(finalamt) * 100,
      rzId,
      rzKeys
    );

    if (!resp) {
      res.json({ success: false, msg: resp.description });
      return;
    }

    await updateUserPlan(getPlan[0], req.decode.uid);

    await query(
      `INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?,?,?,?)`,
      [req.decode.uid, "RAZORPAY", plan?.price, JSON.stringify(resp)]
    );

    res.json({
      success: true,
      msg: "Thank for your payment you are good to go now.",
    });
  } catch (err) {
    res.json({ msg: err.toString(), err });
    console.log({ err, msg: JSON.stringify(err), string: err.toString() });
  }
});

// pay with paypal
router.post("/pay_with_paypal", validateUser, async (req, res) => {
  try {
    const { orderID, plan } = req.body;

    if (!plan || !orderID) {
      return res.json({ msg: "order id and plan required" });
    }

    // getting plan
    const getPlan = await query(`SELECT * FROM plan WHERE id = ?`, [plan?.id]);

    if (getPlan.length < 1) {
      return res.json({
        msg: "Invalid plan found",
      });
    }

    // getting private web
    const [webPrivate] = await query(`SELECT * from web_private`, []);

    const paypalClientId = webPrivate?.pay_paypal_id;
    const paypalClientSecret = webPrivate?.pay_paypal_key;

    if (!paypalClientId || !paypalClientSecret) {
      return res.json({
        msg: "Please provide paypal ID and keys from the Admin",
      });
    }

    let response = await fetch(
      "https://api.sandbox.paypal.com/v1/oauth2/token",
      {
        method: "POST",
        body: "grant_type=client_credentials",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(
              `${paypalClientId}:${paypalClientSecret}`,
              "binary"
            ).toString("base64"),
        },
      }
    );

    let data = await response.json();

    let resp_order = await fetch(
      `https://api.sandbox.paypal.com/v1/checkout/orders/${orderID}`,
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + data.access_token,
        },
      }
    );

    let order_details = await resp_order.json();

    if (order_details.status === "COMPLETED") {
      await updateUserPlan(getPlan[0], req.decode.uid);

      await query(
        `INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?,?,?,?)`,
        [req.decode.uid, "PAYPAL", plan?.price, JSON.stringify(order_details)]
      );

      res.json({
        success: true,
        msg: "Thank for your payment you are good to go now.",
      });
    } else {
      res.json({ success: false, msg: "error_description" });
      return;
    }
  } catch (err) {
    console.log(err);
    res.json({ msg: "something went wrong", err });
  }
});

function checlStripePayment(orderId) {
  return new Promise(async (resolve) => {
    try {
      const getStripe = await query(`SELECT * FROM web_private`, []);

      const stripeClient = new Stripe(getStripe[0]?.pay_stripe_key);
      const getPay = await stripeClient.checkout.sessions.retrieve(orderId);

      console.log({ status: getPay?.payment_status });

      if (getPay?.payment_status === "paid") {
        resolve({ success: true, data: getPay });
      } else {
        resolve({ success: false });
      }
    } catch (err) {
      resolve({ success: false, data: {} });
    }
  });
}

function returnHtmlRes(msg) {
  const html = `<!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="refresh" content="5;url=${env.FRONTEND_URL}/user">
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          text-align: center;
          margin: 0;
          padding: 0;
        }

        .container {
          background-color: #ffffff;
          border: 1px solid #ccc;
          border-radius: 4px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
          margin: 100px auto;
          padding: 20px;
          width: 300px;
        }

        p {
          font-size: 18px;
          color: #333;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <p>${msg}</p>
      </div>
    </body>
    </html>
    `;
  return html;
}

router.get("/stripe_payment", async (req, res) => {
  try {
    const { order, plan } = req.query;

    if (!order || !plan) {
      return res.send("INVALID REQUEST");
    }

    const getOrder = await query(`SELECT * FROM orders WHERE data = ?`, [
      order || "",
    ]);
    const getPlan = await query(`SELECT * FROM plan WHERE id = ?`, [plan]);

    if (getOrder.length < 1) {
      return res.send("Invalid payment found");
    }

    if (getPlan.length < 1) {
      return res.send("Invalid plan found");
    }

    const checkPayment = await checlStripePayment(getOrder[0]?.s_token);
    console.log({ checkPayment: checkPayment });

    if (checkPayment.success) {
      res.send(returnHtmlRes("Payment Success! Redirecting..."));

      await query(`UPDATE orders SET data = ? WHERE data = ?`, [
        JSON.stringify(checkPayment?.data),
        order,
      ]);

      await updateUserPlan(getPlan[0], getOrder[0]?.uid);
    } else {
      res.send(
        "Payment Failed! If the balance was deducted please contact to the HamWiz support. Redirecting..."
      );
    }
  } catch (err) {
    console.log(err);
    res.json({ msg: "Something went wrong", err, success: false });
  }
});

// pay with paystack
router.post("/pay_with_paystack", validateUser, async (req, res) => {
  try {
    const { planData, trans_id, reference } = req.body;

    if (!planData || !trans_id) {
      return res.json({
        msg: "Order id and plan required",
      });
    }

    // getting plan
    const plan = await query(`SELECT * FROM plan WHERE id = ?`, [planData.id]);

    if (plan.length < 1) {
      return res.json({ msg: "Sorry this plan was not found" });
    }

    // gettings paystack keys
    const getWebPrivate = await query(`SELECT * FROM web_private`, []);
    const paystackSecretKey = getWebPrivate[0]?.pay_paystack_key;
    const paystackId = getWebPrivate[0]?.pay_paystack_id;

    if (!paystackSecretKey || !paystackId) {
      return res.json({ msg: "Paystack credentials not found" });
    }

    var response = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const resp = await response.json();

    if (resp.data?.status !== "success") {
      res.json({ success: false, msg: `${resp.message} - Ref:-${reference}` });
      return;
    }

    await query(
      `INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?,?,?,?)`,
      [req.decode.uid, "PAYSTACK", plan[0]?.price, reference]
    );

    await updateUserPlan(plan[0], req.decode.uid);

    res.json({
      success: true,
      msg: "Payment success! Redirecting...",
    });
  } catch (err) {
    console.log(err);
    res.json({ msg: "Something went wrong", err, success: false });
  }
});

// update profile
router.post("/update_profile", validateUser, async (req, res) => {
  try {
    const { newPassword, name, mobile_with_country_code, email, timezone } =
      req.body;

    if (!name || !mobile_with_country_code || !email || !timezone) {
      return res.json({
        msg: "Name, Mobile, Email, Timezone are required fields",
      });
    }

    if (newPassword) {
      const hash = await bcrypt.hash(newPassword, 10);
      await query(
        `UPDATE user SET name = ?, email = ?, password = ?, mobile_with_country_code = ?, timezone = ? WHERE uid = ?`,
        [name, email, hash, mobile_with_country_code, timezone, req.decode.uid]
      );
    } else {
      await query(
        `UPDATE user SET name = ?, email = ?, mobile_with_country_code = ?, timezone = ? WHERE uid = ?`,
        [name, email, mobile_with_country_code, timezone, req.decode.uid]
      );
    }

    res.json({ success: true, msg: "Profile was updated" });
  } catch (err) {
    console.log(err);
    res.json({ msg: "Something went wrong", err, success: false });
  }
});

// get dashboard
router.get("/get_dashboard", validateUser, async (req, res) => {
  try {
    const getOpenChat = await query(
      `SELECT * FROM chats WHERE uid = ? AND chat_status = ?`,
      [req.decode.uid, "open"]
    );
    const getOpenPending = await query(
      `SELECT * FROM chats WHERE uid = ? AND chat_status = ?`,
      [req.decode.uid, "pending"]
    );
    const getOpenResolved = await query(
      `SELECT * FROM chats WHERE uid = ? AND chat_status = ?`,
      [req.decode.uid, "solved"]
    );

    const getActiveChatbots = await query(
      `SELECT * FROM chatbot WHERE active = ? AND uid = ?`,
      [1, req.decode.uid]
    );
    const getDActiveChatbots = await query(
      `SELECT * FROM chatbot WHERE active = ? AND uid = ?`,
      [0, req.decode.uid]
    );

    const opened = getUserOrderssByMonth(getOpenChat);
    const pending = getUserOrderssByMonth(getOpenPending);
    const resolved = getUserOrderssByMonth(getOpenResolved);
    const activeBot = getUserOrderssByMonth(getActiveChatbots);
    const dActiveBot = getUserOrderssByMonth(getDActiveChatbots);

    // get total chats
    const totalChats = await query(`SELECT * FROM chats WHERE uid = ?`, [
      req.decode.uid,
    ]);
    const totalChatbots = await query(`SELECT * FROM chatbot WHERE uid = ?`, [
      req.decode.uid,
    ]);
    const totalContacts = await query(`SELECT * FROM contact WHERE uid = ?`, [
      req.decode.uid,
    ]);
    const totalFlows = await query(`SELECT * FROM flow WHERE uid = ?`, [
      req.decode.uid,
    ]);
    const totalBroadcast = await query(
      `SELECT * FROM broadcast WHERE uid = ?`,
      [req.decode.uid]
    );
    const totalTemplets = await query(`SELECT * FROM templets WHERE uid = ?`, [
      req.decode.uid,
    ]);

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
    res.json({ msg: "Something went wrong", err, success: false });
  }
});

// enroll free plan
router.post("/start_free_trial", validateUser, async (req, res) => {
  try {
    const { planId } = req.body;

    const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [
      req.decode.uid,
    ]);
    if (getUser[0]?.trial > 0) {
      return res.json({
        success: false,
        msg: "You have already taken Trial once. You can not enroll for trial again.",
      });
    }

    const getPlan = await query(`SELECT * FROM plan WHERE id = ?`, [planId]);
    if (getPlan.length < 1) {
      return res.json({ msg: "Invalid plan found" });
    }

    if (getPlan[0]?.price > 0) {
      return res.json({ msg: "This plan is not a trial plan." });
    }
    await query(
      `INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?,?,?,?)`,
      [req.decode.uid, "OFFLINE", 0, JSON.stringify({ plan: getPlan[0] })]
    );

    await updateUserPlan(getPlan[0], getUser[0]?.uid);

    await query(`UPDATE user SET trial = ? WHERE uid = ?`, [1, req.decode.uid]);

    res.json({
      success: true,
      msg: "Your trial plan has been activated. You are redirecting to the panel...",
    });
  } catch (err) {
    console.log(err);
    res.json({ msg: "Something went wrong", err, success: false });
  }
});

// send recover
router.post("/send_resovery", async (req, res) => {
  try {
    const { email } = req.body;

    if (!isValidEmail(email)) {
      return res.json({ msg: "Please enter a valid email" });
    }

    const checkEmailValid = await query(`SELECT * FROM user WHERE email = ?`, [
      email,
    ]);
    if (checkEmailValid.length < 1) {
      return res.json({
        success: true,
        msg: "We have sent a recovery link if this email is associated with user account.",
      });
    }

    const getWeb = await query(`SELECT * FROM web_public`, []);
    const appName = getWeb[0]?.app_name;

    const jsontoken = sign(
      {
        old_email: email,
        email: email,
        time: moment(new Date()),
        password: checkEmailValid[0]?.password,
        role: "user",
      },
      env.JWT_SECRET,
      {}
    );

    const recpveryUrl = `${env.FRONTEND_URL}/recovery-user/${jsontoken}`;

    const getHtml = recoverEmail(appName, recpveryUrl);

    // getting smtp
    const smtp = await query(`SELECT * FROM smtp`, []);
    if (
      !smtp[0]?.email ||
      !smtp[0]?.host ||
      !smtp[0]?.port ||
      !smtp[0]?.password
    ) {
      return res.json({
        success: false,
        msg: "SMTP connections not found! Unable to send recovery link",
      });
    }

    await sendEmail(
      smtp[0]?.host,
      smtp[0]?.port,
      smtp[0]?.email,
      smtp[0]?.password,
      getHtml,
      `${appName} - Password Recovery`,
      smtp[0]?.email,
      email
    );

    res.json({
      success: true,
      msg: "We have sent your a password recovery link. Please check your email",
    });
  } catch (err) {
    console.log(err);
    res.json({ msg: "Something went wrong", err, success: false });
  }
});

// modify recpvery passwrod
router.get("/modify_password", validateUser, async (req, res) => {
  try {
    const { pass } = req.query;

    if (!pass) {
      return res.json({ success: false, msg: "Please provide a password" });
    }

    if (moment(req.decode.time).diff(moment(new Date()), "hours") > 1) {
      return res.json({ success: false, msg: "Token expired" });
    }

    const hashpassword = await bcrypt.hash(pass, 10);

    const result = await query(`UPDATE user SET password = ? WHERE email = ?`, [
      hashpassword,
      req.decode.old_email,
    ]);

    res.json({
      success: true,
      msg: "Your password has been changed. You may login now! Redirecting...",
      data: result,
    });
  } catch (err) {
    console.log(err);
    res.json({ msg: "Something went wrong", err, success: false });
  }
});

// generate api keys
router.get("/generate_api_keys", validateUser, async (req, res) => {
  try {
    const token = sign(
      { uid: req.decode.uid, role: "user" },
      env.JWT_SECRET,
      {}
    );

    // saving keys to user
    await query(`UPDATE user SET api_key = ? WHERE uid = ?`, [
      token,
      req.decode.uid,
    ]);

    res.json({ success: true, token, msg: "New keys has been generated" });
  } catch (err) {
    console.log(err);
    res.json({ msg: "Something went wrong", err, success: false });
  }
});

router.get("/fetch_profile", validateUser, async (req, res) => {
  try {
    // const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [req.decode.uid])

    const metaKeys = await query("SELECT * FROM meta_api WHERE uid = ?", [
      req.decode?.uid,
    ]);

    if (!metaKeys[0]?.access_token || !metaKeys[0]?.business_phone_number_id) {
      return res.json({
        success: false,
        msg: "Please fill the meta token and mobile id",
      });
    }
    const fetchProfile = await fetchProfileFun(
      metaKeys[0]?.business_phone_number_id,
      metaKeys[0]?.access_token
    );

    res.json(fetchProfile);
  } catch (err) {
    console.log(err);
    res.json({ msg: "something went wrong", err });
  }
});

// adding task for agent
router.post("/add_task_for_agent", validateUser, async (req, res) => {
  try {
    const { title, des, agent_uid } = req.body;
    if (!title || !des) {
      return res.json({ msg: "Please give title and description" });
    }

    if (!agent_uid) {
      return res.json({ msg: "Please select an agent" });
    }

    await query(
      `INSERT INTO agent_task (owner_uid, uid, title, description, status) VALUES (?,?,?,?,?)`,
      [req.decode.uid, agent_uid, title, des, "PENDING"]
    );

    res.json({ success: true, msg: "Task was added" });
  } catch (err) {
    console.log(err);
    res.json({ msg: "something went wrong", err });
  }
});

// get my agent tasks
router.get("/get_my_agent_tasks", validateUser, async (req, res) => {
  try {
    const data = await query(
      `
            SELECT agent_task.*, agents.email AS agent_email
            FROM agent_task
            JOIN agents ON agents.uid = agent_task.uid
            WHERE agent_task.owner_uid = ?
        `,
      [req.decode.uid]
    );

    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: "something went wrong", err });
  }
});

// delete task for agent
router.post("/del_task_for_agent", validateUser, async (req, res) => {
  try {
    const { id } = req.body;
    await query(`DELETE FROM agent_task WHERE id = ? AND owner_uid = ?`, [
      id,
      req.decode.uid,
    ]);

    res.json({ msg: "Task was deleted", success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: "something went wrong", err });
  }
});

// add widget
router.post("/add_widget", validateUser, async (req, res) => {
  try {
    const { title, whatsapp_number, place, selectedIcon, logoType, size } =
      req.body;

    if (!title || !whatsapp_number || !place) {
      return res.json({ msg: "Please fill the details" });
    }

    let filename;

    if (logoType === "UPLOAD") {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.json({ success: false, msg: "Please upload a logo" });
      }

      const randomString = randomstring.generate();
      const file = req.files.file;

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
      [
        unique_id,
        req.decode.uid,
        title,
        whatsapp_number,
        filename,
        place,
        size || 50,
      ]
    );

    res.json({
      msg: "Widget was added",
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.json({ msg: "something went wrong", err });
  }
});

// get my widget
router.get("/get_my_widget", validateUser, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM chat_widget WHERE uid = ?`, [
      req.decode.uid,
    ]);

    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: "something went wrong", err });
  }
});

// del widget
router.post("/del_widget", validateUser, async (req, res) => {
  try {
    const { id } = req.body;

    await query(`DELETE FROM chat_widget WHERE id = ?`, [id]);

    res.json({ msg: "Widget was deleted", success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: "something went wrong", err });
  }
});

router.get("/widget", async (req, res) => {
  try {
    const { id } = req.query;

    if (!id) {
      return res.send(``);
    }

    const getWidget = await query(
      `SELECT * FROM chat_widget WHERE unique_id = ?`,
      [id]
    );

    if (getWidget.length < 1) {
      return res.send(``);
    }

    const url = generateWhatsAppURL(
      getWidget[0]?.whatsapp_number,
      getWidget[0]?.title
    );

    res.send(
      returnWidget(
        `${env.FRONTEND_URL}/media/${getWidget[0]?.logo}`,
        getWidget[0]?.size,
        url,
        getWidget[0]?.place
      )
    );
  } catch (err) {
    console.log(err);
    res.json({ msg: "something went wrong", err });
  }
});

// update agent profile
router.post("/update_agent_profile", validateUser, async (req, res) => {
  try {
    const { email, name, mobile, newPas, uid } = req.body;

    if (!email || !name || !mobile) {
      return res.json({
        msg: "You can not remove any detail of agent",
      });
    }

    if (newPas) {
      const hasPas = await bcrypt.hash(newPas, 10);
      await query(
        `UPDATE agents SET email = ?, name = ?, mobile = ?, password = ? WHERE uid = ?`,
        [email, name, mobile, hasPas, uid]
      );
    } else {
      await query(
        `UPDATE agents SET email = ?, name = ?, mobile = ? WHERE uid = ?`,
        [email, name, mobile, uid]
      );
    }

    res.json({ msg: "Agent profile was updated", success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: "something went wrong", err });
  }
});

// auto login agent
router.post("/auto_agent_login", validateUser, async (req, res) => {
  try {
    const { uid } = req.body;
    const agentFind = await query(`SELECT * FROM agents WHERE uid = ?`, [uid]);

    const token = sign(
      {
        uid: agentFind[0].uid,
        role: "agent",
        password: agentFind[0].password,
        email: agentFind[0].email,
        owner_uid: agentFind[0]?.owner_uid,
      },
      env.JWT_SECRET,
      {}
    );

    res.json({ token, success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: "something went wrong", err });
  }
});

// seed demo crm data
router.post("/seed_demo_data", validateUser, async (req, res) => {
  try {
    const pbName = "Demo Leads Phonebook";
    // Insert phonebook
    let pbId;
    const existingPb = await query(`SELECT * FROM phonebook WHERE uid = ? AND name = ?`, [req.decode.uid, pbName]);
    if (existingPb.length > 0) {
      pbId = existingPb[0].id;
    } else {
      const insertPb = await query(`INSERT INTO phonebook (uid, name) VALUES (?, ?) RETURNING id`, [req.decode.uid, pbName]);
      if (insertPb && insertPb.length > 0) {
        pbId = insertPb[0].id;
      } else {
        const getPb = await query(`SELECT id FROM phonebook WHERE uid = ? AND name = ?`, [req.decode.uid, pbName]);
        pbId = getPb[0]?.id;
      }
    }

    if (!pbId) {
      return res.json({ success: false, msg: "Failed to initialize demo phonebook" });
    }

    // 10 Contacts
    const contacts = [
      { name: "Aarav Mehta", mobile: "+919999900001", var1: "VIP", var2: "Retail", var3: "Mumbai", var4: "Interested", var5: "Ref-01" },
      { name: "Diya Sharma", mobile: "+919999900002", var1: "Regular", var2: "Wholesale", var3: "Delhi", var4: "FollowUp", var5: "Ref-02" },
      { name: "Kabir Singh", mobile: "+919999900003", var1: "New", var2: "Retail", var3: "Bangalore", var4: "Interested", var5: "Ref-03" },
      { name: "Ananya Goel", mobile: "+919999900004", var1: "VIP", var2: "Enterprise", var3: "Hyderabad", var4: "Active", var5: "Ref-04" },
      { name: "Vivaan Shah", mobile: "+919999900005", var1: "Inactive", var2: "Retail", var3: "Pune", var4: "Cold", var5: "Ref-05" },
      { name: "Ira Patel", mobile: "+919999900006", var1: "Regular", var2: "Retail", var3: "Ahmedabad", var4: "Interested", var5: "Ref-06" },
      { name: "Reyansh Gupta", mobile: "+919999900007", var1: "VIP", var2: "Enterprise", var3: "Chennai", var4: "Negotiation", var5: "Ref-07" },
      { name: "Myra Sen", mobile: "+919999900008", var1: "New", var2: "Retail", var3: "Kolkata", var4: "FollowUp", var5: "Ref-08" },
      { name: "Arjun Verma", mobile: "+919999900009", var1: "VIP", var2: "Wholesale", var3: "Jaipur", var4: "Interested", var5: "Ref-09" },
      { name: "Sai Reddy", mobile: "+919999900010", var1: "Regular", var2: "Retail", var3: "Kochi", var4: "Warm", var5: "Ref-10" }
    ];

    for (const c of contacts) {
      const checkContact = await query(`SELECT * FROM contact WHERE uid = ? AND mobile = ?`, [req.decode.uid, c.mobile]);
      if (checkContact.length === 0) {
        await query(`INSERT INTO contact (uid, phonebook_id, phonebook_name, name, mobile, var1, var2, var3, var4, var5) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          req.decode.uid,
          pbId,
          pbName,
          c.name,
          c.mobile,
          c.var1,
          c.var2,
          c.var3,
          c.var4,
          c.var5
        ]);
      }
    }

    // 1 Campaign
    const broadcastId = "bc_demo_" + randomstring.generate(6);
    const existingBc = await query(`SELECT * FROM broadcast WHERE uid = ? AND title = ?`, [req.decode.uid, "Demo Launch Campaign"]);
    if (existingBc.length === 0) {
      await query(`INSERT INTO broadcast (broadcast_id, uid, title, templet, phonebook, status, schedule, timezone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        broadcastId,
        req.decode.uid,
        "Demo Launch Campaign",
        JSON.stringify({ name: "demo_welcome_template", language: "en_US", category: "UTILITY" }),
        JSON.stringify({ id: pbId, name: pbName }),
        "COMPLETED",
        new Date(),
        "Asia/Kolkata"
      ]);

      // Seed 10 logs for campaign analytics
      const deliveryStatuses = ["read", "delivered", "read", "failed", "read", "delivered", "sent", "read", "read", "delivered"];
      const errors = [null, null, null, "Meta rate limit reached", null, null, null, null, null, null];
      for (let i = 0; i < contacts.length; i++) {
        await query(`INSERT INTO broadcast_log (uid, broadcast_id, templet_name, sender_mobile, send_to, delivery_status, example, contact, meta_msg_id, delivery_time, err) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          req.decode.uid,
          broadcastId,
          "demo_welcome_template",
          "+12025550184",
          contacts[i].mobile,
          deliveryStatuses[i],
          JSON.stringify([contacts[i].name]),
          JSON.stringify(contacts[i]),
          "wamid." + randomstring.generate(16),
          Date.now() - (i * 3600 * 1000),
          errors[i]
        ]);
      }
    }

    // 1 Flow
    const flowId = "flow_demo_welcome";
    const flowTitle = "Demo Welcome Visual Flow";
    const existingFlow = await query(`SELECT * FROM flow WHERE uid = ? AND flow_id = ?`, [req.decode.uid, flowId]);
    if (existingFlow.length === 0) {
      await query(`INSERT INTO flow (uid, flow_id, title) VALUES (?, ?, ?)`, [
        req.decode.uid,
        flowId,
        flowTitle
      ]);
    }
    const nodes = [
      { id: "1", type: "START", data: { label: "Start Trigger" } },
      { id: "2", type: "MESSAGE", data: { label: "Send Welcome Text" } }
    ];
    const edges = [
      { id: "e1-2", source: "1", target: "2" }
    ];
    const nodepath = path.join(__dirname, `../flow-json/nodes/${req.decode.uid}/${flowId}.json`);
    const edgepath = path.join(__dirname, `../flow-json/edges/${req.decode.uid}/${flowId}.json`);
    await writeJsonToFile(nodepath, nodes);
    await writeJsonToFile(edgepath, edges);

    // 1 Chatbot
    const existingBot = await query(`SELECT * FROM chatbot WHERE uid = ? AND flow_id = ?`, [req.decode.uid, flowId]);
    let botId;
    if (existingBot.length > 0) {
      botId = existingBot[0].id;
    } else {
      const insertBot = await query(`INSERT INTO chatbot (uid, title, for_all, chats, flow, flow_id, active, origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`, [
        req.decode.uid,
        "Demo Welcome Autopilot",
        1,
        "[]",
        JSON.stringify({ id: flowId, flow_id: flowId, title: flowTitle }),
        flowId,
        1,
        JSON.stringify({ title: "Meta", code: "META", data: {} })
      ]);
      if (insertBot && insertBot.length > 0) {
        botId = insertBot[0].id;
      } else {
        const getBot = await query(`SELECT id FROM chatbot WHERE uid = ? AND flow_id = ?`, [req.decode.uid, flowId]);
        botId = getBot[0]?.id;
      }
    }

    // Seed chatbot logs for diagnostics
    const incomingMessages = ["hi", "hello", "need help", "get price", "operator"];
    const matchedStatuses = [1, 1, 1, 0, 1];
    const logStatuses = ["replied", "replied", "replied", "unmatched", "escalated"];
    const details = [
      { reply_count: 1 },
      { reply_count: 1 },
      { reply_count: 2 },
      { reason: "No matching text intent block" },
      { reason: "Assigned to human agent" }
    ];
    for (let i = 0; i < incomingMessages.length; i++) {
      await query(`INSERT INTO chatbot_log (uid, chatbot_id, chatbot_title, flow_id, sender_number, sender_name, incoming_message, origin, matched, status, detail) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
        req.decode.uid,
        botId || 999,
        "Demo Welcome Autopilot",
        flowId,
        contacts[i].mobile,
        contacts[i].name,
        incomingMessages[i],
        "META",
        matchedStatuses[i],
        logStatuses[i],
        JSON.stringify(details[i])
      ]);
    }

    // 1 Agent
    const agentEmail = `demo_agent_${req.decode.uid.slice(0, 6)}@example.com`;
    const agentUid = `agent_${randomstring.generate(8)}`;
    const existingAgent = await query(`SELECT * FROM agents WHERE owner_uid = ? AND email = ?`, [req.decode.uid, agentEmail]);
    let actualAgentUid;
    if (existingAgent.length > 0) {
      actualAgentUid = existingAgent[0].uid;
    } else {
      const hasPass = await bcrypt.hash(process.env.DEMO_AGENT_PASSWORD || "CHANGE_ME", 10);
      await query(`INSERT INTO agents (owner_uid, uid, email, password, role, name, comments, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
        req.decode.uid,
        agentUid,
        agentEmail,
        hasPass,
        "agent",
        "Demo Agent",
        "Demo workspace agent account",
        1
      ]);
      actualAgentUid = agentUid;
    }

    // 1 Task
    const existingTask = await query(`SELECT * FROM agent_task WHERE owner_uid = ? AND uid = ?`, [req.decode.uid, actualAgentUid]);
    if (existingTask.length === 0) {
      await query(`INSERT INTO agent_task (owner_uid, uid, title, description, status) VALUES (?, ?, ?, ?, ?)`, [
        req.decode.uid,
        actualAgentUid,
        "Follow up with Aarav Mehta",
        "Aarav is marked as VIP Retail client. Contact him to discuss custom integration discount pricing options.",
        "PENDING"
      ]);
    }

    // 3 Conversations
    const sampleChats = [
      {
        chatId: "demo-chat-wa-1",
        senderName: "Jane Doe",
        senderMobile: "+19998887701",
        origin: "META",
        tag: "lead",
        note: "Interested in Enterprise pricing plan.",
        messages: [
          {
            type: "text",
            metaChatId: "msg-wa-1",
            msgContext: { type: "text", text: { body: "Hello! I am trying to connect my business phone." } },
            timestamp: Math.floor(Date.now() / 1000) - 3600,
            senderName: "Jane Doe",
            senderMobile: "+19998887701",
            status: "received",
            star: false,
            route: "INCOMING",
            context: "",
            origin: "META"
          }
        ]
      },
      {
        chatId: "demo-chat-qr-2",
        senderName: "John Smith",
        senderMobile: "+19998887702",
        origin: "QR",
        tag: "support",
        note: "Struggling with setting up templates.",
        messages: [
          {
            type: "text",
            metaChatId: "msg-qr-2",
            msgContext: { type: "text", text: { body: "Hi, can you verify why my campaign status says PAUSED?" } },
            timestamp: Math.floor(Date.now() / 1000) - 1800,
            senderName: "John Smith",
            senderMobile: "+19998887702",
            status: "received",
            star: false,
            route: "INCOMING",
            context: "",
            origin: "QR"
          }
        ]
      },
      {
        chatId: "demo-chat-insta-3",
        senderName: "Alice Brown",
        senderMobile: "demo-chat-insta-3",
        origin: "instagram",
        tag: "general",
        note: "Asking about European delivery options.",
        messages: [
          {
            type: "text",
            metaChatId: "msg-insta-3",
            msgContext: { type: "text", text: { body: "Hey! Do you offer bulk discounts on custom orders?" } },
            timestamp: Math.floor(Date.now() / 1000) - 600,
            senderName: "Alice Brown",
            senderMobile: "demo-chat-insta-3",
            status: "received",
            star: false,
            route: "INCOMING",
            context: "",
            origin: "instagram"
          }
        ]
      }
    ];

    for (const sc of sampleChats) {
      const checkChat = await query(`SELECT * FROM chats WHERE chat_id = ? AND uid = ?`, [sc.chatId, req.decode.uid]);
      if (checkChat.length === 0) {
        await query(`INSERT INTO chats (chat_id, uid, last_message_came, sender_name, sender_mobile, last_message, is_opened, chat_status, chat_note, chat_tags, origin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
          sc.chatId,
          req.decode.uid,
          sc.messages[0].timestamp,
          sc.senderName,
          sc.senderMobile,
          JSON.stringify(sc.messages[0]),
          0,
          "open",
          sc.note,
          JSON.stringify([sc.tag]),
          sc.origin
        ]);
      }

      const convPath = path.join(__dirname, `../conversations/inbox/${req.decode.uid}/${sc.chatId}.json`);
      await writeJsonToFile(convPath, sc.messages);
    }

    res.json({ success: true, msg: "Demo CRM workspace successfully seeded!" });
  } catch (err) {
    console.log(err);
    res.json({ success: false, msg: "something went wrong", error: err.message });
  }
});

module.exports = router;
