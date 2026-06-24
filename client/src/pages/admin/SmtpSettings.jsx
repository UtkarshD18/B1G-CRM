import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function AdminSmtpPage() {
  const { tokens } = useAuth()
  const [data, setData] = useState({ email: '', host: '', port: 587, password: '' })
  const [testTo, setTestTo] = useState('')
  const [status, setStatus] = useState('')
  const [testing, setTesting] = useState(false)

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

  async function sendTestEmail(e) {
    e.preventDefault()
    if (!testTo) { setStatus('Please enter a recipient email address for the test.'); return }
    setTesting(true)
    setStatus('Sending test email...')
    try {
      const result = await apiRequest('/api/admin/send_test_email', {
        method: 'POST',
        token: tokens.admin,
        body: { ...data, to: testTo }
      })
      setStatus(result?.msg || (result?.success ? 'Test email sent!' : 'Failed to send test email.'))
    } catch (err) {
      setStatus(err.message || 'Error sending test email.')
    } finally {
      setTesting(false)
    }
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

      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={save} style={{ padding: '28px', borderRadius: '16px' }}>
          <div className="panel-header">
            <h2>SMTP Credentials</h2>
          </div>
          <label>SMTP Email<input type="email" value={data.email || ''} onChange={e => setData({ ...data, email: e.target.value })} placeholder="noreply@yourdomain.com" /></label>
          <label>SMTP Host<input value={data.host || ''} onChange={e => setData({ ...data, host: e.target.value })} placeholder="smtp.gmail.com" /></label>
          <label>SMTP Port<input type="number" value={data.port || ''} onChange={e => setData({ ...data, port: e.target.value })} placeholder="587" /></label>
          <label>SMTP Password<input type="password" value={data.password || ''} onChange={e => setData({ ...data, password: e.target.value })} placeholder="App password" /></label>
          <button className="primary-button" type="submit" style={{ borderRadius: '12px' }}>Save SMTP Settings</button>
        </form>

        <div className="panel form-panel" style={{ padding: '28px', borderRadius: '16px' }}>
          <div className="panel-header">
            <h2>Send Test Email</h2>
          </div>
          <p className="muted-copy">Use this to verify your SMTP credentials by sending a test email. Make sure you have saved the credentials first.</p>
          <form onSubmit={sendTestEmail}>
            <label>
              Recipient Email
              <input
                type="email"
                value={testTo}
                onChange={e => setTestTo(e.target.value)}
                placeholder="admin@yourdomain.com"
                required
              />
            </label>
            <button
              className="primary-button"
              type="submit"
              disabled={testing}
              style={{ borderRadius: '12px', background: testing ? '#94a3b8' : undefined }}
            >
              {testing ? 'Sending...' : '📤 Send Test Email'}
            </button>
          </form>

          <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(30, 160, 133, 0.06)', borderRadius: '10px', border: '1px solid rgba(30, 160, 133, 0.15)' }}>
            <strong style={{ fontSize: '13px', color: '#1ea085' }}>Connection Tips</strong>
            <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '13px', color: '#607481', lineHeight: '1.8' }}>
              <li>Gmail: Use port 587 with TLS or 465 with SSL</li>
              <li>Generate an App Password in Google Account security settings</li>
              <li>Outlook/Hotmail: Use smtp.office365.com, port 587</li>
              <li>Custom SMTP: Contact your hosting provider for credentials</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminSmtpPage
