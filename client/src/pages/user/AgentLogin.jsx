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

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">agent login</span>
          <h2>Tenant-managed staff accounts</h2>
          <p>This matches the live model: agents belong to a tenant and can be auto-logged into `/agent`.</p>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      {actionStatus ? <p className="status-line">{actionStatus}</p> : null}
      <div className="two-column-grid">
        <form className="panel form-panel" onSubmit={createAgent}>
          <div className="panel-header">
            <h2>Create agent</h2>
          </div>
          <label>
            Name
            <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
          </label>
          <label>
            Mobile
            <input value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
            />
          </label>
          <label>
            Comments
            <textarea
              value={form.comments}
              onChange={(event) => setForm({ ...form, comments: event.target.value })}
              rows={4}
            />
          </label>
          <button className="primary-button" type="submit">
            Create agent
          </button>
        </form>

        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Current agents</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => (
                <tr key={agent.uid}>
                  <td>{agent.name}</td>
                  <td>{agent.email}</td>
                  <td>{agent.is_active ? 'Active' : 'Inactive'}</td>
                  <td>
                    <button className="mini-button" type="button" onClick={() => autoLogin(agent.uid)}>
                      Auto login
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserAgentPage
