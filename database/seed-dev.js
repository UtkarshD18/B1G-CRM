/**
 * database/seed-dev.js
 *
 * Seeds development credentials with KNOWN passwords on every startup.
 * Uses the same bcrypt library the application uses for authentication.
 *
 * Credentials:
 *   admin@example.com  /  <set via TEST_ADMIN_PASSWORD>
 *   user@example.com   /  <set via TEST_USER_PASSWORD>
 *   agent@example.com  /  <set via TEST_USER_PASSWORD>
 */
const bcrypt = require('bcrypt');
const pool = require('./config');

const SALT_ROUNDS = 10;

const DEV_ACCOUNTS = {
  admin: { email: 'admin@example.com', password: process.env.TEST_ADMIN_PASSWORD || 'CHANGE_ME' },
  user:  { email: 'user@example.com',  password: process.env.TEST_USER_PASSWORD || 'CHANGE_ME' },
  agent: { email: 'agent@example.com', password: process.env.TEST_AGENT_PASSWORD || 'CHANGE_ME' },
};

async function seedDevCredentials({ logger = console } = {}) {
  const client = await pool.connect();

  try {
    // Admin
    const adminHash = await bcrypt.hash(DEV_ACCOUNTS.admin.password, SALT_ROUNDS);
    await client.query(
      `INSERT INTO admin (uid, email, password, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password`,
      ['local-admin-uid', DEV_ACCOUNTS.admin.email, adminHash, 'admin']
    );

    // User
    const userHash = await bcrypt.hash(DEV_ACCOUNTS.user.password, SALT_ROUNDS);
    await client.query(
      `INSERT INTO "user" (uid, name, email, password, role, timezone, plan, plan_expire)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password`,
      [
        'local-user-uid',
        'Local User',
        DEV_ACCOUNTS.user.email,
        userHash,
        'user',
        'Asia/Kolkata',
        '{"contact_limit":100000,"allow_note":1,"allow_tag":1,"allow_chatbot":1,"allow_api":1}',
        4102444800000
      ]
    );

    // Agent
    const agentHash = await bcrypt.hash(DEV_ACCOUNTS.agent.password, SALT_ROUNDS);
    await client.query(
      `INSERT INTO agents (owner_uid, uid, email, password, role, name, mobile, comments, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (email) DO UPDATE
       SET password = EXCLUDED.password`,
      [
        'local-user-uid',
        'local-agent-uid',
        DEV_ACCOUNTS.agent.email,
        agentHash,
        'agent',
        'Local Agent',
        '',
        'Local development agent',
        1
      ]
    );

    if (logger && typeof logger.info === 'function') {
      logger.info('Dev credentials seeded', {
        admin: DEV_ACCOUNTS.admin.email,
        user: DEV_ACCOUNTS.user.email,
        agent: DEV_ACCOUNTS.agent.email,
      });
    } else {
      console.log('Dev credentials seeded');
    }
  } catch (err) {
    const msg = 'Dev credential seeding failed';
    if (logger && typeof logger.error === 'function') {
      logger.error(msg, { error: err.message });
    } else {
      console.error(msg, err.message);
    }
    // Non-fatal: server can still start even if seeding fails
  } finally {
    client.release();
  }
}

module.exports = { seedDevCredentials };
