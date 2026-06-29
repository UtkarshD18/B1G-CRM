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
  
  // Chunk viewer state
  const [viewingChunksDoc, setViewingChunksDoc] = useState(null)
  const [docChunks, setDocChunks] = useState([])
  const [loadingChunks, setLoadingChunks] = useState(false)

  const loadKnowledgeBase = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true)
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
      if (showLoading) setLoading(false)
    }
  }, [tokens.user])

  // Initial load
  useEffect(() => {
    loadKnowledgeBase(true)
  }, [loadKnowledgeBase])

  // Polling auto-refresh every 5s if any document is in PENDING or INDEXING state
  useEffect(() => {
    const hasActiveIndexing = knowledgeList.some(
      item => item.status === 'PENDING' || item.status === 'INDEXING'
    )
    if (hasActiveIndexing) {
      const interval = setInterval(() => {
        loadKnowledgeBase(false) // don't trigger full screen loading state spinner
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [knowledgeList, loadKnowledgeBase])

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
        setStatus(result.msg || 'URL queued for indexing.')
        setUrlInput('')
        loadKnowledgeBase(false)
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

    setStatus('Uploading document...')
    try {
      const formData = new FormData()
      formData.append('file', fileInput)

      const result = await apiFormRequest('/api/knowledge_base/upload', {
        token: tokens.user,
        formData
      })

      if (result?.success) {
        setStatus(result.msg || 'Document uploaded and queued for indexing.')
        setFileInput(null)
        const fileEl = document.getElementById('kb-file-input')
        if (fileEl) fileEl.value = ''
        loadKnowledgeBase(false)
      } else {
        setStatus(result?.msg || 'Failed to upload file.')
      }
    } catch (error) {
      setStatus(error.message || 'Error uploading document.')
    }
  }

  async function handleReindex(id) {
    setStatus('Re-indexing document...')
    try {
      const result = await apiRequest(`/api/knowledge_base/reindex/${id}`, {
        method: 'POST',
        token: tokens.user
      })
      if (result?.success) {
        setStatus(result.msg || 'Re-indexing queued successfully.')
        loadKnowledgeBase(false)
      } else {
        setStatus(result?.msg || 'Failed to re-index document.')
      }
    } catch (error) {
      setStatus(error.message || 'Error re-indexing document.')
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
        loadKnowledgeBase(false)
      } else {
        setStatus(result?.msg || 'Failed to delete item.')
      }
    } catch (error) {
      setStatus(error.message || 'Error deleting knowledge item.')
    }
  }

  async function handleViewChunks(doc) {
    setViewingChunksDoc(doc)
    setLoadingChunks(true)
    setDocChunks([])
    try {
      const result = await apiRequest(`/api/knowledge_base/chunks/${doc.id}`, {
        token: tokens.user
      })
      if (result?.success && Array.isArray(result.data)) {
        setDocChunks(result.data)
      } else {
        alert(result?.msg || 'Failed to retrieve chunks.')
      }
    } catch (error) {
      alert(error.message || 'Error loading chunks.')
    } finally {
      setLoadingChunks(false)
    }
  }

  function formatRelativeTime(dateString) {
    if (!dateString) return '—'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now - date
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHr / 24)

    if (diffSec < 60) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
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
      {/* Scope-contained page styles for modern glassmorphic tags & animation */}
      <style>{`
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .status-badge.indexed {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }
        .status-badge.pending {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .status-badge.indexing {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
          animation: pulse-blue 1.5s infinite ease-in-out;
        }
        .status-badge.failed {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          cursor: help;
        }
        @keyframes pulse-blue {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(10, 25, 37, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }
        .modal-container {
          background: #ffffff;
          border-radius: 16px;
          width: 90%;
          max-width: 800px;
          max-height: 85vh;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid rgba(10, 25, 37, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid rgba(10, 25, 37, 0.08);
          display: flex;
          justify-content: flex-end;
          background: #f9fafb;
        }
        .chunk-card {
          background: #f3f4f6;
          border: 1px solid rgba(10, 25, 37, 0.06);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          font-family: inherit;
        }
        .chunk-meta {
          font-size: 11px;
          color: #6b7280;
          margin-top: 8px;
          display: flex;
          gap: 16px;
          border-top: 1px solid rgba(0,0,0,0.05);
          padding-top: 6px;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .tooltip-container {
          position: relative;
        }
        .tooltip-text {
          visibility: hidden;
          width: 250px;
          background-color: #1e293b;
          color: #fff;
          text-align: left;
          border-radius: 6px;
          padding: 8px 12px;
          position: absolute;
          z-index: 10;
          bottom: 125%;
          left: 50%;
          transform: translateX(-50%);
          opacity: 0;
          transition: opacity 0.2s;
          font-size: 12px;
          font-weight: normal;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          word-break: break-word;
        }
        .tooltip-container:hover .tooltip-text {
          visibility: visible;
          opacity: 1;
        }
      `}</style>

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
              Upload local documents (PDF, DOCX, or TXT) to extract text and index them asynchronously.
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
                    <th>Title / Path</th>
                    <th>Status</th>
                    <th>Extracted Chunks</th>
                    <th>Model</th>
                    <th>Last Updated</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(item => {
                    const cleanStatus = (item.status || 'INDEXED').toLowerCase()
                    return (
                      <tr key={item.id}>
                        <td>
                          <strong>{item.title}</strong>
                          <div className="muted-copy" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                            {item.source_path}
                          </div>
                        </td>
                        <td>
                          {cleanStatus === 'failed' ? (
                            <div className="tooltip-container">
                              <span className="status-badge failed">
                                ❌ Failed
                              </span>
                              <span className="tooltip-text">
                                {item.index_error || 'Unknown indexing error occurred.'}
                              </span>
                            </div>
                          ) : cleanStatus === 'indexing' ? (
                            <span className="status-badge indexing">
                              ⚙ Indexing
                            </span>
                          ) : cleanStatus === 'pending' ? (
                            <span className="status-badge pending">
                              ⏳ Pending
                            </span>
                          ) : (
                            <span className="status-badge indexed">
                              ✓ Indexed
                            </span>
                          )}
                        </td>
                        <td>
                          {cleanStatus === 'indexed' ? (
                            <button 
                              type="button" 
                              className="mini-button"
                              onClick={() => handleViewChunks(item)}
                              style={{ fontWeight: 500 }}
                            >
                              {item.chunk_count || 0} chunks
                            </button>
                          ) : (
                            <span className="muted-copy">—</span>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '11px', color: '#4b5563' }}>
                            {item.embedding_model || '—'}
                          </span>
                        </td>
                        <td>{formatRelativeTime(item.indexed_at || item.created_at)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {(cleanStatus === 'failed' || cleanStatus === 'indexed') && (
                              <button
                                type="button"
                                className="mini-button"
                                onClick={() => handleReindex(item.id)}
                                style={{ color: '#2563eb', borderColor: '#bfdbfe' }}
                              >
                                Re-index
                              </button>
                            )}
                            <button
                              type="button"
                              className="mini-button"
                              onClick={() => handleDelete(item.id)}
                              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Chunk Viewer Modal */}
      {viewingChunksDoc && (
        <div className="modal-overlay" onClick={() => setViewingChunksDoc(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>Document Chunks</h3>
                <span className="muted-copy" style={{ fontSize: '12px' }}>{viewingChunksDoc.title}</span>
              </div>
              <button 
                onClick={() => setViewingChunksDoc(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            
            <div className="modal-body">
              {loadingChunks ? (
                <p style={{ textAlign: 'center', padding: '24px' }}>Loading chunks...</p>
              ) : docChunks.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '24px', color: '#6b7280' }}>No chunks found for this document.</p>
              ) : (
                docChunks.map(chunk => (
                  <div key={chunk.id} className="chunk-card">
                    <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '13px', lineHeight: '1.6' }}>{chunk.content}</p>
                    <div className="chunk-meta">
                      <span>Index: {chunk.chunk_index}</span>
                      {chunk.source_url && <span>Source: {chunk.source_url}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="primary-button" 
                onClick={() => setViewingChunksDoc(null)}
                style={{ padding: '8px 16px', fontSize: '14px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserKnowledgeBasePage
