const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('./config');

async function bootstrapAdmin({
  db = pool,
  email = process.env.BOOTSTRAP_ADMIN_EMAIL,
  password = process.env.BOOTSTRAP_ADMIN_PASSWORD,
} = {}) {
  if (!email && !password) return false;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password || password.length < 20) {
    throw new Error('Initial administrator requires a valid email and a password of at least 20 characters');
  }
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    await client.query('LOCK TABLE admin IN EXCLUSIVE MODE');
    const existing = await client.query('SELECT 1 FROM admin LIMIT 1');
    if (existing.rows.length) {
      await client.query('COMMIT');
      return false;
    }
    const hash = await bcrypt.hash(password, 12);
    await client.query(
      'INSERT INTO admin (uid, email, password, role) VALUES ($1, $2, $3, $4)',
      [crypto.randomUUID(), email.trim().toLowerCase(), hash, 'admin'],
    );
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    delete process.env.BOOTSTRAP_ADMIN_EMAIL;
    delete process.env.BOOTSTRAP_ADMIN_PASSWORD;
  }
}

module.exports = { bootstrapAdmin };
