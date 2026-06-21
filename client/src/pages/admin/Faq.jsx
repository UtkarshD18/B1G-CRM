import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function AdminFaqPage() {
  const { tokens } = useAuth()
  const [faqs, setFaqs] = useState([])
  const [form, setForm] = useState({ question: '', answer: '' })
  const [status, setStatus] = useState('')

  const load = useCallback(async () => {
    try {
      const result = await apiRequest('/api/admin/get_faq', { token: tokens.admin })
      setFaqs(Array.isArray(result?.data) ? result.data : [])
    } catch (e) { setStatus(e.message) }
  }, [tokens.admin])

  useEffect(() => { load() }, [load])

  async function addFaq(e) {
    e.preventDefault()
    if (!form.question || !form.answer) { setStatus('Please fill both fields'); return }
    setStatus('Adding...')
    try {
      const result = await apiRequest('/api/admin/add_faq', { method: 'POST', token: tokens.admin, body: form })
      setStatus(result?.msg || 'Added')
      if (result?.success) { setForm({ question: '', answer: '' }); load() }
    } catch (err) { setStatus(err.message) }
  }

  async function deleteFaq(id) {
    setStatus('Deleting...')
    try {
      const result = await apiRequest('/api/admin/del_faq', { method: 'POST', token: tokens.admin, body: { id } })
      setStatus(result?.msg || 'Deleted')
      load()
    } catch (err) { setStatus(err.message) }
  }

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d8f0ea, #b8e6d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>❓</div>
          <div>
            <h2 style={{ margin: 0 }}>FAQ</h2>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>Add or delete FAQs displayed on your website</p>
          </div>
        </div>
        <button className="mini-button" onClick={load} style={{ border: '1px solid #1ea085', color: '#1ea085', borderRadius: '10px', padding: '10px 20px' }}>🔄 Refresh</button>
      </div>

      {status && <p className="status-line">{status}</p>}

      <div className="two-column-grid" style={{ gridTemplateColumns: '1fr 1.2fr' }}>
        <form className="panel form-panel" onSubmit={addFaq} style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#1ea085' }}>➕</span>
            <strong>Add New FAQ</strong>
          </div>
          <label>
            Question
            <input value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} placeholder="Enter question" />
          </label>
          <label>
            Answer
            <textarea rows={5} value={form.answer} onChange={e => setForm({ ...form, answer: e.target.value })} placeholder="Enter answer" />
          </label>
          <button className="primary-button" type="submit" style={{ borderRadius: '12px' }}>➕ Add FAQ</button>
        </form>

        <div className="panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <strong>Existing FAQs</strong>
            <span style={{ color: '#1ea085', fontWeight: 700, fontSize: '0.85rem' }}>{faqs.length} items</span>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {faqs.map(faq => (
              <div key={faq.id} style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', background: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#1ea085', flexShrink: 0 }}></span>
                    <strong style={{ color: '#1b2d38', fontSize: '0.92rem' }}>{faq.question}</strong>
                  </div>
                  <p style={{ color: '#607481', fontSize: '0.85rem', margin: 0, paddingLeft: '16px' }}>{faq.answer}</p>
                </div>
                <button onClick={() => deleteFaq(faq.id)} className="mini-button subtle-danger" style={{ padding: '6px 10px', fontSize: '0.75rem', flexShrink: 0 }}>🗑️</button>
              </div>
            ))}
            {faqs.length === 0 && <p className="empty-state">No FAQs added yet.</p>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminFaqPage
