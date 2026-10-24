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
    const existing = await client.query('SELECT uid, email, password FROM admin LIMIT 2');
    const legacy = existing.rows.length === 1 && existing.rows[0].uid === 'local-admin-uid'
      && existing.rows[0].email === 'admin@example.com'
      && existing.rows[0].password === '$2b$10$QjLCkPVd83A5hebBarGAFedPqWLhc8iHXufUx0QJoXrp1Av.5ngGa';
    if (existing.rows.length && !legacy) {
      await client.query('COMMIT');
      return false;
    }
    const hash = await bcrypt.hash(password, 12);
    if (legacy) {
      await client.query('UPDATE admin SET email = $1, password = $2 WHERE uid = $3',
        [email.trim().toLowerCase(), hash, existing.rows[0].uid]);
    } else await client.query(
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
