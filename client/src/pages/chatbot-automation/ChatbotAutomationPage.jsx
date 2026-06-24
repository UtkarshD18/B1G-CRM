import React, { useCallback, useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

import { useChatbotAutomationStore } from '../../store/chatbotAutomationStore'
import { useAuth } from '../../shared/auth'
import FlowToolbar from '../../components/chatbot-automation/FlowToolbar'
import FlowList from '../../components/chatbot-automation/FlowList'
import CanvasPlaceholder from '../../components/chatbot-automation/CanvasPlaceholder'
import NodeMenu from '../../components/chatbot-automation/NodeMenu'
import FlowInspector from '../../components/chatbot-automation/FlowInspector'
import { AutomationNode, InitialNode } from '../../components/chatbot-automation/CustomNode'
import AiExecutionInspector from '../../components/chatbot-automation/AiExecutionInspector'
import './ChatbotAutomation.css'


// Register Custom Node Types for React Flow
const nodeTypes = {
  initial: InitialNode,
  'Send Message': AutomationNode,
  'Send WA Template': AutomationNode,
  'Send WA Form': AutomationNode,
  'Condition': AutomationNode,
  'Response Saver': AutomationNode,
  'Set Chat Labels': AutomationNode,
  'Disable Auto-Reply': AutomationNode,
  'Make Request': AutomationNode,
  'Delay': AutomationNode,
  'Reset Session': AutomationNode,
  'Send Email': AutomationNode,
  'Google Sheets': AutomationNode,
  'Agent Transfer': AutomationNode,
  'AI Transfer': AutomationNode,
  'Webhook': AutomationNode,
  'End Flow': AutomationNode
}

function ChatbotAutomationPage() {
  const { tokens } = useAuth()
  const token = tokens?.user

  const {
    selectedFlow,
    nodes,
    edges,
    setNodes,
    setEdges,
    selectedNodeId,
    setSelectedNodeId,
    isTesterOpen,
    setIsTesterOpen,
    isInspectorOpen,
    setIsInspectorOpen,
    isSimulating,
    simulationInputs,
    setSimulationInputs,
    runSimulation,
    simulationResult,
    setSimulationResult
  } = useChatbotAutomationStore()

  // React Flow Handlers
  const onNodesChange = useCallback((changes) => {
    setNodes(applyNodeChanges(changes, nodes))
  }, [nodes, setNodes])

  const onEdgesChange = useCallback((changes) => {
    setEdges(applyEdgeChanges(changes, edges))
  }, [edges, setEdges])

  const onConnect = useCallback((connection) => {
    // Prevent connecting to self
    if (connection.source === connection.target) return

    // Ensure condition handles don't collide or get overwritten
    const newEdge = {
      ...connection,
      id: `edge-${connection.source}-${connection.target}-${Date.now().toString(36)}`,
      animated: true,
      style: { strokeWidth: 2, stroke: '#1ea085' }
    }
    setEdges(addEdge(newEdge, edges))
  }, [edges, setEdges])

  const onNodeClick = useCallback((event, node) => {
    setSelectedNodeId(node.id)
  }, [setSelectedNodeId])

  const onPaneClick = useCallback(() => {
    setSelectedNodeId(null)
  }, [setSelectedNodeId])

  const handleClearSimulation = () => {
    setSimulationResult(null)
  }

  return (
    <div className="chatbot-automation-container">
      {/* Page Header */}
      <div className="chatbot-automation-header">
        <h2>Chatbot Automation</h2>
        <p>
          Build visual chatbot workflows, automate conversations, route users through conditions and
          connect external services.
        </p>
      </div>

      {/* Top Flow Toolbar */}
      <FlowToolbar />

      {/* Main Workspace Layout */}
      <div className="chatbot-automation-layout">
        {/* Left Directory Sidebar (Width 320px) */}
        <FlowList />

        {/* Right Canvas / Work Area */}
        <div className="canvas-area">
          {!selectedFlow ? (
            <CanvasPlaceholder />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
              {/* Active Flow Header Info */}
              <div className="canvas-flow-header" style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
                <span className="header-flow-indicator"></span>
                <span>Active Flow: {selectedFlow.name || selectedFlow.title}</span>
              </div>

              {/* Simulation Result Header Info */}
              {simulationResult && (
                <div
                  className="canvas-flow-header simulation-active-badge"
                  style={{
                    position: 'absolute',
                    top: '16px',
                    left: '260px',
                    zIndex: 10,
                    borderColor: '#10b981',
                    background: 'rgba(16, 185, 129, 0.1)',
                    color: '#10b981',
                    cursor: 'pointer'
                  }}
                  onClick={handleClearSimulation}
                  title="Clear simulation highlight path"
                >
                  <span>🧪 Test Highlights Active (Click to Clear) ✕</span>
                </div>
              )}

              {/* React Flow Editor Workspace */}
              <div style={{ flex: 1, width: '100%', height: '100%' }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={onNodeClick}
                  onPaneClick={onPaneClick}
                  nodeTypes={nodeTypes}
                  fitView
                  fitViewOptions={{ padding: 0.2 }}
                  maxZoom={1.5}
                  minZoom={0.2}
                >
                  <Background color="#ccc" gap={16} size={1} />
                  <Controls style={{ left: '16px', bottom: '16px' }} />
                  <MiniMap zoomable pannable style={{ right: '16px', bottom: '16px' }} />
                </ReactFlow>
              </div>

              {/* Floating Node Palette Menu Controls */}
              <NodeMenu />

              {/* Right Sliding Panels (Inspector & Flow Tester) */}
              <div
                className="canvas-side-panels"
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  height: '100%',
                  display: 'flex',
                  zIndex: 80,
                  pointerEvents: 'none' // allow click through outer box
                }}
              >
                {/* Node Inspector Drawer */}
                {selectedNodeId && (
                  <div style={{ pointerEvents: 'auto', height: '100%' }}>
                    <FlowInspector />
                  </div>
                )}

                {/* Flow Tester Sidebar Drawer */}
                {isTesterOpen && (
                  <div
                    className="flow-tester-panel animate-slide-left"
                    style={{
                      pointerEvents: 'auto',
                      width: '360px',
                      height: '100%',
                      background: '#111827',
                      borderLeft: '1px solid #374151',
                      display: 'flex',
                      flexDirection: 'column',
                      color: '#f3f4f6',
                      boxShadow: '-10px 0 30px rgba(0,0,0,0.3)'
                    }}
                  >
                    {/* Header */}
                    <div
                      style={{
                        padding: '16px',
                        borderBottom: '1px solid #1f2937',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
                        🧪 Chatbot Flow Tester
                      </h3>
                      <button
                        onClick={() => setIsTesterOpen(false)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          fontSize: '1.1rem'
                        }}
                      >
                        ✕
                      </button>
                    </div>

                    {/* Simulation Settings and Inputs */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div className="af-field">
                        <label className="af-field-label" style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Incoming Message Body</label>
                        <input
                          className="af-input"
                          style={{ background: '#1f2937', border: '1px solid #374151', color: '#ffffff', borderRadius: '8px', padding: '8px' }}
                          value={simulationInputs.message || ''}
                          onChange={(e) => setSimulationInputs({ message: e.target.value })}
                          placeholder="e.g. hello / order status"
                        />
                      </div>

                      <div className="af-field">
                        <label className="af-field-label" style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Sender Mobile Number</label>
                        <input
                          className="af-input"
                          style={{ background: '#1f2937', border: '1px solid #374151', color: '#ffffff', borderRadius: '8px', padding: '8px' }}
                          value={simulationInputs.phone || ''}
                          onChange={(e) => setSimulationInputs({ phone: e.target.value })}
                          placeholder="e.g. +15550001111"
                        />
                      </div>

                      <div className="af-field">
                        <label className="af-field-label" style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Sender Contact Name</label>
                        <input
                          className="af-input"
                          style={{ background: '#1f2937', border: '1px solid #374151', color: '#ffffff', borderRadius: '8px', padding: '8px' }}
                          value={simulationInputs.name || ''}
                          onChange={(e) => setSimulationInputs({ name: e.target.value })}
                          placeholder="e.g. Alice"
                        />
                      </div>

                      <div className="af-field">
                        <label className="af-field-label" style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Initial Profile Variables (JSON)</label>
                        <textarea
                          className="af-textarea"
                          style={{ background: '#1f2937', border: '1px solid #374151', color: '#ffffff', borderRadius: '8px', padding: '8px', fontFamily: 'monospace', fontSize: '0.78rem' }}
                          rows={4}
                          value={simulationInputs.variables || ''}
                          onChange={(e) => setSimulationInputs({ variables: e.target.value })}
                          placeholder='e.g. {"user_level": "VIP"}'
                        />
                      </div>

                      <button
                        className="primary-button new-flow-btn"
                        style={{ marginTop: '8px', padding: '10px' }}
                        onClick={() => runSimulation(token)}
                        disabled={isSimulating}
                      >
                        {isSimulating ? '⏳ Executing Simulation...' : '▶ Run Flow Simulation'}
                      </button>

                      {/* Display Simulation logs step sequence */}
                      {simulationResult && (
                        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                          <hr style={{ borderColor: '#1f2937', margin: '8px 0' }} />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#ffffff' }}>Execution Log Steps</h4>
                            <span
                              style={{
                                fontSize: '0.7rem',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                background: simulationResult.execution?.status === 'completed' ? '#065f46' : '#92400e',
                                color: '#ffffff'
                              }}
                            >
                              {simulationResult.execution?.status?.toUpperCase()}
                            </span>
                          </div>

                          {/* Log steps */}
                          <div className="simulation-logs-list" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {simulationResult.logs?.map((log, idx) => {
                              const node = nodes.find(n => n.id === log.nodeId)
                              const nodeLabel = node?.data?.label || node?.type || log.nodeId
                              const statusColor = log.status === 'success' ? '#10b981' : '#ef4444'

                              return (
                                <div
                                  key={idx}
                                  style={{
                                    padding: '10px',
                                    background: '#1f2937',
                                    borderRadius: '8px',
                                    borderLeft: `3px solid ${statusColor}`,
                                    fontSize: '0.78rem'
                                  }}
                                >
                                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{nodeLabel}</span>
                                    <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>{log.executionTime}ms</span>
                                  </div>
                                  {log.errorMessage ? (
                                    <div style={{ color: '#ef4444', fontSize: '0.72rem' }}>Error: {log.errorMessage}</div>
                                  ) : (
                                    <div style={{ color: '#9ca3af', fontSize: '0.72rem' }}>Executed successfully</div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          {/* Variables details */}
                          <div style={{ marginTop: '10px' }}>
                            <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Final State Variables</label>
                            <pre
                              style={{
                                background: '#1f2937',
                                padding: '10px',
                                borderRadius: '8px',
                                fontSize: '0.72rem',
                                color: '#34d399',
                                overflowX: 'auto',
                                margin: 0
                              }}
                            >
                              {JSON.stringify(simulationResult.execution?.variables || {}, null, 2)}
                            </pre>
                          </div>

                          {/* Labels details */}
                          {simulationResult.execution?.labels?.length > 0 && (
                            <div style={{ marginTop: '6px' }}>
                              <label style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'block', marginBottom: '4px' }}>Assigned CRM Labels</label>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {simulationResult.execution.labels.map(lbl => (
                                  <span key={lbl} style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#1e3a8a', color: '#3b82f6', borderRadius: '4px' }}>
                                    🏷️ {lbl}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* AI Execution Inspector Drawer */}
                {isInspectorOpen && (
                  <AiExecutionInspector token={token} onClose={() => setIsInspectorOpen(false)} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatbotAutomationPage
