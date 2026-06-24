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
  const [logoFile, setLogoFile] = useState(null)
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
    if (!data.app_name) {
      setStatus('App Name is required.')
      return
    }
    setStatus('Saving...')
    try {
      const formData = new FormData()
      formData.append('app_name', data.app_name)
      formData.append('custom_home', data.custom_home || '')
      formData.append('is_custom_home', Number(data.is_custom_home || 0))
      formData.append('meta_description', data.meta_description || '')
      formData.append('currency_code', data.currency_code || '')
      formData.append('currency_symbol', data.currency_symbol || '')
      formData.append('home_page_tutorial', data.home_page_tutorial || '')
      formData.append('chatbot_screen_tutorial', data.chatbot_screen_tutorial || '')
      formData.append('broadcast_screen_tutorial', data.broadcast_screen_tutorial || '')
      formData.append('login_header_footer', data.login_header_footer || '')
      formData.append('exchange_rate', Number(data.exchange_rate || 1))

      if (logoFile) {
        formData.append('file', logoFile)
      } else {
        formData.append('logo', data.logo || '')
      }

      const res = await fetch('/api/web/update_web_config', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.admin}` },
        body: formData,
      })
      const result = await res.json()
      setStatus(result?.msg || 'Saved')
      if (result?.success) {
        setLogoFile(null)
        load()
      }
    } catch (err) {
      setStatus(err.message)
    }
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
        {/* Logo Section */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginBottom: '24px', padding: '16px', background: 'rgba(10,25,37,0.02)', borderRadius: '12px', border: '1px solid rgba(10,25,37,0.06)' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#ffffff', border: '1px solid #c5d0d6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {data.logo ? (
              <img src={`/media/${data.logo}`} alt="Site Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none' }} />
            ) : (
              <span style={{ fontSize: '2rem' }}>🖼️</span>
            )}
          </div>
          <div style={{ display: 'grid', gap: '6px' }}>
            <strong>Site Logo Image</strong>
            <span style={{ color: '#607481', fontSize: '0.82rem' }}>Select a file to upload and replace the current logo.</span>
            <input type="file" accept="image/*" onChange={e => setLogoFile(e.target.files?.[0] || null)} style={{ fontSize: '0.85rem' }} />
          </div>
        </div>

        <div className="form-grid">
          <label>
            App Name
            <input value={data.app_name || ''} onChange={e => setData({ ...data, app_name: e.target.value })} required />
          </label>
          <label>
            Currency Code
            <input value={data.currency_code || ''} onChange={e => setData({ ...data, currency_code: e.target.value })} />
          </label>
          <label>
            Currency Symbol
            <input value={data.currency_symbol || ''} onChange={e => setData({ ...data, currency_symbol: e.target.value })} />
          </label>
          <label>
            Exchange Rate
            <input type="number" min="0" step="any" value={data.exchange_rate || 1} onChange={e => setData({ ...data, exchange_rate: e.target.value })} />
          </label>
          <label>
            Meta Description
            <input value={data.meta_description || ''} onChange={e => setData({ ...data, meta_description: e.target.value })} />
          </label>
          <label>
            Home Page Tutorial URL
            <input value={data.home_page_tutorial || ''} onChange={e => setData({ ...data, home_page_tutorial: e.target.value })} />
          </label>
          <label>
            Chatbot Tutorial URL
            <input value={data.chatbot_screen_tutorial || ''} onChange={e => setData({ ...data, chatbot_screen_tutorial: e.target.value })} />
          </label>
          <label>
            Broadcast Tutorial URL
            <input value={data.broadcast_screen_tutorial || ''} onChange={e => setData({ ...data, broadcast_screen_tutorial: e.target.value })} />
          </label>
        </div>

        <label style={{ marginTop: '16px', display: 'block' }}>
          Custom Home HTML/Content
          <textarea rows={5} value={data.custom_home || ''} onChange={e => setData({ ...data, custom_home: e.target.value })} />
        </label>
        <label style={{ marginTop: '16px', display: 'block' }}>
          Login Header/Footer Content
          <textarea rows={3} value={data.login_header_footer || ''} onChange={e => setData({ ...data, login_header_footer: e.target.value })} />
        </label>
        <label className="checkbox-row" style={{ marginTop: '16px' }}>
          <input type="checkbox" checked={Number(data.is_custom_home) > 0} onChange={e => setData({ ...data, is_custom_home: e.target.checked ? 1 : 0 })} />
          <span>Use Custom Home Page</span>
        </label>
        <button className="primary-button" type="submit" style={{ borderRadius: '12px', marginTop: '20px' }}>Save Site Settings</button>
      </form>
    </div>
  )
}

export default AdminSiteSettings
