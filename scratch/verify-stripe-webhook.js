const axios = require('axios');
const { Client } = require('pg');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'b1gcrm',
    password: process.env.PGPASSWORD || 'b1gcrm123',
    database: 'b1gcrm'
  });
  await client.connect();
  try {
    const res = await client.query(sql, params);
    return res.rows;
  } finally {
    await client.end();
  }
};

(async () => {
  console.log('=== Stripe Webhook Verification ===');

  try {
    // 1. Fetch details of Trial plan
    const plans = await queryDb("SELECT * FROM plan WHERE title = 'Trial'");
    if (plans.length === 0) {
      throw new Error('Trial plan not found in database');
    }
    const trialPlan = plans[0];

    // Ensure we start with a clean test order state
    await queryDb("DELETE FROM orders WHERE data = 'STRIPE_TEST_ORDER'");

    // Fetch original stripe key to prevent overwriting user config
    const originalPrivate = await queryDb("SELECT pay_stripe_key FROM web_private WHERE id = 1");
    const originalStripeKey = originalPrivate[0]?.pay_stripe_key;

    console.log('Mocking Stripe key in database...');
    await queryDb("UPDATE web_private SET pay_stripe_key = 'mock_stripe_key' WHERE id = 1");

    // 2. Insert test order in database
    console.log('Inserting test order...');
    await queryDb(
      "INSERT INTO orders (uid, payment_mode, amount, data, s_token) VALUES ('local-user-uid', 'STRIPE', 0.00, 'STRIPE_TEST_ORDER', 'cs_test_session_id')"
    );

    // 3. Reset user plan in database to dummy state
    console.log('Resetting user plan to empty...');
    await queryDb(
      "UPDATE \"user\" SET plan = '{}', plan_expire = 0 WHERE uid = 'local-user-uid'"
    );

    // Verify initial state
    const userBefore = await queryDb("SELECT plan, plan_expire FROM \"user\" WHERE uid = 'local-user-uid'");
    console.log('User plan before webhook:', userBefore[0]);

    // 4. Send mock checkout.session.completed event to webhook
    console.log('Firing Stripe completed webhook POST request...');
    const webhookPayload = {
      type: 'checkout.session.completed',
      id: 'evt_test_123',
      data: {
        object: {
          id: 'cs_test_session_id',
          payment_status: 'paid',
          metadata: {
            orderID: 'STRIPE_TEST_ORDER',
            planID: String(trialPlan.id),
            uid: 'local-user-uid'
          }
        }
      }
    };

    const response = await axios.post('http://localhost:3010/api/user/stripe_webhook', webhookPayload);
    console.log('Webhook Response status:', response.status);
    console.log('Webhook Response data:', response.data);

    // 5. Verify database changes
    const userAfter = await queryDb("SELECT plan, plan_expire FROM \"user\" WHERE uid = 'local-user-uid'");
    const orderAfter = await queryDb("SELECT data FROM orders WHERE s_token = 'cs_test_session_id'");

    console.log('User plan after webhook:', userAfter[0]);
    console.log('Order data row after webhook:', orderAfter[0]?.data);

    const isPlanUpdated = userAfter[0]?.plan && userAfter[0]?.plan.includes(trialPlan.title);
    const isOrderUpdated = orderAfter[0]?.data && orderAfter[0].data.includes('cs_test_session_id');

    if (isPlanUpdated && isOrderUpdated) {
      console.log('✅ SUCCESS: Stripe Webhook Reconciled payment and updated user entitlements successfully!');
    } else {
      console.error('❌ FAILURE: Payment reconciliation failed.');
      console.log('Plan Updated:', isPlanUpdated, 'Order Updated:', isOrderUpdated);
    }

    // Cleanup
    await queryDb("DELETE FROM orders WHERE data = 'STRIPE_TEST_ORDER'");
    console.log('Restoring original Stripe key...');
    await queryDb("UPDATE web_private SET pay_stripe_key = $1 WHERE id = 1", [originalStripeKey]);
    // Restore dev environment defaults
    await queryDb(
      `UPDATE "user" SET plan = '{"contact_limit":100000,"allow_note":1,"allow_tag":1,"allow_chatbot":1,"allow_api":1}', plan_expire = 4102444800000 WHERE uid = 'local-user-uid'`
    );

  } catch (err) {
    console.error('Stripe webhook verification failed:', err.message);
  }
})();
