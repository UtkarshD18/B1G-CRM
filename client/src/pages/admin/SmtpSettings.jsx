import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function AdminSmtpPage() {
  const { tokens } = useAuth()
  const [data, setData] = useState({ email: '', host: '', port: 587, password: '' })
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    try {
      const result = await apiRequest('/api/admin/get_smtp', { token: tokens.admin })
      setData({ email: '', host: '', port: 587, password: '', ...(result?.data || {}) })
    } catch (e) { setStatus(e.message) }
  }, [tokens.admin])

  useEffect(() => { load() }, [load])

  async function save(e) {
    e.preventDefault()
    setStatus('Saving...')
    try {
      const result = await apiRequest('/api/admin/update_smtp', { method: 'POST', token: tokens.admin, body: data })
      setStatus(result?.msg || 'Saved')
    } catch (err) { setStatus(err.message) }
  }

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d8f0ea, #b8e6d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📧</div>
          <div>
            <h2 style={{ margin: 0 }}>SMTP Settings</h2>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>Configure email sending via SMTP</p>
          </div>
        </div>
        <button className="mini-button" onClick={load} style={{ border: '1px solid #1ea085', color: '#1ea085', borderRadius: '10px', padding: '10px 20px' }}>🔄 Refresh</button>
      </div>

      {status && <p className="status-line">{status}</p>}

      <form className="panel form-panel" onSubmit={save} style={{ padding: '28px', borderRadius: '16px', maxWidth: '600px' }}>
        <label>SMTP Email<input type="email" value={data.email || ''} onChange={e => setData({ ...data, email: e.target.value })} placeholder="noreply@yourdomain.com" /></label>
        <label>SMTP Host<input value={data.host || ''} onChange={e => setData({ ...data, host: e.target.value })} placeholder="smtp.gmail.com" /></label>
        <label>SMTP Port<input type="number" value={data.port || ''} onChange={e => setData({ ...data, port: e.target.value })} placeholder="587" /></label>
        <label>SMTP Password<input type="password" value={data.password || ''} onChange={e => setData({ ...data, password: e.target.value })} placeholder="App password" /></label>
        <button className="primary-button" type="submit" style={{ borderRadius: '12px' }}>Save SMTP Settings</button>
      </form>
    </div>
  )
}

export default AdminSmtpPage
