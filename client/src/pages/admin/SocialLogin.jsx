import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function AdminSocialLoginPage() {
  const { tokens } = useAuth()
  const [data, setData] = useState({ google_client_id: '', google_login_active: 0, fb_login_app_id: '', fb_login_app_sec: '', fb_login_active: 0 })
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    try {
      const result = await apiRequest('/api/admin/get_social_login', { token: tokens.admin })
      setData({ google_client_id: '', google_login_active: 0, fb_login_app_id: '', fb_login_app_sec: '', fb_login_active: 0, ...(result?.data || {}) })
    } catch (e) { setStatus(e.message) }
  }, [tokens.admin])

  useEffect(() => { load() }, [load])

  async function save(e) {
    e.preventDefault()
    setStatus('Saving...')
    try {
      const result = await apiRequest('/api/admin/update_social_login', { method: 'POST', token: tokens.admin, body: data })
      setStatus(result?.msg || 'Saved')
    } catch (err) { setStatus(err.message) }
  }

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d8f0ea, #b8e6d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🔐</div>
          <div>
            <h2 style={{ margin: 0 }}>Social Login</h2>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>Configure Google and Facebook login for users</p>
          </div>
        </div>
        <button className="mini-button" onClick={load} style={{ border: '1px solid #1ea085', color: '#1ea085', borderRadius: '10px', padding: '10px 20px' }}>🔄 Refresh</button>
      </div>

      {status && <p className="status-line">{status}</p>}

      <form onSubmit={save} style={{ display: 'grid', gap: '16px' }}>
        <div className="panel" style={{ padding: '24px', borderRadius: '16px', borderLeft: '4px solid #4285f4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <strong style={{ fontSize: '1rem' }}>🔵 Google Login</strong>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={Number(data.google_login_active) > 0} onChange={e => setData({ ...data, google_login_active: e.target.checked ? 1 : 0 })} />
              <span style={{ fontWeight: 600, color: Number(data.google_login_active) > 0 ? '#1ea085' : '#607481' }}>{Number(data.google_login_active) > 0 ? 'Active' : 'Inactive'}</span>
            </label>
          </div>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600, color: '#365261' }}>
            Google Client ID
            <input value={data.google_client_id || ''} onChange={e => setData({ ...data, google_client_id: e.target.value })} style={{ borderRadius: '12px', padding: '12px 14px', border: '1px solid #c5d0d6' }} />
          </label>
        </div>

        <div className="panel" style={{ padding: '24px', borderRadius: '16px', borderLeft: '4px solid #1877f2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <strong style={{ fontSize: '1rem' }}>🔷 Facebook Login</strong>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={Number(data.fb_login_active) > 0} onChange={e => setData({ ...data, fb_login_active: e.target.checked ? 1 : 0 })} />
              <span style={{ fontWeight: 600, color: Number(data.fb_login_active) > 0 ? '#1ea085' : '#607481' }}>{Number(data.fb_login_active) > 0 ? 'Active' : 'Inactive'}</span>
            </label>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
            <label style={{ display: 'grid', gap: '6px', fontWeight: 600, color: '#365261' }}>
              Facebook App ID
              <input value={data.fb_login_app_id || ''} onChange={e => setData({ ...data, fb_login_app_id: e.target.value })} style={{ borderRadius: '12px', padding: '12px 14px', border: '1px solid #c5d0d6' }} />
            </label>
            <label style={{ display: 'grid', gap: '6px', fontWeight: 600, color: '#365261' }}>
              Facebook App Secret
              <input type="password" value={data.fb_login_app_sec || ''} onChange={e => setData({ ...data, fb_login_app_sec: e.target.value })} style={{ borderRadius: '12px', padding: '12px 14px', border: '1px solid #c5d0d6' }} />
            </label>
          </div>
        </div>

        <button className="primary-button" type="submit" style={{ borderRadius: '12px' }}>Save Social Login Settings</button>
      </form>
    </div>
  )
}

export default AdminSocialLoginPage
