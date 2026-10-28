const { query } = require('../../database/dbpromise');
const { mergeArraysWithPhonebook } = require('./function');

// Shared by explicit searches and inbound channel notifications. Filtering must
// happen before LIMIT so a quiet channel or an older matching chat is not hidden.
async function loadChatList({ connectionInfo, limit = 100 }) {
  const { uid, agent } = connectionInfo;
  const tenantUid = agent ? connectionInfo.decodedValue?.owner_uid : uid;
  if (agent) {
    // Notification producers also use this loader, outside packet middleware.
    const [current] = await query(
      'SELECT permissions, is_active, owner_uid FROM agents WHERE uid = ?',
      [uid],
    );
    if (!current || current.is_active < 1 || current.owner_uid !== tenantUid) return [];
    let permissions = [];
    try {
      permissions = Array.isArray(current.permissions)
        ? current.permissions
        : JSON.parse(current.permissions || '[]');
    } catch {
      return [];
    }
    if (
      !Array.isArray(permissions) ||
      !permissions.some((p) => ['inbox.read', 'inbox.reply', 'inbox_access'].includes(p))
    )
      return [];
  }
  const {
    search = '',
    filterType = 'all',
    channel = 'all',
  } = connectionInfo.data?.inboxFilters || {};
  const conditions = ['c.uid = ?'];
  const params = [tenantUid];
  if (agent) {
    conditions.push(
      'EXISTS (SELECT 1 FROM agent_chats assigned WHERE assigned.chat_id = c.chat_id AND assigned.owner_uid = c.uid AND assigned.uid = ?)',
    );
    params.push(uid);
  }
  if (filterType === 'read' || filterType === 'unread') {
    conditions.push('c.is_opened = ?');
    params.push(filterType === 'read' ? 1 : 0);
  }
  const origin = "LOWER(COALESCE(c.origin, ''))";
  if (channel === 'instagram') conditions.push(`${origin} LIKE '%insta%'`);
  if (channel === 'website')
    conditions.push(`(${origin} LIKE '%web%' OR ${origin} LIKE '%widget%')`);
  if (channel === 'whatsapp')
    conditions.push(
      `(${origin} NOT LIKE '%insta%' AND ${origin} NOT LIKE '%web%' AND ${origin} NOT LIKE '%widget%')`,
    );
  if (search.trim()) {
    conditions.push(`(c.sender_name ILIKE ? OR c.sender_mobile ILIKE ? OR c.last_message ILIKE ? OR c.chat_note ILIKE ? OR CAST(c.chat_tags AS TEXT) ILIKE ? OR EXISTS (
      SELECT 1 FROM contact contact_match WHERE contact_match.uid = c.uid AND contact_match.mobile = c.sender_mobile AND contact_match.name ILIKE ?
    ))`);
    // Search is literal text, not SQL wildcard syntax.
    const pattern = `%${search.trim().replace(/[\\%_]/g, '\\$&')}%`;
    params.push(...Array(6).fill(pattern));
  }
  params.push(Math.min(500, Math.max(1, Math.trunc(Number(limit)) || 100)));
  const chats = await query(
    `SELECT c.*, a.name AS agent_name, a.email AS agent_email
    FROM chats c
    LEFT JOIN agent_chats ac ON c.chat_id = ac.chat_id AND c.uid = ac.owner_uid
    LEFT JOIN agents a ON ac.uid = a.uid AND ac.owner_uid = c.uid
    WHERE ${conditions.join(' AND ')}
    ORDER BY (CASE WHEN c.last_message_came < 1000000000000
      THEN c.last_message_came * 1000 ELSE c.last_message_came END) DESC NULLS LAST LIMIT ?`,
    params,
  );
  const contacts = await query('SELECT * FROM contact WHERE uid = ?', [tenantUid]);
  const merged = mergeArraysWithPhonebook(chats, contacts, search, agent);
  // Contacts without a conversation are useful to start WhatsApp chats, but are
  // never unread and must not appear in Instagram/Website results.
  return merged.filter(
    (chat) =>
      !chat.chat_id.startsWith('contact-') ||
      (filterType !== 'unread' && ['all', 'whatsapp'].includes(channel)),
  );
}

module.exports = { loadChatList };
