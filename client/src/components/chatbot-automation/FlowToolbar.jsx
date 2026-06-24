import React, { useRef } from 'react'
import { useChatbotAutomationStore } from '../../store/chatbotAutomationStore'
import { useAuth } from '../../shared/auth'

function FlowToolbar() {
  const { tokens } = useAuth()
  const token = tokens?.user
  const fileInputRef = useRef(null)

  const {
    selectedFlow,
    createNewFlow,
    saveCurrentFlow,
    togglePublishFlow,
    searchQuery,
    setSearchQuery,
    language,
    setLanguage,
    isTesterOpen,
    setIsTesterOpen,
    isInspectorOpen,
    setIsInspectorOpen,
    setNodes,
    setEdges
  } = useChatbotAutomationStore()

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result)
        if (parsed && Array.isArray(parsed.nodes)) {
          setNodes(parsed.nodes)
          setEdges(parsed.edges || [])
          alert('Flow imported successfully!')
        } else {
          alert('Invalid flow file structure. Must contain a nodes array.')
        }
      } catch (err) {
        console.error('Import parse error', err)
        alert('Failed to parse flow JSON')
      }
    }
    reader.readAsText(file)
    e.target.value = '' // Reset file input
  }

  const handleExport = () => {
    if (!selectedFlow) {
      alert('Please select or create a flow to export.')
      return
    }
    // Simple download/export trigger
    const flowData = {
      name: selectedFlow.name,
      nodes: useChatbotAutomationStore.getState().nodes,
      edges: useChatbotAutomationStore.getState().edges
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(flowData, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute('download', `${selectedFlow.name.toLowerCase().replace(/\s+/g, '_')}_flow.json`)
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  const handleSave = async () => {
    if (!token) return
    const res = await saveCurrentFlow(token)
    if (res?.success) {
      alert('Flow saved successfully!')
    } else {
      alert('Failed to save flow: ' + (res?.msg || 'Error'))
    }
  }

  const handleTogglePublish = async () => {
    if (!token) return
    await togglePublishFlow(token)
  }

  return (
    <div className="flow-toolbar">
      <div className="toolbar-left">
        <button className="primary-button new-flow-btn" onClick={() => createNewFlow(token)}>
          ➕ New Flow
        </button>
        <button
          className="secondary-button dark-text"
          onClick={handleSave}
          disabled={!selectedFlow}
        >
          💾 Save
        </button>
        <button
          className="secondary-button dark-text"
          onClick={handleTogglePublish}
          disabled={!selectedFlow}
        >
          {selectedFlow?.isPublished ? '⏸️ Unpublish' : '🚀 Publish'}
        </button>
        <button className="secondary-button dark-text" onClick={handleImportClick}>
          📥 Import
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json" 
          style={{ display: 'none' }} 
        />
        <button
          className="secondary-button dark-text"
          onClick={handleExport}
          disabled={!selectedFlow}
        >
          📤 Export
        </button>
        {selectedFlow && (
          <>
            <button
              className={`secondary-button ${isTesterOpen ? 'active-tester-btn' : 'dark-text'}`}
              onClick={() => {
                setIsTesterOpen(!isTesterOpen)
                if (!isTesterOpen) setIsInspectorOpen(false)
              }}
              style={{
                background: isTesterOpen ? '#1ea085' : '',
                color: isTesterOpen ? '#ffffff' : ''
              }}
            >
              🧪 Test Flow
            </button>
            <button
              className={`secondary-button ${isInspectorOpen ? 'active-inspector-btn' : 'dark-text'}`}
              onClick={() => {
                setIsInspectorOpen(!isInspectorOpen)
                if (!isInspectorOpen) setIsTesterOpen(false)
              }}
              style={{
                background: isInspectorOpen ? '#3b82f6' : '',
                color: isInspectorOpen ? '#ffffff' : ''
              }}
            >
              🔍 AI Inspector
            </button>
          </>
        )}
      </div>

      <div className="toolbar-right">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search flows..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flow-search-input"
          />
        </div>
        <div className="language-wrapper">
          <span className="lang-icon">🌐</span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-selector"
          >
            <option value="en_US">English (US)</option>
            <option value="es_ES">Español</option>
            <option value="pt_BR">Português</option>
            <option value="hi_IN">हिन्दी</option>
          </select>
        </div>
      </div>
    </div>
  )
}

export default FlowToolbar
