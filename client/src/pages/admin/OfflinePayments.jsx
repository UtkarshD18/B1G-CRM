import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../shared/api';
import { useAuth } from '../../shared/auth';
import { formatDateTime, formatMoney } from '../../shared/format';

export default function OfflinePaymentsPage() {
  const { tokens } = useAuth();
  const [requests, setRequests] = useState([]);
  const [notes, setNotes] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [status, setStatus] = useState('Loading payment requests...');

  const reload = useCallback(async () => {
    try {
      const result = await apiRequest('/api/admin/offline_payment_requests', { token: tokens.admin });
      if (!result?.success) throw new Error(result?.msg || 'Unable to load payment requests');
      setRequests(result.data || []);
      setStatus('');
    } catch (error) {
      setStatus(error.message || 'Unable to load payment requests');
    }
  }, [tokens.admin]);

  useEffect(() => { reload(); }, [reload]);

  async function review(item, decision) {
    const note = String(notes[item.id] || '').trim();
    if (decision === 'approved' && !note) {
      setStatus('Enter a payment verification reference before approving.');
      return;
    }
    setBusyId(item.id);
    setStatus(`Reviewing request #${item.id}...`);
    try {
      const result = await apiRequest('/api/admin/review_offline_payment', {
        method: 'POST', token: tokens.admin, body: { id: item.id, decision, note },
      });
      if (!result?.success) throw new Error(result?.msg || 'Review failed');
      await reload();
      setStatus(`Request #${item.id} ${decision}.`);
    } catch (error) {
      setStatus(error.message || 'Review failed');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">billing &amp; payments</span>
          <h2>Offline Payment Review</h2>
          <p>Verify settlement before activating a customer plan. Approval records the reference and reviewer.</p>
        </div>
        <button type="button" className="secondary-button" onClick={reload}>Refresh</button>
      </div>
      {status && <p className="status-line" role="status">{status}</p>}
      <div className="panel">
        <div className="panel-header"><h2>Pending requests ({requests.length})</h2></div>
        {requests.length === 0 ? <p>No pending offline payments.</p> : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>Account</th><th>Plan ID</th><th>Amount</th><th>Requested</th><th>Verification reference / note</th><th>Action</th></tr></thead>
              <tbody>
                {requests.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name || item.uid}<br /><small>{item.email || item.uid}</small></td>
                    <td>{item.plan_id}</td>
                    <td>{formatMoney(item.amount)}</td>
                    <td>{formatDateTime(item.created_at)}</td>
                    <td><input aria-label={`Verification reference for request ${item.id}`} value={notes[item.id] || ''} onChange={(event) => setNotes({ ...notes, [item.id]: event.target.value })} placeholder="Bank or receipt reference" /></td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <button type="button" className="primary-button" disabled={busyId !== null} onClick={() => review(item, 'approved')}>Approve</button>{' '}
                      <button type="button" className="secondary-button" disabled={busyId !== null} onClick={() => review(item, 'rejected')}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
