import { useCallback, useEffect, useState } from 'react'
import { apiFormRequest, apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function UserKnowledgeBasePage() {
  const { tokens } = useAuth()
  const [knowledgeList, setKnowledgeList] = useState([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [fileInput, setFileInput] = useState(null)

  const loadKnowledgeBase = useCallback(async () => {
    setLoading(true)
    try {
      const result = await apiRequest('/api/knowledge_base/get_all', { token: tokens.user })
      if (result?.success && Array.isArray(result.data)) {
        setKnowledgeList(result.data)
      } else {
        setStatus(result?.msg || 'Failed to load knowledge base items.')
      }
    } catch (error) {
      setStatus(error.message || 'Error loading knowledge base items.')
    } finally {
      setLoading(false)
    }
  }, [tokens.user])

  useEffect(() => {
    loadKnowledgeBase()
  }, [loadKnowledgeBase])

  async function handleUrlScrape(e) {
    e.preventDefault()
    if (!urlInput.trim()) return

    setStatus('Crawling website content...')
    try {
      const result = await apiRequest('/api/knowledge_base/url', {
        method: 'POST',
        token: tokens.user,
        body: { url: urlInput.trim() }
      })

      if (result?.success) {
        setStatus(result.msg || 'URL successfully crawled.')
        setUrlInput('')
        loadKnowledgeBase()
      } else {
        setStatus(result?.msg || 'Failed to crawl website.')
      }
    } catch (error) {
      setStatus(error.message || 'Error crawling website URL.')
    }
  }

  async function handleFileUpload(e) {
    e.preventDefault()
    if (!fileInput) {
      setStatus('Please select a file first.')
      return
    }

    setStatus('Uploading and parsing document...')
    try {
      const formData = new FormData()
      formData.append('file', fileInput)

      const result = await apiFormRequest('/api/knowledge_base/upload', {
        token: tokens.user,
        formData
      })

      if (result?.success) {
        setStatus(result.msg || 'Document uploaded and parsed successfully.')
        setFileInput(null)
        // Reset file input element
        const fileEl = document.getElementById('kb-file-input')
        if (fileEl) fileEl.value = ''
        loadKnowledgeBase()
      } else {
        setStatus(result?.msg || 'Failed to parse file.')
      }
    } catch (error) {
      setStatus(error.message || 'Error uploading document.')
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to delete this document from the knowledge base?')) {
      return
    }

    setStatus('Deleting item...')
    try {
      const result = await apiRequest(`/api/knowledge_base/delete/${id}`, {
        method: 'DELETE',
        token: tokens.user
      })

      if (result?.success) {
        setStatus(result.msg || 'Item deleted.')
        loadKnowledgeBase()
      } else {
        setStatus(result?.msg || 'Failed to delete item.')
      }
    } catch (error) {
      setStatus(error.message || 'Error deleting knowledge item.')
    }
  }

  const filteredItems = knowledgeList.filter(item => {
    const q = searchQuery.toLowerCase()
    return (
      (item.title && item.title.toLowerCase().includes(q)) ||
      (item.type && item.type.toLowerCase().includes(q)) ||
      (item.source_path && item.source_path.toLowerCase().includes(q))
    )
  })

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">Autopilot brain</span>
          <h2>AI Knowledge Base</h2>
          <p>Provide documents or website links to feed contextual information into the CRM AI chatbot responder.</p>
        </div>
      </div>

      {status && <div className="status-line">{status}</div>}

      <div className="two-column-grid">
        <div className="panel-stack" style={{ display: 'grid', gap: '24px' }}>
          {/* File Upload Panel */}
          <form className="panel form-panel" onSubmit={handleFileUpload}>
            <div className="panel-header">
              <h2>Upload Document</h2>
            </div>
            <p className="muted-copy" style={{ marginBottom: '16px' }}>
              Upload local documents (PDF, DOCX, or TXT) to extract text and make it searchable by the chatbot.
            </p>
            <label htmlFor="kb-file-input">
              Select Document File
              <input
                id="kb-file-input"
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={e => setFileInput(e.target.files[0])}
                style={{ padding: '8px 0' }}
              />
            </label>
            <button className="primary-button" type="submit" style={{ marginTop: '12px' }}>
              Upload & Process
            </button>
          </form>

          {/* Scrape Website URL Panel */}
          <form className="panel form-panel" onSubmit={handleUrlScrape}>
            <div className="panel-header">
              <h2>Crawl Website URL</h2>
            </div>
            <p className="muted-copy" style={{ marginBottom: '16px' }}>
              Enter a website URL to automatically crawl, scrape body paragraphs, and index details.
            </p>
            <label>
              Website URL
              <input
                type="text"
                placeholder="https://example.com/about-us"
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
              />
            </label>
            <button className="primary-button" type="submit" style={{ marginTop: '12px' }}>
              Crawl URL
            </button>
          </form>
        </div>

        {/* Knowledge Base Registry List */}
        <div className="panel form-panel">
          <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <h2>Indexed Knowledge Base</h2>
            <input
              type="text"
              placeholder="Search registry..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '200px', padding: '6px 12px', fontSize: '14px', borderRadius: '12px', border: '1px solid rgba(10, 25, 37, 0.12)' }}
            />
          </div>

          {loading ? (
            <p className="status-line">Loading knowledge library...</p>
          ) : filteredItems.length === 0 ? (
            <p className="muted-copy" style={{ padding: '24px', textAlign: 'center' }}>
              {searchQuery ? 'No documents matched your search filter.' : 'Your Knowledge Base is currently empty. Upload files or scrape URLs to get started.'}
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Extracted Size</th>
                    <th>Indexed Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.title}</strong>
                        <div className="muted-copy" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                          {item.source_path}
                        </div>
                      </td>
                      <td>
                        <span className="status-chip active" style={{ textTransform: 'uppercase', fontSize: '10px' }}>
                          {item.type}
                        </span>
                      </td>
                      <td>{item.content_length} chars</td>
                      <td>{new Date(item.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          type="button"
                          className="mini-button"
                          onClick={() => handleDelete(item.id)}
                          style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default UserKnowledgeBasePage
