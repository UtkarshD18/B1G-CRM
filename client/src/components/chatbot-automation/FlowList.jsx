import React, { useEffect } from 'react'
import { useChatbotAutomationStore } from '../../store/chatbotAutomationStore'
import { useAuth } from '../../shared/auth'

function FlowList() {
  const { tokens } = useAuth()
  const token = tokens?.user

  const {
    flows,
    selectedFlow,
    selectFlow,
    deleteExistingFlow,
    duplicateExistingFlow,
    loadFlows,
    searchQuery
  } = useChatbotAutomationStore()

  // Load flows on mount
  useEffect(() => {
    if (token) {
      loadFlows(token)
    }
  }, [token, loadFlows])

  // Filter flows based on the search query
  const filteredFlows = flows.filter((flow) =>
    (flow.name || flow.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleSelectFlow = (flow) => {
    if (token) {
      selectFlow(flow, token)
    }
  }

  const handleDuplicate = async (flowId) => {
    if (token) {
      await duplicateExistingFlow(flowId, token)
      alert('Flow duplicated successfully!')
    }
  }

  const handleDelete = async (flowId) => {
    if (confirm('Are you sure you want to delete this flow?')) {
      if (token) {
        await deleteExistingFlow(flowId, token)
        alert('Flow deleted successfully!')
      }
    }
  }

  return (
    <div className="flow-list-panel">
      <div className="panel-header-simple">
        <h3>Saved Flows</h3>
        <span className="flows-count-badge">{filteredFlows.length}</span>
      </div>

      <div className="flow-cards-container">
        {filteredFlows.length === 0 ? (
          <div className="empty-search-state">
            <p>No flows found</p>
          </div>
        ) : (
          filteredFlows.map((flow) => {
            const isSelected = selectedFlow?.flow_id === flow.flow_id
            const flowName = flow.name || flow.title || 'Untitled Flow'
            const isPub = flow.is_published > 0 || flow.isPublished
            const displayStatus = isPub ? 'PUBLISHED' : 'DRAFT'
            const lastUpdatedDate = flow.updated_at ? new Date(flow.updated_at).toLocaleDateString() : 'N/A'

            return (
              <div
                key={flow.flow_id}
                className={`flow-card-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleSelectFlow(flow)}
              >
                <div className="flow-card-header">
                  <span className="flow-card-title">{flowName}</span>
                  <span className={`status-badge ${displayStatus.toLowerCase()}`}>
                    {displayStatus}
                  </span>
                </div>

                <div className="flow-card-meta">
                  <span className="meta-item">🕒 {lastUpdatedDate}</span>
                  <span className="meta-item">🔗 {flow.nodeCount || 0} nodes</span>
                </div>

                <div className="flow-card-actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    className="action-btn edit-btn"
                    onClick={() => handleSelectFlow(flow)}
                    title="Edit Flow"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="action-btn duplicate-btn"
                    onClick={() => handleDuplicate(flow.flow_id)}
                    title="Duplicate Flow"
                  >
                    📋 Duplicate
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(flow.flow_id)}
                    title="Delete Flow"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default FlowList
