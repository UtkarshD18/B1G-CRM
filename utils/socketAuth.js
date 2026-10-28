const jwt = require('jsonwebtoken');
const env = require('../env');
const { query } = require('../database/dbpromise');
const { getTokenRole } = require('./auth');

// Identity and permissions come from the verified token and current database row.
async function authenticateSocket(socket) {
  const token = socket.handshake.auth?.token || socket.handshake.query?.userToken;
  if (typeof token !== 'string' || !token) throw new Error('Authentication required');
  const decoded = jwt.verify(token, env.JWT_SECRET);
  const role = getTokenRole(decoded);
  if (!decoded.uid || !['user', 'agent'].includes(role)) throw new Error('Invalid socket identity');
  const agent = role === 'agent';
  const [record] = await query(
    agent ? 'SELECT * FROM agents WHERE uid = ?' : 'SELECT * FROM user WHERE uid = ?',
    [decoded.uid],
  );
  if (!record || (agent && (record.is_active < 1 || record.role !== 'agent')))
    throw new Error('Account unavailable');
  if (agent && decoded.owner_uid !== record.owner_uid) throw new Error('Invalid tenant');
  if (agent) {
    const owners = await query('SELECT uid FROM user WHERE uid = ?', [record.owner_uid]);
    if (!owners.length) throw new Error('Workspace unavailable');
  }
  const permissions = agent
    ? Array.isArray(record.permissions)
      ? record.permissions
      : JSON.parse(record.permissions || '[]')
    : [];
  if (!Array.isArray(permissions)) throw new Error('Invalid permissions');
  return {
    uid: record.uid,
    id: socket.id,
    agent,
    owner_uid: agent ? record.owner_uid : undefined,
    decodedValue: { ...decoded, owner_uid: agent ? record.owner_uid : undefined },
    permissions,
    data: socket.connectionInfo?.data || {},
  };
}
module.exports = { authenticateSocket };
