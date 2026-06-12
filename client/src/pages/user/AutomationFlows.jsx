import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { classNames, createFlowId, parseJsonField, prettyJson } from '../../shared/format'

const defaultTemplate = {
  trigger: 'pricing',
  reply: 'Thanks {{senderName}}, our team can help with pricing. What quantity do you need?',
  fallback: 'Thanks for the message. A team member will review this shortly.',
}

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

function UserAutomationFlowsPage() {
  const { tokens } = useAuth()
  const [flows, setFlows] = useState([])
  const [status, setStatus] = useState('Loading flows...')
  const [flowId, setFlowId] = useState('')
  const [title, setTitle] = useState('')
  const [nodesJson, setNodesJson] = useState(prettyJson([]))
  const [edgesJson, setEdgesJson] = useState(prettyJson([]))
  const [template, setTemplate] = useState(defaultTemplate)
  const [activity, setActivity] = useState({ prevent: [], ai: [] })
  const parsedNodes = parseJsonField(nodesJson, 'Nodes')
  const parsedEdges = parseJsonField(edgesJson, 'Edges')
  const nodeCount = parsedNodes.success && Array.isArray(parsedNodes.data) ? parsedNodes.data.length : 0
  const edgeCount = parsedEdges.success && Array.isArray(parsedEdges.data) ? parsedEdges.data.length : 0
  const triggerCount = parsedEdges.success && Array.isArray(parsedEdges.data) ? countBotReadyTriggers(parsedEdges.data) : 0

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
