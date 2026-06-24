import React from 'react'
import { useChatbotAutomationStore } from '../../store/chatbotAutomationStore'
import { useAuth } from '../../shared/auth'

function CanvasPlaceholder() {
  const { createNewFlow } = useChatbotAutomationStore()
  const { tokens } = useAuth()
  const token = tokens?.user

  return (
    <div className="canvas-placeholder-container">
      <div className="placeholder-content">
        <div className="placeholder-icon-animated">🚀</div>
        <h2>Chatbot Automation Builder</h2>
        <p>Create your first automation flow. Drag nodes to build conversation logic.</p>
        <button className="primary-button create-first-flow-btn" onClick={() => createNewFlow(token)}>
          Create Flow
        </button>
      </div>
    </div>
  )
}

export default CanvasPlaceholder

