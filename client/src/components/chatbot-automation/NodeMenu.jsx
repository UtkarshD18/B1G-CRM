import React, { useState } from 'react'
import { useChatbotAutomationStore } from '../../store/chatbotAutomationStore'

const AVAILABLE_NODES = [
  { id: 'send-message', name: 'Send Message', category: 'Message', icon: '💬', desc: 'Send a WhatsApp text or media message.' },
  { id: 'send-wa-template', name: 'Send WA Template', category: 'Message', icon: '📝', desc: 'Send a pre-approved Meta WhatsApp template.' },
  { id: 'send-wa-form', name: 'Send WA Form', category: 'Message', icon: '📋', desc: 'Send interactive WhatsApp utility form.' },
  { id: 'send-email', name: 'Send Email', category: 'Message', icon: '📧', desc: 'Notify contact or agent via email integration.' },
  
  { id: 'make-request', name: 'Make Request', category: 'Request', icon: '🔌', desc: 'Send HTTP payload to external REST API.' },
  { id: 'webhook', name: 'Webhook', category: 'Request', icon: '🔗', desc: 'Trigger a downstream application webhook.' },
  { id: 'google-sheets', name: 'Google Sheets', category: 'Request', icon: '📊', desc: 'Read/Write row cells in spreadsheet.' },
  
  { id: 'response-saver', name: 'Response Saver', category: 'Input', icon: '📥', desc: 'Store sender response text to profile fields.' },
  
  { id: 'condition', name: 'Condition', category: 'Logic', icon: '🔀', desc: 'Split flow execution paths by field conditions.' },
  { id: 'delay', name: 'Delay', category: 'Logic', icon: '⏳', desc: 'Wait duration before continuing flow.' },
  { id: 'reset-session', name: 'Reset Session', category: 'Logic', icon: '🔄', desc: 'Clear active session states & memory.' },
  { id: 'agent-transfer', name: 'Agent Transfer', category: 'Logic', icon: '👤', desc: 'Route chat to a human agent support queue.' },
  { id: 'ai-transfer', name: 'AI Transfer', category: 'Logic', icon: '🤖', desc: 'Transfer control to an AI Agent provider.' },
  { id: 'set-chat-labels', name: 'Set Chat Labels', category: 'Logic', icon: '🏷️', desc: 'Assign tags/labels to the contact conversation.' },
  { id: 'disable-auto-reply', name: 'Disable Auto-Reply', category: 'Logic', icon: '🔇', desc: 'Temporarily mute automated responses.' },
  { id: 'end-flow', name: 'End Flow', category: 'Logic', icon: '🛑', desc: 'Terminate automation sequence immediately.' },
]

function NodeMenu() {
  const { isNodeMenuOpen, setIsNodeMenuOpen, nodes, setNodes, selectedFlow } = useChatbotAutomationStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = ['All', 'Message', 'Request', 'Input', 'Logic']

  const filteredNodes = AVAILABLE_NODES.filter((node) => {
    const matchesSearch = node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          node.desc.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = activeCategory === 'All' || node.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const addNodeToCanvas = (nodeItem) => {
    if (!selectedFlow) return

    const newNode = {
      id: `node-${Date.now()}`,
      type: nodeItem.name,
      position: {
        x: 100 + Math.random() * 200,
        y: 100 + Math.random() * 200,
      },
      data: {
        label: nodeItem.name,
        icon: nodeItem.icon,
        category: nodeItem.category,
        desc: nodeItem.desc,
        ...(nodeItem.name === 'Condition' ? { conditions: [] } : {}),
        ...(nodeItem.name === 'Make Request' ? { method: 'GET', headers: [], responseMappings: [] } : {}),
      }
    }

    setNodes([...nodes, newNode])
    setIsNodeMenuOpen(false)
  }

  return (
    <>
      {/* Floating Toggle Button */}
      {selectedFlow && (
        <button
          className={`floating-add-node-btn ${isNodeMenuOpen ? 'active' : ''}`}
          onClick={() => setIsNodeMenuOpen(!isNodeMenuOpen)}
          title="Open Node Menu"
        >
          {isNodeMenuOpen ? '✕' : '＋'}
        </button>
      )}

      {/* Slide-out Menu Panel */}
      {isNodeMenuOpen && selectedFlow && (
        <div className="node-menu-panel animate-slide-left">
          <div className="node-menu-header">
            <h3>Add Automation Node</h3>
            <button className="close-menu-btn" onClick={() => setIsNodeMenuOpen(false)}>
              ✕
            </button>
          </div>

          <div className="node-menu-search">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="node-menu-categories">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="node-menu-list">
            {filteredNodes.length === 0 ? (
              <div className="no-nodes-state">No matching nodes found.</div>
            ) : (
              filteredNodes.map((node) => (
                <div
                  key={node.id}
                  className="node-menu-card"
                  onClick={() => addNodeToCanvas(node)}
                >
                  <div className="node-card-icon">{node.icon}</div>
                  <div className="node-card-details">
                    <h4>{node.name}</h4>
                    <p>{node.desc}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </>
  )
}

export default NodeMenu
