import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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

const defaultWebhookRule = {
  name: '',
  source: 'external',
  event_type: 'message',
  match_field: 'body.text',
  match_operator: 'contains',
  match_value: 'pricing',
  action_type: 'tag_chat',
  action_payload: prettyJson({ tag: 'Lead' }),
  active: true,
}

function UserDeveloperApiPage() {
  const { tokens } = useAuth()
  const decoded = decodeTokenPayload(tokens.user)
  const [status, setStatus] = useState('Loading API workspace...')
  const [profile, setProfile] = useState(null)
  const [apiKey, setApiKey] = useState('')
  const [copied, setCopied] = useState('')
  const [webhookRules, setWebhookRules] = useState([])
  const [ruleForm, setRuleForm] = useState(defaultWebhookRule)
  const [editingRuleId, setEditingRuleId] = useState('')
  const [logs, setLogs] = useState([])

  const baseUrl = getDisplayBaseUrl()
  const webhookUrl = `${baseUrl}/api/inbox/webhook/${decoded?.uid || ':uid'}`
  const sendMessageUrl = `${baseUrl}/api/v1/send-message?token=${apiKey || 'YOUR_API_KEY'}`
  const templateUrl = `${baseUrl}/api/v1/send_templet`

  const loadProfile = useCallback(async () => {
    setStatus('Loading API workspace...')
    try {
      const [result, rulesResult, logsResult] = await Promise.all([
        apiRequest('/api/user/get_me', { token: tokens.user }),
        apiRequest('/api/webhooks/rules', { token: tokens.user }),
        apiRequest('/api/webhooks/logs', { token: tokens.user }),
      ])
      if (!result?.success) {
        setStatus(result?.msg || 'Unable to load API profile')
        return
      }

      setProfile(result.data || null)
      setApiKey(result.data?.api_key || '')
      setWebhookRules(Array.isArray(rulesResult?.data) ? rulesResult.data : [])
      setLogs(Array.isArray(logsResult?.data) ? logsResult.data : [])
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

  async function saveWebhookRule(event) {
    event.preventDefault()

    let parsedPayload
    try {
      parsedPayload = JSON.parse(ruleForm.action_payload || '{}')
    } catch {
      setStatus('Action payload must be valid JSON.')
      return
    }

    setStatus(editingRuleId ? 'Updating webhook rule...' : 'Creating webhook rule...')
    try {
      const endpoint = editingRuleId ? '/api/webhooks/rules/update' : '/api/webhooks/rules'
      const result = await apiRequest(endpoint, {
        method: 'POST',
        token: tokens.user,
        body: {
          ...ruleForm,
          id: editingRuleId || undefined,
          active: ruleForm.active,
          action_payload: parsedPayload,
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to save webhook rule')
        return
      }

      setRuleForm(defaultWebhookRule)
      setEditingRuleId('')
      await loadProfile()
      setStatus(result.msg || 'Webhook rule saved.')
    } catch (error) {
      setStatus(error.message || 'Unable to save webhook rule')
    }
  }

  function editWebhookRule(rule) {
    setEditingRuleId(rule.id)
    setRuleForm({
      name: rule.name || '',
      source: rule.source || 'external',
      event_type: rule.event_type || 'message',
      match_field: rule.match_field || 'body.text',
      match_operator: rule.match_operator || 'contains',
      match_value: rule.match_value || '',
      action_type: rule.action_type || 'tag_chat',
      action_payload: prettyJson(JSON.parse(rule.action_payload || '{}')),
      active: Number(rule.active) !== 0,
    })
    setStatus('Webhook rule loaded for editing.')
  }

  async function deleteWebhookRule(rule) {
    if (!window.confirm(`Are you sure you want to delete the webhook rule "${rule.name || rule.id}"?`)) {
      return
    }
    setStatus('Deleting webhook rule...')
    try {
      const result = await apiRequest('/api/webhooks/rules/delete', {
        method: 'POST',
        token: tokens.user,
        body: { id: rule.id },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete webhook rule')
        return
      }

      await loadProfile()
      setStatus(result.msg || 'Webhook rule deleted.')
    } catch (error) {
      setStatus(error.message || 'Unable to delete webhook rule')
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
      {
        label: 'Webhook rules',
        ready: webhookRules.length > 0,
        detail: webhookRules.length ? `${webhookRules.length} rule(s) configured` : 'Create rule-based automation',
      },
    ],
    [apiKey, decoded?.uid, profile?.plan, profile?.plan_expire, webhookRules.length],
  )

  const analytics = useMemo(() => {
    let total = logs.length
    let successes = 0
    let failures = 0
    const ruleCounts = {}
    const statusCounts = {}

    logs.forEach(log => {
      const code = Number(log.response_status)
      if (code >= 200 && code < 300) {
        successes++
      } else {
        failures++
      }

      const ruleName = log.rule_name || 'Anonymous Rule'
      ruleCounts[ruleName] = (ruleCounts[ruleName] || 0) + 1

      const statusLabel = log.response_status ? String(log.response_status) : 'FAILED'
      statusCounts[statusLabel] = (statusCounts[statusLabel] || 0) + 1
    })

    return {
      total,
      successes,
      failures,
      successRate: total ? Math.round((successes / total) * 100) : 100,
      ruleCounts: Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
      statusCounts: Object.entries(statusCounts).sort((a, b) => b[1] - a[1]).slice(0, 5),
    }
  }, [logs])

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

      <div className="panel form-panel">
        <div className="panel-header">
          <h2>Webhook automation rules</h2>
          <Link to="/user/webhook-logs" className="secondary-button dark-text">
            View Webhook Logs
          </Link>
        </div>
        <form className="form-panel" onSubmit={saveWebhookRule}>
          <div className="form-grid">
            <label>
              Rule name
              <input
                value={ruleForm.name}
                onChange={(event) => setRuleForm({ ...ruleForm, name: event.target.value })}
                placeholder="Route pricing leads"
              />
            </label>
            <label>
              Source
              <select value={ruleForm.source} onChange={(event) => setRuleForm({ ...ruleForm, source: event.target.value })}>
                <option value="external">External</option>
                <option value="meta">Meta</option>
                <option value="shopify">Shopify</option>
                <option value="wordpress">WordPress</option>
              </select>
            </label>
            <label>
              Event type
              <input value={ruleForm.event_type} onChange={(event) => setRuleForm({ ...ruleForm, event_type: event.target.value })} />
            </label>
            <label>
              Match field
              <input value={ruleForm.match_field} onChange={(event) => setRuleForm({ ...ruleForm, match_field: event.target.value })} />
            </label>
            <label>
              Match operator
              <select
                value={ruleForm.match_operator}
                onChange={(event) => setRuleForm({ ...ruleForm, match_operator: event.target.value })}
              >
                <option value="contains">Contains</option>
                <option value="equals">Equals</option>
                <option value="starts_with">Starts with</option>
                <option value="exists">Exists</option>
              </select>
            </label>
            <label>
              Match value
              <input value={ruleForm.match_value} onChange={(event) => setRuleForm({ ...ruleForm, match_value: event.target.value })} />
            </label>
            <label>
              Action type
              <select value={ruleForm.action_type} onChange={(event) => setRuleForm({ ...ruleForm, action_type: event.target.value })}>
                <option value="tag_chat">Tag chat</option>
                <option value="set_status">Set chat status</option>
                <option value="assign_agent">Assign agent</option>
                <option value="start_flow">Start flow</option>
                <option value="send_webhook">Send webhook</option>
              </select>
            </label>
            <label>
              Rule active
              <input
                type="checkbox"
                checked={ruleForm.active}
                onChange={(event) => setRuleForm({ ...ruleForm, active: event.target.checked })}
              />
            </label>
          </div>
          <label>
            Action payload JSON
            <textarea
              rows={5}
              value={ruleForm.action_payload}
              onChange={(event) => setRuleForm({ ...ruleForm, action_payload: event.target.value })}
            />
          </label>
          <div className="action-row">
            <button className="primary-button" type="submit">
              {editingRuleId ? 'Update rule' : 'Create rule'}
            </button>
            <button
              className="secondary-button dark-text"
              type="button"
              onClick={() => {
                setEditingRuleId('')
                setRuleForm(defaultWebhookRule)
              }}
            >
              Reset rule
            </button>
          </div>
        </form>

        <div className="compact-table">
          <table>
            <thead>
              <tr>
                <th>Rule</th>
                <th>Match</th>
                <th>Action</th>
                <th>Status</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {webhookRules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.name}</td>
                  <td>{`${rule.match_field} ${rule.match_operator} ${rule.match_value || ''}`}</td>
                  <td>{rule.action_type}</td>
                  <td>{Number(rule.active) === 0 ? 'Paused' : 'Active'}</td>
                  <td>
                    <div className="action-row">
                      <button className="mini-button" type="button" onClick={() => editWebhookRule(rule)}>
                        Edit
                      </button>
                      <button className="mini-button subtle-danger" type="button" onClick={() => deleteWebhookRule(rule)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!webhookRules.length ? (
                <tr>
                  <td colSpan="5">No webhook rules configured yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
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
          <h2>Webhook &amp; API Analytics</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Realtime traffic telemetry</span>
        </div>
        
        <div className="two-column-grid" style={{ marginTop: '16px' }}>
          <div style={{ background: '#fcfcfc', border: '1px solid rgba(10,25,37,0.06)', borderRadius: '16px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: 'var(--text)' }}>Execution Metrics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid rgba(10,25,37,0.04)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Total Webhook Dispatches</span>
                <strong style={{ fontSize: '20px', color: 'var(--text)', display: 'block', marginTop: '4px' }}>{analytics.total}</strong>
              </div>
              <div style={{ background: '#fff', padding: '12px', borderRadius: '12px', border: '1px solid rgba(10,25,37,0.04)' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Success Delivery Rate</span>
                <strong style={{ fontSize: '20px', color: '#1ea085', display: 'block', marginTop: '4px' }}>{analytics.successRate}%</strong>
              </div>
            </div>
            
            <div style={{ marginTop: '16px' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Delivery Success/Failure</span>
              <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(231,76,60,0.2)', overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${analytics.successRate}%`, background: '#1ea085', height: '100%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px', color: 'var(--text-muted)' }}>
                <span>{analytics.successes} Successes (2xx)</span>
                <span>{analytics.failures} Failures</span>
              </div>
            </div>
          </div>

          <div style={{ background: '#fcfcfc', border: '1px solid rgba(10,25,37,0.06)', borderRadius: '16px', padding: '16px' }}>
            <h3 style={{ fontSize: '14px', margin: '0 0 12px 0', color: 'var(--text)' }}>Dispatches per Rule</h3>
            {analytics.ruleCounts.length > 0 ? (
              <div style={{ display: 'grid', gap: '8px' }}>
                {analytics.ruleCounts.map(([ruleName, count]) => {
                  const pct = Math.round((count / analytics.total) * 100)
                  return (
                    <div key={ruleName} style={{ fontSize: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--text)' }}>
                        <span style={{ fontWeight: '500' }}>{ruleName}</span>
                        <span style={{ fontWeight: 'bold' }}>{count} ({pct}%)</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '3px', background: 'rgba(10,25,37,0.05)', overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, background: '#1ea085', height: '100%' }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                No active rule executions to display.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserDeveloperApiPage
