import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import DOMPurify from 'dompurify'

function AdminManagePages() {
  const { tokens } = useAuth()
  const [pages, setPages] = useState([])
  const [terms, setTerms] = useState({ title: 'Terms and Conditions', content: '' })
  const [privacy, setPrivacy] = useState({ title: 'Privacy Policy', content: '' })
  const [status, setStatus] = useState('')
  const [viewItem, setViewItem] = useState(null)

  const load = useCallback(async () => {
    try {
      const [pageResult, termsResult, privacyResult] = await Promise.all([
        apiRequest('/api/admin/get_pages', { token: tokens.admin }),
        apiRequest('/api/admin/get_page_slug', { method: 'POST', token: tokens.admin, body: { slug: 'terms-and-conditions' } }),
        apiRequest('/api/admin/get_page_slug', { method: 'POST', token: tokens.admin, body: { slug: 'privacy-policy' } }),
      ])
      setPages(Array.isArray(pageResult?.data) ? pageResult.data : [])
      if (termsResult?.data?.title) setTerms({ title: termsResult.data.title, content: termsResult.data.content || '' })
      if (privacyResult?.data?.title) setPrivacy({ title: privacyResult.data.title, content: privacyResult.data.content || '' })
    } catch (e) { setStatus(e.message) }
  }, [tokens.admin])

  useEffect(() => { load() }, [load])

  async function savePage(path, body, msg) {
    setStatus(msg)
    try {
      const result = await apiRequest(path, { method: 'POST', token: tokens.admin, body })
      setStatus(result?.msg || 'Saved')
      if (result?.success) load()
    } catch (err) { setStatus(err.message) }
  }

  async function deletePage(id) {
    if (!window.confirm('Delete this page?')) return
    try {
      const result = await apiRequest('/api/admin/del_page', { method: 'POST', token: tokens.admin, body: { id } })
      setStatus(result?.msg || 'Deleted')
      load()
    } catch (err) { setStatus(err.message) }
  }

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d8f0ea, #b8e6d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>📄</div>
          <div>
            <h2 style={{ margin: 0 }}>Manage Pages</h2>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>Manage your website pages, terms, and privacy policy</p>
          </div>
        </div>
        <button className="mini-button" onClick={load} style={{ border: '1px solid #1ea085', color: '#1ea085', borderRadius: '10px', padding: '10px 20px' }}>🔄 Refresh</button>
      </div>

      {status && <p className="status-line">{status}</p>}

      {/* Terms & Privacy */}
      <div className="two-column-grid">
        <form className="panel form-panel" style={{ padding: '24px', borderRadius: '16px' }} onSubmit={e => { e.preventDefault(); savePage('/api/admin/update_terms', terms, 'Saving terms...') }}>
          <strong>Terms and Conditions</strong>
          <input value={terms.title} onChange={e => setTerms({ ...terms, title: e.target.value })} />
          <textarea rows={6} value={terms.content} onChange={e => setTerms({ ...terms, content: e.target.value })} />
          <button className="primary-button" type="submit" style={{ borderRadius: '12px' }}>Save Terms</button>
        </form>
        <form className="panel form-panel" style={{ padding: '24px', borderRadius: '16px' }} onSubmit={e => { e.preventDefault(); savePage('/api/admin/update_privacy_policy', privacy, 'Saving privacy policy...') }}>
          <strong>Privacy Policy</strong>
          <input value={privacy.title} onChange={e => setPrivacy({ ...privacy, title: e.target.value })} />
          <textarea rows={6} value={privacy.content} onChange={e => setPrivacy({ ...privacy, content: e.target.value })} />
          <button className="primary-button" type="submit" style={{ borderRadius: '12px' }}>Save Privacy Policy</button>
        </form>
      </div>

      {/* Custom Pages */}
      <div className="panel" style={{ padding: '20px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <strong>Custom Pages</strong>
          <span style={{ color: '#1ea085', fontWeight: 700, fontSize: '0.85rem' }}>{pages.length} pages</span>
        </div>
        <table>
          <thead>
            <tr><th>Title</th><th>Slug</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {pages.map(page => (
              <tr key={page.id}>
                <td><strong>{page.title}</strong></td>
                <td className="muted-copy">{page.slug}</td>
                <td>
                  <div className="action-row">
                    <button className="mini-button" onClick={() => setViewItem(page)} style={{ padding: '6px 10px', fontSize: '0.78rem' }}>👁️</button>
                    <button className="mini-button subtle-danger" onClick={() => deletePage(page.id)} style={{ padding: '6px 10px', fontSize: '0.78rem' }}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: 'center', padding: '30px 0' }}><span className="muted-copy">No custom pages.</span></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'grid', placeItems: 'center', zIndex: 1000 }} onClick={() => setViewItem(null)}>
          <div className="panel" style={{ maxWidth: '700px', width: '90%', maxHeight: '80vh', overflow: 'auto', padding: '28px', borderRadius: '18px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <strong style={{ fontSize: '1.1rem' }}>{viewItem.title}</strong>
              <button className="mini-button" onClick={() => setViewItem(null)} style={{ padding: '4px 10px' }}>✕</button>
            </div>
            <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(viewItem.content) || '<p>No content</p>' }} />
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminManagePages
