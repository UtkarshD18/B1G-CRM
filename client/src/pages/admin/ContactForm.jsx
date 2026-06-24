import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatDateTime } from '../../shared/format'

function AdminContactFormPage() {
  const { tokens } = useAuth()
  const [leads, setLeads] = useState([])
  const [status, setStatus] = useState('')
  const [viewItem, setViewItem] = useState(null)

  const load = useCallback(async () => {
    try {
      const result = await apiRequest('/api/admin/get_contact_leads', { token: tokens.admin })
      setLeads(Array.isArray(result?.data) ? result.data : [])
    } catch (e) { setStatus(e.message) }
  }, [tokens.admin])

  useEffect(() => { load() }, [load])

  async function deleteItem(id, name) {
    if (!window.confirm(`Are you sure you want to permanently delete the contact lead entry from "${name || id}"?`)) {
      return
    }
    setStatus('Deleting...')
    try {
      const result = await apiRequest('/api/admin/del_cotact_entry', { method: 'POST', token: tokens.admin, body: { id } })
      setStatus(result?.msg || 'Deleted')
      load()
    } catch (err) { setStatus(err.message) }
  }

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d8f0ea, #b8e6d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📋</div>
          <div>
            <h2 style={{ margin: 0 }}>Contact Form</h2>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>View and manage contact form submissions</p>
          </div>
        </div>
        <button className="mini-button" onClick={load} style={{ border: '1px solid #1ea085', color: '#1ea085', borderRadius: '10px', padding: '10px 20px' }}>🔄 Refresh</button>
      </div>

      {status && <p className="status-line">{status}</p>}

      <div className="panel table-panel" style={{ borderRadius: '16px' }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td><strong>{lead.name || '—'}</strong></td>
                <td className="muted-copy">{lead.email || '—'}</td>
                <td>{lead.mobile || '—'}</td>
                <td className="muted-copy">{formatDateTime(lead.createdat || lead.created_at)}</td>
                <td>
                  <div className="action-row">
                    <button className="mini-button" onClick={() => setViewItem(lead)} style={{ padding: '6px 10px', fontSize: '0.78rem' }}>👁️ View</button>
                    <button className="mini-button subtle-danger" onClick={() => deleteItem(lead.id, lead.name)} style={{ padding: '6px 10px', fontSize: '0.78rem' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {leads.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '40px 0' }}><span className="muted-copy">No contact form entries yet.</span></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 1000 }} onClick={() => setViewItem(null)}>
          <div className="panel" style={{ maxWidth: '500px', width: '90%', padding: '28px', borderRadius: '18px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ fontSize: '1.1rem' }}>Contact Message</strong>
              <button className="mini-button" onClick={() => setViewItem(null)} style={{ padding: '4px 10px' }}>✕</button>
            </div>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div><span className="muted-copy">Name:</span> <strong>{viewItem.name}</strong></div>
              <div><span className="muted-copy">Email:</span> <strong>{viewItem.email}</strong></div>
              <div><span className="muted-copy">Mobile:</span> <strong>{viewItem.mobile || '—'}</strong></div>
              <div><span className="muted-copy">Message:</span><p style={{ margin: '4px 0 0', lineHeight: 1.5 }}>{viewItem.message || viewItem.msg || '—'}</p></div>
              <div><span className="muted-copy">Date:</span> {formatDateTime(viewItem.createdat || viewItem.created_at)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminContactFormPage
