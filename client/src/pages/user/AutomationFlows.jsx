import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { classNames, createFlowId, parseJsonField, prettyJson } from '../../shared/format'

const defaultTemplate = {
  trigger: 'pricing',
  reply: 'Thanks {{senderName}}, our team can help with pricing. What quantity do you need?',
  fallback: 'Thanks for the message. A team member will review this shortly.',
}

const nodePalette = [
  { type: 'TRIGGER', label: 'Trigger' },
  { type: 'TEXT', label: 'Text reply' },
  { type: 'IMAGE', label: 'Image reply' },
  { type: 'DOCUMENT', label: 'Document reply' },
  { type: 'LOCATION', label: 'Location' },
  { type: 'BUTTON', label: 'Quick replies' },
  { type: 'AI_BOT', label: 'AI handoff' },
]

function createTextNode(id, label, body, x, y) {
  return {
    id,
    type: 'TEXT',
    position: { x, y },
    data: {
      label,
      msgContent: {
        type: 'text',
        text: {
          preview_url: true,
          body,
        },
      },
    },
  }
}

function createPaletteNode(flowType, id, x, y) {
  if (flowType === 'TRIGGER') {
    return {
      id,
      type: 'TRIGGER',
      position: { x, y },
      data: {
        label: 'Incoming message',
        msgContent: { type: 'trigger', body: 'keyword' },
      },
    }
  }

  if (flowType === 'IMAGE') {
    return {
      id,
      type: 'IMAGE',
      position: { x, y },
      data: {
        label: 'Image reply',
        msgContent: {
          type: 'image',
          image: {
            link: 'https://example.com/image.jpg',
            caption: 'Image caption for {{senderName}}',
          },
        },
      },
    }
  }

  if (flowType === 'DOCUMENT') {
    return {
      id,
      type: 'DOCUMENT',
      position: { x, y },
      data: {
        label: 'Document reply',
        msgContent: {
          type: 'document',
          document: {
            link: 'https://example.com/file.pdf',
            caption: 'Document caption for {{senderName}}',
          },
        },
      },
    }
  }

  if (flowType === 'LOCATION') {
    return {
      id,
      type: 'LOCATION',
      position: { x, y },
      data: {
        label: 'Location reply',
        msgContent: {
          type: 'location',
          location: {
            latitude: '28.6139',
            longitude: '77.2090',
            name: 'Store location',
            address: 'New Delhi',
          },
        },
      },
    }
  }

  if (flowType === 'BUTTON') {
    return {
      id,
      type: 'BUTTON',
      position: { x, y },
      data: {
        label: 'Quick replies',
        msgContent: {
          type: 'interactive',
          interactive: {
            type: 'button',
            body: { text: 'Choose an option' },
            action: {
              buttons: [
                { type: 'reply', reply: { id: 'pricing', title: 'Pricing' } },
                { type: 'reply', reply: { id: 'demo', title: 'Book demo' } },
              ],
            },
          },
        },
      },
    }
  }

  if (flowType === 'AI_BOT') {
    return {
      id,
      type: 'AI_BOT',
      position: { x, y },
      data: {
        label: 'AI handoff',
        msgContent: {
          assignAi: true,
          prompt: 'Answer using the business knowledge base and hand off when confidence is low.',
        },
      },
    }
  }

  return createTextNode(id, 'Text reply', 'Write the reply message here.', x, y)
}

function buildBotReadyFlow({ trigger, reply, fallback }) {
  const normalizedTrigger = trigger.trim()
  const nodes = [
    {
      id: 'trigger-start',
      type: 'TRIGGER',
      position: { x: 40, y: 80 },
      data: {
        label: 'Incoming message',
        msgContent: { type: 'trigger', body: normalizedTrigger },
      },
    },
    createTextNode('reply-main', `Reply: ${normalizedTrigger}`, reply.trim(), 360, 60),
  ]
  const edges = [
    {
      id: 'edge-trigger-reply',
      source: 'trigger-start',
      target: 'reply-main',
      sourceHandle: normalizedTrigger,
    },
  ]

  if (fallback.trim()) {
    nodes.push(createTextNode('reply-fallback', 'Fallback reply', fallback.trim(), 360, 220))
    edges.push({
      id: 'edge-fallback-reply',
      source: 'trigger-start',
      target: 'reply-fallback',
      sourceHandle: '{{OTHER_MSG}}',
    })
  }

  return { nodes, edges }
}

function countBotReadyTriggers(edges = []) {
  return edges.filter((edge) => edge?.sourceHandle).length
}

function getFlowNodeType(node) {
  if (node?.data?.flowType) {
    return node.data.flowType
  }

  if (node?.nodeType) {
    return node.nodeType
  }

  if (node?.type === 'TRIGGER' || node?.type === 'input') {
    return 'TRIGGER'
  }

  if (node?.type && !['default', 'output', 'group'].includes(node.type)) {
    return node.type
  }

  return 'TEXT'
}

function toCanvasNode(node) {
  const flowType = getFlowNodeType(node)
  return {
    ...node,
    type: flowType === 'TRIGGER' ? 'input' : 'default',
    position: node?.position || { x: 80, y: 80 },
    data: {
      ...(node?.data || {}),
      flowType,
      label: node?.data?.label || (flowType === 'TRIGGER' ? 'Incoming message' : 'Reply message'),
    },
  }
}

function toPersistedNode(node) {
  const flowType = getFlowNodeType(node)
  const { flowType: _flowType, ...data } = node?.data || {}

  return {
    id: node.id,
    type: flowType,
    position: node.position || { x: 80, y: 80 },
    data: {
      ...data,
      label: data.label || (flowType === 'TRIGGER' ? 'Incoming message' : 'Reply message'),
    },
  }
}

function toCanvasEdge(edge) {
  const sourceHandle = edge?.sourceHandle || edge?.label || 'next'
  return {
    ...edge,
    id: edge?.id || `edge-${edge?.source || 'source'}-${edge?.target || 'target'}`,
    sourceHandle,
    label: sourceHandle,
    animated: sourceHandle === '{{OTHER_MSG}}',
  }
}

function toPersistedEdge(edge) {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || edge.label || 'next',
  }
}

function getNodeMessage(node) {
  const flowType = getFlowNodeType(node)
  const msgContent = node?.data?.msgContent || {}

  if (flowType === 'TRIGGER') {
    return msgContent.body || ''
  }

  if (msgContent.type === 'image') {
    return msgContent.image?.caption || ''
  }

  if (msgContent.type === 'document') {
    return msgContent.document?.caption || ''
  }

  if (msgContent.type === 'location') {
    return msgContent.location?.name || ''
  }

  if (msgContent.type === 'interactive') {
    return msgContent.interactive?.body?.text || ''
  }

  if (flowType === 'AI_BOT') {
    return msgContent.prompt || ''
  }

  return msgContent.text?.body || ''
}

function withNodeMessage(node, value) {
  const flowType = getFlowNodeType(node)
  const data = { ...(node?.data || {}) }
  const msgContent = data.msgContent || {}

  if (flowType === 'TRIGGER') {
    data.msgContent = {
      ...msgContent,
      type: 'trigger',
      body: value,
    }
  } else if (msgContent.type === 'image') {
    data.msgContent = {
      ...msgContent,
      image: {
        ...(msgContent.image || {}),
        caption: value,
      },
    }
  } else if (msgContent.type === 'document') {
    data.msgContent = {
      ...msgContent,
      document: {
        ...(msgContent.document || {}),
        caption: value,
      },
    }
  } else if (msgContent.type === 'location') {
    data.msgContent = {
      ...msgContent,
      location: {
        ...(msgContent.location || {}),
        name: value,
      },
    }
  } else if (msgContent.type === 'interactive') {
    data.msgContent = {
      ...msgContent,
      interactive: {
        ...(msgContent.interactive || {}),
        body: {
          ...(msgContent.interactive?.body || {}),
          text: value,
        },
      },
    }
  } else if (flowType === 'AI_BOT') {
    data.msgContent = {
      ...msgContent,
      assignAi: true,
      prompt: value,
    }
  } else {
    data.msgContent = {
      ...msgContent,
      type: 'text',
      text: {
        preview_url: true,
        ...(msgContent.text || {}),
        body: value,
      },
    }
  }

  return {
    ...node,
    data,
  }
}

function getNodeResource(node) {
  const msgContent = node?.data?.msgContent || {}

  if (msgContent.type === 'image') {
    return msgContent.image?.link || ''
  }

  if (msgContent.type === 'document') {
    return msgContent.document?.link || ''
  }

  return ''
}

function withNodeResource(node, value) {
  const data = { ...(node?.data || {}) }
  const msgContent = data.msgContent || {}

  if (msgContent.type === 'image') {
    data.msgContent = {
      ...msgContent,
      image: {
        ...(msgContent.image || {}),
        link: value,
      },
    }
  } else if (msgContent.type === 'document') {
    data.msgContent = {
      ...msgContent,
      document: {
        ...(msgContent.document || {}),
        link: value,
      },
    }
  }

  return { ...node, data }
}

function getLocationField(node, field) {
  return node?.data?.msgContent?.location?.[field] || ''
}

function withLocationField(node, field, value) {
  const data = { ...(node?.data || {}) }
  const msgContent = data.msgContent || {}

  data.msgContent = {
    ...msgContent,
    type: 'location',
    location: {
      ...(msgContent.location || {}),
      [field]: value,
    },
  }

  return { ...node, data }
}

function getQuickReplyLabels(node) {
  const buttons = node?.data?.msgContent?.interactive?.action?.buttons || []
  return buttons.map((button) => button?.reply?.title).filter(Boolean).join(', ')
}

function toReplyId(label, index) {
  const slug = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  return slug || `option-${index + 1}`
}

function withQuickReplyLabels(node, value) {
  const labels = value.split(',').map((label) => label.trim()).filter(Boolean).slice(0, 3)
  const data = { ...(node?.data || {}) }
  const msgContent = data.msgContent || {}
  const interactive = msgContent.interactive || {}

  data.msgContent = {
    ...msgContent,
    type: 'interactive',
    interactive: {
      ...interactive,
      type: 'button',
      action: {
        ...(interactive.action || {}),
        buttons: labels.map((label, index) => ({
          type: 'reply',
          reply: {
            id: toReplyId(label, index),
            title: label,
          },
        })),
      },
    },
  }

  return { ...node, data }
}

function UserAutomationFlowsPage() {
  const { tokens } = useAuth()
  const [flows, setFlows] = useState([])
  const [status, setStatus] = useState('Loading flows...')
  const [flowId, setFlowId] = useState('')
  const [title, setTitle] = useState('')
  const [nodesJson, setNodesJson] = useState(prettyJson([]))
  const [edgesJson, setEdgesJson] = useState(prettyJson([]))
  const [canvasNodes, setCanvasNodes] = useState([])
  const [canvasEdges, setCanvasEdges] = useState([])
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [selectedEdgeId, setSelectedEdgeId] = useState('')
  const [template, setTemplate] = useState(defaultTemplate)
  const [activity, setActivity] = useState({ prevent: [], ai: [] })
  const parsedNodes = parseJsonField(nodesJson, 'Nodes')
  const parsedEdges = parseJsonField(edgesJson, 'Edges')
  const nodeCount = parsedNodes.success && Array.isArray(parsedNodes.data) ? parsedNodes.data.length : 0
  const edgeCount = parsedEdges.success && Array.isArray(parsedEdges.data) ? parsedEdges.data.length : 0
  const triggerCount = parsedEdges.success && Array.isArray(parsedEdges.data) ? countBotReadyTriggers(parsedEdges.data) : 0
  const selectedNode = useMemo(
    () => canvasNodes.find((node) => node.id === selectedNodeId),
    [canvasNodes, selectedNodeId],
  )
  const selectedEdge = useMemo(
    () => canvasEdges.find((edge) => edge.id === selectedEdgeId),
    [canvasEdges, selectedEdgeId],
  )

  const syncCanvasGraph = useCallback((nextNodes, nextEdges = canvasEdges) => {
    const persistedNodes = nextNodes.map(toPersistedNode)
    const persistedEdges = nextEdges.map(toPersistedEdge)

    setCanvasNodes(nextNodes)
    setCanvasEdges(nextEdges)
    setNodesJson(prettyJson(persistedNodes))
    setEdgesJson(prettyJson(persistedEdges))
  }, [canvasEdges])

  useEffect(() => {
    if (!parsedNodes.success || !Array.isArray(parsedNodes.data)) {
      return
    }

    setCanvasNodes(parsedNodes.data.map(toCanvasNode))
  }, [nodesJson, parsedNodes.success])

  useEffect(() => {
    if (!parsedEdges.success || !Array.isArray(parsedEdges.data)) {
      return
    }

    setCanvasEdges(parsedEdges.data.map(toCanvasEdge))
  }, [edgesJson, parsedEdges.success])

  useEffect(() => {
    if (selectedNodeId && !canvasNodes.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId('')
    }

    if (selectedEdgeId && !canvasEdges.some((edge) => edge.id === selectedEdgeId)) {
      setSelectedEdgeId('')
    }
  }, [canvasEdges, canvasNodes, selectedEdgeId, selectedNodeId])

  const loadFlows = useCallback(async (options = {}) => {
    const silent = options?.silent === true
    const finalStatus = options?.finalStatus || ''

    if (!silent) {
      setStatus('Loading flows...')
    }

    try {
      const result = await apiRequest('/api/chat_flow/get_mine', { token: tokens.user })
      setFlows(Array.isArray(result?.data) ? result.data : [])
      setStatus(finalStatus)
    } catch (error) {
      setStatus(error.message || 'Unable to load flows')
    }
  }, [tokens.user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadFlows()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadFlows])

  async function openFlow(nextFlowId, nextTitle = '') {
    setFlowId(nextFlowId)
    setTitle(nextTitle)
    setStatus('Loading flow detail...')

    try {
      const [detailResult, activityResult] = await Promise.all([
        apiRequest('/api/chat_flow/get_by_flow_id', {
          method: 'POST',
          token: tokens.user,
          body: { flowId: nextFlowId },
        }),
        apiRequest('/api/chat_flow/get_activity', {
          method: 'POST',
          token: tokens.user,
          body: { flowId: nextFlowId },
        }),
      ])

      setNodesJson(prettyJson(detailResult?.nodes || []))
      setEdgesJson(prettyJson(detailResult?.edges || []))
      setActivity({
        prevent: Array.isArray(activityResult?.prevent) ? activityResult.prevent : [],
        ai: Array.isArray(activityResult?.ai) ? activityResult.ai : [],
      })
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load flow detail')
    }
  }

  function newFlow() {
    setFlowId(createFlowId())
    setTitle('Untitled Flow')
    setNodesJson(prettyJson([]))
    setEdgesJson(prettyJson([]))
    setActivity({ prevent: [], ai: [] })
    setStatus('New flow draft ready.')
  }

  function applyBotTemplate() {
    if (!template.trigger.trim()) {
      setStatus('Trigger phrase is required.')
      return
    }

    if (!template.reply.trim()) {
      setStatus('Reply message is required.')
      return
    }

    const nextFlowId = flowId || createFlowId()
    const flow = buildBotReadyFlow(template)
    setFlowId(nextFlowId)
    setTitle(title || `Bot reply for ${template.trigger.trim()}`)
    setNodesJson(prettyJson(flow.nodes))
    setEdgesJson(prettyJson(flow.edges))
    setStatus('Bot-ready flow draft generated.')
  }

  const onNodesChange = useCallback((changes) => {
    setCanvasNodes((currentNodes) => {
      const nextNodes = applyNodeChanges(changes, currentNodes)
      setNodesJson(prettyJson(nextNodes.map(toPersistedNode)))
      return nextNodes
    })
  }, [])

  const onEdgesChange = useCallback((changes) => {
    setCanvasEdges((currentEdges) => {
      const nextEdges = applyEdgeChanges(changes, currentEdges)
      setEdgesJson(prettyJson(nextEdges.map(toPersistedEdge)))
      return nextEdges
    })
  }, [])

  const onConnect = useCallback((connection) => {
    setCanvasEdges((currentEdges) => {
      const nextEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}-${Date.now().toString(36)}`,
        sourceHandle: connection.sourceHandle || 'next',
      }
      const nextEdges = addEdge(toCanvasEdge(nextEdge), currentEdges)
      setEdgesJson(prettyJson(nextEdges.map(toPersistedEdge)))
      return nextEdges
    })
  }, [])

  function addVisualNode(flowType) {
    const nextId = `${flowType.toLowerCase()}-${Date.now().toString(36)}`
    const offset = canvasNodes.length * 42
    const x = flowType === 'TRIGGER' ? 60 + offset : 360 + offset
    const y = flowType === 'TRIGGER' ? 90 + offset : 120 + offset
    const nextNode = toCanvasNode(createPaletteNode(flowType, nextId, x, y))
    const paletteItem = nodePalette.find((item) => item.type === flowType)

    syncCanvasGraph([...canvasNodes, nextNode], canvasEdges)
    setSelectedNodeId(nextId)
    setSelectedEdgeId('')
    setStatus(`${paletteItem?.label || flowType} node added.`)
  }

  function updateSelectedNode(field, value) {
    if (!selectedNode) {
      return
    }

    const nextNodes = canvasNodes.map((node) => {
      if (node.id !== selectedNode.id) {
        return node
      }

      if (field === 'label') {
        return {
          ...node,
          data: {
            ...node.data,
            label: value,
          },
        }
      }

      return withNodeMessage(node, value)
    })

    syncCanvasGraph(nextNodes, canvasEdges)
  }

  function updateSelectedNodeResource(value) {
    if (!selectedNode) {
      return
    }

    const nextNodes = canvasNodes.map((node) => (node.id === selectedNode.id ? withNodeResource(node, value) : node))
    syncCanvasGraph(nextNodes, canvasEdges)
  }

  function updateSelectedLocation(field, value) {
    if (!selectedNode) {
      return
    }

    const nextNodes = canvasNodes.map((node) =>
      node.id === selectedNode.id ? withLocationField(node, field, value) : node,
    )
    syncCanvasGraph(nextNodes, canvasEdges)
  }

  function updateSelectedQuickReplies(value) {
    if (!selectedNode) {
      return
    }

    const nextNodes = canvasNodes.map((node) => (node.id === selectedNode.id ? withQuickReplyLabels(node, value) : node))
    syncCanvasGraph(nextNodes, canvasEdges)
  }

  function updateSelectedEdgeSourceHandle(value) {
    if (!selectedEdge) {
      return
    }

    const nextEdges = canvasEdges.map((edge) => {
      if (edge.id !== selectedEdge.id) {
        return edge
      }

      return toCanvasEdge({
        ...edge,
        sourceHandle: value,
      })
    })

    syncCanvasGraph(canvasNodes, nextEdges)
  }

  async function saveFlow(event) {
    event.preventDefault()
    const parsedNodes = parseJsonField(nodesJson, 'Nodes')
    const parsedEdges = parseJsonField(edgesJson, 'Edges')

    if (!parsedNodes.success) {
      setStatus(parsedNodes.error)
      return
    }

    if (!parsedEdges.success) {
      setStatus(parsedEdges.error)
      return
    }

    const nextFlowId = flowId || createFlowId()
    setStatus('Saving flow...')

    try {
      const result = await apiRequest('/api/chat_flow/add_new', {
        method: 'POST',
        token: tokens.user,
        body: {
          title,
          flowId: nextFlowId,
          nodes: parsedNodes.data,
          edges: parsedEdges.data,
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to save flow')
        return
      }

      setFlowId(nextFlowId)
      await loadFlows({ silent: true, finalStatus: 'Flow saved.' })
    } catch (error) {
      setStatus(error.message || 'Unable to save flow')
    }
  }

  async function deleteFlow(flow) {
    setStatus('Deleting flow...')
    try {
      const result = await apiRequest('/api/chat_flow/del_flow', {
        method: 'POST',
        token: tokens.user,
        body: {
          id: flow.id,
          flowId: flow.flow_id,
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete flow')
        return
      }

      if (flow.flow_id === flowId) {
        setFlowId('')
        setTitle('')
        setNodesJson(prettyJson([]))
        setEdgesJson(prettyJson([]))
        setActivity({ prevent: [], ai: [] })
      }

      await loadFlows({ silent: true, finalStatus: 'Flow deleted.' })
    } catch (error) {
      setStatus(error.message || 'Unable to delete flow')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">automation flows</span>
          <h2>Real flow CRUD over `/api/chat_flow`</h2>
          <p>Flow list, detail loading, JSON editing, save, delete, and activity inspection are wired to the backend.</p>
        </div>
        <button className="primary-button" type="button" onClick={newFlow}>
          New flow
        </button>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <span>Saved flows</span>
          <strong>{flows.length}</strong>
        </article>
        <article className="dashboard-card">
          <span>Nodes</span>
          <strong>{nodeCount}</strong>
        </article>
        <article className="dashboard-card">
          <span>Edges</span>
          <strong>{edgeCount}</strong>
        </article>
        <article className="dashboard-card">
          <span>Bot triggers</span>
          <strong>{triggerCount}</strong>
        </article>
      </div>

      <div className="inbox-layout">
        <aside className="panel inbox-sidebar">
          <div className="panel-header">
            <h2>Saved flows</h2>
          </div>
          <div className="chat-list">
            {flows.map((flow) => (
              <div className="list-row" key={flow.flow_id}>
                <button
                  className={classNames('chat-list-item', flow.flow_id === flowId ? 'active' : '')}
                  type="button"
                  onClick={() => openFlow(flow.flow_id, flow.title)}
                >
                  <strong>{flow.title}</strong>
                  <span>{flow.flow_id}</span>
                </button>
                <button className="mini-button subtle-danger" type="button" onClick={() => deleteFlow(flow)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </aside>

        <section className="page-stack">
          <div className="panel form-panel">
            <div className="panel-header">
              <h2>Bot-ready flow template</h2>
            </div>
            <div className="form-grid">
              <label>
                Trigger phrase
                <input
                  value={template.trigger}
                  onChange={(event) => setTemplate({ ...template, trigger: event.target.value })}
                />
              </label>
              <label>
                Reply message
                <textarea
                  rows={3}
                  value={template.reply}
                  onChange={(event) => setTemplate({ ...template, reply: event.target.value })}
                />
              </label>
              <label>
                Fallback reply
                <textarea
                  rows={3}
                  value={template.fallback}
                  onChange={(event) => setTemplate({ ...template, fallback: event.target.value })}
                />
              </label>
            </div>
            <button className="secondary-button dark-text" type="button" onClick={applyBotTemplate}>
              Generate bot-ready flow
            </button>
          </div>

          <form className="panel form-panel" onSubmit={saveFlow}>
            <div className="panel-header">
              <h2>Flow editor</h2>
            </div>
            <label>
              Title
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Flow title" />
            </label>
            <label>
              Flow ID
              <input value={flowId} onChange={(event) => setFlowId(event.target.value)} placeholder="flow identifier" />
            </label>
            <label>
              Nodes JSON
              <textarea rows={10} value={nodesJson} onChange={(event) => setNodesJson(event.target.value)} />
            </label>
            <label>
              Edges JSON
              <textarea rows={10} value={edgesJson} onChange={(event) => setEdgesJson(event.target.value)} />
            </label>
            <button className="primary-button" type="submit">
              Save flow
            </button>
          </form>

          <div className="panel flow-canvas-panel">
            <div className="panel-header">
              <h2>Visual flow canvas</h2>
              <div className="button-row flow-palette" aria-label="Flow node palette">
                {nodePalette.map((item) => (
                  <button className="mini-button" key={item.type} type="button" onClick={() => addVisualNode(item.type)}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flow-builder-grid">
              <div className="flow-canvas" aria-label="Visual automation flow canvas">
                <ReactFlow
                  nodes={canvasNodes}
                  edges={canvasEdges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={(_, node) => {
                    setSelectedNodeId(node.id)
                    setSelectedEdgeId('')
                  }}
                  onEdgeClick={(_, edge) => {
                    setSelectedEdgeId(edge.id)
                    setSelectedNodeId('')
                  }}
                  fitView
                >
                  <MiniMap pannable zoomable />
                  <Controls />
                  <Background />
                </ReactFlow>
              </div>
              <div className="flow-inspector">
                <h3>Selected node</h3>
                {selectedNode ? (
                  <>
                    <p>{getFlowNodeType(selectedNode)} node</p>
                    <label>
                      Node label
                      <input
                        value={selectedNode.data?.label || ''}
                        onChange={(event) => updateSelectedNode('label', event.target.value)}
                      />
                    </label>
                    <label>
                      {getFlowNodeType(selectedNode) === 'AI_BOT' ? 'AI instruction' : 'Message body'}
                      <textarea
                        rows={4}
                        value={getNodeMessage(selectedNode)}
                        onChange={(event) => updateSelectedNode('message', event.target.value)}
                      />
                    </label>
                    {['IMAGE', 'DOCUMENT'].includes(getFlowNodeType(selectedNode)) ? (
                      <label>
                        Media URL
                        <input value={getNodeResource(selectedNode)} onChange={(event) => updateSelectedNodeResource(event.target.value)} />
                      </label>
                    ) : null}
                    {getFlowNodeType(selectedNode) === 'LOCATION' ? (
                      <>
                        <label>
                          Latitude
                          <input
                            value={getLocationField(selectedNode, 'latitude')}
                            onChange={(event) => updateSelectedLocation('latitude', event.target.value)}
                          />
                        </label>
                        <label>
                          Longitude
                          <input
                            value={getLocationField(selectedNode, 'longitude')}
                            onChange={(event) => updateSelectedLocation('longitude', event.target.value)}
                          />
                        </label>
                        <label>
                          Address
                          <input
                            value={getLocationField(selectedNode, 'address')}
                            onChange={(event) => updateSelectedLocation('address', event.target.value)}
                          />
                        </label>
                      </>
                    ) : null}
                    {getFlowNodeType(selectedNode) === 'BUTTON' ? (
                      <label>
                        Quick replies
                        <input
                          value={getQuickReplyLabels(selectedNode)}
                          onChange={(event) => updateSelectedQuickReplies(event.target.value)}
                        />
                      </label>
                    ) : null}
                  </>
                ) : (
                  <p>Select a node on the canvas to edit its label and message.</p>
                )}

                <h3>Selected edge</h3>
                {selectedEdge ? (
                  <label>
                    Trigger / source handle
                    <input
                      value={selectedEdge.sourceHandle || ''}
                      onChange={(event) => updateSelectedEdgeSourceHandle(event.target.value)}
                    />
                  </label>
                ) : (
                  <p>Select an edge to edit the trigger value used by the chatbot runtime.</p>
                )}
              </div>
            </div>
          </div>

          <div className="two-column-grid">
            <div className="panel">
              <div className="panel-header">
                <h2>AI activity</h2>
              </div>
              <ul className="signal-list">
                {activity.ai.map((entry) => (
                  <li key={entry.id}>{entry.senderNumber || entry.number || JSON.stringify(entry)}</li>
                ))}
                {!activity.ai.length ? <li>No AI activity entries.</li> : null}
              </ul>
            </div>
            <div className="panel">
              <div className="panel-header">
                <h2>Disabled numbers</h2>
              </div>
              <ul className="signal-list">
                {activity.prevent.map((entry) => (
                  <li key={entry.id}>{entry.senderNumber || entry.number || JSON.stringify(entry)}</li>
                ))}
                {!activity.prevent.length ? <li>No disabled numbers.</li> : null}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default UserAutomationFlowsPage
