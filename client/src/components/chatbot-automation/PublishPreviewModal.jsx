import React, { useEffect, useState, useMemo } from 'react'
import { useChatbotAutomationStore } from '../../store/chatbotAutomationStore'
import { apiRequest } from '../../shared/api'

function PublishPreviewModal({ flowId, token, onClose, onPublishSuccess }) {
  const {
    nodes,
    edges,
    flowHistory,
    loadFlowHistory,
    publishFlowWithDetails,
    validateCurrentFlow,
    validationResult,
    isValidationRunning,
    compareVersions,
    comparisonResult
  } = useChatbotAutomationStore()

  const [releaseTag, setReleaseTag] = useState('Production')
  const [versionNotes, setVersionNotes] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Find active published version and latest version to compare
  const activeVersion = useMemo(() => {
    return flowHistory?.find(v => v.status === 'published')
  }, [flowHistory])

  const latestVersion = useMemo(() => {
    // History is sorted DESC, so flowHistory[0] is the latest saved version (draft or historical)
    return flowHistory?.[0]
  }, [flowHistory])

  // Run validation and comparison when the modal is mounted
  useEffect(() => {
    const runChecks = async () => {
      if (!token || !flowId) return
      
      // 1. Load latest history
      await loadFlowHistory(flowId, token)
      
      // 2. Validate current canvas state
      await validateCurrentFlow(token)
    }
    
    runChecks()
  }, [flowId, token])

  // Once history and validation are loaded, fetch compare diff if there is an active version
  useEffect(() => {
    if (!token || !flowId || !activeVersion || !latestVersion) return
    
    // Compare active version with the latest saved version
    if (activeVersion.version !== latestVersion.version) {
      compareVersions(flowId, activeVersion.version, latestVersion.version, token)
    }
  }, [activeVersion, latestVersion, flowId, token])

  // Generate automated release notes based on comparisonResult
  useEffect(() => {
    let generatedNotes = '### Release Notes\n\n'
    if (comparisonResult) {
      const { addedNodes, removedNodes, modifiedNodes, edges: edgeDiff } = comparisonResult
      let changesCount = 0

      if (addedNodes?.length > 0) {
        generatedNotes += '#### 🟢 Added Components:\n'
        addedNodes.forEach(n => {
          generatedNotes += `- **${n.label}** (${n.type})\n`
        })
        generatedNotes += '\n'
        changesCount++
      }

      if (modifiedNodes?.length > 0) {
        generatedNotes += '#### 🟡 Modified Components:\n'
        modifiedNodes.forEach(n => {
          generatedNotes += `- **${n.label}**:\n`
          n.changes.forEach(c => {
            const fromText = typeof c.from === 'object' ? JSON.stringify(c.from) : c.from
            const toText = typeof c.to === 'object' ? JSON.stringify(c.to) : c.to
            generatedNotes += `  - Changed *${c.field}* from "${fromText}" to "${toText}"\n`
          })
        })
        generatedNotes += '\n'
        changesCount++
      }

      if (removedNodes?.length > 0) {
        generatedNotes += '#### 🔴 Removed Components:\n'
        removedNodes.forEach(n => {
          generatedNotes += `- **${n.label}** (${n.type})\n`
        })
        generatedNotes += '\n'
        changesCount++
      }

      if (edgeDiff?.added?.length > 0 || edgeDiff?.removed?.length > 0) {
        generatedNotes += '#### 🔀 Connection Changes:\n'
        if (edgeDiff.added?.length > 0) {
          generatedNotes += `- Connected ${edgeDiff.added.length} new paths\n`
        }
        if (edgeDiff.removed?.length > 0) {
          generatedNotes += `- Removed ${edgeDiff.removed.length} paths\n`
        }
        generatedNotes += '\n'
        changesCount++
      }

      if (changesCount === 0) {
        generatedNotes += '- Minor visual adjustments or label edits.\n'
      }
    } else {
      generatedNotes += '- First-time publication of visual chatbot automation flow.\n- Standard initial release.\n'
    }

    setVersionNotes(generatedNotes)
  }, [comparisonResult])

  // Get color for health score
  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981' // Green
    if (score >= 50) return '#f59e0b' // Yellow/Orange
    return '#ef4444' // Red
  }

  const handlePublish = async () => {
    if (!token || !flowId) return
    setIsPublishing(true)
    setErrorMessage('')

    try {
      const res = await publishFlowWithDetails(flowId, releaseTag, versionNotes, token)
      if (res?.success) {
        onPublishSuccess(res.msg || 'Flow published successfully!')
        onClose()
      } else {
        setErrorMessage(res?.msg || 'Failed to publish flow')
      }
    } catch (err) {
      console.error(err)
      setErrorMessage('Network error during publish')
    } finally {
      setIsPublishing(false)
    }
  }

  const renderChangesDiff = () => {
    if (!comparisonResult) {
      return (
        <div className="diff-empty-state">
          <p style={{ color: '#9ca3af', fontSize: '0.82rem', textAlign: 'center', margin: '20px 0' }}>
            {activeVersion 
              ? '🔄 Comparing current workspace with active version...' 
              : '🌱 This is the first version being published. All elements will be created.'}
          </p>
        </div>
      )
    }

    const { addedNodes, removedNodes, modifiedNodes } = comparisonResult

    return (
      <div className="compare-diff-list" style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '200px', overflowY: 'auto' }}>
        {addedNodes?.map(n => (
          <div key={n.id} style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: '#10b981', fontWeight: 700 }}>🟢 Added Node: {n.label}</span>
            <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{n.type}</span>
          </div>
        ))}

        {modifiedNodes?.map(n => (
          <div key={n.id} style={{ padding: '8px 12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 700, color: '#f59e0b' }}>
              <span>🟡 Modified Node: {n.label}</span>
              <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{n.type}</span>
            </div>
            <div style={{ paddingLeft: '8px', fontSize: '0.72rem', color: '#d1d5db', display: 'flex', flexDirection: 'column', gap: 2 }}>
              {n.changes.map((c, idx) => {
                const fromText = typeof c.from === 'object' ? JSON.stringify(c.from) : c.from
                const toText = typeof c.to === 'object' ? JSON.stringify(c.to) : c.to
                return (
                  <div key={idx}>
                    <span style={{ color: '#9ca3af', textTransform: 'capitalize' }}>{c.field}:</span>{' '}
                    <span style={{ textDecoration: 'line-through', color: '#ef4444', marginRight: 4 }}>{fromText}</span>
                    <span style={{ color: '#10b981' }}>{toText}</span>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {removedNodes?.map(n => (
          <div key={n.id} style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <span style={{ color: '#ef4444', fontWeight: 700 }}>🔴 Removed Node: {n.label}</span>
            <span style={{ color: '#9ca3af', fontSize: '0.7rem' }}>{n.type}</span>
          </div>
        ))}

        {addedNodes?.length === 0 && modifiedNodes?.length === 0 && removedNodes?.length === 0 && (
          <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: '0.8rem', padding: '10px' }}>
            ✅ No node layout differences detected. Re-publishing will tag this exact draft.
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'rgba(17, 24, 39, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div
        className="animate-scale-in"
        style={{
          width: '680px',
          background: '#111827',
          border: '1px solid #374151',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          color: '#f3f4f6',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
            🚀 Visual Flow Publication Review
          </h3>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '1.25rem' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Validation & Health Score Section */}
          {isValidationRunning ? (
            <div style={{ padding: '16px', background: '#1f2937', borderRadius: '12px', textAlign: 'center' }}>
              <span>🔄 Running diagnostics validation engine...</span>
            </div>
          ) : validationResult ? (
            <div
              style={{
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                padding: '16px',
                background: '#1f2937',
                border: `1px solid ${validationResult.success ? '#10b981' : '#ef4444'}`,
                borderRadius: '16px'
              }}
            >
              {/* Circular Health Score */}
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  border: `6px solid ${getHealthColor(validationResult.healthScore)}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>
                  {validationResult.healthScore}%
                </span>
              </div>

              {/* Status information */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#ffffff' }}>
                    Diagnostics Engine Results
                  </span>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: validationResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: validationResult.success ? '#10b981' : '#ef4444'
                    }}
                  >
                    {validationResult.success ? 'Ready' : 'Blocked'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>
                  {validationResult.success
                    ? 'All critical nodes and configurations validated successfully. Non-critical warnings may be ignored.'
                    : 'Severe configuration errors detected. Critical problems must be resolved prior to deployment.'}
                </p>
              </div>
            </div>
          ) : null}

          {/* Validation Errors & Warnings Details */}
          {validationResult && (validationResult.errors.length > 0 || validationResult.warnings.length > 0) && (
            <div style={{ padding: '12px 16px', background: '#1f2937', borderRadius: '12px' }}>
              <span className="section-label" style={{ color: '#9ca3af', marginBottom: '8px', display: 'block' }}>Diagnostics Logs</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '120px', overflowY: 'auto' }}>
                {validationResult.errors.map((e, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', color: '#ef4444', display: 'flex', gap: 6 }}>
                    <span>❌</span> <span>{e.message}</span>
                  </div>
                ))}
                {validationResult.warnings.map((w, idx) => (
                  <div key={idx} style={{ fontSize: '0.75rem', color: '#f59e0b', display: 'flex', gap: 6 }}>
                    <span>⚠️</span> <span>{w.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Side-by-Side Visual Compare / Differences Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="section-label" style={{ color: '#9ca3af' }}>Semantic Changes Summary</span>
            {renderChangesDiff()}
          </div>

          {/* Tag and Notes fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="af-field">
              <label className="af-field-label">Release Tag / Environment</label>
              <select
                className="af-select"
                style={{ background: '#1f2937', color: '#ffffff', borderColor: '#374151' }}
                value={releaseTag}
                onChange={(e) => setReleaseTag(e.target.value)}
              >
                <option value="Production">🚀 Production (Active Webhook Execution)</option>
                <option value="Stable">✅ Stable (LTS Tag)</option>
                <option value="Release Candidate">📦 Release Candidate (RC)</option>
                <option value="Hotfix">🔧 Hotfix (Production Fix)</option>
                <option value="Draft">📝 Draft Save Point</option>
              </select>
            </div>
            
            <div className="af-field" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>
                Targeting environment automatically configures runtime webhook resolution to this active version.
              </span>
            </div>
          </div>

          <div className="af-field">
            <label className="af-field-label">Release Notes (Markdown Enabled)</label>
            <textarea
              className="af-textarea"
              style={{ background: '#1f2937', color: '#ffffff', borderColor: '#374151', fontFamily: 'monospace', fontSize: '0.8rem' }}
              rows={6}
              value={versionNotes}
              onChange={(e) => setVersionNotes(e.target.value)}
              placeholder="Provide a detailed description of flow changes..."
            />
          </div>

          {errorMessage && (
            <div style={{ padding: '10px 14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '8px', color: '#ef4444', fontSize: '0.8rem' }}>
              ⚠️ {errorMessage}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #1f2937', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#1f2937' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 18px',
              background: 'transparent',
              border: '1px solid #374151',
              borderRadius: '10px',
              color: '#9ca3af',
              cursor: 'pointer',
              fontSize: '0.85rem'
            }}
          >
            Cancel
          </button>
          
          <button
            onClick={handlePublish}
            disabled={isPublishing || (validationResult && !validationResult.success)}
            style={{
              padding: '10px 24px',
              background: (validationResult && !validationResult.success) ? '#374151' : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              cursor: (validationResult && !validationResult.success) ? 'not-allowed' : 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
              boxShadow: (validationResult && !validationResult.success) ? 'none' : '0 4px 14px rgba(16, 185, 129, 0.3)'
            }}
          >
            {isPublishing ? '⏳ Deploying Flow...' : '🚀 Publish & Deploy'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default PublishPreviewModal
