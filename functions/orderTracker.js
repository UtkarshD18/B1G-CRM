const { MongoClient, ObjectId } = require('mongodb');
const fetch = require('node-fetch');
const env = require('../env');

// Cache Expressbees Auth Token
let cachedXbToken = null;
let cachedXbTokenAt = 0;

/**
 * Authenticates with Expressbees to get an API token.
 */
async function getExpressbeesToken() {
  const email = process.env.XPRESSBEES_EMAIL;
  const password = process.env.XPRESSBEES_PASSWORD;
  const baseUrl = process.env.XPRESSBEES_BASE_URL || 'https://shipment.xpressbees.com/api';

  if (!email || !password) {
    return null;
  }

  const now = Date.now();
  if (cachedXbToken && now - cachedXbTokenAt < 11 * 60 * 60 * 1000) {
    return cachedXbToken;
  }

  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const json = await res.json();
    if (json?.status && json?.data) {
      cachedXbToken = String(json.data);
      cachedXbTokenAt = now;
      return cachedXbToken;
    }
  } catch (err) {
    console.error('[Order Tracker] Expressbees login failed:', err.message);
  }
  return null;
}

/**
 * Fetches live shipment tracking updates from Expressbees for a given AWB.
 */
async function getExpressbeesTracking(awb) {
  const token = await getExpressbeesToken();
  if (!token) return null;

  const baseUrl = process.env.XPRESSBEES_BASE_URL || 'https://shipment.xpressbees.com/api';
  try {
    const res = await fetch(`${baseUrl.replace(/\/+$/, '')}/shipments2/track/${awb}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const json = await res.json();
    return json;
  } catch (err) {
    console.error('[Order Tracker] Expressbees tracking request failed:', err.message);
    return null;
  }
}

/**
 * Searches the integrated site's MongoDB for the customer's order.
 * Can search by phone number or by matching an order number (e.g. BOG-, TMP-, H1G-).
 */
async function findOrderInStorefrontDb(phone, orderIdQuery) {
  const mongoUri = process.env.BOGECOM_MONGO_URI;
  if (!mongoUri) {
    console.log('[Order Tracker] BOGECOM_MONGO_URI not configured. Skipping MongoDB search.');
    return null;
  }

  let client;
  try {
    client = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    const db = client.db();
    const ordersCol = db.collection('orders');

    // Build search filters
    const searchQueries = [];

    // Search by Order ID if present in the message
    if (orderIdQuery) {
      const cleanId = orderIdQuery.toUpperCase().trim();
      searchQueries.push({ orderNumber: cleanId });
      searchQueries.push({ displayOrderId: cleanId });
      searchQueries.push({ temp_id: cleanId });
      searchQueries.push({ final_id: cleanId });

      // If it looks like a Mongo ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(cleanId)) {
        try {
          searchQueries.push({ _id: new ObjectId(cleanId) });
        } catch (e) {}
      }
    }

    // Search by phone number
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '');
      const shortPhone = cleanPhone.length > 10 ? cleanPhone.slice(-10) : cleanPhone;

      searchQueries.push({ 'billingDetails.phone': { $regex: shortPhone } });
      searchQueries.push({ 'deliveryAddressSnapshot.order_mobile': { $regex: shortPhone } });
      searchQueries.push({ 'guestDetails.phone': { $regex: shortPhone } });
    }

    if (searchQueries.length === 0) return null;

    // Find the latest matching order
    const order = await ordersCol.findOne({ $or: searchQueries }, { sort: { createdAt: -1 } });

    return order;
  } catch (err) {
    console.error('[Order Tracker] Storefront DB search failed:', err.message);
    return null;
  } finally {
    if (client) {
      await client.close().catch(() => {});
    }
  }
}

/**
 * Tracks an order and returns formatted context for Gemini.
 */
async function getOrderTrackingContext(senderNumber, messageText) {
  // Extract potential Order ID from message
  let orderIdQuery = null;
  const orderIdMatch = (messageText || '').match(/(BOG|TMP|H1G)-[A-Z0-9/\-]+/i);
  if (orderIdMatch) {
    orderIdQuery = orderIdMatch[0];
  }

  // Find order in MongoDB
  const order = await findOrderInStorefrontDb(senderNumber, orderIdQuery);

  if (!order) {
    // If no storefront MongoDB is connected, search the local PostgreSQL database
    try {
      const { query } = require('../database/dbpromise');
      const cleanNumber = (senderNumber || '').replace(/\D/g, '');
      const shortNumber = cleanNumber.length > 10 ? cleanNumber.slice(-10) : cleanNumber;

      const pgOrders = await query(
        `SELECT id, amount, payment_mode, data, createdat 
         FROM orders 
         WHERE (data LIKE ? OR data LIKE ?) 
         ORDER BY createdat DESC 
         LIMIT 1`,
        [`%${cleanNumber}%`, `%${shortNumber}%`],
      );

      if (pgOrders && pgOrders.length > 0) {
        const pgOrder = pgOrders[0];
        let details = {};
        try {
          details = JSON.parse(pgOrder.data);
        } catch (e) {}

        const status = details.status || 'pending';
        const awb = details.awb || null;
        const courier = details.courier || 'Expressbees';

        let context = `Customer's Local Seeded Order Details:
- Order Number: BOG-${pgOrder.id}
- Order Status: ${status}
- Payment Status: ${pgOrder.payment_mode || 'paid'}
- Date: ${pgOrder.createdat || 'N/A'}
- Items: ${JSON.stringify(details.items || [])}`;

        if (awb) {
          context += `\n- Shipping Courier: ${courier}\n- AWB Number: ${awb}`;
          context += `\n- Live Tracking Status: ${status === 'Out for Delivery' ? 'Out for Delivery (Arriving Today)' : 'In Transit'}`;
        }
        return context;
      }
    } catch (err) {
      console.error('[Order Tracker] PostgreSQL fallback search failed:', err.message);
    }
    return null;
  }

  // Get AWB details
  const awb = order.awbNumber || order.awb_number || null;
  const status = order.order_status || order.status || 'pending';
  const displayId = order.orderNumber || order.displayOrderId || `Order (${order._id})`;

  let trackingInfo = null;
  if (awb) {
    trackingInfo = await getExpressbeesTracking(awb);
  }

  // Format response details
  let context = `Customer's Storefront Order Details:
- Order Number: ${displayId}
- Order Status: ${status}
- Payment Status: ${order.payment_status || 'pending'}
- Date: ${order.createdAt || 'N/A'}
- Delivery Address: ${order.deliveryAddressSnapshot?.full_address || order.billingDetails?.address || 'N/A'}`;

  if (awb) {
    context += `\n- Shipping Courier: Xpressbees\n- AWB Number: ${awb}`;
    if (trackingInfo && trackingInfo.data) {
      context += `\n- Live Tracking Status: ${JSON.stringify(trackingInfo.data)}`;
    } else {
      context += `\n- Live Tracking Status: Shipped (Tracking updates pending from courier)`;
    }
  } else {
    context += `\n- Shipping Info: Not yet shipped (awaiting warehouse processing)`;
  }

  return context;
}

module.exports = { getOrderTrackingContext };
