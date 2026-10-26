const express = require('express');
const router = express.Router();
const razorpayController = require('../controllers/razorpayController');
const { extractToken, verifyToken } = require('../utils/auth');

// Optional auth middleware: extracts user token if present, but doesn't block unauthenticated requests
function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = extractToken(authHeader);
      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          req.decode = decoded;
        }
      }
    }
  } catch {
    // Ignore invalid optional tokens
  }
  next();
}

/**
 * STEP 1: Backend Endpoint to create orders
 * POST /api/create-order
 * Request: { amount (paise), currency, receipt }
 * Return: { order_id, amount, currency }
 * Minimum amount: 100 paise
 */
router.post('/create-order', optionalAuth, razorpayController.createOrder);

/**
 * STEP 3: Backend Endpoint to verify payment signature
 * POST /api/verify-payment
 * Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
 * Compare generated signature with razorpay_signature
 * Return success only if signatures match
 */
router.post('/verify-payment', optionalAuth, razorpayController.verifyPayment);

/**
 * Public configuration endpoint for Frontend
 * GET /api/razorpay/config
 * Returns public Key ID only (never KEY_SECRET)
 */
router.get('/razorpay/config', razorpayController.getConfig);

module.exports = router;
