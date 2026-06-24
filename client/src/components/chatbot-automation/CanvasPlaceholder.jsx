import React from 'react'
import { useChatbotAutomationStore } from '../../store/chatbotAutomationStore'

function CanvasPlaceholder() {
  const { createFlow } = useChatbotAutomationStore()

  return (
    <div className="canvas-placeholder-container">
      <div className="placeholder-content">
        <div className="placeholder-icon-animated">🚀</div>
        <h2>Chatbot Automation Builder</h2>
        <p>Create your first automation flow. Drag nodes to build conversation logic.</p>
        <button className="primary-button create-first-flow-btn" onClick={createFlow}>
          Create Flow
        </button>
      </div>
    </div>
  )
}

export default CanvasPlaceholder
