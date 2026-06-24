import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function AdminFrontPartnerPage() {
  const { tokens } = useAuth()
  const [logos, setLogos] = useState([])
  const [status, setStatus] = useState('')
  const [uploading, setUploading] = useState(false)

  const load = useCallback(async () => {
    try {
      const result = await apiRequest('/api/admin/get_brands', { token: tokens.admin })
      setLogos(Array.isArray(result?.data) ? result.data : [])
    } catch (e) {
      setStatus(e.message)
    }
  }, [tokens.admin])

  useEffect(() => { load() }, [load])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 200 * 1024) {
      setStatus('File too large. Max 200KB.')
      return
    }
    setUploading(true)
    setStatus('Uploading...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/admin/add_brand_image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.admin}` },
        body: formData,
      })
      const result = await res.json()
      setStatus(result?.msg || 'Uploaded')
      load()
    } catch (err) {
      setStatus(err.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function deleteLogo(id) {
    if (!window.confirm('Delete this logo?')) return
    setStatus('Deleting...')
    try {
      const result = await apiRequest('/api/admin/del_brand_logo', { method: 'POST', token: tokens.admin, body: { id } })
      setStatus(result?.msg || 'Deleted')
      load()
    } catch (err) {
      setStatus(err.message)
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>🤝</div>
          <div>
            <h2 style={{ margin: 0 }}>Partner Logos</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Add or manage partner logos displayed on your website</p>
          </div>
        </div>
        <button className="mini-button" onClick={load} style={{ border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '10px', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🔄 Refresh
        </button>
      </div>

      {status && <p className="status-line">{status}</p>}

      <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 1.2fr' }}>
        {/* Upload section */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center', gap: '12px', background: 'var(--bg-panel)', borderRadius: '16px' }}>
          <div style={{ fontSize: '2.6rem', color: 'var(--accent-primary)' }}>☁️</div>
          <strong style={{ color: 'var(--text-primary)' }}>Click to upload logo</strong>
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>PNG, JPEG, JPG — max 200KB</span>
          <label className="mini-button" style={{ cursor: 'pointer', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', borderRadius: '10px', padding: '10px 20px', marginTop: '8px' }}>
            Browse files
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        {/* Existing logos */}
        <div className="panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Existing Logos</strong>
              <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Hover a logo and click delete</p>
            </div>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 700, fontSize: '0.85rem' }}>{logos.length} logos</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px' }}>
            {logos.map(logo => (
              <div key={logo.id} style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', position: 'relative', background: 'var(--bg-panel)' }}>
                <img src={`/media/${logo.filename}`} alt="logo" style={{ maxWidth: '100%', maxHeight: '80px', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none' }} />
                <button onClick={() => deleteLogo(logo.id)} className="mini-button subtle-danger" style={{ fontSize: '0.72rem', padding: '4px 10px' }}>Delete</button>
              </div>
            ))}
            {logos.length === 0 && <p className="muted-copy">No logos uploaded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminFrontPartnerPage
