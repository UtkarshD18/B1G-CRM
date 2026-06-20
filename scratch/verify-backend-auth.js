require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const { query, withTransaction } = require('../database/dbpromise.js');
const env = require('../env');

const BASE_URL = process.env.TEST_BASE_URL || 'http://127.0.0.1:3010/api';
const USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'User@123';
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || 'Admin@123';

const runTest = async () => {
  console.log('=== Backend Auth & Transaction Safety Verification ===\n');

  const results = {
    unauthenticatedAccessBlocked: false,
    malformedTokenBlocked: false,
    roleMismatchBlocked: false,
    inactiveAgentAccessBlocked: false,
    agentOwnerContextLoaded: false,
    transactionRollbackSafety: false,
    pass: false
  };

  try {
    // Obtain active user and admin tokens
    console.log('Logging in as User and Admin to fetch valid tokens...');
    let userToken = '';
    let adminToken = '';
    let userUid = '';

    try {
      const userRes = await axios.post(`${BASE_URL}/user/login`, {
        email: 'user@example.com',
        password: USER_PASSWORD
      });
      userToken = userRes.data.token;
      userUid = userRes.data.uid || 'local-user-uid';
      console.log('  ✅ User logged in.');
    } catch (err) {
      console.warn('  ⚠️ User login failed, using direct DB token generation:', err.message);
      userToken = jwt.sign({ email: 'user@example.com', uid: 'local-user-uid', role: 'user' }, env.JWT_SECRET);
      userUid = 'local-user-uid';
    }

    try {
      const adminRes = await axios.post(`${BASE_URL}/admin/login`, {
        email: 'admin@example.com',
        password: ADMIN_PASSWORD
      });
      adminToken = adminRes.data.token;
      console.log('  ✅ Admin logged in.');
    } catch (err) {
      console.warn('  ⚠️ Admin login failed, using direct DB token generation:', err.message);
      adminToken = jwt.sign({ email: 'admin@example.com', uid: 'local-admin-uid', role: 'admin' }, env.JWT_SECRET);
    }

    // 1. Unauthenticated access block check
    console.log('\nChecking unauthenticated access block...');
    try {
      const res = await axios.get(`${BASE_URL}/inbox/get_chats`);
      console.log('  ❌ FAILED: Inbox chats accessed without token.');
    } catch (err) {
      const status = err.response?.status;
      const logout = err.response?.data?.logout;
      console.log(`  ✅ SUCCESS: Unauthenticated access blocked. Status: ${status}, logout: ${logout}`);
      if (logout === true) {
        results.unauthenticatedAccessBlocked = true;
      }
    }

    // 2. Malformed token check
    console.log('\nChecking malformed token block...');
    try {
      await axios.get(`${BASE_URL}/inbox/get_chats`, {
        headers: { Authorization: 'Bearer NOT_A_REAL_TOKEN' }
      });
      console.log('  ❌ FAILED: Accessed with malformed token.');
    } catch (err) {
      const status = err.response?.status;
      const logout = err.response?.data?.logout;
      console.log(`  ✅ SUCCESS: Malformed token blocked. Status: ${status}, logout: ${logout}`);
      if (logout === true) {
        results.malformedTokenBlocked = true;
      }
    }

    // 3. Role mismatch check (User accessing Admin endpoints)
    console.log('\nChecking role mismatch block (User accessing Admin route)...');
    try {
      await axios.get(`${BASE_URL}/admin/get_users`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      console.log('  ❌ FAILED: User token accessed Admin page.');
    } catch (err) {
      const logout = err.response?.data?.logout;
      console.log(`  ✅ SUCCESS: Role mismatch blocked. logout: ${logout}`);
      if (logout === true) {
        results.roleMismatchBlocked = true;
      }
    }

    // 4. Inactive agent check
    console.log('\nSetting up temporary inactive agent in DB...');
    const tempAgentUid = 'inactive-agent-uid-' + Date.now();
    const tempAgentEmail = 'inactive-agent@example.com';
    await query(
      `INSERT INTO agents (owner_uid, uid, name, email, password, role, is_active)
       VALUES (?, ?, ?, ?, ?, 'agent', 0)`,
      [userUid, tempAgentUid, 'Inactive Agent', tempAgentEmail, 'hashedpassword']
    );

    const inactiveAgentToken = jwt.sign(
      { email: tempAgentEmail, uid: tempAgentUid, role: 'agent' },
      env.JWT_SECRET
    );

    console.log('Checking inactive agent access...');
    try {
      await axios.get(`${BASE_URL}/agent/get_my_assigned_chats`, {
        headers: { Authorization: `Bearer ${inactiveAgentToken}` }
      });
      console.log('  ❌ FAILED: Inactive agent accessed agent endpoint.');
    } catch (err) {
      const logout = err.response?.data?.logout;
      console.log(`  ✅ SUCCESS: Inactive agent blocked. logout: ${logout}`);
      if (logout === true) {
        results.inactiveAgentAccessBlocked = true;
      }
    }

    // 5. Active agent owner context verification
    console.log('\nUpdating agent to active...');
    await query(`UPDATE agents SET is_active = 1 WHERE uid = ?`, [tempAgentUid]);

    console.log('Verifying active agent accesses endpoint and retrieves chats...');
    try {
      const res = await axios.get(`${BASE_URL}/agent/get_my_assigned_chats`, {
        headers: { Authorization: `Bearer ${inactiveAgentToken}` }
      });
      console.log(`  ✅ SUCCESS: Active agent accessed endpoint. Success status: ${res.data.success}`);
      results.agentOwnerContextLoaded = true;
    } catch (err) {
      console.log('  ❌ FAILED: Active agent could not access endpoint:', err.message);
    }

    // Clean up temporary agent
    await query(`DELETE FROM agents WHERE uid = ?`, [tempAgentUid]);

    // 6. Transaction Rollback Safety verification
    console.log('\nTesting transaction rollback safety...');
    let leadCountBefore = 0;
    const countRes = await query(`SELECT COUNT(*)::int as count FROM crm_leads`);
    leadCountBefore = countRes[0].count;

    try {
      await withTransaction(async (tx) => {
        // First query succeeds
        await tx(
          `INSERT INTO crm_leads (uid, name, mobile, stage) VALUES (?, ?, ?, ?)`,
          [userUid, 'Transaction Rollback Test Lead', '0000000000', 'Lead']
        );

        // Explicitly throw error to force transaction rollback
        throw new Error('Forced Rollback Error');
      });
    } catch (err) {
      console.log(`  - Caught expected transaction error: ${err.message}`);
    }

    const countResAfter = await query(`SELECT COUNT(*)::int as count FROM crm_leads`);
    const leadCountAfter = countResAfter[0].count;
    console.log(`  - Leads count before: ${leadCountBefore}, after rollback: ${leadCountAfter}`);

    if (leadCountBefore === leadCountAfter) {
      results.transactionRollbackSafety = true;
      console.log('  ✅ SUCCESS: Transaction successfully rolled back and no partial state was written!');
    } else {
      console.log('  ❌ FAILED: Lead record was written despite transaction error.');
    }

    // Evaluate summary pass
    if (
      results.unauthenticatedAccessBlocked &&
      results.malformedTokenBlocked &&
      results.roleMismatchBlocked &&
      results.inactiveAgentAccessBlocked &&
      results.agentOwnerContextLoaded &&
      results.transactionRollbackSafety
    ) {
      results.pass = true;
      console.log('\n✅ All Backend Auth & Transaction safety verification checks PASSED!');
    } else {
      console.log('\n❌ Backend Auth & Transaction safety verification FAILED!');
    }

  } catch (err) {
    console.error('\n❌ Verification script encountered error:', err.message, err.stack);
  }

  process.exit(results.pass ? 0 : 1);
};

runTest();
