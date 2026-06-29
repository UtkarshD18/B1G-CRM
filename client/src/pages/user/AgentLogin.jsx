import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'

const PERMISSION_GROUPS = {
  'CRM Core': [
    { key: 'inbox.read', label: 'Inbox: Read messages & thread history' },
    { key: 'inbox.reply', label: 'Inbox: Send replies and select quick templates' },
    { key: 'contacts.read', label: 'Contacts: View profile information' },
    { key: 'contacts.write', label: 'Contacts: Create, edit, and export profiles' },
    { key: 'task_access', label: 'Task Access (Legacy)' },
    { key: 'kanban_access', label: 'Kanban Access (Legacy)' },
    { key: 'leads_access', label: 'Leads Access (Legacy)' },
    { key: 'campaigns_access', label: 'Campaigns Access (Legacy)' },
    { key: 'website_access', label: 'Website Manager (Legacy)' },
    { key: 'reports_access', label: 'Supervisor Dashboard (Legacy)' },
    { key: 'billing_access', label: 'Billing Access (Legacy)' },
    { key: 'api_access', label: 'API & Webhooks (Legacy)' }
  ],
  'Knowledge Base': [
    { key: 'kb.read', label: 'KB: Read library papers & document titles' },
    { key: 'kb.write', label: 'KB: Upload documents & scrape website URLs' },
    { key: 'kb.delete', label: 'KB: Remove documents and resources' },
    { key: 'kb.reindex', label: 'KB: Force rebuild of vector embeddings' }
  ],
  'Automation Flows': [
    { key: 'automation.read', label: 'Flows: Access Chatbot Builder & view canvases' },
    { key: 'automation.edit', label: 'Flows: Edit, duplicate, and delete flow logic' },
    { key: 'automation.publish', label: 'Flows: Deploy active automation runs' }
  ],
  'AI Observability': [
    { key: 'ai.inspector', label: 'AI: Developer Execution Logs Inspector drawer' },
    { key: 'ai.execution', label: 'AI: View confidence percentages & latency metadata' },
    { key: 'ai.sources', label: 'AI: View retrieved document citation badges' },
    { key: 'ai.chunks', label: 'AI: View matching raw text chunks & evidences' },
    { key: 'ai.prompt', label: 'AI: View LLM system/user prompts' },
    { key: 'ai.payload', label: 'AI: View raw API request/response JSON payloads' }
  ],
  'Settings': [
    { key: 'settings.ai', label: 'Settings: Configure AI Model Provider credentials' },
    { key: 'settings.whatsapp', label: 'Settings: Manage WhatsApp Cloud API links' },
    { key: 'settings.users', label: 'Settings: Manage staff accounts & permission maps' }
  ]
}

const PERMISSION_KEYS = Object.values(PERMISSION_GROUPS).flat()

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
            
            <div className="permissions-section" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '4px' }}>Assign Permissions</h3>
              {Object.keys(PERMISSION_GROUPS).map(groupName => (
                <div key={groupName} style={{ marginBottom: '1rem' }}>
                  <h4 style={{ margin: '8px 0 4px 0', fontSize: '0.8rem', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em' }}>{groupName}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                    {PERMISSION_GROUPS[groupName].map(p => (
                      <label key={p.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                          type="checkbox" 
                          checked={form.permissions.includes(p.key)}
                          onChange={(e) => handlePermissionChange(p.key, e.target.checked, false)}
                          style={{ marginTop: '3px' }}
                        />
                        <span>{p.label} <code style={{ fontSize: '0.7rem', color: '#9ca3af' }}>({p.key})</code></span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
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
            
            <div className="permissions-section" style={{ marginTop: '1.5rem' }}>
              <h3 style={{ marginBottom: '0.75rem', fontWeight: 600, borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '4px' }}>Modify Permissions</h3>
              {Object.keys(PERMISSION_GROUPS).map(groupName => (
                <div key={groupName} style={{ marginBottom: '1rem' }}>
                  <h4 style={{ margin: '8px 0 4px 0', fontSize: '0.8rem', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em' }}>{groupName}</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '6px' }}>
                    {PERMISSION_GROUPS[groupName].map(p => (
                      <label key={p.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', cursor: 'pointer', fontSize: '0.85rem' }}>
                        <input 
                          type="checkbox" 
                          checked={(editingAgent.permissions || []).includes(p.key)}
                          onChange={(e) => handlePermissionChange(p.key, e.target.checked, true)}
                          style={{ marginTop: '3px' }}
                        />
                        <span>{p.label} <code style={{ fontSize: '0.7rem', color: '#9ca3af' }}>({p.key})</code></span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
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
                    if (parsed.includes(p.key)) perms.push(p.label.split(':')[0]); // keep it short in table
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
