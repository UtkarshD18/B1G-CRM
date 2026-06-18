import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { classNames } from '../../shared/format'

const metaFields = [
  { key: 'waba_id', label: 'WABA ID' },
  { key: 'business_account_id', label: 'Business account ID' },
  { key: 'business_phone_number_id', label: 'Business phone number ID' },
  { key: 'app_id', label: 'App ID' },
  { key: 'access_token', label: 'Access token', secret: true },
]

const integrationTabs = [
  { mode: 'all', label: 'Overview', path: '/user/integrations' },
  { mode: 'meta', label: 'Meta WhatsApp', path: '/user/link-meta-whatsapp' },
  { mode: 'qr', label: 'WhatsApp QR', path: '/user/add-whatsapp-qr' },
  { mode: 'instagram', label: 'Instagram', path: '/user/link-instagram' },
]

const workflowItems = [
  { title: 'Inbox', detail: 'Cloud API text and media replies' },
  { title: 'Meta templates', detail: 'Template list, create, delete, and media headers' },
  { title: 'Campaigns', detail: 'Broadcast sends through approved templates' },
  { title: 'REST API', detail: 'Tenant API send-message and template endpoints' },
]

function randomId() {
  const id = globalThis.crypto?.randomUUID?.()
  return id ? id.slice(0, 12) : `qr-${Date.now()}`
}

function getIntegrationMode(pathname) {
  if (pathname.includes('link-meta-whatsapp')) {
    return 'meta'
  }
  if (pathname.includes('link-instagram')) {
    return 'instagram'
  }
  if (pathname.includes('add-whatsapp-qr')) {
    return 'qr'
  }
  return 'all'
}

function hasValue(value) {
  return Boolean(String(value || '').trim())
}

function normalizeMetaPayload(meta) {
  return metaFields.reduce((payload, field) => ({
    ...payload,
    [field.key]: String(meta[field.key] || '').trim(),
  }), {})
}

function maskSecret(value) {
  const token = String(value || '').trim()
  if (!token) {
    return 'Not configured'
  }
  if (token.length <= 10) {
    return 'Configured'
  }
  return `${token.slice(0, 6)}...${token.slice(-4)}`
}

function buildMetaReadiness(meta) {
  return [
    { label: 'WABA', ready: hasValue(meta.waba_id), detail: meta.waba_id || 'Missing WABA ID' },
    {
      label: 'Business',
      ready: hasValue(meta.business_account_id),
      detail: meta.business_account_id || 'Missing business account ID',
    },
    {
      label: 'Phone number',
      ready: hasValue(meta.business_phone_number_id),
      detail: meta.business_phone_number_id || 'Missing phone number ID',
    },
    { label: 'App', ready: hasValue(meta.app_id), detail: meta.app_id || 'Missing app ID' },
    { label: 'Token', ready: hasValue(meta.access_token), detail: maskSecret(meta.access_token) },
  ]
}

