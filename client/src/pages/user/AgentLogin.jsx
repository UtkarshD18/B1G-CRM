import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

function UserAgentPage() {
  const { tokens } = useAuth()
  const [agents, setAgents] = useState([])
  const [status, setStatus] = useState('Loading agents...')
  const [actionStatus, setActionStatus] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    comments: '',
  })

  const loadAgents = useCallback(async () => {
    setStatus('Loading agents...')
    try {
      const result = await apiRequest('/api/agent/get_my_agents', { token: tokens.user })
      setAgents(Array.isArray(result?.data) ? result.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load agents')
    }
  }, [tokens.user])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAgents()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadAgents])

  async function createAgent(event) {
    event.preventDefault()
    setActionStatus('Creating agent...')

    try {
      const result = await apiRequest('/api/agent/add_agent', {
        method: 'POST',
        token: tokens.user,
        body: form,
      })

      if (!result?.success) {
        setActionStatus(result?.msg || 'Unable to create agent')
        return
      }

      setForm({
        name: '',
        email: '',
        mobile: '',
        password: '',
        comments: '',
      })
      setActionStatus('Agent created.')
      loadAgents()
    } catch (error) {
      setActionStatus(error.message || 'Unable to create agent')
    }
  }

  async function autoLogin(uid) {
    setActionStatus('Creating agent auto-login token...')

    try {
      const result = await apiRequest('/api/user/auto_agent_login', {
        method: 'POST',
        token: tokens.user,
        body: { uid },
      })

      if (!result?.success || !result?.token) {
        setActionStatus(result?.msg || 'Unable to create auto-login token')
        return
      }

      window.open(`/agent/login?token=${encodeURIComponent(result.token)}`, '_blank', 'noopener')
      setActionStatus('Agent portal opened in a new tab.')
    } catch (error) {
      setActionStatus(error.message || 'Unable to create auto-login token')
    }
  }

  async function deleteAgent(uid, name) {
    if (!window.confirm(`Delete agent "${name}"? This cannot be undone.`)) return
    setActionStatus('Deleting...')
    try {
      const result = await apiRequest('/api/agent/delete_agent', {
        method: 'POST',
        token: tokens.user,
        body: { uid },
      })
      setActionStatus(result?.msg || 'Deleted')
      loadAgents()
    } catch (error) {
      setActionStatus(error.message || 'Unable to delete agent')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #d8f0ea, #b8e6d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem' }}>👤</div>
          <div>
            <h2 style={{ margin: 0 }}>Agent Login</h2>
            <p style={{ margin: 0, color: '#607481', fontSize: '0.9rem' }}>Manage your support agents</p>
          </div>
        </div>
        <button className="mini-button" onClick={loadAgents} style={{ border: '1px solid #1ea085', color: '#1ea085', borderRadius: '10px', padding: '10px 20px' }}>🔄 Refresh</button>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      {actionStatus ? <p className="status-line">{actionStatus}</p> : null}
      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={createAgent} style={{ padding: '24px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ color: '#1ea085' }}>➕</span>
            <strong>Add Agent</strong>
          </div>
          <p style={{ color: '#607481', fontSize: '0.875rem', margin: '0 0 16px' }}>Assign a new agent to your workspace</p>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              placeholder="agent@company.com"
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder="Secure password"
            />
          </label>
          <label>
            Full Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Agent full name" />
          </label>
          <label>
            Mobile Number
            <input
              type="number"
              value={form.mobile}
              onChange={(event) => setForm({ ...form, mobile: event.target.value })}
              placeholder="Phone number"
            />
          </label>
          <label>
            Short Comment
            <textarea
              value={form.comments}
              onChange={(event) => setForm({ ...form, comments: event.target.value })}
              rows={3}
              placeholder="Optional notes about this agent"
            />
          </label>
          <button className="primary-button" type="submit" style={{ borderRadius: '12px' }}>
            Add Agent
          </button>
        </form>

        <div className="panel" style={{ padding: '20px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <strong>Agent List</strong>
            <span style={{ color: '#1ea085', fontWeight: 700, fontSize: '0.85rem' }}>{agents.length} agent{agents.length !== 1 ? 's' : ''}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Auto Login</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Mobile Number</th>
                  <th>Comments</th>
                  <th>Active</th>
                  <th>Chats</th>
                  <th>Actions</th>
                  <th>Delete</th>
                </tr>
              </thead>
              <tbody>
                {agents.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '36px 0' }}>
                      <span className="muted-copy">No agents registered yet.</span>
                    </td>
                  </tr>
                ) : agents.map((agent) => (
                  <tr key={agent.uid}>
                    <td>
                      <button
                        className="mini-button"
                        type="button"
                        onClick={() => autoLogin(agent.uid)}
                        title="Auto Login as this agent"
                        aria-label="Auto Login"
                        style={{ fontSize: '16px', padding: '6px 10px' }}
                      >
                        🔑
                      </button>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '50%',
                          background: '#e2e8f0', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', fontWeight: 'bold', fontSize: '13px',
                          color: '#4a5568', flexShrink: 0
                        }}>
                          {String(agent.name || agent.email || 'A').charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{agent.name || '—'}</span>
                      </div>
                    </td>
                    <td className="muted-copy">{agent.email}</td>
                    <td>{agent.mobile || '—'}</td>
                    <td style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#607481' }} title={agent.comments || ''}>
                      {agent.comments || '—'}
                    </td>
                    <td>
                      <span className="status-chip" style={{
                        backgroundColor: agent.is_active ? '#d1fae5' : '#f3f4f6',
                        color: agent.is_active ? '#065f46' : '#374151',
                        fontSize: '11px', fontWeight: 600
                      }}>
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#1ea085' }}>
                        {agent.chat_count ?? 0}
                      </span>
                    </td>
                    <td>
                      <button
                        className="mini-button"
                        type="button"
                        onClick={() => autoLogin(agent.uid)}
                        title="Open agent portal"
                      >
                        🚀 Login
                      </button>
                    </td>
                    <td>
                      <button
                        className="mini-button subtle-danger"
                        type="button"
                        title="Delete agent"
                        aria-label="Delete agent"
                        onClick={() => deleteAgent(agent.uid, agent.name || agent.email)}
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserAgentPage
