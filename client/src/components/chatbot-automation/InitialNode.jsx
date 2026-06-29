import React from 'react'

function InitialNode() {
  const variables = ['{{senderName}}', '{{senderMobile}}', '{{senderMessage}}']

  return (
    <div className="initial-node-card">
      <div className="node-badge">TRIGGER</div>
      <div className="node-header">
        <span className="node-icon">⚡</span>
        <div className="node-header-info">
          <h4>Initial Node</h4>
          <span className="node-subtype">Source: Chatbot</span>
        </div>
      </div>
      <div className="node-body">
        <p className="node-instruction">
          This flow initiates automatically when an incoming conversation is matched.
        </p>
        <div className="node-variables-section">
          <span className="section-label">Available Variables</span>
          <div className="variables-grid">
            {variables.map((variable) => (
              <span key={variable} className="variable-tag">
                {variable}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="node-footer">
        <span className="connection-point-dot"></span>
      </div>
    </div>
  )
}

export default InitialNode
