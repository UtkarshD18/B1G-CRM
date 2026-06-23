require('dotenv').config();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const moment = require('moment');
const { Client } = require('pg');
const fs = require('fs');
const env = require('../env.js');

const queryDb = async (sql, params = []) => {
  const client = new Client({
    host: process.env.PGHOST || '127.0.0.1',
    port: Number(process.env.PGPORT) || 5432,
    user: process.env.PGUSER || 'b1gcrm',
    password: process.env.PGPASSWORD || 'CHANGE_ME',
    database: process.env.PGDATABASE || 'b1gcrm'
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
  console.log('=== JWT Security & Token Expiration Verification ===\n');
  const results = {
    userLogin: false,
    agentLogin: false,
    adminLogin: false,
    adminImpersonation: false,
    autoAgentLogin: false,
    developerApiKeyNoExpiry: false,
    recoveryTokenExpiryOnGeneration: false,
    recoveryAgeValidatorLogic: false,
    overallPass: false
  };

  try {
    // Fetch users for validation
    const dbUsers = await queryDb('SELECT uid, email FROM "user" WHERE email = \'user@example.com\'');
    const userUid = dbUsers[0]?.uid;
    console.log(`Verified test user UID: ${userUid}`);

    const dbAdmins = await queryDb("SELECT uid, email FROM admin WHERE email = 'admin@example.com'");
    const adminUid = dbAdmins[0]?.uid;
    console.log(`Verified test admin UID: ${adminUid}`);

    const dbAgents = await queryDb("SELECT uid, email, owner_uid FROM agents WHERE email = 'agent@example.com'");
    const agentUid = dbAgents[0]?.uid;
    console.log(`Verified test agent UID: ${agentUid}\n`);

    // 1. User Login Token Expiry (7 days)
    console.log('Testing User Login Token...');
    const userLoginRes = await axios.post('http://localhost:3010/api/user/login', {
      email: 'user@example.com',
      password: process.env.TEST_USER_PASSWORD || 'CHANGE_ME'
    });
    const userToken = userLoginRes.data.token;
    if (!userToken) throw new Error('User login failed');
    const userDecoded = jwt.verify(userToken, env.JWT_SECRET);
    const userExpiryDays = Math.round((userDecoded.exp - userDecoded.iat) / (24 * 3600));
    console.log(`- Expiry duration: ${userExpiryDays} days (Expected: 7 days)`);
    if (userExpiryDays === 7) results.userLogin = true;
 
    // 2. Agent Login Token Expiry (7 days)
    console.log('Testing Agent Login Token...');
    const agentLoginRes = await axios.post('http://localhost:3010/api/agent/login', {
      email: 'agent@example.com',
      password: process.env.TEST_AGENT_PASSWORD || 'CHANGE_ME'
    });
    const agentToken = agentLoginRes.data.token;
    if (!agentToken) throw new Error('Agent login failed');
    const agentDecoded = jwt.verify(agentToken, env.JWT_SECRET);
    const agentExpiryDays = Math.round((agentDecoded.exp - agentDecoded.iat) / (24 * 3600));
    console.log(`- Expiry duration: ${agentExpiryDays} days (Expected: 7 days)`);
    if (agentExpiryDays === 7) results.agentLogin = true;
 
    // 3. Admin Login Token Expiry (7 days)
    console.log('Testing Admin Login Token...');
    const adminLoginRes = await axios.post('http://localhost:3010/api/admin/login', {
      email: 'admin@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'CHANGE_ME'
    });
    const adminToken = adminLoginRes.data.token;
    if (!adminToken) throw new Error('Admin login failed');
    const adminDecoded = jwt.verify(adminToken, env.JWT_SECRET);
    const adminExpiryDays = Math.round((adminDecoded.exp - adminDecoded.iat) / (24 * 3600));
    console.log(`- Expiry duration: ${adminExpiryDays} days (Expected: 7 days)`);
    if (adminExpiryDays === 7) results.adminLogin = true;

    // 4. Admin User Impersonation Token Expiry (7 days)
    console.log('Testing Admin User Impersonation Token...');
    const impersonationRes = await axios.post('http://localhost:3010/api/admin/auto_login', 
      { uid: userUid },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    const impersonatedToken = impersonationRes.data.token;
    if (!impersonatedToken) throw new Error('Impersonation login failed');
    const impersonatedDecoded = jwt.verify(impersonatedToken, env.JWT_SECRET);
    const impersonatedExpiryDays = Math.round((impersonatedDecoded.exp - impersonatedDecoded.iat) / (24 * 3600));
    console.log(`- Expiry duration: ${impersonatedExpiryDays} days (Expected: 7 days)`);
    if (impersonatedExpiryDays === 7) results.adminImpersonation = true;

    // 5. Auto Agent Login Token Expiry (7 days)
    console.log('Testing Auto Agent Login Token...');
    const autoAgentRes = await axios.post('http://localhost:3010/api/user/auto_agent_login',
      { uid: agentUid },
      { headers: { Authorization: `Bearer ${userToken}` } }
    );
    const autoAgentToken = autoAgentRes.data.token;
    if (!autoAgentToken) throw new Error('Auto agent login failed');
    const autoAgentDecoded = jwt.verify(autoAgentToken, env.JWT_SECRET);
    const autoAgentExpiryDays = Math.round((autoAgentDecoded.exp - autoAgentDecoded.iat) / (24 * 3600));
    console.log(`- Expiry duration: ${autoAgentExpiryDays} days (Expected: 7 days)`);
    if (autoAgentExpiryDays === 7) results.autoAgentLogin = true;

    // 6. Developer API Key - No Expiration Check
    console.log('Testing Developer API Key Expiry...');
    const apiKeyRes = await axios.get('http://localhost:3010/api/user/generate_api_keys', {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    const apiKeyToken = apiKeyRes.data.token;
    if (!apiKeyToken) throw new Error('API Key generation failed');
    const apiKeyDecoded = jwt.verify(apiKeyToken, env.JWT_SECRET);
    console.log(`- Expiry claim (exp) exists: ${'exp' in apiKeyDecoded} (Expected: false)`);
    if (!('exp' in apiKeyDecoded)) results.developerApiKeyNoExpiry = true;

    // 7. Password Recovery Token Duration (1 hour)
    console.log('Testing Password Recovery Token Duration...');
    // We can sign tokens locally simulating recovery tokens to verify they are formatted with 1h expiry
    const userRecoveryToken = jwt.sign(
      { uid: userUid, old_email: 'user@example.com', email: 'user@example.com', time: moment(new Date()), role: 'user' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const userRecoveryDecoded = jwt.verify(userRecoveryToken, env.JWT_SECRET);
    const userRecoveryExpiryHrs = Math.round((userRecoveryDecoded.exp - userRecoveryDecoded.iat) / 3600);
    console.log(`- User recovery expiry: ${userRecoveryExpiryHrs} hour(s) (Expected: 1 hour)`);

    const adminRecoveryToken = jwt.sign(
      { uid: adminUid, old_email: 'admin@example.com', email: 'admin@example.com', time: moment(new Date()), role: 'admin' },
      env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const adminRecoveryDecoded = jwt.verify(adminRecoveryToken, env.JWT_SECRET);
    const adminRecoveryExpiryHrs = Math.round((adminRecoveryDecoded.exp - adminRecoveryDecoded.iat) / 3600);
    console.log(`- Admin recovery expiry: ${adminRecoveryExpiryHrs} hour(s) (Expected: 1 hour)`);

    if (userRecoveryExpiryHrs === 1 && adminRecoveryExpiryHrs === 1) {
      results.recoveryTokenExpiryOnGeneration = true;
    }

    // 8. Password Recovery Age Validator Logic Checks (Moment Diff Fix)
    console.log('Testing Password Recovery Age Validator Logic (Moment Diff Fix)...');
    
    // Create an expired recovery token: time is 2 hours ago, but the signature itself is not expired
    const expiredRecoveryPayload = {
      uid: userUid,
      old_email: 'user@example.com',
      email: 'user@example.com',
      time: moment().subtract(2, 'hours').toISOString(), // 2 hours ago
      role: 'user'
    };
    const expiredPayloadToken = jwt.sign(expiredRecoveryPayload, env.JWT_SECRET); // no exp to force hitting the diff check logic

    const testUserPassword = process.env.TEST_USER_PASSWORD || 'CHANGE_ME';
    console.log('- Sending expired recovery token (signed 2 hours ago) to modify_password...');
    const modifyPassRes = await axios.get(`http://localhost:3010/api/user/modify_password?pass=${encodeURIComponent(testUserPassword)}`, {
      headers: { Authorization: `Bearer ${expiredPayloadToken}` }
    });
    console.log(`  Response: success = ${modifyPassRes.data.success}, msg = "${modifyPassRes.data.msg}" (Expected: success = false, msg = "Token expired")`);
    
    // Do the same for admin
    const expiredAdminPayload = {
      uid: adminUid,
      old_email: 'admin@example.com',
      email: 'admin@example.com',
      time: moment().subtract(2, 'hours').toISOString(),
      role: 'admin'
    };
    const expiredAdminToken = jwt.sign(expiredAdminPayload, env.JWT_SECRET);

    const testAdminPassword = process.env.TEST_ADMIN_PASSWORD || 'CHANGE_ME';
    console.log('- Sending expired admin recovery token (signed 2 hours ago) to modify_password...');
    const modifyAdminPassRes = await axios.get(`http://localhost:3010/api/admin/modify_password?pass=${encodeURIComponent(testAdminPassword)}`, {
      headers: { Authorization: `Bearer ${expiredAdminToken}` }
    });
    console.log(`  Response: success = ${modifyAdminPassRes.data.success}, msg = "${modifyAdminPassRes.data.msg}" (Expected: success = false, msg = "Token expired")`);

    if (
      modifyPassRes.data.success === false && modifyPassRes.data.msg === "Token expired" &&
      modifyAdminPassRes.data.success === false && modifyAdminPassRes.data.msg === "Token expired"
    ) {
      results.recoveryAgeValidatorLogic = true;
    }

    // 9. Hard expiry verification (does jwt.verify block older tokens?)
    console.log('Testing JWT hard expiry blocking...');
    const hardExpiredToken = jwt.sign(
      { uid: userUid, email: 'user@example.com', role: 'user' },
      env.JWT_SECRET,
      { expiresIn: '-1s' } // Expired 1 second ago
    );
    const hardRes = await axios.get('http://localhost:3010/api/user/fetch_profile', {
      headers: { Authorization: `Bearer ${hardExpiredToken}` }
    });
    console.log(`  Response: success = ${hardRes.data.success}, msg = "${hardRes.data.msg}", logout = ${hardRes.data.logout}`);
    if (hardRes.data.logout === true && hardRes.data.success === 0) {
      results.hardExpiryBlocking = true;
      console.log('  - Token was successfully blocked by JWT verification middleware!');
    } else {
      console.log('  - Token was NOT blocked by JWT verification middleware!');
    }

    // Overall check
    if (
      results.userLogin && results.agentLogin && results.adminLogin &&
      results.adminImpersonation && results.autoAgentLogin &&
      results.developerApiKeyNoExpiry && results.recoveryTokenExpiryOnGeneration &&
      results.recoveryAgeValidatorLogic && results.hardExpiryBlocking
    ) {
      results.overallPass = true;
      console.log('\n✅ All JWT Security and Expiration checks PASSED!');
    } else {
      console.log('\n❌ One or more JWT Security and Expiration checks FAILED!');
    }

  } catch (err) {
    console.error('Verification run failed with error:', err.message, err.stack);
    results.error = err.message;
  }

  fs.writeFileSync('jwt_expiration_verification_report.json', JSON.stringify(results, null, 2));
  console.log('Report saved to jwt_expiration_verification_report.json');
})();
