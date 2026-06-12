import { useCallback, useEffect, useMemo, useState } from 'react'
import { API_BASE, apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { decodeTokenPayload, formatDateTime, prettyJson, summarizePlan } from '../../shared/format'

function getDisplayBaseUrl() {
  if (API_BASE && API_BASE.startsWith('http')) {
    return API_BASE
  }

  return typeof window !== 'undefined' ? window.location.origin : ''
}

function buildSendMessageSample(apiKey) {
  return prettyJson({
    messageObject: {
      to: '15551234567',
      type: 'text',
      text: {
        body: 'Hello from B1GCRM API',
      },
    },
    token: apiKey || 'YOUR_API_KEY',
  })
}

function buildTemplateSample(apiKey) {
  return prettyJson({
    token: apiKey || 'YOUR_API_KEY',
    sendTo: '15551234567',
    templetName: 'order_update',
    exampleArr: ['A-1004', 'Shipped'],
    mediaUri: '',
  })
}

function UserDeveloperApiPage() {
  const { tokens } = useAuth()
  const decoded = decodeTokenPayload(tokens.user)
  const [status, setStatus] = useState('Loading API workspace...')
  const [profile, setProfile] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [copied, setCopied] = useState('')

  const baseUrl = getDisplayBaseUrl()
  const webhookUrl = `${baseUrl}/api/inbox/webhook/${decoded?.uid || ':uid'}`
  const sendMessageUrl = `${baseUrl}/api/v1/send-message?token=${apiKey || 'YOUR_API_KEY'}`
  const templateUrl = `${baseUrl}/api/v1/send_templet`

  const loadProfile = useCallback(async () => {
    setStatus('Loading API workspace...')
    try {
      const result = await apiRequest('/api/user/get_me', { token: tokens.user })
      if (!result?.success) {
        setStatus(result?.msg || 'Unable to load API profile')
        return
      }

      setProfile(result.data || null)
      setApiKey(result.data?.api_key || '')
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load API workspace')
    }
  }, [tokens.user])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

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

  async function copyText(label, value) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(label)
      window.setTimeout(() => setCopied(''), 1600)
    } catch {
      setCopied('')
    }
  }

  const apiReadiness = useMemo(
    () => [
      {
        label: 'API key',
        ready: Boolean(apiKey),
        detail: apiKey ? 'Generated' : 'Generate a key before using REST endpoints',
      },
      {
        label: 'Active plan',
        ready: Boolean(profile?.plan && profile?.plan_expire),
        detail: summarizePlan(profile?.plan),
      },
      {
        label: 'Plan expiry',
        ready: Boolean(profile?.plan_expire),
        detail: formatDateTime(profile?.plan_expire),
      },
      {
        label: 'Webhook URL',
        ready: Boolean(decoded?.uid),
        detail: decoded?.uid ? 'Ready for Meta/webhook setup' : 'Login token missing uid',
      },
    ],
    [apiKey, decoded?.uid, profile?.plan, profile?.plan_expire],
  )

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">api dashboard</span>
          <h2>REST API, template API, and webhook setup</h2>
          <p>Expose the developer surfaces confirmed in the reference SaaS without changing the database.</p>
        </div>
        <button className="primary-button" type="button" onClick={loadProfile}>
          Refresh
        </button>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="dashboard-grid">
        {apiReadiness.map((item) => (
          <div className="dashboard-card" key={item.label}>
            <span className="dashboard-label">{item.label}</span>
            <strong>{item.ready ? 'Ready' : 'Needs setup'}</strong>
            <span>{item.detail}</span>
          </div>
        ))}
      </div>

      <div className="two-column-grid">
        <div className="panel form-panel">
          <div className="panel-header">
            <h2>API key</h2>
          </div>
          <p className="muted-copy">This key is stored on the tenant profile and is required by `/api/v1` endpoints.</p>
          <div className="copy-chip">{apiKey || 'No API key generated yet.'}</div>
          <div className="action-row">
            <button className="primary-button" type="button" onClick={generateApiKey}>
              Generate API key
            </button>
            {apiKey ? (
              <button className="secondary-button dark-text" type="button" onClick={() => copyText('API key', apiKey)}>
                Copy key
              </button>
            ) : null}
          </div>
          {copied === 'API key' ? <p className="status-line">API key copied.</p> : null}
        </div>

        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Webhook endpoint</h2>
          </div>
          <p className="muted-copy">Use this URL in Meta or external systems that need to push inbound events.</p>
          <div className="copy-chip">{webhookUrl}</div>
          <button className="primary-button" type="button" onClick={() => copyText('Webhook URL', webhookUrl)}>
            Copy webhook URL
          </button>
          {copied === 'Webhook URL' ? <p className="status-line">Webhook URL copied.</p> : null}
        </div>
      </div>

      <div className="two-column-grid">
        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Conversational REST API</h2>
          </div>
          <div className="endpoint-row">
            <span>POST</span>
            <code>{sendMessageUrl}</code>
          </div>
          <pre className="code-block">{buildSendMessageSample(apiKey)}</pre>
          <button className="primary-button" type="button" onClick={() => copyText('Message sample', buildSendMessageSample(apiKey))}>
            Copy sample body
          </button>
        </div>

        <div className="panel form-panel">
          <div className="panel-header">
            <h2>Template API</h2>
          </div>
          <div className="endpoint-row">
            <span>POST</span>
            <code>{templateUrl}</code>
          </div>
          <pre className="code-block">{buildTemplateSample(apiKey)}</pre>
          <button className="primary-button" type="button" onClick={() => copyText('Template sample', buildTemplateSample(apiKey))}>
            Copy sample body
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>What is still pending</h2>
        </div>
        <ul className="signal-list">
          <li>Webhook automation rules need their own database model and rule builder UI.</li>
          <li>Webhook logs need persistent request logging before a log viewer can be accurate.</li>
          <li>API analytics need counters around `/api/v1` traffic before charts can be real.</li>
        </ul>
      </div>
    </div>
  )
}

export default UserDeveloperApiPage
