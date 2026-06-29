import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { classNames } from '../../shared/format'

const integrationTabs = [
  { mode: 'all', label: 'Overview', path: '/user/integrations' },
  { mode: 'meta', label: 'Meta WhatsApp', path: '/user/link-meta-whatsapp' },
  { mode: 'qr', label: 'WhatsApp QR', path: '/user/add-whatsapp-qr' },
  { mode: 'instagram', label: 'Instagram', path: '/user/link-instagram' },
  { mode: 'messenger', label: 'Messenger', path: '/user/link-messenger' },
  { mode: 'email', label: 'Email (SMTP)', path: '/user/link-email' },
  { mode: 'sms', label: 'SMS (Twilio)', path: '/user/link-sms' },
  { mode: 'webchat', label: 'Website Chat', path: '/user/link-webchat' },
]

function randomId() {
  const id = globalThis.crypto?.randomUUID?.()
  return id ? id.slice(0, 12) : `qr-${Date.now()}`
}

function getIntegrationMode(pathname) {
  if (pathname.includes('link-meta-whatsapp')) return 'meta'
  if (pathname.includes('link-instagram')) return 'instagram'
  if (pathname.includes('add-whatsapp-qr')) return 'qr'
  if (pathname.includes('link-messenger')) return 'messenger'
  if (pathname.includes('link-email')) return 'email'
  if (pathname.includes('link-sms')) return 'sms'
  if (pathname.includes('link-webchat')) return 'webchat'
  return 'all'
}

function mapModeToChannelType(mode) {
  if (mode === 'meta') return 'whatsapp_cloud'
  if (mode === 'instagram') return 'instagram'
  if (mode === 'messenger') return 'messenger'
  if (mode === 'email') return 'email'
  if (mode === 'sms') return 'sms'
  if (mode === 'webchat') return 'webchat'
  return null
}

function maskSecret(value) {
  const token = String(value || '').trim()
  if (!token) return 'Not configured'
  if (token.length <= 10) return 'Configured'
  return `${token.slice(0, 6)}...${token.slice(-4)}`
}

