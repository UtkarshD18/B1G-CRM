import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { classNames, createFlowId, parseJsonField, prettyJson } from '../../shared/format'

function UserAutomationFlowsPage() {
  const { tokens } = useAuth()
  const [flows, setFlows] = useState([])
  const [status, setStatus] = useState('Loading flows...')
  const [flowId, setFlowId] = useState('')
  const [title, setTitle] = useState('')
  const [nodesJson, setNodesJson] = useState(prettyJson([]))
  const [edgesJson, setEdgesJson] = useState(prettyJson([]))
  const [activity, setActivity] = useState({ prevent: [], ai: [] })

  const loadFlows = useCallback(async () => {
    setStatus('Loading flows...')
    try {
      const result = await apiRequest('/api/chat_flow/get_mine', { token: tokens.user })
      setFlows(Array.isArray(result?.data) ? result.data : [])
      setStatus('')
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
      setStatus('Flow saved.')
      loadFlows()
      openFlow(nextFlowId, title)
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

      setStatus('Flow deleted.')
      loadFlows()
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
