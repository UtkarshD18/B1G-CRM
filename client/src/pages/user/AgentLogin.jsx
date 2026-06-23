import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

const PERMISSION_KEYS = [
  { key: 'inbox_access', label: 'Inbox Access' },
  { key: 'task_access', label: 'Task Access' },
  { key: 'contacts_access', label: 'Contacts Access' },
  { key: 'kanban_access', label: 'Kanban Access' },
  { key: 'leads_access', label: 'Leads Access' },
  { key: 'campaigns_access', label: 'Campaigns Access' },
  { key: 'flows_access', label: 'Flows Access' },
  { key: 'chatbot_access', label: 'Chatbot Access' },
  { key: 'knowledgebase_access', label: 'Knowledge Base' },
  { key: 'website_access', label: 'Website Manager' },
  { key: 'reports_access', label: 'Supervisor Dashboard' },
  { key: 'billing_access', label: 'Billing Access' },
  { key: 'api_access', label: 'API & Webhooks' },
  { key: 'settings_access', label: 'Settings' }
]

function UserAgentPage() {
  const { tokens } = useAuth()
  const [agents, setAgents] = useState([])
  const [status, setStatus] = useState('Loading agents...')
  const [actionStatus, setActionStatus] = useState('')
  const [editingAgent, setEditingAgent] = useState(null)
  
  const [form, setForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    comments: '',
    permissions: []
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
    loadAgents()
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
        permissions: []
      })
      setActionStatus('Agent created.')
      loadAgents()
    } catch (error) {
      setActionStatus(error.message || 'Unable to create agent')
    }
  }

  async function updateAgent(event) {
    event.preventDefault()
    setActionStatus('Updating agent...')

    try {
      const result = await apiRequest('/api/user/update_agent_profile', {
        method: 'POST',
        token: tokens.user,
        body: {
          uid: editingAgent.uid,
          name: editingAgent.name,
          email: editingAgent.email,
          mobile: editingAgent.mobile,
          newPas: editingAgent.newPas || '',
          permissions: editingAgent.permissions || []
        },
      })

      if (!result?.success) {
        setActionStatus(result?.msg || 'Unable to update agent')
        return
      }

      setEditingAgent(null)
      setActionStatus('Agent updated.')
      loadAgents()
    } catch (error) {
      setActionStatus(error.message || 'Unable to update agent')
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

  const handlePermissionChange = (permKey, isChecked, isEdit = false) => {
    if (isEdit) {
      const currentPerms = editingAgent.permissions || []
      const nextPerms = isChecked 
        ? [...currentPerms, permKey]
        : currentPerms.filter(k => k !== permKey)
      setEditingAgent({ ...editingAgent, permissions: nextPerms })
    } else {
      const currentPerms = form.permissions || []
      const nextPerms = isChecked
        ? [...currentPerms, permKey]
        : currentPerms.filter(k => k !== permKey)
      setForm({ ...form, permissions: nextPerms })
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">agent login</span>
          <h2>Tenant-managed staff accounts & permissions</h2>
          <p>Configure agent roles and granular permissions matching Sprint 14 requirements.</p>
        </div>
      </div>
      {status ? <p className="status-line">{status}</p> : null}
      {actionStatus ? <p className="status-line">{actionStatus}</p> : null}
      
      <div className="two-column-grid">
        {!editingAgent ? (
          <form className="panel form-panel" onSubmit={createAgent}>
            <div className="panel-header">
              <h2>Create agent</h2>
            </div>
            <label>
              Name
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                required
              />
            </label>
            <label>
              Mobile
              <input value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} required />
            </label>
            <label>
              Password
              <input
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                required
              />
            </label>
            <label>
              Comments
              <textarea
                value={form.comments}
                onChange={(event) => setForm({ ...form, comments: event.target.value })}
                rows={2}
              />
            </label>
            
            <div className="permissions-section" style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Assign Permissions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {PERMISSION_KEYS.map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={form.permissions.includes(p.key)}
                      onChange={(e) => handlePermissionChange(p.key, e.target.checked, false)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <button className="primary-button" type="submit" style={{ marginTop: '1.5rem' }}>
              Create agent
            </button>
          </form>
        ) : (
          <form className="panel form-panel" onSubmit={updateAgent}>
            <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Edit Agent: {editingAgent.name}</h2>
              <button type="button" className="mini-button" onClick={() => setEditingAgent(null)}>Cancel</button>
            </div>
            <label>
              Name
              <input value={editingAgent.name} onChange={(event) => setEditingAgent({ ...editingAgent, name: event.target.value })} required />
            </label>
            <label>
              Email
              <input
                type="email"
                value={editingAgent.email}
                onChange={(event) => setEditingAgent({ ...editingAgent, email: event.target.value })}
                required
              />
            </label>
            <label>
              Mobile
              <input value={editingAgent.mobile} onChange={(event) => setEditingAgent({ ...editingAgent, mobile: event.target.value })} required />
            </label>
            <label>
              New Password (Optional)
              <input
                type="password"
                value={editingAgent.newPas || ''}
                onChange={(event) => setEditingAgent({ ...editingAgent, newPas: event.target.value })}
                placeholder="Leave blank to keep current"
              />
            </label>
            
            <div className="permissions-section" style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Modify Permissions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {PERMISSION_KEYS.map(p => (
                  <label key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input 
                      type="checkbox" 
                      checked={(editingAgent.permissions || []).includes(p.key)}
                      onChange={(e) => handlePermissionChange(p.key, e.target.checked, true)}
                    />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            <button className="primary-button" type="submit" style={{ marginTop: '1.5rem' }}>
              Save Changes
            </button>
          </form>
        )}

        <div className="panel table-panel">
          <div className="panel-header">
            <h2>Current agents</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Permissions</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {agents.map((agent) => {
                const perms = [];
                try {
                  const parsed = JSON.parse(agent.permissions || '[]');
                  PERMISSION_KEYS.forEach(p => {
                    if (parsed.includes(p.key)) perms.push(p.label);
                  });
                } catch {
                  // Fallback
                }
                return (
                  <tr key={agent.uid}>
                    <td>{agent.name}</td>
                    <td>{agent.email}</td>
                    <td style={{ fontSize: '0.75rem', color: '#666', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {perms.join(', ') || 'None'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="mini-button" type="button" onClick={() => autoLogin(agent.uid)}>
                          Auto login
                        </button>
                        <button className="mini-button" type="button" style={{ background: '#eee', color: '#333' }} onClick={() => {
                          let parsedPerms = [];
                          try {
                            parsedPerms = JSON.parse(agent.permissions || '[]');
                          } catch {
                            // Empty
                          }
                          setEditingAgent({
                            uid: agent.uid,
                            name: agent.name,
                            email: agent.email,
                            mobile: agent.mobile,
                            permissions: parsedPerms
                          });
                        }}>
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default UserAgentPage