function UserIntegrationsPage() {
  const { tokens } = useAuth()
  const location = useLocation()
  const mode = getIntegrationMode(location.pathname)
  const channelType = mapModeToChannelType(mode)

  const [status, setStatus] = useState('Loading integrations...')
  const [apiKey, setApiKey] = useState('')
  const [instances, setInstances] = useState([])
  const [qrForm, setQrForm] = useState({ title: '', uniqueId: randomId() })

  // Dynamic Provider Metadata & Connection states
  const [providersMetadata, setProvidersMetadata] = useState([])
  const [connectionState, setConnectionState] = useState(null)
  const [settingsForm, setSettingsForm] = useState({})
  const [credentialsForm, setCredentialsForm] = useState({})
  const [showTokens, setShowTokens] = useState({})
  const [metrics, setMetrics] = useState(null)

  const currentMetadata = useMemo(() => {
    return providersMetadata.find(p => p.channel_type === channelType)
  }, [providersMetadata, channelType])

  const loadIntegrations = useCallback(async () => {
    setStatus('Loading integrations...')
    try {
      const [profileResult, qrResult, metadataResult] = await Promise.all([
        apiRequest('/api/user/get_me', { token: tokens.user }),
        apiRequest('/api/qr/get_all', { token: tokens.user }),
        apiRequest('/api/channels/metadata', { token: tokens.user })
      ])

      setApiKey(profileResult?.data?.api_key || '')
      setInstances(Array.isArray(qrResult?.data) ? qrResult.data : [])
      
      if (metadataResult?.success) {
        setProvidersMetadata(metadataResult.data)
      }

      // If active tab is a dynamic channel, fetch its connection state
      if (channelType) {
        const connResult = await apiRequest(`/api/channels/${channelType}/connection`, { token: tokens.user })
        if (connResult?.success) {
          setConnectionState(connResult.data.connection)
          setSettingsForm(connResult.data.settings || {})
          
          // Pre-populate empty form values
          const initialCreds = {}
          const meta = metadataResult?.data?.find(p => p.channel_type === channelType)
          meta?.credentialFields?.forEach(f => {
            initialCreds[f.key] = ''
          })
          setCredentialsForm(initialCreds)
        }
      }

      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load integrations')
    }
  }, [tokens.user, channelType])

  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  // Save Dynamic configuration
  async function saveConfig(event) {
    if (event) event.preventDefault()
    setStatus('Saving configurations...')
    try {
      const payload = {
        credentials: credentialsForm,
        settings: settingsForm
      }
      const result = await apiRequest(`/api/channels/${channelType}/save`, {
        method: 'POST',
        token: tokens.user,
        body: payload
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Failed to save configurations')
        return
      }

      setStatus('Configurations saved successfully.')
      loadIntegrations()
    } catch (error) {
      setStatus(error.message || 'Failed to save settings')
    }
  }

  // Test dynamic connection
  async function testConnection() {
    setStatus('Testing connection health...')
    try {
      const result = await apiRequest(`/api/channels/${channelType}/test_connection`, {
        method: 'POST',
        token: tokens.user
      })
      if (result.success) {
        setStatus(`Verification successful: ${result.msg || 'Connected'}`)
      } else {
        setStatus(`Verification failed: ${result.msg || 'Authentication error'}`)
      }
      loadIntegrations()
    } catch (error) {
      setStatus(error.message || 'Verification failed')
    }
  }

  // Disconnect dynamic channel
  async function disconnectChannel() {
    setStatus('Disconnecting channel...')
    try {
      const result = await apiRequest(`/api/channels/${channelType}/disconnect`, {
        method: 'POST',
        token: tokens.user
      })
      if (result?.success) {
        setStatus('Channel disconnected.')
        setCredentialsForm({})
        setSettingsForm({})
        loadIntegrations()
      } else {
        setStatus(result?.msg || 'Disconnect failed')
      }
    } catch (error) {
      setStatus(error.message || 'Disconnect failed')
    }
  }

  async function generateApiKey() {
    setStatus('Generating API key...')
    try {
      const result = await apiRequest('/api/user/generate_api_keys', { token: tokens.user })
      if (!result?.success) {
        setStatus(result?.msg || 'Unable to generate API key')
        return
      }
      setApiKey(result.token)
      setStatus('API key generated.')
    } catch (error) {
      setStatus(error.message || 'Unable to generate API key')
    }
  }

  async function createQr(event) {
    event.preventDefault()
    setStatus('Creating QR instance...')
    try {
      const result = await apiRequest('/api/qr/gen_qr', {
        method: 'POST',
        token: tokens.user,
        body: qrForm
      })
      if (!result?.success) {
        setStatus(result?.msg || 'Unable to create QR instance')
        return
      }
      setQrForm({ title: '', uniqueId: randomId() })
      setStatus('QR instance created.')
      loadIntegrations()
    } catch (error) {
      setStatus(error.message || 'Unable to create QR instance')
    }
  }

  async function deleteQr(uniqueId) {
    setStatus('Deleting QR instance...')
    try {
      const result = await apiRequest('/api/qr/del_instance', {
        method: 'POST',
        token: tokens.user,
        body: { uniqueId }
      })
      if (result?.success === false) {
        setStatus(result?.msg || 'Unable to delete QR instance')
        return
      }
      setStatus('QR instance deleted.')
      loadIntegrations()
    } catch (error) {
      setStatus(error.message || 'Unable to delete QR instance')
    }
  }

  // Poll QR instances if generating/scanning
  useEffect(() => {
    const hasGeneratingOrScan = instances.some(
      (inst) => inst.status === 'GENERATING' || inst.status === 'SCAN_QR'
    )
    if (!hasGeneratingOrScan) return undefined

    const interval = setInterval(() => {
      apiRequest('/api/qr/get_all', { token: tokens.user })
        .then((qrResult) => {
          setInstances(Array.isArray(qrResult?.data) ? qrResult.data : [])
        })
        .catch((err) => console.error(err))
    }, 3000)

    return () => clearInterval(interval)
  }, [instances, tokens.user])

  const toggleTokenVisibility = (key) => {
    setShowTokens(curr => ({ ...curr, [key]: !curr[key] }))
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">integrations</span>
          <h2>Transport Connection Console</h2>
          <p>Configure credential variables, operation modes, and test pipeline routing for omnichannel communications.</p>
        </div>
        <button className="primary-button" type="button" onClick={loadIntegrations}>
          Refresh Connections
        </button>
      </div>

      <div className="tab-row integration-tabs" aria-label="Integration channels">
        {integrationTabs.map((tab) => (
          <Link
            className={classNames('tab-button', mode === tab.mode ? 'active' : '')}
            key={tab.mode}
            to={tab.path}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      {mode === 'all' && (
        <div className="two-column-grid">
          <div className="panel form-panel">
            <div className="panel-header">
              <h2>Public API Key</h2>
            </div>
            <p className="muted-copy">Use this token payload with `/api/v1/send-message` and `/api/v1/send_templet` routes.</p>
            <div className="copy-chip">{apiKey || 'No API key generated yet.'}</div>
            <button className="primary-button" type="button" onClick={generateApiKey}>
              Generate API key
            </button>
            <div className="meta-block">
              <p>API Endpoint: `/api/v1`</p>
              <p>Global Webhook: `/api/inbox/webhook/:uid`</p>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Active Connections</h2>
            </div>
            <div className="readiness-list">
              {providersMetadata.map(p => (
                <div className="readiness-row ready" key={p.channel_type}>
                  <span>Available</span>
                  <strong>{p.name}</strong>
                  <small>Ver: {p.providerVersion} | API: {p.apiVersion}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === 'qr' && (
        <>
          <div className="two-column-grid">
            <form className="panel form-panel" onSubmit={createQr}>
              <div className="panel-header">
                <h2>Configure QR Session</h2>
              </div>
              <label>
                Title / Session Label
                <input value={qrForm.title} onChange={(event) => setQrForm({ ...qrForm, title: event.target.value })} required />
              </label>
              <label>
                Unique ID
                <input
                  value={qrForm.uniqueId}
                  onChange={(event) => setQrForm({ ...qrForm, uniqueId: event.target.value })}
                  required
                />
              </label>
              <button className="primary-button" type="submit">
                Create Session
              </button>
            </form>

            <div className="panel form-panel">
              <div className="panel-header">
                <h2>Connection Requirements</h2>
              </div>
              <div className="readiness-list">
                <div className="readiness-row ready">
                  <span>Required</span>
                  <strong>Session Name</strong>
                  <small>Identifies device instance</small>
                </div>
                <div className="readiness-row ready">
                  <span>Required</span>
                  <strong>Browser Profile</strong>
                  <small>Stored local session data</small>
                </div>
              </div>
            </div>
          </div>

          <div className="panel table-panel">
            <div className="panel-header">
              <h2>QR Session Devices</h2>
            </div>
            {!instances.length ? (
              <div className="empty-onboarding-card">
                <h3>No QR sessions configured</h3>
                <p>Add a session label, generate a unique ID, and scan the QR code to link devices via Baileys.</p>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Label</th>
                    <th>Status</th>
                    <th>Unique ID</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {instances.map((instance) => {
                    const uniqueId = instance.uniqueid || instance.uniqueId || instance.unique_id
                    let qrImg = null
                    if (instance.status === 'SCAN_QR' && instance.other) {
                      try {
                        const parsed = typeof instance.other === 'string' ? JSON.parse(instance.other) : instance.other
                        if (parsed?.qr) {
                          qrImg = parsed.qr
                        }
                      } catch (e) {
                        console.error(e)
                      }
                    }
                    return (
                      <tr key={uniqueId}>
                        <td>{instance.title}</td>
                        <td>
                          <div>
                            <strong>{instance.status || 'Created'}</strong>
                            {qrImg && (
                              <div style={{ marginTop: '8px' }}>
                                <img src={qrImg} alt="Scan QR" style={{ width: '128px', height: '128px', border: '1px solid #ccc', borderRadius: '4px' }} />
                              </div>
                            )}
                          </div>
                        </td>
                        <td>{uniqueId}</td>
                        <td>
                          <button
                            className="mini-button subtle-danger"
                            type="button"
                            onClick={() => deleteQr(uniqueId)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* Dynamic Metadata Driven connection cards */}
      {currentMetadata && connectionState && (
        <div className="two-column-grid">
          <form className="panel form-panel" onSubmit={saveConfig}>
            <div className="panel-header">
              <div>
                <h2>{currentMetadata.name} Setup</h2>
                <p>Enter connection credential properties described by the provider.</p>
              </div>
              <span className={classNames('status-chip', 
                connectionState.connection_status === 'CONNECTED' ? 'ready' : '',
                connectionState.connection_status === 'ERROR' ? 'blocked' : ''
              )}>
                {connectionState.connection_status || 'NEW'}
              </span>
            </div>

            <div className="form-grid">
              <h3 style={{ gridColumn: 'span 2', fontSize: '0.9rem', opacity: 0.8, marginTop: '8px' }}>Credentials & Secrets</h3>
              
              {currentMetadata.credentialFields.map((field) => (
                <label key={field.key} style={{ gridColumn: 'span 2' }}>
                  {field.label} {field.required && <span className="danger-text">*</span>}
                  <div style={{ position: 'relative', display: 'flex' }}>
                    <input
                      autoComplete="new-password"
                      type={field.secret && !showTokens[field.key] ? 'password' : 'text'}
                      value={credentialsForm[field.key] || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, [field.key]: e.target.value })}
                      placeholder={field.helpText || `Enter ${field.label}`}
                      required={field.required}
                    />
                    {field.secret && (
                      <button 
                        type="button" 
                        onClick={() => toggleTokenVisibility(field.key)}
                        style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', opacity: 0.7 }}
                      >
                        {showTokens[field.key] ? '🙈' : '👁️'}
                      </button>
                    )}
                  </div>
                </label>
              ))}

              <h3 style={{ gridColumn: 'span 2', fontSize: '0.9rem', opacity: 0.8, marginTop: '16px' }}>Settings & Modes</h3>
              
              {currentMetadata.settingFields.map((field) => (
                <label key={field.key} style={{ gridColumn: 'span 2' }}>
                  {field.label}
                  {field.type === 'select' ? (
                    <select
                      value={settingsForm[field.key] || field.default || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, [field.key]: e.target.value })}
                    >
                      {field.options.map(opt => (
                        <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={settingsForm[field.key] || field.default || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, [field.key]: e.target.value })}
                      placeholder={field.helpText || `Enter ${field.label}`}
                    />
                  )}
                </label>
              ))}
            </div>

            <div className="action-row">
              <button className="primary-button" type="submit">
                Save Configurations
              </button>
              {connectionState.connection_status !== 'DISCONNECTED' && (
                <button className="mini-button subtle-danger" type="button" onClick={disconnectChannel}>
                  Disconnect
                </button>
              )}
            </div>
          </form>

          <div className="panel form-panel">
            <div className="panel-header">
              <h2>Verification & Health</h2>
            </div>
            
            <div className="readiness-list">
              <div className="readiness-row ready">
                <span>Active Mode</span>
                <strong>{connectionState.mode?.toUpperCase() || 'MOCK'}</strong>
                <small>Mode defined in settings</small>
              </div>

              <div className={classNames('readiness-row', connectionState.connection_status === 'CONNECTED' ? 'ready' : 'blocked')}>
                <span>Health</span>
                <strong>{connectionState.connection_status || 'NEW'}</strong>
                <small>Last Error: {connectionState.last_error || 'None'}</small>
              </div>

              <div className="readiness-row ready">
                <span>Last Verified</span>
                <strong>{connectionState.last_verified_at ? new Date(connectionState.last_verified_at).toLocaleString() : 'Never'}</strong>
                <small>API Ver: {connectionState.api_version || currentMetadata.apiVersion}</small>
              </div>

              <div className="readiness-row ready">
                <span>Capabilities</span>
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {Object.entries(currentMetadata.capabilities).map(([cap, supported]) => (
                    <span 
                      key={cap} 
                      className={classNames('status-chip', supported ? 'ready' : '')} 
                      style={{ fontSize: '0.7rem', padding: '2px 6px', background: supported ? 'var(--ready-bg)' : 'var(--blocked-bg)' }}
                    >
                      {cap}: {supported ? 'Yes' : 'No'}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="action-row" style={{ marginTop: '16px' }}>
              <button className="secondary-button dark-text" type="button" onClick={testConnection}>
                Test Connection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserIntegrationsPage
