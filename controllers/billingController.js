const billingService = require('../services/billingService');
const env = require('../env.js');

function returnHtmlRes(msg) {
  return `<!DOCTYPE html>
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
}

async function getPlanDetails(req, res, next) {
  try {
    const result = await billingService.getPlanDetails(req.body.id);
    return res.json(result);
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong', err });
  }
}

async function getPaymentDetails(req, res, next) {
  try {
    const result = await billingService.getPaymentDetails(req.decode.uid);
    return res.json({
      data: result.data,
      userData: result.userData,
      success: result.success,
    });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'something went wrong', err });
  }
}

async function createStripeSession(req, res, next) {
  try {
    const result = await billingService.createStripeSession({
      uid: req.decode.uid,
      planId: req.body.planId,
    });
    if (!result.success) {
      return res.json({
        success: false,
        msg: result.msg,
      });
    }
    return res.json({
      success: true,
      session: result.session,
    });
  } catch (err) {
    console.log(err);
    return res.json({ msg: err.toString(), err });
  }
}

async function payWithRazorpay(req, res, next) {
  try {
    const { rz_payment_id, plan, amount } = req.body;
    const result = await billingService.processRazorpayPayment({
      uid: req.decode.uid,
      rz_payment_id,
      plan,
      amount,
    });
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({
      success: true,
      msg: result.msg,
    });
  } catch (err) {
    console.log(err);
    return res.json({ msg: err.toString(), err });
  }
}

async function payWithPaypal(req, res, next) {
  try {
    const { orderID, plan } = req.body;
    const result = await billingService.processPaypalPayment({
      uid: req.decode.uid,
      orderID,
      plan,
    });
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({
      success: true,
      msg: result.msg,
    });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'something went wrong', err });
  }
}

async function payWithPaystack(req, res, next) {
  try {
    const { planData, trans_id, reference } = req.body;
    const result = await billingService.processPaystackPayment({
      uid: req.decode.uid,
      planData,
      trans_id,
      reference,
    });
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({
      success: true,
      msg: result.msg,
    });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

async function payOffline(req, res, next) {
  try {
    const { planId } = req.body;
    const result = await billingService.processOfflinePayment({
      uid: req.decode.uid,
      planId,
    });
    if (!result.success) {
      return res.json({ success: false, msg: result.msg });
    }
    return res.json({
      success: true,
      msg: result.msg,
    });
  } catch (err) {
    console.log(err);
    return res.json({ success: false, msg: 'Failed to record custom payment' });
  }
}

async function startFreeTrial(req, res, next) {
  try {
    const { planId } = req.body;
    const result = await billingService.startFreeTrial(req.decode.uid, planId);
    if (!result.success) {
      return res.json({
        success: false,
        msg: result.msg,
      });
    }
    return res.json({
      success: true,
      msg: result.msg,
    });
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

async function stripePaymentCallback(req, res, next) {
  try {
    const { order, plan } = req.query;
    const result = await billingService.verifyStripePayment({ order, plan });
    if (!result.success) {
      if (result.msg === 'INVALID REQUEST') {
        return res.send('INVALID REQUEST');
      }
      if (result.msg.includes('Invalid payment') || result.msg.includes('Invalid plan')) {
        return res.send(result.msg);
      }
      return res.send(result.msg);
    }
    return res.send(returnHtmlRes(result.msg));
  } catch (err) {
    console.log(err);
    return res.json({ msg: 'Something went wrong', err, success: false });
  }
}

module.exports = {
  getPlanDetails,
  getPaymentDetails,
  createStripeSession,
  payWithRazorpay,
  payWithPaypal,
  payWithPaystack,
  payOffline,
  startFreeTrial,
  stripePaymentCallback,
};
