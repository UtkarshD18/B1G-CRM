const { query } = require('../database/dbpromise');
const env = require('../env.js');
const Stripe = require('stripe');
const randomstring = require('randomstring');
const billingHelper = require('../functions/helpers/billingHelper');

async function getPlanDetails(planId) {
  const data = await query(`SELECT * FROM plan WHERE id = ?`, [planId]);
  if (data.length < 1) {
    return { success: false, data: null };
  } else {
    return { success: true, data: data[0] };
  }
}

async function getPaymentDetails(uid) {
  const resp = await query(`SELECT * FROM web_private`, []);
  let data = resp[0];
  const [userData] = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);

  if (data) {
    data.pay_stripe_key = '';
    data.pay_mercadopago_key = '';
  }

  return { success: true, data, userData };
}

async function createStripeSession({ uid, planId }) {
  const getWeb = await query(`SELECT * FROM web_private`, []);

  if (getWeb.length < 1 || !getWeb[0]?.pay_stripe_key || !getWeb[0]?.pay_stripe_id) {
    return {
      success: false,
      msg: 'Opss.. payment keys found not found',
    };
  }

  const stripeKeys = getWeb[0]?.pay_stripe_key;
  const stripeClient = new Stripe(stripeKeys);

  const plan = await query(`SELECT * FROM plan WHERE id = ?`, [planId]);
  if (plan.length < 1) {
    return { success: false, msg: 'No plan found with the id' };
  }

  const randomSt = randomstring.generate();
  const orderID = `STRIPE_${randomSt}`;

  await query(`INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?,?,?,?)`, [
    uid,
    'STRIPE',
    plan[0]?.price,
    orderID,
  ]);

  const web = await query(`SELECT * FROM web_public`, []);

  const productStripe = [
    {
      price_data: {
        currency: web[0]?.currency_code,
        product_data: {
          name: plan[0]?.title,
        },
        unit_amount: plan[0]?.price * 100,
      },
      quantity: 1,
    },
  ];

  const session = await stripeClient.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: productStripe,
    mode: 'payment',
    success_url: `${env.BACKEND_URL}/api/user/stripe_payment?order=${orderID}&plan=${plan[0]?.id}`,
    cancel_url: `${env.BACKEND_URL}/api/user/stripe_payment?order=${orderID}&plan=${plan[0]?.id}`,
    locale: env.STRIPE_LANG,
  });

  await query(`UPDATE orders SET s_token = ? WHERE data = ?`, [session?.id, orderID]);

  return { success: true, session };
}

async function processRazorpayPayment({ uid, rz_payment_id, plan, amount }) {
  if (!rz_payment_id || !plan || !amount) {
    return { success: false, msg: 'please send required fields' };
  }

  const getPlan = await query(`SELECT * FROM plan WHERE id = ?`, [plan?.id]);
  if (getPlan.length < 1) {
    return { success: false, msg: 'Invalid plan found' };
  }

  const [webPrivate] = await query(`SELECT * from web_private`, []);
  const [webPublic] = await query(`SELECT * FROM web_public`, []);

  const rzId = webPrivate?.rz_id;
  const rzKeys = webPrivate?.rz_key;

  if (!rzId || !rzKeys) {
    return { success: false, msg: 'Please fill your razorpay credentials!' };
  }

  const finalamt = (parseInt(amount) / parseInt(webPublic.exchange_rate || 1)) * 80;

  const resp = await billingHelper.rzCapturePayment(
    rz_payment_id,
    Math.round(finalamt) * 100,
    rzId,
    rzKeys,
  );
  if (!resp) {
    return { success: false, msg: 'Payment capture failed' };
  }

  await billingHelper.updateUserPlan(getPlan[0], uid);

  await query(`INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?,?,?,?)`, [
    uid,
    'RAZORPAY',
    plan?.price,
    JSON.stringify(resp),
  ]);

  return {
    success: true,
    msg: 'Thank for your payment you are good to go now.',
  };
}

async function processPaypalPayment({ uid, orderID, plan }) {
  if (!plan || !orderID) {
    return { success: false, msg: 'order id and plan required' };
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(orderID)) {
    return { success: false, msg: 'Invalid order ID format' };
  }

  const getPlan = await query(`SELECT * FROM plan WHERE id = ?`, [plan?.id]);
  if (getPlan.length < 1) {
    return { success: false, msg: 'Invalid plan found' };
  }

  const [webPrivate] = await query(`SELECT * from web_private`, []);
  const paypalClientId = webPrivate?.pay_paypal_id;
  const paypalClientSecret = webPrivate?.pay_paypal_key;

  if (!paypalClientId || !paypalClientSecret) {
    return {
      success: false,
      msg: 'Please provide paypal ID and keys from the Admin',
    };
  }

  let response = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization:
        'Basic ' +
        Buffer.from(`${paypalClientId}:${paypalClientSecret}`, 'binary').toString('base64'),
    },
  });

  let data = await response.json();

  let resp_order = await fetch(`https://api.sandbox.paypal.com/v1/checkout/orders/${orderID}`, {
    method: 'GET',
    headers: {
      Authorization: 'Bearer ' + data.access_token,
    },
  });

  let order_details = await resp_order.json();

  if (order_details.status === 'COMPLETED') {
    await billingHelper.updateUserPlan(getPlan[0], uid);

    await query(`INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?,?,?,?)`, [
      uid,
      'PAYPAL',
      plan?.price,
      JSON.stringify(order_details),
    ]);

    return {
      success: true,
      msg: 'Thank for your payment you are good to go now.',
    };
  } else {
    return { success: false, msg: 'error_description' };
  }
}

async function processPaystackPayment({ uid, planData, trans_id, reference }) {
  if (!planData || !trans_id) {
    return { success: false, msg: 'Order id and plan required' };
  }

  if (!reference || !/^[a-zA-Z0-9_-]+$/.test(reference)) {
    return { success: false, msg: 'Invalid reference format' };
  }

  const plan = await query(`SELECT * FROM plan WHERE id = ?`, [planData.id]);
  if (plan.length < 1) {
    return { success: false, msg: 'Sorry this plan was not found' };
  }

  const getWebPrivate = await query(`SELECT * FROM web_private`, []);
  const paystackSecretKey = getWebPrivate[0]?.pay_paystack_key;
  const paystackId = getWebPrivate[0]?.pay_paystack_id;

  if (!paystackSecretKey || !paystackId) {
    return { success: false, msg: 'Paystack credentials not found' };
  }

  var response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: {
      Authorization: `Bearer ${paystackSecretKey}`,
      'Content-Type': 'application/json',
    },
  });

  const resp = await response.json();

  if (resp.data?.status !== 'success') {
    return { success: false, msg: `${resp.message} - Ref:-${reference}` };
  }

  await query(`INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?,?,?,?)`, [
    uid,
    'PAYSTACK',
    plan[0]?.price,
    reference,
  ]);

  await billingHelper.updateUserPlan(plan[0], uid);

  return {
    success: true,
    msg: 'Payment success! Redirecting...',
  };
}

async function processOfflinePayment({ uid, planId }) {
  const getPlan = await query(`SELECT * FROM plan WHERE id = ?`, [planId]);
  if (getPlan.length < 1) {
    return { success: false, msg: 'Invalid plan found' };
  }

  await query(`INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?,?,?,?)`, [
    uid,
    'OFFLINE',
    getPlan[0].price,
    JSON.stringify({
      plan: getPlan[0],
      note: 'Manual offline/custom transaction initiated by user.',
    }),
  ]);

  await billingHelper.updateUserPlan(getPlan[0], uid);

  return {
    success: true,
    msg: 'Your offline/custom payment was recorded successfully. Plan updated!',
  };
}

async function startFreeTrial(uid, planId) {
  const getUser = await query(`SELECT * FROM user WHERE uid = ?`, [uid]);
  if (getUser[0]?.trial > 0) {
    return {
      success: false,
      msg: 'You have already taken Trial once. You can not enroll for trial again.',
    };
  }

  const getPlan = await query(`SELECT * FROM plan WHERE id = ?`, [planId]);
  if (getPlan.length < 1) {
    return { success: false, msg: 'Invalid plan found' };
  }

  if (getPlan[0]?.price > 0) {
    return { success: false, msg: 'This plan is not a trial plan.' };
  }

  await query(`INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?,?,?,?)`, [
    uid,
    'OFFLINE',
    0,
    JSON.stringify({ plan: getPlan[0] }),
  ]);

  await billingHelper.updateUserPlan(getPlan[0], getUser[0]?.uid);
  await query(`UPDATE user SET trial = ? WHERE uid = ?`, [1, uid]);

  return {
    success: true,
    msg: 'Your trial plan has been activated. You are redirecting to the panel...',
  };
}

async function checkStripePayment(orderId) {
  try {
    const getStripe = await query(`SELECT * FROM web_private`, []);
    const stripeClient = new Stripe(getStripe[0]?.pay_stripe_key);
    const getPay = await stripeClient.checkout.sessions.retrieve(orderId);

    if (getPay?.payment_status === 'paid') {
      return { success: true, data: getPay };
    } else {
      return { success: false };
    }
  } catch (err) {
    return { success: false, data: {} };
  }
}

async function verifyStripePayment({ order, plan }) {
  if (!order || !plan) {
    return { success: false, msg: 'INVALID REQUEST' };
  }

  const getOrder = await query(`SELECT * FROM orders WHERE data = ?`, [order]);
  const getPlan = await query(`SELECT * FROM plan WHERE id = ?`, [plan]);

  if (getOrder.length < 1) {
    return { success: false, msg: 'Invalid payment found' };
  }

  if (getPlan.length < 1) {
    return { success: false, msg: 'Invalid plan found' };
  }

  const checkPayment = await checkStripePayment(getOrder[0]?.s_token);

  if (checkPayment.success) {
    await query(`UPDATE orders SET data = ? WHERE data = ?`, [
      JSON.stringify(checkPayment?.data),
      order,
    ]);

    await billingHelper.updateUserPlan(getPlan[0], getOrder[0]?.uid);

    return {
      success: true,
      msg: 'Payment Success! Redirecting...',
    };
  } else {
    return {
      success: false,
      msg: 'Payment Failed! If the balance was deducted please contact to the HamWiz support. Redirecting...',
    };
  }
}

module.exports = {
  getPlanDetails,
  getPaymentDetails,
  createStripeSession,
  processRazorpayPayment,
  processPaypalPayment,
  processPaystackPayment,
  processOfflinePayment,
  startFreeTrial,
  verifyStripePayment,
};