function UserIntegrationsPage() {
  const { tokens } = useAuth()
  const location = useLocation()
  const mode = getIntegrationMode(location.pathname)
  const [status, setStatus] = useState('Loading integrations...')
  const [meta, setMeta] = useState({
    waba_id: '',
    business_account_id: '',
    access_token: '',
    business_phone_number_id: '',
    app_id: '',
  })
  const [showToken, setShowToken] = useState(false)
  const [lastVerifiedAt, setLastVerifiedAt] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [instances, setInstances] = useState([])
  const [qrForm, setQrForm] = useState({ title: '', uniqueId: randomId() })

  // Instagram credentials states
  const [instaKeys, setInstaKeys] = useState(null)
  const [instaForm, setInstaForm] = useState({
    instagram_business_account_id: '',
    access_token: '',
    username: '',
    name: '',
    app_id: '',
  })

  const metaReadiness = useMemo(() => buildMetaReadiness(meta), [meta])
  const readyMetaCount = metaReadiness.filter((item) => item.ready).length
  const metaReady = readyMetaCount === metaReadiness.length

  const pageCopy = {
    all: {
      title: 'Integration control center',
      text: 'Connect Cloud API, QR sessions, public API keys, and future channels from one tenant workspace.',
    },
    meta: {
      title: 'Link Meta WhatsApp',
      text: 'Store and verify the tenant WhatsApp Cloud API credentials used by inbox, campaigns, templates, and API sends.',
    },
    qr: {
      title: 'Add WhatsApp QR',
      text: 'Create QR-based WhatsApp instances for tenants that operate outside Cloud API.',
    },
    instagram: {
      title: 'Link Instagram',
      text: 'Configure and link the tenant Instagram Business Account for unified inbox direct-messaging and chatbot automations.',
    },
  }[mode]

  const loadIntegrations = useCallback(async () => {
    setStatus('Loading integrations...')
    try {
      const [metaResult, profileResult, qrResult, instaResult] = await Promise.all([
        apiRequest('/api/user/get_meta_keys', { token: tokens.user }),
        apiRequest('/api/user/get_me', { token: tokens.user }),
        apiRequest('/api/qr/get_all', { token: tokens.user }),
        apiRequest('/api/instagram/get_keys', { token: tokens.user }),
      ])

      setMeta((current) => ({ ...current, ...(metaResult?.data || {}) }))
      setApiKey(profileResult?.data?.api_key || '')
      setInstances(Array.isArray(qrResult?.data) ? qrResult.data : [])
      setInstaKeys(instaResult?.data || null)
      if (instaResult?.data) {
        setInstaForm(instaResult.data)
      }
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load integrations')
    }
  }, [tokens.user])

  useEffect(() => {
    loadIntegrations()
  }, [loadIntegrations])

  async function saveInsta(event) {
    if (event) event.preventDefault()
    setStatus('Saving Instagram credentials...')
    try {
      const result = await apiRequest('/api/instagram/save_keys', {
        method: 'POST',
        token: tokens.user,
        body: instaForm,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to connect Instagram')
        return
      }

      setStatus('Instagram connected successfully.')
      loadIntegrations()
    } catch (error) {
      setStatus(error.message || 'Unable to connect Instagram')
    }
  }

  async function disconnectInsta() {
    setStatus('Disconnecting Instagram...')
    try {
      const result = await apiRequest('/api/instagram/disconnect', {
        method: 'POST',
        token: tokens.user,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to disconnect Instagram')
        return
      }

      setInstaForm({
        instagram_business_account_id: '',
        access_token: '',
        username: '',
        name: '',
        app_id: '',
      })
      setInstaKeys(null)
      setStatus('Instagram disconnected.')
      loadIntegrations()
    } catch (error) {
      setStatus(error.message || 'Unable to disconnect Instagram')
    }
  }

  function simulateInstagramOAuth() {
    setInstaForm({
      instagram_business_account_id: 'insta-business-acct-mock',
      access_token: 'mock_token_' + randomId(),
      username: 'mock_instagram_business',
      name: 'Mock Instagram Page',
      app_id: 'mock-app-id-123',
    })
    setStatus('OAuth simulation successful. Click Save to complete connection.')
  }

  useEffect(() => {
    const hasGeneratingOrScan = instances.some(
      (inst) => inst.status === 'GENERATING' || inst.status === 'SCAN_QR'
    )
    if (!hasGeneratingOrScan) {
      return undefined
    }

    const interval = setInterval(() => {
      apiRequest('/api/qr/get_all', { token: tokens.user })
        .then((qrResult) => {
          setInstances(Array.isArray(qrResult?.data) ? qrResult.data : [])
        })
        .catch((err) => console.error(err))
    }, 3000)

    return () => clearInterval(interval)
  }, [instances, tokens.user])

  async function saveMeta(event) {
    event.preventDefault()
    const payload = normalizeMetaPayload(meta)
    const missingField = metaFields.find((field) => !payload[field.key])

    if (missingField) {
      setStatus(`Fill ${missingField.label} before verification.`)
      return
    }

    setStatus('Verifying Meta credentials...')
    try {
      const result = await apiRequest('/api/user/update_meta', {
        method: 'POST',
        token: tokens.user,
        body: payload,
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to save Meta credentials')
        return
      }

      setMeta((current) => ({ ...current, ...payload }))
      setLastVerifiedAt(new Date().toLocaleString())
      setStatus('Meta credentials verified and saved.')
    } catch (error) {
      setStatus(error.message || 'Unable to save Meta credentials')
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
        body: qrForm,
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
        body: { uniqueId },
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

  const showMetaPanels = mode !== 'qr' && mode !== 'instagram'
  const showQrAndApiPanels = mode === 'all' || mode === 'qr'

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">integrations</span>
          <h2>{pageCopy.title}</h2>
          <p>{pageCopy.text}</p>
        </div>
        <button className="primary-button" type="button" onClick={loadIntegrations}>
          Refresh
        </button>
      </div>

      <div className="tab-row integration-tabs" aria-label="Integration sections">
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

      {showMetaPanels ? (
        <>
          <div className="two-column-grid">
            <form className="panel form-panel" onSubmit={saveMeta}>
              <div className="panel-header">
                <div>
                  <h2>Meta WhatsApp Cloud API</h2>
                  <p>{metaReady ? 'Credentials are present.' : `${readyMetaCount}/${metaReadiness.length} fields complete.`}</p>
                </div>
                <span className="status-chip">{metaReady ? 'Ready' : 'Incomplete'}</span>
              </div>
              <div className="form-grid">
                {metaFields.map((field) => (
                  <label key={field.key}>
                    {field.label}
                    <input
                      autoComplete="off"
                      type={field.secret && !showToken ? 'password' : 'text'}
                      value={meta[field.key] || ''}
                      onChange={(event) => setMeta({ ...meta, [field.key]: event.target.value })}
                    />
                  </label>
                ))}
              </div>
              <div className="action-row">
                <button className="primary-button" type="submit">
                  Save and verify Meta
                </button>
                <button className="secondary-button dark-text" type="button" onClick={() => setShowToken((value) => !value)}>
                  {showToken ? 'Hide token' : 'Show token'}
                </button>
              </div>
            </form>

            <div className="panel form-panel">
              <div className="panel-header">
                <h2>Connection readiness</h2>
                <span className="status-chip">{readyMetaCount}/{metaReadiness.length}</span>
              </div>
              <div className="readiness-list">
                {metaReadiness.map((item) => (
                  <div className={classNames('readiness-row', item.ready ? 'ready' : 'blocked')} key={item.label}>
                    <span>{item.ready ? 'Ready' : 'Missing'}</span>
                    <strong>{item.label}</strong>
                    <small>{item.detail}</small>
                  </div>
                ))}
              </div>
              <div className="meta-block">
                <p>Last verified: {lastVerifiedAt || 'Not verified in this session'}</p>
                <p>Backend validation: `/api/user/update_meta` checks the phone number id against Meta Graph API.</p>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Connected workflows</h2>
            </div>
            <div className="workflow-grid">
              {workflowItems.map((item) => (
                <div className="endpoint-row" key={item.title}>
                  <span>{item.title}</span>
                  <p>{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {mode === 'instagram' ? (
        <>
          {!instaKeys && (
            <div className="empty-onboarding-card">
              <h3>No Instagram accounts linked</h3>
              <p>To connect your Instagram Business account to B1GCRM:</p>
              <ol>
                <li>Enter your <strong>Instagram Business Account ID</strong> and <strong>Username</strong>.</li>
                <li>Provide the Facebook Page or User <strong>Access Token</strong> with permissions for <code>instagram_basic</code> and <code>instagram_manage_messages</code>.</li>
                <li>Click <strong>Connect Account</strong>, or use the <strong>Simulate OAuth Flow</strong> button to test inbox capabilities first.</li>
              </ol>
            </div>
          )}
          <div className="two-column-grid">
            <form className="panel form-panel" onSubmit={saveInsta}>
            <div className="panel-header">
              <div>
                <h2>Instagram Business account connection</h2>
                <p>{instaKeys ? 'Credentials are saved and active.' : 'Configure credentials or use simulated OAuth connect.'}</p>
              </div>
              <span className={classNames('status-chip', instaKeys ? 'ready' : '')}>
                {instaKeys ? 'Connected' : 'Disconnected'}
              </span>
            </div>

            <div className="form-grid">
              <label>
                Instagram Business Account ID
                <input
                  type="text"
                  value={instaForm.instagram_business_account_id || ''}
                  onChange={(event) => setInstaForm({ ...instaForm, instagram_business_account_id: event.target.value })}
                  placeholder="e.g. 17841401234567890"
                  required
                />
              </label>

              <label>
                Username
                <input
                  type="text"
                  value={instaForm.username || ''}
                  onChange={(event) => setInstaForm({ ...instaForm, username: event.target.value })}
                  placeholder="e.g. my_business_insta"
                  required
                />
              </label>

              <label>
                Display Name (Optional)
                <input
                  type="text"
                  value={instaForm.name || ''}
                  onChange={(event) => setInstaForm({ ...instaForm, name: event.target.value })}
                  placeholder="e.g. My Business Page"
                />
              </label>

              <label>
                App ID (Optional)
                <input
                  type="text"
                  value={instaForm.app_id || ''}
                  onChange={(event) => setInstaForm({ ...instaForm, app_id: event.target.value })}
                  placeholder="e.g. 1234567890"
                />
              </label>

              <label>
                Access Token
                <input
                  type={showToken ? 'text' : 'password'}
                  value={instaForm.access_token || ''}
                  onChange={(event) => setInstaForm({ ...instaForm, access_token: event.target.value })}
                  placeholder="Page Access Token / User Token"
                  required
                />
              </label>
            </div>

            <div className="action-row">
              <button className="primary-button" type="submit">
                {instaKeys ? 'Save Settings' : 'Connect Account'}
              </button>
              <button className="secondary-button dark-text" type="button" onClick={() => setShowToken((value) => !value)}>
                {showToken ? 'Hide token' : 'Show token'}
              </button>
              {!instaKeys && (
                <button className="secondary-button dark-text" type="button" onClick={simulateInstagramOAuth}>
                  Simulate OAuth Flow
                </button>
              )}
              {instaKeys && (
                <button className="mini-button subtle-danger" type="button" onClick={disconnectInsta}>
                  Disconnect
                </button>
              )}
            </div>
          </form>

          <div className="panel form-panel">
            <div className="panel-header">
              <h2>Connection readiness</h2>
            </div>
            <div className="readiness-list">
              <div className={classNames('readiness-row', instaKeys ? 'ready' : 'blocked')}>
                <span>{instaKeys ? 'Ready' : 'Pending'}</span>
                <strong>Webhook Receiver</strong>
                <small>
                  {tokens.user ? `Webhook URI: /api/instagram/webhook/${tokens.user}` : 'Requires user session token'}
                </small>
              </div>
              <div className={classNames('readiness-row', instaForm.instagram_business_account_id ? 'ready' : 'blocked')}>
                <span>{instaForm.instagram_business_account_id ? 'Ready' : 'Missing'}</span>
                <strong>Business Account ID</strong>
                <small>{instaForm.instagram_business_account_id || 'Missing ID'}</small>
              </div>
              <div className={classNames('readiness-row', instaForm.access_token ? 'ready' : 'blocked')}>
                <span>{instaForm.access_token ? 'Ready' : 'Missing'}</span>
                <strong>Access Token</strong>
                <small>{maskSecret(instaForm.access_token)}</small>
              </div>
            </div>
            {instaKeys && (
              <div className="meta-block" style={{ marginTop: '16px' }}>
                <p><strong>Connected Account:</strong></p>
                <p>Username: @{instaKeys.username}</p>
                <p>Display Name: {instaKeys.name}</p>
                <p>Business ID: {instaKeys.instagram_business_account_id}</p>
              </div>
            )}
          </div>
        </div>
      </>
    ) : null}

      {showQrAndApiPanels ? (
        <>
          <div className="two-column-grid">
            <div className="panel form-panel">
              <div className="panel-header">
                <h2>Public API</h2>
              </div>
              <p className="muted-copy">Use this key with `/api/v1/send-message` and `/api/v1/send_templet`.</p>
              <div className="copy-chip">{apiKey || 'No API key generated yet.'}</div>
              <button className="primary-button" type="button" onClick={generateApiKey}>
                Generate API key
              </button>
              <div className="meta-block">
                <p>Webhook URL: `/api/inbox/webhook/:uid`</p>
                <p>API base: `/api/v1`</p>
              </div>
            </div>

            <form className="panel form-panel" onSubmit={createQr}>
              <div className="panel-header">
                <h2>QR instance</h2>
              </div>
              <label>
                Title
                <input value={qrForm.title} onChange={(event) => setQrForm({ ...qrForm, title: event.target.value })} />
              </label>
              <label>
                Unique ID
                <input
                  value={qrForm.uniqueId}
                  onChange={(event) => setQrForm({ ...qrForm, uniqueId: event.target.value })}
                />
              </label>
              <button className="primary-button" type="submit">
                Create QR instance
              </button>
            </form>
          </div>

          <div className="panel table-panel">
            <div className="panel-header">
              <h2>QR instances</h2>
            </div>
            {!instances.length ? (
              <div className="empty-onboarding-card">
                <h3>No WhatsApp QR instances configured</h3>
                <p>To connect a WhatsApp device via QR code scanner (Baileys/Web JS):</p>
                <ol>
                  <li>Enter a title (e.g. <code>Support Desk WA</code>) and leave the generated Unique ID.</li>
                  <li>Click <strong>Create QR instance</strong>.</li>
                  <li>Wait a few seconds for the instance status to change to <code>SCAN_QR</code>.</li>
                  <li>Scan the generated QR code using your WhatsApp mobile app under Link a Device.</li>
                </ol>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>ID</th>
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
      ) : null}
    </div>
  )
}

export default UserIntegrationsPage
