import { useCallback, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

const nodePalette = [
  { type: 'TRIGGER', label: 'Trigger', icon: '⚡' },
  { type: 'TEXT', label: 'Text Reply', icon: '💬' },
  { type: 'IMAGE', label: 'Image', icon: '🖼️' },
  { type: 'DOCUMENT', label: 'Document', icon: '📄' },
  { type: 'LOCATION', label: 'Location', icon: '📍' },
  { type: 'BUTTON', label: 'Quick Reply', icon: '🔘' },
  { type: 'AI_BOT', label: 'AI Handoff', icon: '🤖' },
  { type: 'TEMPLATE', label: 'Template', icon: '📝' },
]

function getFlowNodeType(node) {
  if (node?.data?.flowType) return node.data.flowType
  if (node?.nodeType) return node.nodeType
  if (node?.type === 'TRIGGER' || node?.type === 'input') return 'TRIGGER'
  if (node?.type && !['default', 'output', 'group'].includes(node.type)) return node.type
  return 'TEXT'
}

function createPaletteNode(flowType, id, x, y) {
  const defaults = {
    TRIGGER: { label: 'Incoming message', msgContent: { type: 'trigger', body: 'keyword' } },
    TEXT: { label: 'Text reply', msgContent: { type: 'text', text: { preview_url: true, body: 'Write the reply message here.' } } },
    IMAGE: { label: 'Image reply', msgContent: { type: 'image', image: { link: 'https://example.com/image.jpg', caption: 'Image caption' } } },
    DOCUMENT: { label: 'Document reply', msgContent: { type: 'document', document: { link: 'https://example.com/file.pdf', caption: 'Document caption' } } },
    LOCATION: { label: 'Location reply', msgContent: { type: 'location', location: { latitude: '28.6139', longitude: '77.2090', name: 'Store', address: 'New Delhi' } } },
    BUTTON: { label: 'Quick replies', msgContent: { type: 'interactive', interactive: { type: 'button', body: { text: 'Choose an option' }, action: { buttons: [{ type: 'reply', reply: { id: 'opt1', title: 'Option 1' } }] } } } },
    AI_BOT: { label: 'AI handoff', msgContent: { assignAi: true, prompt: 'Answer using knowledge base.' } },
    TEMPLATE: { label: 'Send template', msgContent: { type: 'template', templateName: '' } },
  }
  const def = defaults[flowType] || defaults.TEXT
  return { id, type: flowType, position: { x, y }, data: { label: def.label, msgContent: def.msgContent } }
}

function toCanvasNode(node) {
  const flowType = getFlowNodeType(node)
  return {
    ...node,
    type: flowType === 'TRIGGER' ? 'input' : 'default',
    position: node?.position || { x: 80, y: 80 },
    data: { ...(node?.data || {}), flowType, label: node?.data?.label || (flowType === 'TRIGGER' ? 'Incoming message' : 'Reply message') },
  }
}

function toPersistedNode(node) {
  const flowType = getFlowNodeType(node)
  const { flowType: _ft, ...data } = node?.data || {}
  return { id: node.id, type: flowType, position: node.position || { x: 80, y: 80 }, data: { ...data, label: data.label || 'Node' } }
}

function toCanvasEdge(edge) {
  const sourceHandle = edge?.sourceHandle || edge?.label || 'next'
  return { ...edge, id: edge?.id || `edge-${edge?.source}-${edge?.target}`, sourceHandle, label: sourceHandle, animated: sourceHandle === '{{OTHER_MSG}}' }
}

function toPersistedEdge(edge) {
  return { id: edge.id, source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle || edge.label || 'next' }
}

function getNodeMessage(node) {
  const flowType = getFlowNodeType(node)
  const mc = node?.data?.msgContent || {}
  if (flowType === 'TRIGGER') return mc.body || ''
  if (mc.type === 'image') return mc.image?.caption || ''
  if (mc.type === 'document') return mc.document?.caption || ''
  if (mc.type === 'location') return mc.location?.name || ''
  if (mc.type === 'interactive') return mc.interactive?.body?.text || ''
  if (mc.type === 'template') return mc.templateName || ''
  if (flowType === 'AI_BOT') return mc.prompt || ''
  return mc.text?.body || ''
}

function withNodeMessage(node, value) {
  const flowType = getFlowNodeType(node)
  const data = { ...(node?.data || {}) }
  const mc = data.msgContent || {}

  if (flowType === 'TRIGGER') data.msgContent = { ...mc, type: 'trigger', body: value }
  else if (mc.type === 'image') data.msgContent = { ...mc, image: { ...(mc.image || {}), caption: value } }
  else if (mc.type === 'document') data.msgContent = { ...mc, document: { ...(mc.document || {}), caption: value } }
  else if (mc.type === 'location') data.msgContent = { ...mc, location: { ...(mc.location || {}), name: value } }
  else if (mc.type === 'interactive') data.msgContent = { ...mc, interactive: { ...(mc.interactive || {}), body: { ...(mc.interactive?.body || {}), text: value } } }
  else if (mc.type === 'template') data.msgContent = { ...mc, templateName: value }
  else if (flowType === 'AI_BOT') data.msgContent = { ...mc, assignAi: true, prompt: value }
  else data.msgContent = { ...mc, type: 'text', text: { preview_url: true, ...(mc.text || {}), body: value } }

  return { ...node, data }
}

function FlowCanvas({ nodes: initialNodes, edges: initialEdges, onSave, templates }) {
  const [canvasNodes, setCanvasNodes] = useState(() => (initialNodes || []).map(toCanvasNode))
  const [canvasEdges, setCanvasEdges] = useState(() => (initialEdges || []).map(toCanvasEdge))
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [selectedEdgeId, setSelectedEdgeId] = useState('')

  const selectedNode = useMemo(() => canvasNodes.find((n) => n.id === selectedNodeId), [canvasNodes, selectedNodeId])
  const selectedEdge = useMemo(() => canvasEdges.find((e) => e.id === selectedEdgeId), [canvasEdges, selectedEdgeId])

  const onNodesChange = useCallback((changes) => {
    setCanvasNodes((cur) => applyNodeChanges(changes, cur))
  }, [])

  const onEdgesChange = useCallback((changes) => {
    setCanvasEdges((cur) => applyEdgeChanges(changes, cur))
  }, [])

  const onConnect = useCallback((connection) => {
    setCanvasEdges((cur) => {
      const nextEdge = { ...connection, id: `edge-${connection.source}-${connection.target}-${Date.now().toString(36)}`, sourceHandle: connection.sourceHandle || 'next' }
      return addEdge(toCanvasEdge(nextEdge), cur)
    })
  }, [])

  function addNode(flowType) {
    const nextId = `${flowType.toLowerCase()}-${Date.now().toString(36)}`
    const offset = canvasNodes.length * 42
    const x = flowType === 'TRIGGER' ? 60 + offset : 360 + offset
    const y = flowType === 'TRIGGER' ? 90 + offset : 120 + offset
    const nextNode = toCanvasNode(createPaletteNode(flowType, nextId, x, y))
    setCanvasNodes((cur) => [...cur, nextNode])
    setSelectedNodeId(nextId)
    setSelectedEdgeId('')
  }

  function updateNode(field, value) {
    if (!selectedNode) return
    setCanvasNodes((cur) =>
      cur.map((node) => {
        if (node.id !== selectedNode.id) return node
        if (field === 'label') return { ...node, data: { ...node.data, label: value } }
        return withNodeMessage(node, value)
      }),
    )
  }

  function updateEdge(value) {
    if (!selectedEdge) return
    setCanvasEdges((cur) =>
      cur.map((edge) => (edge.id === selectedEdge.id ? toCanvasEdge({ ...edge, sourceHandle: value }) : edge)),
    )
  }

  function handleSave() {
    const persistedNodes = canvasNodes.map(toPersistedNode)
    const persistedEdges = canvasEdges.map(toPersistedEdge)
    onSave?.(persistedNodes, persistedEdges)
  }

  return (
    <div className="af-canvas-wrapper">
      <div className="af-canvas-area">
        <ReactFlow
          nodes={canvasNodes}
          edges={canvasEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, node) => { setSelectedNodeId(node.id); setSelectedEdgeId('') }}
          onEdgeClick={(_, edge) => { setSelectedEdgeId(edge.id); setSelectedNodeId('') }}
          fitView
        >
          <MiniMap pannable zoomable />
          <Controls />
          <Background />
        </ReactFlow>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Node Palette */}
        <div>
          <h4 style={{ margin: '0 0 10px', fontSize: '0.85rem', fontWeight: 700, color: '#10212d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Add Node
          </h4>
          <div className="af-node-palette">
            {nodePalette.map((item) => (
              <button className="af-node-palette-btn" key={item.type} type="button" onClick={() => addNode(item.type)}>
                <span className="af-node-palette-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Inspector */}
        <div className="af-inspector">
          <h4>Inspector</h4>
          {selectedNode ? (
            <>
              <div className="af-field">
                <label className="af-field-label">{getFlowNodeType(selectedNode)} Node</label>
              </div>
              <div className="af-field">
                <label className="af-field-label">Label</label>
                <input className="af-input" value={selectedNode.data?.label || ''} onChange={(e) => updateNode('label', e.target.value)} />
              </div>
              <div className="af-field">
                <label className="af-field-label">
                  {getFlowNodeType(selectedNode) === 'AI_BOT' ? 'AI Instruction' : getFlowNodeType(selectedNode) === 'TEMPLATE' ? 'Template Name' : 'Message'}
                </label>
                {getFlowNodeType(selectedNode) === 'TEMPLATE' && templates?.length ? (
                  <select className="af-select" value={getNodeMessage(selectedNode)} onChange={(e) => updateNode('message', e.target.value)}>
                    <option value="">Select template</option>
                    {templates.map((t) => (
                      <option key={t.name} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                ) : (
                  <textarea className="af-textarea" rows={3} value={getNodeMessage(selectedNode)} onChange={(e) => updateNode('message', e.target.value)} />
                )}
              </div>
            </>
          ) : selectedEdge ? (
            <div className="af-field">
              <label className="af-field-label">Trigger / Source Handle</label>
              <input className="af-input" value={selectedEdge.sourceHandle || ''} onChange={(e) => updateEdge(e.target.value)} />
            </div>
          ) : (
            <div className="af-inspector-empty">
              <div className="af-inspector-empty-icon">🎯</div>
              <span>Select a node or edge to inspect and edit</span>
            </div>
          )}
        </div>

        <button type="button" className="af-btn af-btn-primary" onClick={handleSave} style={{ width: '100%', justifyContent: 'center' }}>
          💾 Save Flow
        </button>
      </div>
    </div>
  )
}

export default FlowCanvas
