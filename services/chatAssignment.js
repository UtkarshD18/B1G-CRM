const { withTransaction } = require('../database/dbpromise');

async function assignChat({ ownerUid, chatId, agentUid = null }) {
  if (!chatId || typeof chatId !== 'string') throw new Error('Chat is required');
  await withTransaction(async (tx) => {
    const [chat] = await tx('SELECT id FROM chats WHERE uid = ? AND chat_id = ? FOR UPDATE', [
      ownerUid,
      chatId,
    ]);
    if (!chat) throw new Error('Chat was not found');
    if (agentUid) {
      const [agent] = await tx(
        'SELECT uid FROM agents WHERE uid = ? AND owner_uid = ? AND is_active = 1',
        [agentUid, ownerUid],
      );
      if (!agent) throw new Error('Agent was not found or is inactive');
    }
    await tx('DELETE FROM agent_chats WHERE owner_uid = ? AND chat_id = ?', [ownerUid, chatId]);
    if (agentUid)
      await tx('INSERT INTO agent_chats (owner_uid, uid, chat_id) VALUES (?,?,?)', [
        ownerUid,
        agentUid,
        chatId,
      ]);
    // PostgreSQL delivers this invalidation only after COMMIT, across processes.
    await tx('SELECT pg_notify(?, ?)', [
      'b1gcrm_inbox_changes',
      JSON.stringify({ uid: ownerUid, chatId, assignmentChanged: true }),
    ]);
  });
}
module.exports = { assignChat };
