import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

const defaults = {
  logo: '', app_name: 'B1G CRM', custom_home: '', is_custom_home: 0,
  meta_description: '', currency_code: 'USD', currency_symbol: '$',
  home_page_tutorial: '', chatbot_screen_tutorial: '', broadcast_screen_tutorial: '',
  login_header_footer: '', exchange_rate: 1,
}

function AdminSiteSettings() {
  const { tokens } = useAuth()
  const [data, setData] = useState(defaults)
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    try {
      const result = await apiRequest('/api/admin/get_web_public', { token: tokens.admin })
      setData({ ...defaults, ...(result?.data || {}) })
    } catch (e) { setStatus(e.message) }
  }, [tokens.admin])

  useEffect(() => { load() }, [load])

  async function save(e) {
    e.preventDefault()
    setStatus('Saving...')
    try {
      const result = await apiRequest('/api/web/update_web_config', { method: 'POST', token: tokens.admin, body: data })
      setStatus(result?.msg || 'Saved')
    } catch (err) { setStatus(err.message) }
  }

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d8f0ea, #b8e6d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>⚙️</div>
          <div>
            <h2 style={{ margin: 0 }}>Site Settings</h2>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>Configure your website appearance and behavior</p>
          </div>
        </div>
        <button className="mini-button" onClick={load} style={{ border: '1px solid #1ea085', color: '#1ea085', borderRadius: '10px', padding: '10px 20px' }}>🔄 Refresh</button>
      </div>

      {status && <p className="status-line">{status}</p>}

      <form className="panel form-panel" onSubmit={save} style={{ padding: '28px', borderRadius: '16px' }}>
        <div className="form-grid">
          {[
            ['app_name', 'App Name'],
            ['logo', 'Logo Filename'],
            ['currency_code', 'Currency Code'],
            ['currency_symbol', 'Currency Symbol'],
            ['exchange_rate', 'Exchange Rate'],
            ['meta_description', 'Meta Description'],
            ['home_page_tutorial', 'Home Page Tutorial URL'],
            ['chatbot_screen_tutorial', 'Chatbot Tutorial URL'],
            ['broadcast_screen_tutorial', 'Broadcast Tutorial URL'],
          ].map(([key, label]) => (
            <label key={key}>
              {label}
              <input value={data[key] || ''} onChange={e => setData({ ...data, [key]: e.target.value })} />
            </label>
          ))}
        </div>
        <label>
          Custom Home HTML/Content
          <textarea rows={5} value={data.custom_home || ''} onChange={e => setData({ ...data, custom_home: e.target.value })} />
        </label>
        <label>
          Login Header/Footer Content
          <textarea rows={3} value={data.login_header_footer || ''} onChange={e => setData({ ...data, login_header_footer: e.target.value })} />
        </label>
        <label className="checkbox-row">
          <input type="checkbox" checked={Number(data.is_custom_home) > 0} onChange={e => setData({ ...data, is_custom_home: e.target.checked ? 1 : 0 })} />
          <span>Use Custom Home Page</span>
        </label>
        <button className="primary-button" type="submit" style={{ borderRadius: '12px' }}>Save Site Settings</button>
      </form>
    </div>
  )
}

export default AdminSiteSettings
