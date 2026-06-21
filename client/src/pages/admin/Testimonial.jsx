import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function AdminTestimonialPage() {
  const { tokens } = useAuth()
  const [items, setItems] = useState([])
  const [form, setForm] = useState({ title: '', description: '', reviewer_name: '', reviewer_position: '' })
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    try {
      const result = await apiRequest('/api/admin/get_testi', { token: tokens.admin })
      setItems(Array.isArray(result?.data) ? result.data : [])
    } catch (e) { setStatus(e.message) }
  }, [tokens.admin])

  useEffect(() => { load() }, [load])

  async function addItem(e) {
    e.preventDefault()
    if (!form.title || !form.description || !form.reviewer_name || !form.reviewer_position) {
      setStatus('Please fill all fields'); return
    }
    setStatus('Adding...')
    try {
      const result = await apiRequest('/api/admin/add_testimonial', { method: 'POST', token: tokens.admin, body: form })
      setStatus(result?.msg || 'Added')
      if (result?.success) { setForm({ title: '', description: '', reviewer_name: '', reviewer_position: '' }); load() }
    } catch (err) { setStatus(err.message) }
  }

  async function deleteItem(id) {
    setStatus('Deleting...')
    try {
      const result = await apiRequest('/api/admin/del_testi', { method: 'POST', token: tokens.admin, body: { id } })
      setStatus(result?.msg || 'Deleted')
      load()
    } catch (err) { setStatus(err.message) }
  }

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d8f0ea, #b8e6d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>💬</div>
          <div>
            <h2 style={{ margin: 0 }}>Testimonial</h2>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>Add or delete customer testimonials</p>
          </div>
        </div>
        <button className="mini-button" onClick={load} style={{ border: '1px solid #1ea085', color: '#1ea085', borderRadius: '10px', padding: '10px 20px' }}>🔄 Refresh</button>
      </div>

      {status && <p className="status-line">{status}</p>}

      <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 1.2fr' }}>
        <form className="panel form-panel" onSubmit={addItem} style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#1ea085' }}>➕</span>
            <strong>Add New Testimonial</strong>
          </div>
          <label>Title<input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Title" /></label>
          <label>Description<textarea rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" /></label>
          <label>Reviewer Name<input value={form.reviewer_name} onChange={e => setForm({ ...form, reviewer_name: e.target.value })} placeholder="Reviewer Name" /></label>
          <label>Reviewer Position<input value={form.reviewer_position} onChange={e => setForm({ ...form, reviewer_position: e.target.value })} placeholder="Reviewer Position" /></label>
          <button className="primary-button" type="submit" style={{ borderRadius: '12px' }}>➕ Add</button>
        </form>

        <div className="panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <strong>Existing Testimonials</strong>
            <span style={{ color: '#1ea085', fontWeight: 700, fontSize: '0.85rem' }}>{items.length} items</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {items.map(item => (
              <div key={item.id} style={{ border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px', background: '#ffffff', position: 'relative' }}>
                <div style={{ color: '#1ea085', fontSize: '1.6rem', marginBottom: '8px' }}>❝</div>
                <strong style={{ color: '#e07835', fontSize: '0.92rem' }}>"{item.title}"</strong>
                <p style={{ color: '#607481', fontSize: '0.85rem', margin: '8px 0 12px', lineHeight: '1.45' }}>{item.description?.substring(0, 150)}{item.description?.length > 150 ? '...' : ''}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d8f0ea', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#1ea085' }}>
                    {(item.reviewer_name || '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#1b2d38', display: 'block' }}>{item.reviewer_name}</strong>
                    <span style={{ fontSize: '0.78rem', color: '#607481' }}>{item.reviewer_position}</span>
                  </div>
                </div>
                <button onClick={() => deleteItem(item.id)} className="mini-button subtle-danger" style={{ position: 'absolute', top: '12px', right: '12px', padding: '4px 8px', fontSize: '0.72rem' }}>🗑️</button>
              </div>
            ))}
            {items.length === 0 && <p className="empty-state">No testimonials added yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminTestimonialPage
