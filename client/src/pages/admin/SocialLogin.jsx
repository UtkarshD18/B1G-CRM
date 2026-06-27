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
            <span className="eyebrow">social-login</span>
            <h5 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>Social Login</h5>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>Configure social media login options for your users</p>
          </div>
        </div>
      </div>

      {status && <p className="status-line">{status}</p>}

      <form onSubmit={save} style={{ display: 'grid', gap: '16px' }}>
        <div className="panel" style={{ padding: '24px', borderRadius: '16px', borderLeft: '4px solid #4285f4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <strong style={{ fontSize: '1rem', color: '#1b2d38' }}>Google Login</strong>
              <p style={{ margin: '2px 0 0', color: '#607481', fontSize: '0.82rem' }}>Allow users to sign in with their Google accounts</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={Number(data.google_login_active) > 0} onChange={e => setData({ ...data, google_login_active: e.target.checked ? 1 : 0 })} />
              <span style={{ fontWeight: 600, color: Number(data.google_login_active) > 0 ? '#1ea085' : '#607481' }}>Enabled</span>
            </label>
          </div>
          <label style={{ display: 'grid', gap: '6px', fontWeight: 600, color: '#365261', marginTop: '12px' }}>
            Key ID
            <input value={data.google_client_id || ''} onChange={e => setData({ ...data, google_client_id: e.target.value })} placeholder="Enter your Google Client ID" style={{ borderRadius: '12px', padding: '12px 14px', border: '1px solid #c5d0d6' }} />
          </label>
          <span style={{ color: '#a0aec0', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>Obtain from Google Developer Console</span>
        </div>

        <div className="panel" style={{ padding: '24px', borderRadius: '16px', borderLeft: '4px solid #1877f2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div>
              <strong style={{ fontSize: '1rem', color: '#1b2d38' }}>Facebook Login</strong>
              <p style={{ margin: '2px 0 0', color: '#607481', fontSize: '0.82rem' }}>Allow users to sign in with their Facebook accounts</p>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input type="checkbox" checked={Number(data.fb_login_active) > 0} onChange={e => setData({ ...data, fb_login_active: e.target.checked ? 1 : 0 })} />
              <span style={{ fontWeight: 600, color: Number(data.fb_login_active) > 0 ? '#1ea085' : '#607481' }}>Enabled</span>
            </label>
          </div>
          <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)', marginTop: '12px' }}>
            <div>
              <label style={{ display: 'grid', gap: '6px', fontWeight: 600, color: '#365261' }}>
                App ID
                <input value={data.fb_login_app_id || ''} onChange={e => setData({ ...data, fb_login_app_id: e.target.value })} placeholder="Enter your Facebook App ID" style={{ borderRadius: '12px', padding: '12px 14px', border: '1px solid #c5d0d6' }} />
              </label>
              <span style={{ color: '#a0aec0', fontSize: '0.78rem', marginTop: '4px', display: 'block' }}>Obtain from Facebook Developer Portal</span>
            </div>
            <label style={{ display: 'grid', gap: '6px', fontWeight: 600, color: '#365261' }}>
              App Secret
              <input type="password" value={data.fb_login_app_sec || ''} onChange={e => setData({ ...data, fb_login_app_sec: e.target.value })} placeholder="Enter your Facebook App Secret" style={{ borderRadius: '12px', padding: '12px 14px', border: '1px solid #c5d0d6' }} />
            </label>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: '#f8fafb', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <strong style={{ fontSize: '0.8rem', color: '#4a5568', display: 'block' }}>Redirect URI</strong>
            <code style={{ fontSize: '0.82rem', color: '#1a202c' }}>{window.location.origin}/auth/facebook/callback</code>
          </div>
        </div>

        <button className="primary-button" type="submit" style={{ borderRadius: '12px' }}>Save</button>
      </form>
    </div>
  )
}

export default AdminSocialLoginPage
