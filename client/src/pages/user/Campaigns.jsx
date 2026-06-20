import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { classNames, formatDateTime, parseStoredJson } from '../../shared/format'

const campaignTabs = [
  { key: 'workspace', label: 'Campaigns', path: '/user/campaigns' },
  { key: 'send', label: 'Send campaign', path: '/user/send-campaign' },
  { key: 'dashboard', label: 'Dashboard', path: '/user/campaign-dashboard' },
]

function getCampaignMode(pathname) {
  if (pathname.includes('campaign-dashboard')) {
    return 'dashboard'
  }
  if (pathname.includes('send-campaign')) {
    return 'send'
  }
  return 'workspace'
}

function normalizeStatus(value) {
  return String(value || 'QUEUE').toUpperCase()
}

function getCampaignTemplate(campaign) {
  const template = parseStoredJson(campaign?.templet, {})
  return template?.name || campaign?.templet_name || 'N/A'
}

function getCampaignAudience(campaign) {
  const phonebook = parseStoredJson(campaign?.phonebook, {})
  return phonebook?.name || phonebook?.title || 'N/A'
}

function summarizeCampaigns(campaigns) {
  const now = Date.now()
  return campaigns.reduce(
    (summary, campaign) => {
      const status = normalizeStatus(campaign.status)
      const scheduleTime = new Date(campaign.schedule).getTime()

      return {
        total: summary.total + 1,
        queued: summary.queued + (status === 'QUEUE' || status === 'QUEUED' ? 1 : 0),
        paused: summary.paused + (status === 'PAUSED' ? 1 : 0),
        completed: summary.completed + (status === 'COMPLETED' || status === 'DONE' ? 1 : 0),
        scheduled: summary.scheduled + (Number.isFinite(scheduleTime) && scheduleTime > now ? 1 : 0),
      }
    },
    { total: 0, queued: 0, paused: 0, completed: 0, scheduled: 0 },
  )
}

function buildDeliveryCards(logSummary, logs) {
  return [
    { label: 'Recipients', value: logSummary?.totalLogs ?? logs.length },
    { label: 'Pending', value: logSummary?.totalPending ?? 0 },
    { label: 'Sent', value: logSummary?.getSent ?? 0 },
    { label: 'Delivered', value: logSummary?.totalDelivered ?? 0 },
    { label: 'Read', value: logSummary?.totalRead ?? 0 },
    { label: 'Failed', value: logSummary?.totalFailed ?? 0 },
  ]
}

function buildAggregateDeliveryCards(summary) {
  const delivery = summary?.delivery || {}
  return [
    { label: 'All recipients', value: delivery.total || 0 },
    { label: 'Pending', value: delivery.pending || 0 },
    { label: 'Sent', value: delivery.sent || 0 },
    { label: 'Delivered', value: delivery.delivered || 0 },
    { label: 'Read', value: delivery.read || 0 },
    { label: 'Failed', value: delivery.failed || 0 },
  ]
}

function getSeriesMax(series = []) {
  return Math.max(1, ...series.map((item) => Number(item.value || 0)))
}

const emptyDashboardFilters = { from: '', to: '' }
const contactFieldOptions = [
  { value: '{{name}}', label: 'Contact name' },
  { value: '{{mobile}}', label: 'Mobile number' },
  { value: '{{var1}}', label: 'Variable 1' },
  { value: '{{var2}}', label: 'Variable 2' },
  { value: '{{var3}}', label: 'Variable 3' },
  { value: '{{var4}}', label: 'Variable 4' },
  { value: '{{var5}}', label: 'Variable 5' },
]

function buildDashboardQuery(filters) {
  const params = new URLSearchParams()
  if (filters.from) {
    params.set('from', filters.from)
  }
  if (filters.to) {
    params.set('to', filters.to)
  }

  const query = params.toString()
  return query ? `?${query}` : ''
}

