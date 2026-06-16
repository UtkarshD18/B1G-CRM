/**
 * database/seed-dev.js
 *
 * Seeds development credentials with KNOWN passwords on every startup.
 * Uses the same bcrypt library the application uses for authentication.
 *
 * Credentials:
 *   admin@example.com  /  Admin@123
 *   user@example.com   /  User@123
 *   agent@example.com  /  User@123
 */
const bcrypt = require('bcrypt');
const pool = require('./config');

const SALT_ROUNDS = 10;

const DEV_ACCOUNTS = {
  admin: { email: 'admin@example.com', password: 'Admin@123' },
  user:  { email: 'user@example.com',  password: 'User@123' },
  agent: { email: 'agent@example.com', password: 'User@123' },
};

async function seedDevCredentials({ logger = console } = {}) {
  const client = await pool.connect();

  try {
    // Admin
    const adminHash = await bcrypt.hash(DEV_ACCOUNTS.admin.password, SALT_ROUNDS);
    await client.query(
      'UPDATE admin SET password = $1 WHERE email = $2',
      [adminHash, DEV_ACCOUNTS.admin.email]
    );

    // User
    const userHash = await bcrypt.hash(DEV_ACCOUNTS.user.password, SALT_ROUNDS);
    await client.query(
      'UPDATE "user" SET password = $1 WHERE email = $2',
      [userHash, DEV_ACCOUNTS.user.email]
    );

    // Agent
    const agentHash = await bcrypt.hash(DEV_ACCOUNTS.agent.password, SALT_ROUNDS);
    await client.query(
      'UPDATE agents SET password = $1 WHERE email = $2',
      [agentHash, DEV_ACCOUNTS.agent.email]
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
