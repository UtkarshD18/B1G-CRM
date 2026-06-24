import React, { useState, useEffect } from 'react'
import { Handle, Position } from '@xyflow/react'
import { useChatbotAutomationStore } from '../../store/chatbotAutomationStore'
import { useAuth } from '../../shared/auth'
import { apiFormRequest, apiRequest } from '../../shared/api'

// Helper to resolve icon by node type
const getNodeIcon = (type) => {
  const icons = {
    'Send Message': '💬',
    'Send WA Template': '📝',
    'Send WA Form': '📋',
    'Condition': '🔀',
    'Response Saver': '📥',
    'Set Chat Labels': '🏷️',
    'Disable Auto-Reply': '🔇',
    'Make Request': '🔌',
    'Delay': '⏳',
    'Reset Session': '🔄',
    'Send Email': '📧',
    'Google Sheets': '📊',
    'Agent Transfer': '👤',
    'AI Transfer': '🤖',
    'Webhook': '🔗',
    'End Flow': '🛑',
    'initial': '⚡'
  }
  return icons[type] || '❓'
}

// Custom Node for general automation steps
export function AutomationNode({ id, data, type }) {
  const { tokens } = useAuth()
  const token = tokens?.user
  
  const { 
    selectedNodeId, 
    simulationResult, 
    updateNodeData, 
    duplicateNode, 
    deleteNode, 
    setLastFocusedInput 
  } = useChatbotAutomationStore()

  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [publishedForms, setPublishedForms] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [availableLabels, setAvailableLabels] = useState([])
  const [newTagName, setNewTagName] = useState('')
  const [showAddTagInput, setShowAddTagInput] = useState(false)
  const [availableTemplates, setAvailableTemplates] = useState([])
  const [showResponseExample, setShowResponseExample] = useState(false)
  const [showSmtpSettings, setShowSmtpSettings] = useState(false)
  const [showEmailContent, setShowEmailContent] = useState(false)

  const isSelected = selectedNodeId === id
  const name = data.label || type
  const icon = data.icon || getNodeIcon(type)
  const category = data.category || 'Logic'
  const desc = data.desc || ''

  // Load published forms if this is a Send WA Form node
  useEffect(() => {
    if (type === 'Send WA Form' && token) {
      fetchPublishedForms()
    }
  }, [type, token])

  const fetchPublishedForms = async () => {
    try {
      const res = await apiRequest('/api/chatbot-automation/forms', { token })
      if (res?.success && Array.isArray(res.data)) {
        setPublishedForms(res.data)
      } else {
        // Fallback mock forms matching user screenshots
        setPublishedForms([
          { form_id: '95049511181580', name: 'New Test', status: 'PUBLISHED' },
          { form_id: '95042830645439', name: 'Contact Form', status: 'PUBLISHED' }
        ])
      }
    } catch (err) {
      console.error('Failed to load forms, using fallback', err)
      setPublishedForms([
        { form_id: '95049511181580', name: 'New Test', status: 'PUBLISHED' },
        { form_id: '95042830645439', name: 'Contact Form', status: 'PUBLISHED' }
      ])
    }
  }

  // Load labels if this is a Set Chat Labels node
  useEffect(() => {
    if (type === 'Set Chat Labels' && token) {
      fetchLabels()
    }
  }, [type, token])

  const fetchLabels = async () => {
    try {
      const res = await apiRequest('/api/chatbot-automation/labels', { token })
      if (res?.success && Array.isArray(res.data)) {
        setAvailableLabels(res.data)
      } else {
        setAvailableLabels([
          { id: 1, hex: '#10b981', title: 'Lead' },
          { id: 2, hex: '#3b82f6', title: 'Support' },
          { id: 3, hex: '#ef4444', title: 'Urgent' }
        ])
      }
    } catch (err) {
      console.error('Failed to load labels', err)
      setAvailableLabels([
        { id: 1, hex: '#10b981', title: 'Lead' },
        { id: 2, hex: '#3b82f6', title: 'Support' },
        { id: 3, hex: '#ef4444', title: 'Urgent' }
      ])
    }
  }

  // Load templates if this is a Send WA Template node
  useEffect(() => {
    if (type === 'Send WA Template' && token) {
      fetchTemplates()
    }
  }, [type, token])

  const fetchTemplates = async () => {
    try {
      const res = await apiRequest('/api/chatbot-automation/templates', { token })
      if (res?.success && Array.isArray(res.data)) {
        setAvailableTemplates(res.data)
      } else {
        setAvailableTemplates([
          { id: 1, title: 'shipping_update', category: 'UTILITY', language: 'en_US', status: 'APPROVED', components: [{ type: 'BODY', text: 'Hello {{1}}, your order {{2}} has shipped!' }] },
          { id: 2, title: 'welcome_message', category: 'MARKETING', language: 'en_US', status: 'APPROVED', components: [{ type: 'BODY', text: 'Welcome {{1}} to our store!' }] }
        ])
      }
    } catch (err) {
      console.error('Failed to load templates', err)
      setAvailableTemplates([
        { id: 1, title: 'shipping_update', category: 'UTILITY', language: 'en_US', status: 'APPROVED', components: [{ type: 'BODY', text: 'Hello {{1}}, your order {{2}} has shipped!' }] },
        { id: 2, title: 'welcome_message', category: 'MARKETING', language: 'en_US', status: 'APPROVED', components: [{ type: 'BODY', text: 'Welcome {{1}} to our store!' }] }
      ])
    }
  }

  const handleLabelLeftClick = (title) => {
    const addList = data.labels || []
    const removeList = data.removeLabels || []
    
    if (addList.includes(title)) {
      updateNodeData(id, 'labels', addList.filter(l => l !== title))
    } else {
      updateNodeData(id, 'labels', [...addList, title])
      updateNodeData(id, 'removeLabels', removeList.filter(l => l !== title))
    }
  }

  const handleLabelRightClick = (e, title) => {
    e.preventDefault()
    const addList = data.labels || []
    const removeList = data.removeLabels || []
    
    if (removeList.includes(title)) {
      updateNodeData(id, 'removeLabels', removeList.filter(l => l !== title))
    } else {
      updateNodeData(id, 'removeLabels', [...removeList, title])
      updateNodeData(id, 'labels', addList.filter(l => l !== title))
    }
  }

  const handleAddNewTag = () => {
    if (!newTagName.trim()) return
    const title = newTagName.trim()
    
    if (!availableLabels.some(l => l.title.toLowerCase() === title.toLowerCase())) {
      setAvailableLabels(prev => [...prev, { id: `new_${Date.now()}`, hex: '#64748b', title }])
    }
    
    const addList = data.labels || []
    if (!addList.includes(title)) {
      updateNodeData(id, 'labels', [...addList, title])
    }
    
    setNewTagName('')
    setShowAddTagInput(false)
  }

  const handleTemplateChange = (templateTitle) => {
    const template = availableTemplates.find(t => t.title === templateTitle)
    updateNodeData(id, 'templateId', templateTitle)
    if (template) {
      updateNodeData(id, 'languageCode', template.language || 'en_US')
      
      const bodyComp = template.components.find(c => c.type === 'BODY')
      let count = 0
      if (bodyComp && bodyComp.text) {
        const matches = bodyComp.text.match(/\{\{\d+\}\}/g)
        if (matches) count = matches.length
      }
      
      const currentParams = []
      for (let i = 0; i < count; i++) {
        currentParams.push({ value: '' })
      }
      updateNodeData(id, 'parameters', currentParams)
    }
  }

  // File Upload Helper
  const handleMediaUpload = async (e, targetField) => {
    const file = e.target.files[0]
    if (!file || !token) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await apiFormRequest('/api/user/return_media_url', { token, formData })
      if (res?.success && res.url) {
        updateNodeData(id, targetField, res.url)
      } else {
        alert('File upload failed: ' + (res?.msg || 'Error'))
      }
    } catch (err) {
      console.error('Media upload error', err)
      alert('Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  // Keyboard shortcut blocking helper
  const handleKeyDown = (e) => {
    e.stopPropagation()
  }

  const handleFocus = (field) => {
    setLastFocusedInput({ nodeId: id, field })
  }

  // Determine execution highlighting status
  let executionStatus = null
  if (simulationResult) {
    const executedPath = simulationResult.execution?.executionPath || []
    if (executedPath.includes(id)) {
      const nodeLog = simulationResult.logs?.find((l) => l.nodeId === id)
      if (nodeLog) {
        executionStatus = nodeLog.status
      } else if (simulationResult.execution.currentNode === id) {
        executionStatus = 'paused'
      } else {
        executionStatus = 'success'
      }
    }
  }

  const getStatusClass = () => {
    if (executionStatus === 'success') return 'executed-success'
    if (executionStatus === 'failed') return 'executed-failed'
    if (executionStatus === 'paused') return 'executed-paused'
    return ''
  }

  const getCategoryClass = () => {
    return category.toLowerCase()
  }

  const conditions = data.conditions || []

  // Default value initializations
  const messageType = data.messageType || 'Simple Text'

  return (
    <div
      className={`custom-node-card ${getCategoryClass()} ${isSelected ? 'selected' : ''} ${getStatusClass()}`}
      style={{ minWidth: '320px', padding: '14px' }}
    >
      {/* Target input handle (Left) */}
      <Handle type="target" position={Position.Left} style={{ background: '#555', width: '8px', height: '8px' }} />

      {/* Execution status indicator badge */}
      {executionStatus && (
        <span className={`node-execution-status-badge ${executionStatus}`}>
          {executionStatus === 'success' && '✓'}
          {executionStatus === 'failed' && '✕'}
          {executionStatus === 'paused' && '⏳'}
        </span>
      )}

      {/* Confirmation Modal Overlay inside Node */}
      {showConfirmDelete && (
        <div 
          className="node-delete-confirm-overlay nodrag"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(17, 24, 39, 0.95)',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            padding: '16px',
            border: '1px solid #ef4444',
            textAlign: 'center'
          }}
        >
          <p style={{ color: '#ffffff', fontSize: '0.85rem', fontWeight: 600, margin: '0 0 12px 0' }}>
            Delete this node & connections?
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="action-btn delete-btn"
              onClick={() => {
                deleteNode(id)
                setShowConfirmDelete(false)
              }}
              style={{ padding: '6px 12px', background: '#ef4444', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              Confirm
            </button>
            <button 
              className="action-btn"
              onClick={() => setShowConfirmDelete(false)}
              style={{ padding: '6px 12px', background: '#374151', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="custom-node-header" style={{ marginBottom: '10px' }}>
        <div className="custom-node-header-left">
          <span className="custom-node-icon">{icon}</span>
          <div className="node-title-wrapper">
            <h4 style={{ margin: 0, fontSize: '0.88rem', color: '#fff' }}>{name}</h4>
          </div>
        </div>
        <div className="custom-node-header-actions nodrag" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Enable/Disable Toggle */}
          <label className="node-toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '28px', height: '16px' }}>
            <input 
              type="checkbox" 
              checked={data.enabled !== false} 
              onChange={(e) => updateNodeData(id, 'enabled', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span 
              className="node-toggle-slider" 
              style={{
                position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: data.enabled !== false ? '#10b981' : '#4b5563',
                borderRadius: '16px', transition: '.2s',
                boxShadow: data.enabled !== false ? '0 0 4px #10b981' : 'none'
              }}
            >
              <span 
                style={{
                  position: 'absolute', content: '""', height: '12px', width: '12px', left: '2px', bottom: '2px',
                  backgroundColor: 'white', borderRadius: '50%', transition: '.2s',
                  transform: data.enabled !== false ? 'translateX(12px)' : 'translateX(0)'
                }}
              />
            </span>
          </label>

          {/* Duplicate Node Button */}
          <button 
            onClick={() => duplicateNode(id)}
            style={{ background: 'transparent', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: '0.9rem', padding: '2px' }}
            title="Duplicate Node"
          >
            📋
          </button>
          {/* Delete Node Button */}
          <button 
            onClick={() => setShowConfirmDelete(true)}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.9rem', padding: '2px' }}
            title="Delete Node"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="node-body-content nodrag">
        {/* ==================== SEND MESSAGE NODE ==================== */}
        {type === 'Send Message' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="af-field">
              <label className="af-field-label" style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Message Type</label>
              <select
                className="af-select"
                value={messageType}
                onChange={(e) => updateNodeData(id, 'messageType', e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px' }}
              >
                <option value="Simple Text">Simple Text</option>
                <option value="Image">Image</option>
                <option value="Audio">Audio</option>
                <option value="Document">Document</option>
                <option value="Location">Location</option>
                <option value="Video">Video</option>
                <option value="Button Message">Button Message</option>
                <option value="List Message">List Message</option>
              </select>
            </div>

            {/* Simple Text Dynamic Panel */}
            {messageType === 'Simple Text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  className="af-input"
                  placeholder="Header text..."
                  value={data.headerText || ''}
                  onChange={(e) => updateNodeData(id, 'headerText', e.target.value)}
                  onFocus={() => handleFocus('headerText')}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <textarea
                  className="af-textarea"
                  rows={3}
                  placeholder="Type your message..."
                  value={data.messageBody || ''}
                  onChange={(e) => updateNodeData(id, 'messageBody', e.target.value)}
                  onFocus={() => handleFocus('messageBody')}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Footer text..."
                  value={data.footerText || ''}
                  onChange={(e) => updateNodeData(id, 'footerText', e.target.value)}
                  onFocus={() => handleFocus('footerText')}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
              </div>
            )}

            {/* Image Dynamic Panel */}
            {messageType === 'Image' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMediaUpload(e, 'imageUrl')}
                  style={{ fontSize: '0.75rem', color: '#9ca3af' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Image URL..."
                  value={data.imageUrl || ''}
                  onChange={(e) => updateNodeData(id, 'imageUrl', e.target.value)}
                  onFocus={() => handleFocus('imageUrl')}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Caption..."
                  value={data.caption || ''}
                  onChange={(e) => updateNodeData(id, 'caption', e.target.value)}
                  onFocus={() => handleFocus('caption')}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
              </div>
            )}

            {/* Audio Dynamic Panel */}
            {messageType === 'Audio' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => handleMediaUpload(e, 'audioUrl')}
                  style={{ fontSize: '0.75rem', color: '#9ca3af' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Audio URL..."
                  value={data.audioUrl || ''}
                  onChange={(e) => updateNodeData(id, 'audioUrl', e.target.value)}
                  onFocus={() => handleFocus('audioUrl')}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
              </div>
            )}

            {/* Document Dynamic Panel */}
            {messageType === 'Document' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
                  onChange={(e) => handleMediaUpload(e, 'documentUrl')}
                  style={{ fontSize: '0.75rem', color: '#9ca3af' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Document URL..."
                  value={data.documentUrl || ''}
                  onChange={(e) => updateNodeData(id, 'documentUrl', e.target.value)}
                  onFocus={() => handleFocus('documentUrl')}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Filename..."
                  value={data.filename || ''}
                  onChange={(e) => updateNodeData(id, 'filename', e.target.value)}
                  onFocus={() => handleFocus('filename')}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
              </div>
            )}

            {/* Video Dynamic Panel */}
            {messageType === 'Video' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleMediaUpload(e, 'videoUrl')}
                  style={{ fontSize: '0.75rem', color: '#9ca3af' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Video URL..."
                  value={data.videoUrl || ''}
                  onChange={(e) => updateNodeData(id, 'videoUrl', e.target.value)}
                  onFocus={() => handleFocus('videoUrl')}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Caption..."
                  value={data.caption || ''}
                  onChange={(e) => updateNodeData(id, 'caption', e.target.value)}
                  onFocus={() => handleFocus('caption')}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
              </div>
            )}

            {/* Location Dynamic Panel */}
            {messageType === 'Location' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <input
                  type="text"
                  className="af-input"
                  placeholder="Latitude"
                  value={data.latitude || ''}
                  onChange={(e) => updateNodeData(id, 'latitude', e.target.value)}
                  onFocus={() => handleFocus('latitude')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Longitude"
                  value={data.longitude || ''}
                  onChange={(e) => updateNodeData(id, 'longitude', e.target.value)}
                  onFocus={() => handleFocus('longitude')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Location Name"
                  value={data.locationName || ''}
                  onChange={(e) => updateNodeData(id, 'locationName', e.target.value)}
                  onFocus={() => handleFocus('locationName')}
                  onKeyDown={handleKeyDown}
                  style={{ gridColumn: 'span 2', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Address"
                  value={data.address || ''}
                  onChange={(e) => updateNodeData(id, 'address', e.target.value)}
                  onFocus={() => handleFocus('address')}
                  onKeyDown={handleKeyDown}
                  style={{ gridColumn: 'span 2', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
              </div>
            )}

            {/* Button Message Dynamic Panel */}
            {messageType === 'Button Message' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  className="af-input"
                  placeholder="Header text..."
                  value={data.headerText || ''}
                  onChange={(e) => updateNodeData(id, 'headerText', e.target.value)}
                  onFocus={() => handleFocus('headerText')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <textarea
                  className="af-textarea"
                  rows={2}
                  placeholder="Body text..."
                  value={data.messageBody || ''}
                  onChange={(e) => updateNodeData(id, 'messageBody', e.target.value)}
                  onFocus={() => handleFocus('messageBody')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Footer text..."
                  value={data.footerText || ''}
                  onChange={(e) => updateNodeData(id, 'footerText', e.target.value)}
                  onFocus={() => handleFocus('footerText')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                
                <div style={{ borderTop: '1px solid #374151', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>Buttons (Max 3)</span>
                    {(data.buttons || []).length < 3 && (
                      <button
                        onClick={() => {
                          const currentBtns = data.buttons || []
                          updateNodeData(id, 'buttons', [...currentBtns, { type: 'Quick Reply', text: 'New Button' }])
                        }}
                        style={{ border: 'none', background: 'transparent', color: '#10b981', cursor: 'pointer', fontSize: '0.72rem' }}
                      >
                        + Add Button
                      </button>
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(data.buttons || []).map((btn, index) => (
                      <div key={index} style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <select
                          value={btn.type || 'Quick Reply'}
                          onChange={(e) => {
                            const next = [...data.buttons]
                            next[index] = { ...btn, type: e.target.value }
                            updateNodeData(id, 'buttons', next)
                          }}
                          onKeyDown={handleKeyDown}
                          style={{ padding: '4px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '6px', fontSize: '0.75rem' }}
                        >
                          <option value="Quick Reply">Reply</option>
                          <option value="URL">URL</option>
                          <option value="Call">Call</option>
                        </select>
                        <input
                          type="text"
                          value={btn.text || ''}
                          onChange={(e) => {
                            const next = [...data.buttons]
                            next[index] = { ...btn, text: e.target.value }
                            updateNodeData(id, 'buttons', next)
                          }}
                          onKeyDown={handleKeyDown}
                          placeholder="Label"
                          style={{ flex: 1, padding: '4px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '6px', fontSize: '0.75rem' }}
                        />
                        <button
                          onClick={() => {
                            const next = (data.buttons || []).filter((_, i) => i !== index)
                            updateNodeData(id, 'buttons', next)
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* List Message Dynamic Panel */}
            {messageType === 'List Message' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <input
                  type="text"
                  className="af-input"
                  placeholder="Header text..."
                  value={data.headerText || ''}
                  onChange={(e) => updateNodeData(id, 'headerText', e.target.value)}
                  onFocus={() => handleFocus('headerText')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <textarea
                  className="af-textarea"
                  rows={2}
                  placeholder="Body text..."
                  value={data.messageBody || ''}
                  onChange={(e) => updateNodeData(id, 'messageBody', e.target.value)}
                  onFocus={() => handleFocus('messageBody')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="Footer text..."
                  value={data.footerText || ''}
                  onChange={(e) => updateNodeData(id, 'footerText', e.target.value)}
                  onFocus={() => handleFocus('footerText')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />
                <input
                  type="text"
                  className="af-input"
                  placeholder="List Button Title (e.g. View Catalog)"
                  value={data.listButtonTitle || ''}
                  onChange={(e) => updateNodeData(id, 'listButtonTitle', e.target.value)}
                  onFocus={() => handleFocus('listButtonTitle')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                />

                {/* Sections & Rows List */}
                <div style={{ borderTop: '1px solid #374151', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>Sections</span>
                    <button
                      onClick={() => {
                        const currentSecs = data.sections || []
                        updateNodeData(id, 'sections', [...currentSecs, { title: 'New Section', rows: [] }])
                      }}
                      style={{ border: 'none', background: 'transparent', color: '#10b981', cursor: 'pointer', fontSize: '0.72rem' }}
                    >
                      + Add Section
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {(data.sections || []).map((sec, sIdx) => (
                      <div key={sIdx} style={{ background: '#111827', padding: '8px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '6px' }}>
                          <input
                            type="text"
                            value={sec.title || ''}
                            onChange={(e) => {
                              const next = [...data.sections]
                              next[sIdx] = { ...sec, title: e.target.value }
                              updateNodeData(id, 'sections', next)
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Section Title"
                            style={{ flex: 1, padding: '4px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}
                          />
                          <button
                            onClick={() => {
                              const next = [...data.sections]
                              next[sIdx].rows = [...(sec.rows || []), { id: `row_${Date.now()}`, title: 'New Option', description: '' }]
                              updateNodeData(id, 'sections', next)
                            }}
                            style={{ border: 'none', background: 'transparent', color: '#10b981', cursor: 'pointer', fontSize: '0.7rem' }}
                            title="Add Option Row"
                          >
                            + Row
                          </button>
                          <button
                            onClick={() => {
                              const next = data.sections.filter((_, i) => i !== sIdx)
                              updateNodeData(id, 'sections', next)
                            }}
                            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem' }}
                          >
                            ✕
                          </button>
                        </div>

                        {/* Option Rows */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingLeft: '8px' }}>
                          {(sec.rows || []).map((row, rIdx) => (
                            <div key={rIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '2px solid #374151', paddingLeft: '6px' }}>
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                <input
                                  type="text"
                                  placeholder="Option Title"
                                  value={row.title || ''}
                                  onChange={(e) => {
                                    const next = [...data.sections]
                                    next[sIdx].rows[rIdx] = { ...row, title: e.target.value }
                                    updateNodeData(id, 'sections', next)
                                  }}
                                  onKeyDown={handleKeyDown}
                                  style={{ flex: 1, padding: '3px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '4px', fontSize: '0.72rem' }}
                                />
                                <button
                                  onClick={() => {
                                    const next = [...data.sections]
                                    next[sIdx].rows = sec.rows.filter((_, i) => i !== rIdx)
                                    updateNodeData(id, 'sections', next)
                                  }}
                                  style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.7rem' }}
                                >
                                  ✕
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder="Description (Optional)"
                                value={row.description || ''}
                                onChange={(e) => {
                                  const next = [...data.sections]
                                  next[sIdx].rows[rIdx] = { ...row, description: e.target.value }
                                  updateNodeData(id, 'sections', next)
                                }}
                                onKeyDown={handleKeyDown}
                                style={{ padding: '3px', background: '#1f2937', color: '#9ca3af', border: '1px solid #374151', borderRadius: '4px', fontSize: '0.68rem' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== SEND WA TEMPLATE ==================== */}
        {type === 'Send WA Template' && (() => {
          const selectedTemplate = availableTemplates.find(t => t.title === data.templateId)
          let placeholdersCount = 0
          let templateBodyPreview = ''
          if (selectedTemplate) {
            const bodyComp = selectedTemplate.components.find(c => c.type === 'BODY')
            if (bodyComp && bodyComp.text) {
              templateBodyPreview = bodyComp.text
              const matches = bodyComp.text.match(/\{\{\d+\}\}/g)
              if (matches) {
                placeholdersCount = matches.length
              }
            }
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Warning banner */}
              <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#f59e0b', padding: '8px', borderRadius: '8px', fontSize: '0.7rem', display: 'flex', gap: '6px' }}>
                <span>⚠️</span>
                <span>This node works for Official META WhatsApp</span>
              </div>

              {/* Template select dropdown */}
              <div className="af-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="af-field-label" style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600 }}>Select Template</label>
                  <button 
                    onClick={fetchTemplates}
                    style={{ border: 'none', background: 'transparent', color: '#10b981', cursor: 'pointer', fontSize: '0.7rem' }}
                  >
                    🔄 Refresh
                  </button>
                </div>

                <select
                  className="af-select"
                  value={data.templateId || ''}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
                >
                  <option value="">Choose a template...</option>
                  {availableTemplates.map(t => (
                    <option key={t.id} value={t.title}>
                      {t.title} ({t.category} - {t.language})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTemplate && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#111827', padding: '8px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                  <div style={{ fontSize: '0.7rem', color: '#9ca3af', borderBottom: '1px solid #1f2937', paddingBottom: '4px' }}>
                    <strong>Preview:</strong>
                    <div style={{ color: '#e9edef', fontStyle: 'italic', marginTop: '2px' }}>
                      {templateBodyPreview}
                    </div>
                  </div>

                  {placeholdersCount > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>Parameters Mapping</span>
                      {Array.from({ length: placeholdersCount }).map((_, pIdx) => {
                        const paramVal = (data.parameters && data.parameters[pIdx]) ? (data.parameters[pIdx].value || '') : ''
                        return (
                          <div key={pIdx} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Variable {"{{"}{pIdx + 1}{"}}"}</label>
                            <input
                              type="text"
                              placeholder={`Value for {{${pIdx + 1}}}...`}
                              value={paramVal}
                              onChange={(e) => {
                                const nextParams = [...(data.parameters || [])]
                                while (nextParams.length <= pIdx) {
                                  nextParams.push({ value: '' })
                                }
                                nextParams[pIdx] = { value: e.target.value }
                                updateNodeData(id, 'parameters', nextParams)
                              }}
                              onFocus={() => handleFocus(`parameters[${pIdx}].value`)}
                              onKeyDown={handleKeyDown}
                              style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })()}

        {/* ==================== SEND WA FORM NODE ==================== */}
        {type === 'Send WA Form' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Warning callout */}
            <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.25)', color: '#f59e0b', padding: '8px', borderRadius: '8px', fontSize: '0.7rem', display: 'flex', gap: '6px' }}>
              <span>⚠️</span>
              <span>This node works only with Official META WhatsApp</span>
            </div>

            {/* Form Selection */}
            <div className="af-field">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label className="af-field-label" style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600 }}>Select Form</label>
                <button 
                  onClick={fetchPublishedForms}
                  style={{ border: 'none', background: 'transparent', color: '#10b981', cursor: 'pointer', fontSize: '0.7rem' }}
                >
                  🔄 Refresh
                </button>
              </div>

              <select
                className="af-select"
                value={data.formId || ''}
                onChange={(e) => {
                  const selectedForm = publishedForms.find(f => f.form_id === e.target.value)
                  updateNodeData(id, 'formId', e.target.value)
                  if (selectedForm) {
                    updateNodeData(id, 'formTitle', selectedForm.name)
                  }
                }}
                onKeyDown={handleKeyDown}
                style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
              >
                <option value="">Choose a form...</option>
                {publishedForms.map(f => (
                  <option key={f.form_id} value={f.form_id}>
                    {f.name} ({f.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Published Form List Display */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto', background: '#111827', padding: '6px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              {publishedForms.map(f => (
                <div 
                  key={f.form_id} 
                  onClick={() => {
                    updateNodeData(id, 'formId', f.form_id)
                    updateNodeData(id, 'formTitle', f.name)
                  }}
                  style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 6px', borderRadius: '4px', cursor: 'pointer', background: data.formId === f.form_id ? 'rgba(16, 185, 129, 0.15)' : 'transparent', fontSize: '0.72rem' }}
                >
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{f.name}</span>
                  <span style={{ color: '#10b981', fontSize: '0.62rem', background: 'rgba(16,185,129,0.1)', padding: '1px 4px', borderRadius: '4px' }}>{f.status}</span>
                </div>
              ))}
            </div>

            {/* Message Config */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #374151', paddingTop: '8px' }}>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>Message Config</span>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Header</label>
                <input
                  type="text"
                  placeholder="Fill our form"
                  value={data.formTitle || ''}
                  onChange={(e) => updateNodeData(id, 'formTitle', e.target.value)}
                  onFocus={() => handleFocus('formTitle')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Body</label>
                <textarea
                  placeholder="Please fill out the form below."
                  value={data.formBody || ''}
                  onChange={(e) => updateNodeData(id, 'formBody', e.target.value)}
                  onFocus={() => handleFocus('formBody')}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Footer</label>
                <input
                  type="text"
                  placeholder="Powered by CRM"
                  value={data.formFooter || ''}
                  onChange={(e) => updateNodeData(id, 'formFooter', e.target.value)}
                  onFocus={() => handleFocus('formFooter')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>CTA Button Label</label>
                <input
                  type="text"
                  placeholder="Open Form"
                  value={data.formCta || ''}
                  onChange={(e) => updateNodeData(id, 'formCta', e.target.value)}
                  onFocus={() => handleFocus('formCta')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Save Form Response Into Variable</label>
                <input
                  type="text"
                  placeholder="form_response"
                  value={data.saveResponseVariable || 'form_response'}
                  onChange={(e) => updateNodeData(id, 'saveResponseVariable', e.target.value)}
                  onFocus={() => handleFocus('saveResponseVariable')}
                  onKeyDown={handleKeyDown}
                  style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                />
              </div>
            </div>

            {/* Real-time Live Preview Bubble */}
            <div style={{ borderTop: '1px solid #374151', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: 600 }}>Message Live Preview</span>
              <div style={{ background: '#0b141a', border: '1px solid #202c33', borderRadius: '12px', padding: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ color: '#00a884', fontSize: '0.75rem', fontWeight: 'bold' }}>
                  {data.formTitle || 'Fill our form'}
                </div>
                <div style={{ color: '#e9edef', fontSize: '0.78rem', whiteSpace: 'pre-wrap' }}>
                  {data.formBody || 'Please fill out the form below.'}
                </div>
                <div style={{ color: '#8696a0', fontSize: '0.68rem' }}>
                  {data.formFooter || 'Powered by CRM'}
                </div>
                <button style={{ pointerEvents: 'none', background: '#202c33', color: '#00a884', border: '1px solid #2f3b43', borderRadius: '20px', padding: '6px', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px', textAlign: 'center', width: '100%' }}>
                  📲 {data.formCta || 'Open Form'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== RESPONSE SAVER ==================== */}
        {type === 'Response Saver' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#3b82f6', padding: '8px', borderRadius: '8px', fontSize: '0.7rem' }}>
              ℹ️ Map response fields to variables for use in later nodes.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>Variable Mappings ({(data.mappings || []).length})</span>
                <button
                  onClick={() => {
                    const current = data.mappings || []
                    updateNodeData(id, 'mappings', [...current, { targetVariable: '', sourcePath: '' }])
                  }}
                  style={{ border: 'none', background: 'transparent', color: '#10b981', cursor: 'pointer', fontSize: '0.72rem' }}
                >
                  + Add Mapping
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {(data.mappings || []).map((mapping, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.68rem', color: '#9ca3af', width: '12px' }}>{idx + 1}</span>
                    <input
                      type="text"
                      placeholder="target_var"
                      value={mapping.targetVariable || ''}
                      onChange={(e) => {
                        const next = [...data.mappings]
                        next[idx] = { ...mapping, targetVariable: e.target.value }
                        updateNodeData(id, 'mappings', next)
                      }}
                      onFocus={() => handleFocus(`mappings[${idx}].targetVariable`)}
                      onKeyDown={handleKeyDown}
                      style={{ flex: 1, padding: '4px 6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '6px', fontSize: '0.75rem' }}
                    />
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>→</span>
                    <input
                      type="text"
                      placeholder="apiResponses.node_xxx.data.key"
                      value={mapping.sourcePath || ''}
                      onChange={(e) => {
                        const next = [...data.mappings]
                        next[idx] = { ...mapping, sourcePath: e.target.value }
                        updateNodeData(id, 'mappings', next)
                      }}
                      onFocus={() => handleFocus(`mappings[${idx}].sourcePath`)}
                      onKeyDown={handleKeyDown}
                      style={{ flex: 1, padding: '4px 6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '6px', fontSize: '0.75rem' }}
                    />
                    <button
                      onClick={() => {
                        const next = data.mappings.filter((_, i) => i !== idx)
                        updateNodeData(id, 'mappings', next)
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="af-field" style={{ borderTop: '1px solid #374151', paddingTop: '8px' }}>
              <label className="af-field-label" style={{ color: '#9ca3af', fontSize: '0.7rem' }}>Save Incoming Message</label>
              <input
                className="af-input"
                value={data.variableName || ''}
                onChange={(e) => updateNodeData(id, 'variableName', e.target.value)}
                onFocus={() => handleFocus('variableName')}
                onKeyDown={handleKeyDown}
                placeholder="e.g. user_query"
                style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
              />
            </div>

            <div 
              onClick={() => setShowResponseExample(!showResponseExample)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', padding: '6px 10px', borderRadius: '8px', border: '1px solid #1f2937', cursor: 'pointer', userSelect: 'none' }}
            >
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Response Structure Example</span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{showResponseExample ? '▲' : '▼'}</span>
            </div>

            {showResponseExample && (
              <pre style={{ margin: 0, padding: '6px', background: '#0b141a', color: '#10b981', fontSize: '0.65rem', borderRadius: '6px', overflowX: 'auto', fontFamily: 'monospace' }}>
{`{
  "senderMessage": "hello",
  "apiResponses": {
    "node-123": {
      "status": 200,
      "data": { "userId": 42 }
    }
  },
  "formResponses": {
    "email": "test@domain.com"
  }
}`}
              </pre>
            )}
          </div>
        )}

        {/* ==================== CONDITION ==================== */}
        {type === 'Condition' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Custom Input config */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', borderBottom: '1px solid #374151', paddingBottom: '10px', marginBottom: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: '#9ca3af' }}>Custom Input Source</span>
                <input
                  type="checkbox"
                  checked={data.customInput === true}
                  onChange={(e) => updateNodeData(id, 'customInput', e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
              </div>
              {data.customInput && (
                <input
                  type="text"
                  className="af-input"
                  placeholder="{{senderMessage}}"
                  value={data.customInputSource || ''}
                  onChange={(e) => updateNodeData(id, 'customInputSource', e.target.value)}
                  onFocus={() => handleFocus('customInputSource')}
                  onKeyDown={handleKeyDown}
                  style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                />
              )}
            </div>

            {/* Conditions list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {conditions.map((cond, index) => (
                <div 
                  key={index} 
                  style={{ 
                    background: '#111827', 
                    border: '1px solid #1f2937', 
                    borderRadius: '8px', 
                    padding: '8px',
                    position: 'relative'
                  }}
                  className="nodrag"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 'bold' }}>Condition {index + 1}</span>
                    <button
                      onClick={() => {
                        const next = conditions.filter((_, i) => i !== index)
                        updateNodeData(id, 'conditions', next)
                      }}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem' }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <select
                      value={cond.operator || 'Exact Match'}
                      onChange={(e) => {
                        const next = [...conditions]
                        next[index] = { ...cond, operator: e.target.value }
                        updateNodeData(id, 'conditions', next)
                      }}
                      onKeyDown={handleKeyDown}
                      style={{ width: '100%', padding: '4px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '6px', fontSize: '0.75rem' }}
                    >
                      <option value="Exact Match">Exact Match</option>
                      <option value="Contains">Contains</option>
                      <option value="Starts With">Starts With</option>
                      <option value="Ends With">Ends With</option>
                      <option value="Number Equals">Number Equals</option>
                      <option value="Greater Than">Greater Than</option>
                      <option value="Less Than">Less Than</option>
                      <option value="Between">Between</option>
                      <option value="Regex Match">Regex Match</option>
                      <option value="Is Empty">Is Empty</option>
                      <option value="Is Not Empty">Is Not Empty</option>
                    </select>

                    {cond.operator !== 'Is Empty' && cond.operator !== 'Is Not Empty' && (
                      <textarea
                        className="af-textarea"
                        rows={2}
                        placeholder={cond.operator === 'Between' ? 'e.g. 10, 20' : 'Value to compare...'}
                        value={cond.valueToCompare || ''}
                        onChange={(e) => {
                          const next = [...conditions]
                          next[index] = { ...cond, valueToCompare: e.target.value }
                          updateNodeData(id, 'conditions', next)
                        }}
                        onFocus={() => handleFocus(`conditions[${index}].valueToCompare`)}
                        onKeyDown={handleKeyDown}
                        style={{ width: '100%', padding: '4px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '6px', fontSize: '0.72rem' }}
                      />
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>Case Sensitive</span>
                      <input
                        type="checkbox"
                        checked={cond.caseSensitive === true}
                        onChange={(e) => {
                          const next = [...conditions]
                          next[index] = { ...cond, caseSensitive: e.target.checked }
                          updateNodeData(id, 'conditions', next)
                        }}
                        style={{ cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`branch_${index}`}
                    style={{ right: '-18px', top: '50%', transform: 'translateY(-50%)', background: '#3b82f6', width: '8px', height: '8px' }}
                  />
                </div>
              ))}

              <button
                onClick={() => {
                  updateNodeData(id, 'conditions', [
                    ...conditions,
                    { operator: 'Exact Match', valueToCompare: '', caseSensitive: false, variableName: '{{senderMessage}}' }
                  ])
                }}
                style={{ padding: '6px', background: '#1e293b', border: '1px dashed #3b82f6', color: '#3b82f6', borderRadius: '8px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
              >
                + Add Condition
              </button>

              <div 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center', 
                  background: '#111827', 
                  border: '1px solid #1f2937', 
                  borderRadius: '8px', 
                  padding: '8px',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 'bold' }}>Else Path (Default)</span>
                <Handle
                  type="source"
                  position={Position.Right}
                  id="default_path"
                  style={{ right: '-18px', top: '50%', transform: 'translateY(-50%)', background: '#64748b', width: '8px', height: '8px' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ==================== SET CHAT LABELS ==================== */}
        {type === 'Set Chat Labels' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', color: '#10b981', padding: '8px', borderRadius: '8px', fontSize: '0.7rem' }}>
              🏷️ Add or remove labels from this chat during flow execution.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#9ca3af' }}>
              <span>Legend: 🟢 Will Add · 🔴 Will Remove</span>
            </div>
            <div style={{ fontSize: '0.62rem', color: '#6b7280', fontStyle: 'italic', marginBottom: '2px' }}>
              LEFT-CLICK = ADD · RIGHT-CLICK = REMOVE
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', background: '#111827', padding: '8px', borderRadius: '8px', border: '1px solid #1f2937' }}>
              {availableLabels.map((lbl) => {
                const willAdd = (data.labels || []).includes(lbl.title)
                const willRemove = (data.removeLabels || []).includes(lbl.title)
                
                let borderStyle = '1px solid #374151'
                let badgeColor = '#9ca3af'
                let bg = 'rgba(31, 41, 55, 0.5)'
                let sign = ''

                if (willAdd) {
                  borderStyle = '1px solid #10b981'
                  badgeColor = '#10b981'
                  bg = 'rgba(16, 185, 129, 0.15)'
                  sign = '🟢 +'
                } else if (willRemove) {
                  borderStyle = '1px solid #ef4444'
                  badgeColor = '#ef4444'
                  bg = 'rgba(239, 68, 68, 0.15)'
                  sign = '🔴 -'
                }

                return (
                  <span
                    key={lbl.id}
                    onClick={() => handleLabelLeftClick(lbl.title)}
                    onContextMenu={(e) => handleLabelRightClick(e, lbl.title)}
                    style={{
                      border: borderStyle,
                      background: bg,
                      color: '#ffffff',
                      fontSize: '0.72rem',
                      padding: '3px 8px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      userSelect: 'none'
                    }}
                    title="Left-click to Add, Right-click to Remove"
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: lbl.hex || '#64748b', display: 'inline-block' }} />
                    {lbl.title} {sign && <span style={{ fontSize: '0.65rem', fontWeight: 'bold', color: badgeColor }}>{sign}</span>}
                  </span>
                )
              })}

              {!showAddTagInput ? (
                <button
                  onClick={() => setShowAddTagInput(true)}
                  style={{
                    border: '1px dashed #64748b',
                    background: 'transparent',
                    color: '#64748b',
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    borderRadius: '16px',
                    cursor: 'pointer'
                  }}
                >
                  + new tag
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddNewTag()
                      else handleKeyDown(e)
                    }}
                    placeholder="tag name..."
                    style={{
                      padding: '2px 6px',
                      fontSize: '0.7rem',
                      background: '#1f2937',
                      color: '#fff',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      width: '80px'
                    }}
                  />
                  <button onClick={handleAddNewTag} style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#10b981', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
                  <button onClick={() => setShowAddTagInput(false)} style={{ padding: '2px 6px', fontSize: '0.7rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.7rem', color: '#9ca3af' }}>
              <div><strong>Will Add:</strong> {(data.labels || []).length > 0 ? (data.labels || []).join(', ') : 'None'}</div>
              <div><strong>Will Remove:</strong> {(data.removeLabels || []).length > 0 ? (data.removeLabels || []).join(', ') : 'None'}</div>
            </div>
          </div>
        )}

        {/* ==================== SEND EMAIL NODE ==================== */}
        {type === 'Send Email' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.25)', color: '#3b82f6', padding: '8px', borderRadius: '8px', fontSize: '0.7rem' }}>
              📧 Configure SMTP settings and compose the email to send.
            </div>

            <div 
              onClick={() => setShowSmtpSettings(!showSmtpSettings)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', padding: '6px 10px', borderRadius: '8px', border: '1px solid #1f2937', cursor: 'pointer', userSelect: 'none' }}
            >
              <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>🛠️ Server Configuration</span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{showSmtpSettings ? '▲' : '▼'}</span>
            </div>

            {showSmtpSettings && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#111827', padding: '10px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '6px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>SMTP Host</label>
                    <input
                      type="text"
                      placeholder="smtp.example.com"
                      value={data.smtpHost || ''}
                      onChange={(e) => updateNodeData(id, 'smtpHost', e.target.value)}
                      onFocus={() => handleFocus('smtpHost')}
                      onKeyDown={handleKeyDown}
                      style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Port</label>
                    <input
                      type="text"
                      placeholder="587"
                      value={data.smtpPort || ''}
                      onChange={(e) => updateNodeData(id, 'smtpPort', e.target.value)}
                      onFocus={() => handleFocus('smtpPort')}
                      onKeyDown={handleKeyDown}
                      style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Security</label>
                    <select
                      value={data.smtpSecurity || 'TLS'}
                      onChange={(e) => updateNodeData(id, 'smtpSecurity', e.target.value)}
                      onKeyDown={handleKeyDown}
                      style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                    >
                      <option value="TLS">TLS</option>
                      <option value="SSL">SSL</option>
                      <option value="None">None</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                    <label style={{ fontSize: '0.68rem', color: '#9ca3af' }}>SMTP Auth</label>
                    <input
                      type="checkbox"
                      checked={data.smtpAuthEnabled !== false}
                      onChange={(e) => updateNodeData(id, 'smtpAuthEnabled', e.target.checked)}
                      style={{ cursor: 'pointer' }}
                    />
                  </div>
                </div>

                {data.smtpAuthEnabled !== false && (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Username</label>
                        <input
                          type="text"
                          placeholder="Username"
                          value={data.smtpUser || ''}
                          onChange={(e) => updateNodeData(id, 'smtpUser', e.target.value)}
                          onFocus={() => handleFocus('smtpUser')}
                          onKeyDown={handleKeyDown}
                          style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>SMTP Email</label>
                        <input
                          type="text"
                          placeholder="email@example.com"
                          value={data.smtpEmail || ''}
                          onChange={(e) => updateNodeData(id, 'smtpEmail', e.target.value)}
                          onFocus={() => handleFocus('smtpEmail')}
                          onKeyDown={handleKeyDown}
                          style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Password</label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        value={data.smtpPassword || ''}
                        onChange={(e) => updateNodeData(id, 'smtpPassword', e.target.value)}
                        onFocus={() => handleFocus('smtpPassword')}
                        onKeyDown={handleKeyDown}
                        style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <div 
              onClick={() => setShowEmailContent(!showEmailContent)}
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827', padding: '6px 10px', borderRadius: '8px', border: '1px solid #1f2937', cursor: 'pointer', userSelect: 'none' }}
            >
              <span style={{ fontSize: '0.78rem', color: '#fff', fontWeight: 600 }}>📝 Email Content</span>
              <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{showEmailContent ? '▲' : '▼'}</span>
            </div>

            {showEmailContent && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: '#111827', padding: '10px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>From Address</label>
                    <input
                      type="text"
                      placeholder="no-reply@domain.com"
                      value={data.emailFrom || ''}
                      onChange={(e) => updateNodeData(id, 'emailFrom', e.target.value)}
                      onFocus={() => handleFocus('emailFrom')}
                      onKeyDown={handleKeyDown}
                      style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>To Address</label>
                    <input
                      type="text"
                      placeholder="recipient@domain.com"
                      value={data.emailTo || ''}
                      onChange={(e) => updateNodeData(id, 'emailTo', e.target.value)}
                      onFocus={() => handleFocus('emailTo')}
                      onKeyDown={handleKeyDown}
                      style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>Subject</label>
                  <input
                    type="text"
                    placeholder="Enter subject..."
                    value={data.emailSubject || ''}
                    onChange={(e) => updateNodeData(id, 'emailSubject', e.target.value)}
                    onFocus={() => handleFocus('emailSubject')}
                    onKeyDown={handleKeyDown}
                    style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <label style={{ fontSize: '0.65rem', color: '#9ca3af' }}>HTML Body</label>
                  <textarea
                    rows={4}
                    placeholder="<h1>Hello</h1><p>This is email content...</p>"
                    value={data.emailHtmlContent || ''}
                    onChange={(e) => updateNodeData(id, 'emailHtmlContent', e.target.value)}
                    onFocus={() => handleFocus('emailHtmlContent')}
                    onKeyDown={handleKeyDown}
                    style={{ padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
                  />
                </div>
              </div>
            )}

            {(!data.emailTo || !data.emailSubject || !data.emailHtmlContent) && (
              <span style={{ fontSize: '0.65rem', color: '#f59e0b' }}>
                ⚠️ Missing required fields (To, Subject, HTML Body)
              </span>
            )}
          </div>
        )}

        {/* ==================== MAKE REQUEST ==================== */}
        {type === 'Make Request' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="af-field" style={{ display: 'flex', gap: '4px' }}>
              <select
                value={data.method || 'GET'}
                onChange={(e) => updateNodeData(id, 'method', e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ width: '80px', padding: '4px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
              <input
                type="text"
                className="af-input"
                placeholder="http://api.endpoint"
                value={data.url || ''}
                onChange={(e) => updateNodeData(id, 'url', e.target.value)}
                onFocus={() => handleFocus('url')}
                onKeyDown={handleKeyDown}
                style={{ flex: 1, padding: '4px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
              />
            </div>
          </div>
        )}

        {/* ==================== DELAY ==================== */}
        {type === 'Delay' && (
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="number"
              value={data.delayAmount || '5'}
              onChange={(e) => updateNodeData(id, 'delayAmount', e.target.value)}
              onFocus={() => handleFocus('delayAmount')}
              onKeyDown={handleKeyDown}
              style={{ width: '60px', padding: '4px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
            />
            <select
              value={data.delayUnit || 'seconds'}
              onChange={(e) => updateNodeData(id, 'delayUnit', e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1, padding: '4px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.75rem' }}
            >
              <option value="seconds">Seconds</option>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </div>
        )}

        {/* Fallback descriptions for non-overhauled logic steps */}
        {!['Send Message', 'Send WA Template', 'Send WA Form', 'Response Saver', 'Condition', 'Make Request', 'Delay', 'Set Chat Labels', 'Send Email'].includes(type) && (
          <p className="custom-node-desc" style={{ margin: 0, fontSize: '0.78rem', color: '#9ca3af' }}>{desc || 'No config required'}</p>
        )}
      </div>

      {/* Default source handle (Right) (Only if NOT condition and NOT end flow) */}
      {type !== 'Condition' && type !== 'End Flow' && (
        <Handle type="source" position={Position.Right} id="next" style={{ background: '#555', width: '8px', height: '8px' }} />
      )}
    </div>
  )
}

// Custom Node for the Initial Trigger block
export function InitialNode({ id, data }) {
  const { selectedNodeId, simulationResult, updateNodeData, lastFocusedInput, nodes } = useChatbotAutomationStore()
  const isSelected = selectedNodeId === id

  const currentSource = data.source || 'Chatbot'

  // Variables catalog based on source trigger selection
  const variableCatalogs = {
    'Chatbot': ['{{senderName}}', '{{senderMobile}}', '{{senderMessage}}'],
    'Instagram DM': ['{{instagramUser}}', '{{instagramMessage}}', '{{instagramUserId}}'],
    'Instagram Comment': ['{{commentText}}', '{{postId}}', '{{commentAuthor}}'],
    'Webhook Automation': ['{{senderName}}', '{{senderMobile}}', '{{webhookPayload}}']
  }

  const explanatoryText = {
    'Chatbot': 'Triggered automatically by chatbot messages.',
    'Instagram DM': 'Triggered automatically by Instagram DMs.',
    'Instagram Comment': 'Triggered automatically by Instagram Comments.',
    'Webhook Automation': 'Triggered automatically by incoming webhook events.'
  }

  const variables = variableCatalogs[currentSource] || variableCatalogs['Chatbot']
  const triggerDesc = explanatoryText[currentSource] || explanatoryText['Chatbot']

  // Handle click on variable tags to append variable into active focused input element
  const handleVariableClick = (variable) => {
    if (!lastFocusedInput) return
    const { nodeId, field } = lastFocusedInput
    const targetNode = nodes.find(n => n.id === nodeId)
    if (!targetNode) return

    const getNestedVal = (obj, path) => {
      if (!obj || !path) return ""
      const parts = path.replace(/\[(\d+)\]/g, ".$1").split(".")
      let current = obj
      for (const part of parts) {
        if (current === null || current === undefined) return ""
        current = current[part]
      }
      return current !== undefined ? current : ""
    }

    const currentVal = field.includes(".") || field.includes("[")
      ? getNestedVal(targetNode.data, field)
      : (targetNode.data[field] || "")
    updateNodeData(nodeId, field, currentVal + variable)
  }

  let executionStatus = null
  if (simulationResult) {
    const executedPath = simulationResult.execution?.executionPath || []
    if (executedPath.includes(id)) {
      executionStatus = 'success'
    }
  }

  return (
    <div className={`initial-node-card ${isSelected ? 'selected' : ''} ${executionStatus ? 'executed-success' : ''}`} style={{ minWidth: '320px' }}>
      <div className="node-badge">TRIGGER</div>
      
      {/* Execution status indicator badge */}
      {executionStatus && (
        <span className="node-execution-status-badge success">✓</span>
      )}

      <div className="node-header" style={{ marginBottom: '10px' }}>
        <span className="node-icon">⚡</span>
        <div className="node-header-info">
          <h4 style={{ margin: 0, fontSize: '0.92rem', color: '#fff' }}>Initial Node</h4>
          <span className="node-subtype" style={{ fontSize: '0.7rem', color: '#9ca3af' }}>Source: {currentSource}</span>
        </div>
      </div>
      
      <div className="node-body">
        {/* Source Dropdown */}
        <div className="af-field nodrag" style={{ marginBottom: '8px' }}>
          <label className="af-field-label" style={{ color: '#9ca3af', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Trigger Source</label>
          <select
            className="af-select"
            value={currentSource}
            onChange={(e) => updateNodeData(id, 'source', e.target.value)}
            style={{ width: '100%', padding: '6px', background: '#1f2937', color: '#fff', border: '1px solid #374151', borderRadius: '8px', fontSize: '0.8rem' }}
          >
            <option value="Chatbot">Chatbot</option>
            <option value="Instagram DM">Instagram DM</option>
            <option value="Instagram Comment">Instagram Comment</option>
            <option value="Webhook Automation">Webhook Automation</option>
          </select>
        </div>

        {/* Trigger Description */}
        <p className="node-instruction" style={{ fontSize: '0.78rem', color: '#d1d5db', marginBottom: '10px' }}>
          {triggerDesc}
        </p>

        {/* Variable tag chips */}
        <div className="node-variables-section" style={{ borderTop: '1px solid #374151', paddingTop: '8px' }}>
          <span className="section-label" style={{ fontSize: '0.7rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '6px' }}>Available Variables</span>
          <div className="variables-grid nodrag" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {variables.map((variable) => (
              <span 
                key={variable} 
                className="variable-tag" 
                onClick={() => handleVariableClick(variable)}
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  color: '#10b981',
                  fontFamily: 'monospace',
                  fontSize: '0.72rem',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  userSelect: 'none'
                }}
                title="Click to insert variable into active field"
                onMouseEnter={(e) => e.target.style.background = 'rgba(16, 185, 129, 0.3)'}
                onMouseLeave={(e) => e.target.style.background = 'rgba(16, 185, 129, 0.15)'}
              >
                {variable}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      {/* Target source handle (Right) */}
      <Handle type="source" position={Position.Right} id="next" style={{ background: '#10b981', width: '10px', height: '10px' }} />
    </div>
  )
}