function normalizeTemplateStatus(value) {
  return String(value || '').toUpperCase()
}

function isTemplateApproved(template) {
  const status = normalizeTemplateStatus(template?.status)
  return !status || status === 'APPROVED'
}

function getTemplateBodyText(template) {
  const body = template?.components?.find((component) => normalizeTemplateStatus(component?.type) === 'BODY')
  return body?.text || ''
}

function getTemplateVariableSlots(template) {
  const text = getTemplateBodyText(template)
  const matches = [...text.matchAll(/{{\s*(\d+)\s*}}/g)].map((match) => Number(match[1]))
  return [...new Set(matches)].filter(Number.isFinite).sort((left, right) => left - right)
}

function buildDefaultVariableMappings(count) {
  const defaultOrder = ['{{name}}', '{{var1}}', '{{var2}}', '{{var3}}', '{{var4}}', '{{var5}}', '{{mobile}}']
  return Array.from({ length: count }, (_, index) => {
    const fallbackIndex = Math.min(index, defaultOrder.length - 1)
    return defaultOrder[fallbackIndex]
  })
}

function getAudienceCount(phonebook) {
  return Number(phonebook?.contact_count || phonebook?.contacts_count || phonebook?.total_contacts || 0)
}

function UserCampaignsPage() {
  const { tokens } = useAuth()
  const location = useLocation()
  const mode = getCampaignMode(location.pathname)
  const [campaigns, setCampaigns] = useState([])
  const [phonebooks, setPhonebooks] = useState([])
  const [templates, setTemplates] = useState([])
  const [logs, setLogs] = useState([])
  const [logSummary, setLogSummary] = useState(null)
  const [dashboardSummary, setDashboardSummary] = useState(null)
  const [dateDraft, setDateDraft] = useState(emptyDashboardFilters)
  const [dashboardFilters, setDashboardFilters] = useState(emptyDashboardFilters)
  const [selectedCampaignId, setSelectedCampaignId] = useState('')
  const [status, setStatus] = useState('Loading campaigns...')
  const [form, setForm] = useState({
    title: '',
    templateName: '',
    phonebookId: '',
    scheduleTimestamp: new Date().toISOString().slice(0, 16),
    variableMappings: [],
  })
  const campaignSummary = useMemo(() => summarizeCampaigns(campaigns), [campaigns])
  const deliveryCards = useMemo(() => buildDeliveryCards(logSummary, logs), [logSummary, logs])
  const aggregateDeliveryCards = useMemo(() => buildAggregateDeliveryCards(dashboardSummary), [dashboardSummary])
  const campaignStatus = dashboardSummary?.campaignStatus || campaignSummary
  const deliveryTrend = dashboardSummary?.trend || []
  const templateUsage = dashboardSummary?.templates || []
  const deliveryTrendMax = getSeriesMax(deliveryTrend)
  const templateUsageMax = getSeriesMax(templateUsage)
  const dashboardQuery = useMemo(() => buildDashboardQuery(dashboardFilters), [dashboardFilters])
  const approvedTemplates = useMemo(() => templates.filter(isTemplateApproved), [templates])
  const selectedTemplate = useMemo(
    () => templates.find((template) => template.name === form.templateName),
    [form.templateName, templates],
  )
  const selectedPhonebook = useMemo(
    () => phonebooks.find((phonebook) => String(phonebook.id) === String(form.phonebookId)),
    [form.phonebookId, phonebooks],
  )
  const selectedAudienceCount = getAudienceCount(selectedPhonebook)
  const templateVariableSlots = useMemo(() => getTemplateVariableSlots(selectedTemplate), [selectedTemplate])
  const selectedTemplateBody = getTemplateBodyText(selectedTemplate)

  const pageCopy = {
    workspace: {
      title: 'Broadcast campaign workspace',
      text: 'Create Meta template broadcasts from phonebooks and inspect delivery logs.',
    },
    send: {
      title: 'Send campaign',
      text: 'Schedule a Meta template broadcast to a selected phonebook audience.',
    },
    dashboard: {
      title: 'Campaign Dashboard',
      text: 'Monitor campaign queue state, schedules, and per-campaign delivery performance.',
    },
  }[mode]

  const loadData = useCallback(async (options = {}) => {
    const silent = options?.silent === true
    const finalStatus = options?.finalStatus || ''

    if (!silent) {
      setStatus('Loading campaigns...')
    }

    try {
      const campaignEndpoint =
        mode === 'dashboard' ? `/api/broadcast/get_broadcast${dashboardQuery}` : '/api/broadcast/get_broadcast'
      const dashboardEndpoint =
        mode === 'dashboard'
          ? `/api/broadcast/dashboard_summary${dashboardQuery}`
          : '/api/broadcast/dashboard_summary'

      const [campaignResult, phonebookResult, dashboardResult, templateResult] = await Promise.all([
        apiRequest(campaignEndpoint, { token: tokens.user }),
        apiRequest('/api/phonebook/get_by_uid', { token: tokens.user }),
        apiRequest(dashboardEndpoint, { token: tokens.user }),
        apiRequest('/api/user/get_my_meta_templets', { token: tokens.user }),
      ])

      if (!campaignResult?.success) {
        setStatus(campaignResult?.msg || 'Unable to load campaigns')
        return
      }
      if (!phonebookResult?.success) {
        setStatus(phonebookResult?.msg || 'Unable to load phonebooks')
        return
      }
      if (!dashboardResult?.success) {
        setDashboardSummary(null)
        setStatus(dashboardResult?.msg || 'Unable to load dashboard summary')
        return
      }

      setCampaigns(Array.isArray(campaignResult?.data) ? campaignResult.data : [])
      setPhonebooks(Array.isArray(phonebookResult?.data) ? phonebookResult.data : [])
      setDashboardSummary(dashboardResult.data || null)
      setTemplates(Array.isArray(templateResult?.data) ? templateResult.data : [])
      if (finalStatus) {
        setStatus(finalStatus)
      } else {
        setStatus(
          mode === 'send' && !templateResult?.success
            ? templateResult?.msg || 'Unable to load Meta templates'
            : '',
        )
      }
    } catch (error) {
      setStatus(error.message || 'Unable to load campaigns')
    }
  }, [dashboardQuery, mode, tokens.user])

  useEffect(() => {
    loadData()
  }, [loadData])

  function applyDashboardFilters(event) {
    event.preventDefault()
    if (dateDraft.from && dateDraft.to && dateDraft.from > dateDraft.to) {
      setStatus('From date must be before to date.')
      return
    }

    setDashboardFilters({ ...dateDraft })
  }

  function clearDashboardFilters() {
    const nextFilters = { ...emptyDashboardFilters }
    setDateDraft(nextFilters)
    setDashboardFilters(nextFilters)
  }

  function selectTemplate(templateName) {
    const template = templates.find((item) => item.name === templateName)
    const slots = getTemplateVariableSlots(template)
    setForm((current) => ({
      ...current,
      templateName,
      variableMappings: buildDefaultVariableMappings(slots.length),
    }))
  }

  function updateVariableMapping(index, value) {
    setForm((current) => {
      const nextMappings = [...current.variableMappings]
      nextMappings[index] = value
      return { ...current, variableMappings: nextMappings }
    })
  }

  async function createCampaign(event) {
    event.preventDefault()

    if (!form.title.trim()) {
      setStatus('Campaign title is required.')
      return
    }

    if (!form.templateName) {
      setStatus('Select an approved Meta template.')
      return
    }

    if (selectedTemplate && !isTemplateApproved(selectedTemplate)) {
      setStatus('Select an approved Meta template.')
      return
    }

    if (!selectedPhonebook) {
      setStatus('Select a phonebook.')
      return
    }

    if (selectedAudienceCount < 1) {
      setStatus('Selected phonebook has no contacts.')
      return
    }

    if (!form.scheduleTimestamp || Number.isNaN(new Date(form.scheduleTimestamp).getTime())) {
      setStatus('Select a valid schedule.')
      return
    }

    if (templateVariableSlots.length && form.variableMappings.some((mapping) => !mapping)) {
      setStatus('Map every template variable to a contact field.')
      return
    }

    setStatus('Creating campaign...')
    try {
      const result = await apiRequest('/api/broadcast/add_new', {
        method: 'POST',
        token: tokens.user,
        body: {
          title: form.title.trim(),
          templet: selectedTemplate || { name: form.templateName },
          phonebook: selectedPhonebook,
          scheduleTimestamp: new Date(form.scheduleTimestamp).toISOString(),
          example: form.variableMappings,
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to create campaign')
        return
      }

      setForm({ ...form, title: '' })
      await loadData({ silent: true, finalStatus: 'Campaign created.' })
    } catch (error) {
      setStatus(error.message || 'Unable to create campaign')
    }
  }

  async function loadLogs(broadcastId) {
    setStatus('Loading campaign logs...')
    try {
      const result = await apiRequest('/api/broadcast/get_broadcast_logs', {
        method: 'POST',
        token: tokens.user,
        body: { id: broadcastId },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to load logs')
        return
      }

      setLogs(Array.isArray(result.data) ? result.data : [])
      setLogSummary(result)
      setSelectedCampaignId(broadcastId)
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load logs')
    }
  }

  async function updateStatus(broadcast_id, nextStatus) {
    setStatus('Updating campaign status...')
    try {
      const result = await apiRequest('/api/broadcast/change_broadcast_status', {
        method: 'POST',
        token: tokens.user,
        body: { broadcast_id, status: nextStatus },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to update campaign')
        return
      }

      setStatus('Campaign updated.')
      loadData()
    } catch (error) {
      setStatus(error.message || 'Unable to update campaign')
    }
  }

  async function deleteCampaign(broadcast_id) {
    setStatus('Deleting campaign...')
    try {
      const result = await apiRequest('/api/broadcast/del_broadcast', {
        method: 'POST',
        token: tokens.user,
        body: { broadcast_id },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete campaign')
        return
      }

      setStatus('Campaign deleted.')
      setLogs([])
      setLogSummary(null)
      setSelectedCampaignId('')
      loadData()
    } catch (error) {
      setStatus(error.message || 'Unable to delete campaign')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">campaigns</span>
          <h2>{pageCopy.title}</h2>
          <p>{pageCopy.text}</p>
        </div>
        <button className="primary-button" type="button" onClick={loadData}>
          Refresh
        </button>
      </div>

      <div className="tab-row integration-tabs" aria-label="Campaign sections">
        {campaignTabs.map((tab) => (
          <Link
            className={classNames('tab-button', mode === tab.key ? 'active' : '')}
            key={tab.key}
            to={tab.path}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      {mode === 'dashboard' ? (
        <form className="panel form-panel dashboard-filter-panel" onSubmit={applyDashboardFilters}>
          <div className="panel-header">
            <h2>Date range</h2>
          </div>
          <div className="form-grid">
            <label>
              From date
              <input
                type="date"
                value={dateDraft.from}
                onChange={(event) => setDateDraft({ ...dateDraft, from: event.target.value })}
              />
            </label>
            <label>
              To date
              <input
                type="date"
                value={dateDraft.to}
                onChange={(event) => setDateDraft({ ...dateDraft, to: event.target.value })}
              />
            </label>
          </div>
          <div className="action-row dashboard-filter-actions">
            <button className="secondary-button" type="button" onClick={clearDashboardFilters}>
              Clear
            </button>
            <button className="primary-button" type="submit">
              Apply filters
            </button>
          </div>
        </form>
      ) : null}

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <span>Total campaigns</span>
          <strong>{campaignStatus.total}</strong>
        </article>
        <article className="dashboard-card">
          <span>Queued</span>
          <strong>{campaignStatus.queued}</strong>
        </article>
        <article className="dashboard-card">
          <span>Paused</span>
          <strong>{campaignStatus.paused}</strong>
        </article>
        <article className="dashboard-card">
          <span>Scheduled ahead</span>
          <strong>{campaignStatus.scheduled}</strong>
        </article>
      </div>

      {mode === 'dashboard' ? (
        <div className="two-column-grid">
          <div className="panel">
            <div className="panel-header">
              <h2>Aggregate delivery</h2>
            </div>
            <div className="dashboard-grid campaign-metrics-grid">
              {aggregateDeliveryCards.map((card) => (
                <article className="dashboard-card" key={card.label}>
                  <span>{card.label}</span>
                  <strong>{card.value}</strong>
                </article>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Delivery trend</h2>
            </div>
            <div className="bar-series">
              {deliveryTrend.map((item) => (
                <div className="bar-row" key={item.label}>
                  <span>{item.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(4, (Number(item.value || 0) / deliveryTrendMax) * 100)}%` }} />
                  </div>
                  <strong>{item.value}</strong>
                </div>
              ))}
              {!deliveryTrend.length ? <p className="empty-state">No delivery trend data yet.</p> : null}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h2>Template usage</h2>
            </div>
            <div className="bar-series">
              {templateUsage.map((item) => (
                <div className="bar-row" key={item.label}>
                  <span>{item.label}</span>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${Math.max(4, (Number(item.value || 0) / templateUsageMax) * 100)}%` }} />
                  </div>
                  <strong>{item.value}</strong>
                </div>
              ))}
              {!templateUsage.length ? <p className="empty-state">No template usage data yet.</p> : null}
            </div>
          </div>
        </div>
      ) : null}

      {mode === 'send' ? (
        <>
          <div className="dashboard-grid">
            <article className="dashboard-card">
              <span>Approved templates</span>
              <strong>{approvedTemplates.length}</strong>
            </article>
            <article className="dashboard-card">
              <span>Phonebooks</span>
              <strong>{phonebooks.length}</strong>
            </article>
            <article className="dashboard-card">
              <span>Selected audience</span>
              <strong>{selectedAudienceCount}</strong>
            </article>
            <article className="dashboard-card">
              <span>Template variables</span>
              <strong>{templateVariableSlots.length}</strong>
            </article>
          </div>

          <form className="panel form-panel" onSubmit={createCampaign}>
            <div className="panel-header">
              <h2>Create broadcast</h2>
            </div>
            <div className="form-grid">
              <label>
                Campaign title
                <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
              </label>
              <label>
                Approved Meta template
                <select value={form.templateName} onChange={(event) => selectTemplate(event.target.value)}>
                  <option value="">Select template</option>
                  {templates.map((template) => (
                    <option disabled={!isTemplateApproved(template)} key={template.id || template.name} value={template.name}>
                      {template.name} {template.status ? `- ${template.status}` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Phonebook
                <select value={form.phonebookId} onChange={(event) => setForm({ ...form, phonebookId: event.target.value })}>
                  <option value="">Select phonebook</option>
                  {phonebooks.map((phonebook) => (
                    <option key={phonebook.id} value={phonebook.id}>
                      {phonebook.name} ({getAudienceCount(phonebook)} contacts)
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Schedule
                <input
                  type="datetime-local"
                  value={form.scheduleTimestamp}
                  onChange={(event) => setForm({ ...form, scheduleTimestamp: event.target.value })}
                />
              </label>
            </div>

            {selectedTemplate ? (
              <div className="template-summary">
                <span className="status-chip">{selectedTemplate.status || 'APPROVED'}</span>
                <span>{selectedTemplate.category || 'N/A'}</span>
                <span>{selectedTemplate.language || 'N/A'}</span>
              </div>
            ) : null}

            {selectedTemplateBody ? <code className="code-block">{selectedTemplateBody}</code> : null}

            {templateVariableSlots.length ? (
              <div className="table-panel compact-table">
                <table>
                  <thead>
                    <tr>
                      <th>Template slot</th>
                      <th>Contact field</th>
                      <th>Preview value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templateVariableSlots.map((slot, index) => (
                      <tr key={slot}>
                        <td>{`{{${slot}}}`}</td>
                        <td>
                          <select
                            aria-label={`Variable ${slot} contact field`}
                            value={form.variableMappings[index] || ''}
                            onChange={(event) => updateVariableMapping(index, event.target.value)}
                          >
                            {contactFieldOptions.map((field) => (
                              <option key={field.value} value={field.value}>
                                {field.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>{form.variableMappings[index]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="empty-state">No body variables detected for this template.</p>
            )}

            <button className="primary-button" type="submit">
              Create campaign
            </button>
          </form>
        </>
      ) : null}

      <div className="panel table-panel">
        <div className="panel-header">
          <h2>{mode === 'dashboard' ? 'Campaign performance' : 'Campaigns'}</h2>
        </div>
        {!campaigns.length ? (
          <div className="empty-onboarding-card">
            <h3>No campaigns available</h3>
            <p>To run a marketing campaign broadcast, follow these steps:</p>
            <ol>
              <li>Go to the <strong>Contacts</strong> page, create a Phonebook, and add or import Contacts.</li>
              <li>Go to the <strong>Meta Templates</strong> page, create a template, and ensure it is approved.</li>
              <li>Switch to the <strong>Send campaign</strong> tab here, select your approved template, match variables, select your phonebook, and launch.</li>
            </ol>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Template</th>
                <th>Audience</th>
                <th>Status</th>
                <th>Schedule</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.broadcast_id}>
                  <td>{campaign.title}</td>
                  <td>{getCampaignTemplate(campaign)}</td>
                  <td>{getCampaignAudience(campaign)}</td>
                  <td>{normalizeStatus(campaign.status)}</td>
                  <td>{formatDateTime(campaign.schedule)}</td>
                  <td>
                    <div className="action-row">
                      <button
                        className={classNames('mini-button', selectedCampaignId === campaign.broadcast_id ? 'dark-text' : '')}
                        type="button"
                        onClick={() => loadLogs(campaign.broadcast_id)}
                      >
                        {selectedCampaignId === campaign.broadcast_id ? 'Selected' : 'Inspect'}
                      </button>
                      <button
                        className="mini-button"
                        type="button"
                        onClick={() => updateStatus(campaign.broadcast_id, 'QUEUE')}
                      >
                        Queue
                      </button>
                      <button
                        className="mini-button"
                        type="button"
                        onClick={() => updateStatus(campaign.broadcast_id, 'PAUSED')}
                      >
                        Pause
                      </button>
                      <button
                        className="mini-button subtle-danger"
                        type="button"
                        onClick={() => deleteCampaign(campaign.broadcast_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel table-panel">
        <div className="panel-header">
          <h2>Delivery analytics</h2>
          {logSummary ? (
            <span className="status-chip">
              {logSummary.totalLogs || 0} total / {logSummary.totalPending || 0} pending
            </span>
          ) : null}
        </div>
        {logSummary ? (
          <div className="dashboard-grid campaign-metrics-grid">
            {deliveryCards.map((card) => (
              <article className="dashboard-card" key={card.label}>
                <span>{card.label}</span>
                <strong>{card.value}</strong>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">Inspect a campaign to load delivery analytics.</p>
        )}
        <table>
          <thead>
            <tr>
              <th>To</th>
              <th>Status</th>
              <th>Template</th>
              <th>Error</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.send_to}</td>
                <td>{log.delivery_status}</td>
                <td>{log.templet_name}</td>
                <td>{log.err || 'None'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserCampaignsPage
