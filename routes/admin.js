const router = require('express').Router();
const { query } = require('../database/dbpromise.js');
const randomstring = require('randomstring');
const adminValidator = require('../middlewares/admin.js');
const adminAuthController = require('../controllers/adminAuthController.js');
const adminUserController = require('../controllers/adminUserController.js');
const adminPlanController = require('../controllers/adminPlanController.js');
const { getFileExtension, sendEmail } = require('../functions/function.js');
const moment = require('moment');
const env = require('../env.js');

router.post('/login', adminAuthController.login);

// add new plan
router.post('/add_plan', adminValidator, adminPlanController.addPlan);

// get plans
router.get('/get_plans', adminPlanController.getPlans);

// get web public
router.get('/get_web_public', async (req, res) => {
  try {
    const data = await query(`SELECT * FROM web_public`, []);
    res.json({ data: data[0], success: true });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// del plan
router.post('/del_plan', adminValidator, adminPlanController.deletePlan);

// edit plan
router.post('/edit_plan', adminValidator, adminPlanController.editPlan);

// get all users
router.get('/get_users', adminValidator, adminUserController.getUsers);

// update user
router.post('/update_user', adminValidator, adminUserController.updateUser);

// update plan (assign plan to user — owned by plan domain)
router.post('/update_plan', adminValidator, adminPlanController.assignPlanToUser);

// get payment gateway admin
router.get('/get_payment_gateway_admin', adminValidator, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM web_private`, []);
    if (data.length < 1) {
      return res.json({ data: {}, success: true });
    }
    res.json({ data: data[0], success: true });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// update payment gateway
router.post('/update_pay_gateway', adminValidator, async (req, res) => {
  try {
    const {
      pay_offline_id,
      pay_offline_key,
      offline_active,
      pay_stripe_id,
      pay_stripe_key,
      stripe_active,
      pay_paypal_id,
      pay_paypal_key,
      paypal_active,
      rz_id,
      rz_key,
      rz_active,
      pay_paystack_id,
      pay_paystack_key,
      paystack_active,
      pay_mercadopago_id,
      pay_mercadopago_key,
      mercadopago_active,
    } = req.body;

    await query(
      `UPDATE web_private SET  
            pay_offline_id = ?, 
            pay_offline_key = ?, 
            offline_active = ?,
            pay_stripe_id = ?, 
            pay_stripe_key = ?, 
            stripe_active = ?,
            pay_paypal_id = ?,
            pay_paypal_key = ?,
            paypal_active = ?,
            rz_id = ?,
            rz_key = ?,
            rz_active = ?,
            pay_paystack_id = ?,
            pay_paystack_key = ?,
            paystack_active = ?,
            pay_mercadopago_id = ?,
            pay_mercadopago_key = ?,
            mercadopago_active = ?
            `,
      [
        pay_offline_id,
        pay_offline_key,
        offline_active,
        pay_stripe_id,
        pay_stripe_key,
        stripe_active,
        pay_paypal_id,
        pay_paypal_key,
        paypal_active,
        rz_id,
        rz_key,
        rz_active,
        pay_paystack_id,
        pay_paystack_key,
        paystack_active,
        pay_mercadopago_id,
        pay_mercadopago_key,
        mercadopago_active,
      ],
    );

    res.json({ success: true, msg: 'Payment gateway updated' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// add partners logo
router.post('/add_brand_image', adminValidator, async (req, res) => {
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

    await query(`INSERT INTO partners (filename) VALUES (?)`, [filename]);

    res.json({ success: true, msg: 'Logo was uploaded' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// get all brands
router.get('/get_brands', async (req, res) => {
  try {
    const data = await query(`SELECT * FROM partners`, []);
    res.json({ data, success: true });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// del image
router.post('/del_brand_logo', adminValidator, async (req, res) => {
  try {
    const { id } = req.body;
    await query(`DELETE from partners WHERE id = ?`, [id]);

    res.json({ success: true, msg: 'Bran was deleted' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// add faq
router.post('/add_faq', adminValidator, async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!answer || !question) {
      return res.json({
        success: false,
        msg: 'Please provide question and answer both',
      });
    }

    await query(`INSERT INTO faq (question, answer) VALUES (?,?)`, [question, answer]);

    res.json({ success: true, msg: 'Faq was added' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// get all faq
router.get('/get_faq', async (req, res) => {
  try {
    const data = await query(`SELECT * FROM faq`, []);
    res.json({ data, success: true });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// del faq
router.post('/del_faq', adminValidator, async (req, res) => {
  try {
    const { id } = req.body;
    await query(`DELETE FROM faq WHERE id = ?`, [id]);
    res.json({ success: true, msg: 'Faq was deleted' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// add page
router.post('/add_page', adminValidator, async (req, res) => {
  try {
    const { title, content, slug } = req.body;

    if (!title || !content || !slug) {
      return res.json({ success: false, msg: 'Please fill all fields' });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.json({ success: false, msg: 'No image was selected' });
    }

    // checking few pages
    const pageAlready = ['contact-form', 'privacy-policy', 'terms-and-conditions'];

    if (pageAlready.includes(slug)) {
      return res.json({
        msg: 'This slug is already used by system please use another slug.',
      });
    }

    // checking already one
    const getPage = await query(`SELECT * FROM page WHERE slug = ?`, [slug]);
    if (getPage.length > 0) {
      return res.json({
        success: false,
        msg: 'Thi slug was already used by another page.',
      });
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

    await query(`INSERT INTO page (slug, title, image, content) VALUES (?,?,?,?)`, [
      slug,
      title,
      filename,
      content,
    ]);

    res.json({ success: true, msg: 'Page was added' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// get all pages
router.get('/get_pages', async (req, res) => {
  try {
    const data = await query(`SELECT * FROM page WHERE permanent = ?`, [0]);
    res.json({ data, success: true });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// del page
router.post('/del_page', adminValidator, async (req, res) => {
  try {
    const { id } = req.body;

    await query(`DELETE FROM page WHERE id = ?`, [id]);
    res.json({ success: true, msg: 'Page was deleted' });
  } catch (err) {
    res.json({ success: false, msg: 'something went wrong' });
    console.log(err);
  }
});

// auto user login
router.post('/auto_login', adminValidator, adminUserController.autoLogin);

// ading testtimonial
router.post('/add_testimonial', adminValidator, async (req, res) => {
  try {
    const { title, description, reviewer_name, reviewer_position } = req.body;

    if (!title || !description || !reviewer_name || !reviewer_position) {
      return res.json({ success: false, msg: 'Please fill all fields' });
    }

    await query(
      `INSERT INTO testimonial (title, description, reviewer_name, reviewer_position) VALUES (?,?,?,?)`,
      [title, description, reviewer_name, reviewer_position],
    );

    res.json({ success: true, msg: 'Testimonial was added' });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});

// get all testi
router.get('/get_testi', async (req, res) => {
  try {
    const data = await query(`SELECT * FROM testimonial`, []);
    res.json({ success: true, data });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});

// del testi
router.post('/del_testi', adminValidator, async (req, res) => {
  try {
    const { id } = req.body;

    await query(`DELETE FROM testimonial WHERE id = ?`, [id]);
    res.json({ success: true, msg: 'Testimonial was deleted' });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});

// get orders
router.get('/get_orders', adminValidator, async (req, res) => {
  try {
    const data = await query(
      `
            SELECT 
                orders.id,
                orders.uid,
                orders.payment_mode,
                orders.amount,
                orders.data,
                orders.s_token,
                orders.createdat AS "orderCreatedAt",
                user.role,
                user.name,
                user.email,
                user.password,
                user.mobile_with_country_code,
                user.timezone,
                user.plan,
                user.plan_expire,
                user.trial,
                user.api_key,
                user.createdat AS "userCreatedAt"
            FROM orders
            LEFT JOIN user ON orders.uid = user.uid
        `,
      [],
    );

    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});

// get all contact forms
router.get('/get_contact_leads', adminValidator, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM contact_form`, []);
    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});

// del contact entry
router.post('/del_cotact_entry', adminValidator, async (req, res) => {
  try {
    const { id } = req.body;
    await query(`DELETE FROM contact_form WHERE id = ?`, [id]);
    res.json({ success: true, msg: 'Entry was deleted' });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});

// get page by slug
router.post('/get_page_slug', async (req, res) => {
  try {
    const { slug } = req.body;

    const data = await query(`SELECT * FROM page WHERE slug = ?`, [slug]);
    if (data.length < 1) {
      return res.json({ data: {}, success: true, page: false });
    } else {
      return res.json({ data: data[0], success: true, page: true });
    }
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});
// update termns
router.post('/update_terms', adminValidator, async (req, res) => {
  try {
    const { title, content } = req.body;

    // check
    const getPP = await query(`SELECT * FROM page WHERE slug = ?`, ['terms-and-conditions']);

    if (getPP.length > 0) {
      await query(`UPDATE page SET title = ?, content = ? WHERE slug = ?`, [
        title,
        content,
        'terms-and-conditions',
      ]);
    } else {
      await query(`INSERT INTO page (slug, title, content, permanent) VALUES (?,?,?,?)`, [
        'terms-and-conditions',
        title,
        content,
        1,
      ]);
    }

    res.json({ success: true, msg: 'Page updated' });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});

// update privacy policy
router.post('/update_privacy_policy', adminValidator, async (req, res) => {
  try {
    const { title, content } = req.body;

    // check
    const getPP = await query(`SELECT * FROM page WHERE slug = ?`, ['privacy-policy']);

    if (getPP.length > 0) {
      await query(`UPDATE page SET title = ?, content = ? WHERE slug = ?`, [
        title,
        content,
        'privacy-policy',
      ]);
    } else {
      await query(`INSERT INTO page (slug, title, content, permanent) VALUES (?,?,?,?)`, [
        'privacy-policy',
        title,
        content,
        1,
      ]);
    }

    res.json({ success: true, msg: 'Page updated' });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});

// get smtp
router.get('/get_smtp', adminValidator, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM smtp`, []);
    if (data.length < 1) {
      return res.json({ data: { id: 'ID' }, success: true });
    } else {
      return res.json({ data: data[0], success: true });
    }
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});

// update smtp
router.post('/update_smtp', adminValidator, async (req, res) => {
  try {
    const { email, port, password, host } = req.body;

    if (!email || !port || !password || !host) {
      return res.json({ msg: 'Please fill all the fields' });
    }

    const getOne = await query(`SELECT * FROM smtp`, []);
    if (getOne.length < 1) {
      await query(`INSERT INTO smtp (email, host, port, password) VALUES (?,?,?,?)`, [
        email,
        host,
        port,
        password,
      ]);
    } else {
      await query(`UPDATE smtp SET email = ?, host = ?, port = ?, password = ?`, [
        email,
        host,
        port,
        password,
      ]);
    }

    res.json({ success: true, msg: 'Email settings was updated' });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});

// send test email
router.post('/send_test_email', adminValidator, async (req, res) => {
  try {
    const { email, port, password, host, to } = req.body;

    if (!email || !port || !password || !host) {
      return res.json({ msg: 'Please fill all the fields' });
    }

    const checkEmail = await sendEmail(
      host,
      port,
      email,
      password,
      `<h1>This is a test SMTP email!</h1>`,
      'SMTP Testing',
      'Testing Sender',
      to,
    );

    if (checkEmail.success) {
      res.json({ msg: 'Email sent', success: true });
    } else {
      res.json({ msg: checkEmail?.err });
    }
  } catch (err) {
    console.log(err);
    res.json({ msg: 'server error', err });
  }
});

// get dashboard user
router.get('/get_dashboard_for_user', adminValidator, adminUserController.getDashboardForUser);

// get admin
router.get('/get_admin', adminValidator, adminAuthController.getAdmin);

// update admin
router.post('/update-admin', adminValidator, adminAuthController.updateAdmin);

// send recover
router.post('/send_resovery', adminAuthController.sendRecovery);

// modify recpvery passwrod
router.get('/modify_password', adminValidator, adminAuthController.modifyPassword);

// Duplicate del_user route removed to avoid conflicts.

// get all genn wa links
router.get('/get_wa_gen', adminValidator, async (req, res) => {
  try {
    const data = await query(`SELECT * FROM gen_links`, []);
    res.json({ data, success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'Something went wrong', err, success: false });
  }
});

// del gen link
router.post('/de_wa_den_link', adminValidator, async (req, res) => {
  try {
    const { id } = req.body;
    await query(`DELETE FROM gen_links WHERE id = ?`, [id]);
    res.json({ msg: 'Generated link was deleted', success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'Something went wrong', err, success: false });
  }
});

// get social login
router.get('/get_social_login', async (req, res) => {
  try {
    const data = await query(`SELECT * FROM web_public`, []);
    res.json({ data: data[0], success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'Something went wrong', err, success: false });
  }
});

// update social things
router.post('/update_social_login', adminValidator, async (req, res) => {
  try {
    const {
      google_client_id,
      google_login_active,
      fb_login_app_id,
      fb_login_app_sec,
      fb_login_active,
    } = req.body;

    await query(
      `UPDATE web_public SET google_client_id = ?, google_login_active = ?, fb_login_app_id = ?, fb_login_app_sec = ?, fb_login_active = ?`,
      [google_client_id, google_login_active, fb_login_app_id, fb_login_app_sec, fb_login_active],
    );

    res.json({ msg: 'Settings updated', success: true });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'Something went wrong', err, success: false });
  }
});

// update rtl
router.post('/update_rtl', adminValidator, async (req, res) => {
  try {
    const { rtl } = req.body;

    await query(`UPDATE web_public SET rtl = ?`, [rtl ? 1 : 0]);

    res.json({ success: true, msg: 'RTL was updated' });
  } catch (err) {
    console.log(err);
    res.json({ msg: 'Something went wrong', err, success: false });
  }
});

// delete user
router.post('/del_user', adminValidator, adminUserController.deleteUser);

// update deployment settings
router.post('/update_deployment_settings', adminValidator, async (req, res) => {
  try {
    const {
      meta_app_id,
      meta_app_secret,
      meta_waba_id,
      meta_business_account_id,
      meta_access_token,
      meta_phone_number_id,
      insta_app_id,
      insta_app_secret,
      insta_business_account_id,
      insta_access_token,
      ai_provider_active,
      ai_openai_key,
      ai_openai_model,
      ai_gemini_key,
      ai_gemini_model,
      ai_claude_key,
      ai_claude_model,
      ai_openrouter_key,
      ai_openrouter_model,
      ai_ollama_url,
      ai_ollama_model,
      ai_custom_url,
      ai_custom_model,
      widget_domains,
    } = req.body;

    await query(
      `UPDATE web_private SET 
        meta_app_id = ?,
        meta_app_secret = ?,
        meta_waba_id = ?,
        meta_business_account_id = ?,
        meta_access_token = ?,
        meta_phone_number_id = ?,
        insta_app_id = ?,
        insta_app_secret = ?,
        insta_business_account_id = ?,
        insta_access_token = ?,
        ai_provider_active = ?,
        ai_openai_key = ?,
        ai_openai_model = ?,
        ai_gemini_key = ?,
        ai_gemini_model = ?,
        ai_claude_key = ?,
        ai_claude_model = ?,
        ai_openrouter_key = ?,
        ai_openrouter_model = ?,
        ai_ollama_url = ?,
        ai_ollama_model = ?,
        ai_custom_url = ?,
        ai_custom_model = ?,
        widget_domains = ?`,
      [
        meta_app_id || '',
        meta_app_secret || '',
        meta_waba_id || '',
        meta_business_account_id || '',
        meta_access_token || '',
        meta_phone_number_id || '',
        insta_app_id || '',
        insta_app_secret || '',
        insta_business_account_id || '',
        insta_access_token || '',
        ai_provider_active || '',
        ai_openai_key || '',
        ai_openai_model || '',
        ai_gemini_key || '',
        ai_gemini_model || '',
        ai_claude_key || '',
        ai_claude_model || '',
        ai_openrouter_key || '',
        ai_openrouter_model || '',
        ai_ollama_url || '',
        ai_ollama_model || '',
        ai_custom_url || '',
        ai_custom_model || '',
        widget_domains || '',
      ],
    );

    res.json({ success: true, msg: 'Deployment settings updated successfully' });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'something went wrong', error: err.message });
  }
});

// get transport metrics
router.get('/get_transport_metrics', adminValidator, async (req, res) => {
  try {
    const queueMetrics = await query(`
      SELECT 
        (SELECT COUNT(*) FROM channel_outgoing_queue WHERE state = 'pending') as pending_out,
        (SELECT COUNT(*) FROM channel_outgoing_queue WHERE state = 'failed' OR state = 'dead_letter') as failed_out,
        (SELECT COUNT(*) FROM channel_incoming_queue WHERE state = 'pending') as pending_in
    `);

    const channelMetrics = await query(
      `SELECT * FROM channel_metrics ORDER BY updated_at DESC LIMIT 50`,
    );

    const workers = await query(`SELECT * FROM transport_workers ORDER BY last_seen DESC`);

    res.json({
      success: true,
      data: {
        queue: queueMetrics[0] || { pending_out: 0, failed_out: 0, pending_in: 0 },
        channels: channelMetrics,
        workers,
      },
    });
  } catch (err) {
    console.error(err);
    res.json({ success: false, msg: 'failed to fetch metrics' });
  }
});

module.exports = router;
