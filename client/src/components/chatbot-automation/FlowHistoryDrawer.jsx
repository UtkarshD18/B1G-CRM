import React, { useEffect, useState } from 'react'
import { useChatbotAutomationStore } from '../../store/chatbotAutomationStore'

function FlowHistoryDrawer({ flowId, token, onClose }) {
  const {
    flowHistory,
    loadFlowHistory,
    flowTemplates,
    loadFlowTemplates,
    toggleTemplate,
    rollbackToVersion
  } = useChatbotAutomationStore()

  // Track which version is having its template settings configured
  const [editingTemplateVer, setEditingTemplateVer] = useState(null) // version number
  const [templateCategory, setTemplateCategory] = useState('General')
  const [templateDescription, setTemplateDescription] = useState('')

  // Track rollback configuration
  const [confirmRollbackVer, setConfirmRollbackVer] = useState(null)
  const [rollbackNotes, setRollbackNotes] = useState('')

  useEffect(() => {
    if (flowId && token) {
      loadFlowHistory(flowId, token)
      loadFlowTemplates(token)
    }
  }, [flowId, token])

  const handleToggleTemplateSubmit = async (versionNum, isTemplate) => {
    try {
      const res = await toggleTemplate(
        flowId,
        versionNum,
        isTemplate,
        templateCategory,
        templateDescription,
        token
      )
      if (res?.success) {
        alert(isTemplate ? 'Marked as reusable template!' : 'Removed from templates.')
        setEditingTemplateVer(null)
        loadFlowTemplates(token)
      } else {
        alert(res?.msg || 'Failed to update template setting')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleRollbackSubmit = async (versionNum) => {
    try {
      const res = await rollbackToVersion(flowId, versionNum, rollbackNotes, token)
      if (res?.success) {
        alert(`Successfully rolled back and deployed version ${versionNum}!`)
        setConfirmRollbackVer(null)
        setRollbackNotes('')
        onClose()
      } else {
        alert(res?.msg || 'Rollback failed')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleExport = async (versionNum) => {
    try {
      const res = await fetch(`/api/chatbot-automation/flows/${flowId}/versions/${versionNum}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Export failed')
      const data = await res.json()
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2))
      const downloadAnchor = document.createElement('a')
      downloadAnchor.setAttribute('href', dataStr)
      downloadAnchor.setAttribute('download', `flow_${flowId}_v${versionNum}.json`)
      document.body.appendChild(downloadAnchor)
      downloadAnchor.click()
      downloadAnchor.remove()
    } catch (err) {
      console.error(err)
      alert('Failed to export flow version')
    }
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'published':
        return { background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }
      case 'draft':
        return { background: 'rgba(156, 163, 175, 0.15)', color: '#9ca3af', border: '1px solid rgba(156, 163, 175, 0.3)' }
      default: // historical
        return { background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.3)' }
    }
  }

  return (
    <div
      className="flow-tester-panel animate-slide-left"
      style={{
        width: '460px',
        height: '100%',
        background: '#111827',
        borderLeft: '1px solid #374151',
        display: 'flex',
        flexDirection: 'column',
        color: '#f3f4f6',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.3)',
        pointerEvents: 'auto'
      }}
    >
      {/* Drawer Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#ffffff' }}>
          📜 Version History & Templates
        </h3>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.1rem' }}
        >
          ✕
        </button>
      </div>

      {/* Drawer Scrollable Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {flowHistory?.length === 0 ? (
          <div style={{ color: '#9ca3af', textAlign: 'center', margin: '40px 0', fontSize: '0.88rem' }}>
            No versions saved yet. Please save your flow.
          </div>
        ) : (
          flowHistory?.map((v) => {
            const isTemplateObj = flowTemplates?.find(t => t.version_id === v.id)
            const isPublished = v.status === 'published'

            return (
              <div
                key={v.id}
                style={{
                  background: '#1f2937',
                  border: isPublished ? '1px solid #10b981' : '1px solid #2d3748',
                  borderRadius: '16px',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                }}
              >
                {/* Upper Meta details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>
                      Version {v.version}
                    </span>
                    <span
                      style={{
                        fontSize: '0.62rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                        ...getStatusStyle(v.status)
                      }}
                    >
                      {v.status}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                    {new Date(v.created_at).toLocaleDateString()} {new Date(v.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Sub details: Author / Tag */}
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <div>
                    <span style={{ color: '#4a5568' }}>Tag:</span>{' '}
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>{v.release_tag || 'Draft'}</span>
                  </div>
                  <div>
                    <span style={{ color: '#4a5568' }}>Operator:</span> {v.created_by}
                  </div>
                  {v.rollback_source_version && (
                    <div style={{ color: '#3b82f6', fontWeight: 600 }}>
                      ↩️ Rollback from Version {v.rollback_source_version}
                    </div>
                  )}
                  {isTemplateObj && (
                    <div style={{ color: '#10b981', fontWeight: 600 }}>
                      ✨ Template Category: {isTemplateObj.category}
                    </div>
                  )}
                </div>

                {/* Release/notes details */}
                {v.version_notes && (
                  <div
                    style={{
                      background: '#111827',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      lineHeight: '1.4',
                      color: '#d1d5db',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {v.version_notes}
                  </div>
                )}

                {/* Metrics Section */}
                <div
                  style={{
                    background: '#1a202c',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    color: '#e2e8f0',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '6px 12px'
                  }}
                >
                  <div>💬 Chats: <span style={{ color: '#ffffff', fontWeight: 700 }}>{v.conversation_count || 0}</span></div>
                  <div>📈 Success Rate: <span style={{ color: '#10b981', fontWeight: 700 }}>{parseFloat(v.success_rate || 0).toFixed(0)}%</span></div>
                  <div>⚠️ Fallback Rate: <span style={{ color: '#ef4444', fontWeight: 700 }}>{parseFloat(v.fallback_rate || 0).toFixed(0)}%</span></div>
                  <div>🤖 AI Calls: <span style={{ color: '#6366f1', fontWeight: 700 }}>{v.ai_calls || 0}</span></div>
                  <div>⏱️ Latency: <span style={{ color: '#3b82f6', fontWeight: 700 }}>{v.average_latency || 0}ms</span></div>
                  <div>💵 Avg Cost: <span style={{ color: '#f59e0b', fontWeight: 700 }}>${parseFloat(v.average_cost || 0).toFixed(4)}</span></div>
                </div>

                {/* Confirm Rollback Form */}
                {confirmRollbackVer === v.version && (
                  <div style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid #ef4444', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 700 }}>Confirm Rollback to Version {v.version}</span>
                    <input
                      placeholder="Rollback notes (e.g. Hotfix roll back)..."
                      className="af-input compact"
                      style={{ background: '#111827', color: '#ffffff', border: '1px solid #ef4444' }}
                      value={rollbackNotes}
                      onChange={(e) => setRollbackNotes(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        className="action-btn"
                        onClick={() => setConfirmRollbackVer(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="action-btn"
                        style={{ background: '#ef4444', color: '#ffffff', borderColor: '#ef4444' }}
                        onClick={() => handleRollbackSubmit(v.version)}
                      >
                        Yes, Rollback
                      </button>
                    </div>
                  </div>
                )}

                {/* Edit Template Config Form */}
                {editingTemplateVer === v.version && (
                  <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid #10b981', borderRadius: '12px', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: 700 }}>Template Configuration</span>
                    <div className="af-field">
                      <label className="sub-label">Category</label>
                      <select
                        className="af-select compact"
                        style={{ background: '#111827', color: '#ffffff' }}
                        value={templateCategory}
                        onChange={(e) => setTemplateCategory(e.target.value)}
                      >
                        <option value="General">General Template</option>
                        <option value="Customer Support">Customer Support</option>
                        <option value="Sales / E-commerce">Sales / E-commerce</option>
                        <option value="AI Assistants">AI Assistants & RAG</option>
                        <option value="Lead Generation">Lead Generation</option>
                      </select>
                    </div>
                    <div className="af-field">
                      <label className="sub-label">Description</label>
                      <textarea
                        rows={2}
                        className="af-textarea"
                        style={{ background: '#111827', color: '#ffffff', padding: 6, fontSize: '0.78rem' }}
                        placeholder="Describe the usage pattern for this visual flow..."
                        value={templateDescription}
                        onChange={(e) => setTemplateDescription(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button
                        className="action-btn"
                        onClick={() => setEditingTemplateVer(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="action-btn"
                        style={{ background: '#10b981', color: '#ffffff', borderColor: '#10b981' }}
                        onClick={() => handleToggleTemplateSubmit(v.version, true)}
                      >
                        Save Template
                      </button>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {!confirmRollbackVer && !editingTemplateVer && (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {/* Rollback Trigger */}
                    {!isPublished && (
                      <button
                        className="action-btn"
                        onClick={() => {
                          setConfirmRollbackVer(v.version)
                          setRollbackNotes(`Rollback to version ${v.version}`)
                        }}
                      >
                        ↩️ Rollback
                      </button>
                    )}

                    {/* Template settings toggle */}
                    {isTemplateObj ? (
                      <button
                        className="action-btn delete-btn"
                        onClick={() => handleToggleTemplateSubmit(v.version, false)}
                      >
                        ✨ Remove Template
                      </button>
                    ) : (
                      <button
                        className="action-btn"
                        onClick={() => {
                          setEditingTemplateVer(v.version)
                          setTemplateCategory('General')
                          setTemplateDescription(v.version_notes || '')
                        }}
                      >
                        ✨ Make Template
                      </button>
                    )}

                    {/* Export specific version */}
                    <button
                      className="action-btn"
                      onClick={() => handleExport(v.version)}
                    >
                      📥 Export Version
                    </button>
                  </div>
                )}

              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default FlowHistoryDrawer
