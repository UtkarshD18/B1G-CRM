const { query, withTransaction } = require('../database/dbpromise');

async function listPending() {
  return query(`SELECT r.id, r.uid, r.plan_id, r.amount, r.status, r.created_at,
    u.name, u.email FROM offline_payment_requests r
    LEFT JOIN user u ON u.uid = r.uid
    WHERE r.status = 'pending' ORDER BY r.created_at ASC LIMIT 100`);
}

async function review({ id, adminUid, decision, note }) {
  if (!Number.isSafeInteger(Number(id)) || Number(id) < 1 || !['approved', 'rejected'].includes(decision)) {
    return { success: false, status: 400, msg: 'Invalid review request' };
  }
  if (decision === 'approved' && !String(note || '').trim()) {
    return { success: false, status: 400, msg: 'Enter a payment verification reference before approval' };
  }
  return withTransaction(async (txQuery) => {
    const [request] = await txQuery(
      'SELECT * FROM offline_payment_requests WHERE id = ? FOR UPDATE',
      [id],
    );
    if (!request) return { success: false, status: 404, msg: 'Request not found' };
    if (request.status !== 'pending') return { success: false, status: 409, msg: 'Request already reviewed' };

    const plan = request.plan_snapshot;
    if (decision === 'approved') {
      const days = Number(plan?.plan_duration_in_days);
      if (!Number.isFinite(days) || days < 1 || Number(plan?.price) !== Number(request.amount)) {
        return { success: false, status: 409, msg: 'Plan snapshot is invalid' };
      }
      const expires = Date.now() + days * 86400000;
      const updated = await txQuery('UPDATE user SET plan = ?, plan_expire = ? WHERE uid = ? RETURNING uid', [
        JSON.stringify(plan), expires, request.uid,
      ]);
      if (!updated.length) return { success: false, status: 404, msg: 'Account not found' };
      await txQuery('INSERT INTO orders (uid, payment_mode, amount, data) VALUES (?, ?, ?, ?)', [
        request.uid, 'OFFLINE', request.amount,
        JSON.stringify({ offlinePaymentRequestId: request.id, approvedBy: adminUid }),
      ]);
    }
    await txQuery(`UPDATE offline_payment_requests
      SET status = ?, reviewed_at = NOW(), reviewed_by = ?, review_note = ? WHERE id = ?`,
    [decision, adminUid, String(note || '').slice(0, 2000), id]);
    return { success: true, status: 200, msg: `Request ${decision}` };
  });
}

module.exports = { listPending, review };
