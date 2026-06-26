import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiFormRequest, apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { prettyJson } from '../../shared/format'

import TemplateBuilder from './automation/TemplateBuilder'
import WhatsAppPreview from './automation/WhatsAppPreview'
import FlowCanvas from './automation/FlowCanvas'
import ChatbotConfig from './automation/ChatbotConfig'
import './automation/AutomationFlows.css'

/* ─── helpers ───────────────────────────────────────────── */

function extractTemplateVariables(value) {
  const variables = new Set()
  const pattern = /\{\{\s*(\d+)\s*\}\}/g
  let match = pattern.exec(value || '')
  while (match) {
    variables.add(match[1])
    match = pattern.exec(value || '')
  }
  return Array.from(variables).sort((a, b) => Number(a) - Number(b))
}

function normalizeTemplateName(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
}

function statusTone(status) {
  const n = String(status || '').toUpperCase()
  if (n === 'APPROVED') return 'Configured'
  if (n === 'REJECTED') return 'Needs review'
  return n || 'Pending'
}

function createDefaultForm() {
  return {
    name: '',
    language: 'en_US',
    category: 'UTILITY',
    templateType: 'STANDARD',
    headerFormat: 'NONE',
    headerText: '',
    headerExampleValues: {},
    mediaHash: '',
    mediaUrl: '',
    mediaPreviewUrl: '',
    mediaFilename: '',
    mediaFilesize: '',
    selectedMediaFile: null,
    bodyText: 'Hello {{1}}, your update is ready.',
    bodyExampleValues: { 1: 'Customer' },
    footerText: '',
    buttons: [
      { type: 'QUICK_REPLY', text: 'Track order', url: '', urlExampleValues: {}, phone_number: '' },
    ],
    carouselCards: [
      { mediaPreviewUrl: '', mediaUrl: '', mediaHash: '', selectedMediaFile: null, bodyText: '', buttons: [{ type: 'QUICK_REPLY', text: '', url: '', urlExampleValues: {}, phone_number: '' }] },
      { mediaPreviewUrl: '', mediaUrl: '', mediaHash: '', selectedMediaFile: null, bodyText: '', buttons: [{ type: 'QUICK_REPLY', text: '', url: '', urlExampleValues: {}, phone_number: '' }] },
    ],
    catalogId: '',
    catalogThumbnailUrl: '',
    catalogThumbnailPreviewUrl: '',
    catalogThumbnailHash: '',
    selectedCatalogFile: null,
    _editingName: null,
  }
}

function populateFormFromTemplate(template) {
  const f = createDefaultForm()
  f.name = template.name
  f.language = template.language || 'en_US'
  f.category = template.category || 'UTILITY'

  const components = template.components || []
  const header = components.find((c) => c.type === 'HEADER')
  if (header) {
    f.headerFormat = header.format || 'NONE'
    if (header.format === 'TEXT') {
      f.headerText = header.text || ''
      if (header.example?.header_text) {
        extractTemplateVariables(header.text).forEach((v, i) => {
          f.headerExampleValues[v] = header.example.header_text[i] || ''
        })
      }
    } else if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(header.format)) {
      f.mediaHash = header.example?.header_handle?.[0] || ''
    }
  }

  const body = components.find((c) => c.type === 'BODY')
  if (body) {
    f.bodyText = body.text || ''
    if (body.example?.body_text?.[0]) {
      extractTemplateVariables(body.text).forEach((v, i) => {
        f.bodyExampleValues[v] = body.example.body_text[0][i] || ''
      })
    }
  }

  const footer = components.find((c) => c.type === 'FOOTER')
  if (footer) f.footerText = footer.text || ''

  const buttonsComp = components.find((c) => c.type === 'BUTTONS')
  if (buttonsComp?.buttons) {
    f.buttons = buttonsComp.buttons.map((btn) => ({
      type: btn.type || 'QUICK_REPLY',
      text: btn.text || '',
      url: btn.url || '',
      urlExampleValues: {},
      phone_number: btn.phone_number || '',
    }))
  } else {
    f.buttons = []
  }

  // Detect carousel
  if (components.find((c) => c.type === 'CAROUSEL')) {
    f.templateType = 'CAROUSEL'
  }

  f._editingName = template.name
  return f
}

function buildTemplateButtons(buttons = []) {
  return buttons
    .filter((b) => b.text?.trim())
    .slice(0, 3)
    .map((b) => {
      if (b.type === 'URL') {
        const urlBtn = { type: 'URL', text: b.text.trim(), url: b.url?.trim() || '' }
        const vars = extractTemplateVariables(b.url)
        if (vars.length) urlBtn.example = vars.map((v) => b.urlExampleValues?.[v] || '')
        return urlBtn
      }
      if (b.type === 'PHONE_NUMBER') {
        return { type: 'PHONE_NUMBER', text: b.text.trim(), phone_number: b.phone_number?.trim() || '' }
      }
      return { type: 'QUICK_REPLY', text: b.text.trim() }
    })
}

function buildComponents(form) {
  const components = []

  if (form.headerFormat === 'TEXT' && form.headerText?.trim()) {
    const hdr = { type: 'HEADER', format: 'TEXT', text: form.headerText.trim() }
    const vars = extractTemplateVariables(form.headerText)
    if (vars.length) hdr.example = { header_text: vars.map((v) => form.headerExampleValues?.[v] || `Header ${v}`) }
    components.push(hdr)
  }

  if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerFormat) && form.mediaHash) {
    components.push({ type: 'HEADER', format: form.headerFormat, example: { header_handle: [form.mediaHash] } })
  }

  const bodyComp = { type: 'BODY', text: form.bodyText?.trim() || '' }
  const bodyVars = extractTemplateVariables(form.bodyText)
  if (bodyVars.length) {
    bodyComp.example = { body_text: [bodyVars.map((v) => form.bodyExampleValues?.[v] || `Example ${v}`)] }
  }
  components.push(bodyComp)

  if (form.footerText?.trim()) {
    components.push({ type: 'FOOTER', text: form.footerText.trim() })
  }

  const buttons = buildTemplateButtons(form.buttons)
  if (buttons.length) {
    components.push({ type: 'BUTTONS', buttons })
  }

  return components
}

/* ─── main page ────────────────────────────────────────── */

function UserAutomationFlowsPage() {
  const { tokens } = useAuth()
  const [activeTab, setActiveTab] = useState('templates')
  const [status, setStatus] = useState('')

  /* ── Template Builder state ─────────── */
  const [templates, setTemplates] = useState([])
  const [form, setForm] = useState(createDefaultForm)
  const [submitting, setSubmitting] = useState(false)
  const [selectedCardIndex, setSelectedCardIndex] = useState(0)

  /* ── Flow state ─────────────────────── */
  const [flows, setFlows] = useState([])
  const [selectedFlowId, setSelectedFlowId] = useState(null)
  const [selectedFlowData, setSelectedFlowData] = useState(null)

  /* ── Load templates ─────────────────── */
  const loadTemplates = useCallback(async () => {
    try {
      const result = await apiRequest('/api/user/get_my_meta_templets', { token: tokens.user })
      setTemplates(result?.success && Array.isArray(result.data) ? result.data : [])
    } catch (err) {
      setStatus(err.message || 'Unable to load templates')
    }
  }, [tokens.user])

  /* ── Load flows ─────────────────────── */
  const loadFlows = useCallback(async () => {
    try {
      const result = await apiRequest('/api/chat_flow/get_mine', { token: tokens.user })
      setFlows(Array.isArray(result?.data) ? result.data : [])
    } catch (err) {
      setStatus(err.message || 'Unable to load flows')
    }
  }, [tokens.user])

  useEffect(() => {
    loadTemplates()
    loadFlows()
  }, [loadTemplates, loadFlows])

  /* ── Template submit ────────────────── */
  async function handleTemplateSubmit(event) {
    event?.preventDefault?.()

    const name = normalizeTemplateName(form.name)
    if (!name) { setStatus('Template name is required.'); return }
    if (!form.bodyText?.trim()) { setStatus('Body text is required.'); return }

    // Validate header examples
    if (form.headerFormat === 'TEXT') {
      const hdrVars = extractTemplateVariables(form.headerText)
      const missing = hdrVars.find((v) => !String(form.headerExampleValues?.[v] || '').trim())
      if (missing) { setStatus(`Header variable {{${missing}}} needs an example.`); return }
    }

    // Validate body examples
    const bodyVars = extractTemplateVariables(form.bodyText)
    const missingBody = bodyVars.find((v) => !String(form.bodyExampleValues?.[v] || '').trim())
    if (missingBody) { setStatus(`Body variable {{${missingBody}}} needs an example.`); return }

    // Validate media
    if (['IMAGE', 'VIDEO', 'DOCUMENT'].includes(form.headerFormat) && !form.mediaHash) {
      setStatus('Upload header media before submitting.'); return
    }

    const isEdit = !!form._editingName
    setSubmitting(true)
    setStatus(isEdit ? 'Updating template...' : 'Submitting template to Meta...')

    try {
      const payload = {
        name,
        language: form.language?.trim() || 'en_US',
        category: form.category,
        components: buildComponents(form),
      }

      const endpoint = isEdit ? '/api/user/update_meta_templet' : '/api/user/add_meta_templet'
      const result = await apiRequest(endpoint, { method: 'POST', token: tokens.user, body: payload })

      if (!result?.success) { setStatus(result?.msg || 'Unable to save template'); return }

      setForm(createDefaultForm())
      setStatus(result.msg || (isEdit ? 'Template updated.' : 'Template submitted for Meta review.'))
      loadTemplates()
    } catch (err) {
      setStatus(err.message || 'Unable to save template')
    } finally {
      setSubmitting(false)
    }
  }

  function editTemplate(template) {
    setForm(populateFormFromTemplate(template))
    setActiveTab('templates')
    setStatus(`Loaded "${template.name}" for editing.`)
  }

  function cancelEdit() {
    setForm(createDefaultForm())
    setStatus('')
  }

  async function deleteTemplate(name) {
    if (!name) return
    setStatus(`Deleting ${name}...`)
    try {
      const result = await apiRequest('/api/user/del_meta_templet', { method: 'POST', token: tokens.user, body: { name } })
      setStatus(result?.success ? (result.msg || 'Template deleted.') : (result?.msg || 'Unable to delete'))
      if (result?.success) loadTemplates()
    } catch (err) {
      setStatus(err.message || 'Unable to delete')
    }
  }

  /* ── Flow operations ────────────────── */
  async function openFlow(flow) {
    setSelectedFlowId(flow.flow_id)
    try {
      const result = await apiRequest('/api/chat_flow/get_by_flow_id', {
        method: 'POST', token: tokens.user, body: { flowId: flow.flow_id },
      })
      setSelectedFlowData({ nodes: result?.nodes || [], edges: result?.edges || [], title: flow.title, flowId: flow.flow_id })
    } catch (err) {
      setStatus(err.message || 'Unable to load flow')
    }
  }

  async function saveFlowData(nodes, edges) {
    if (!selectedFlowData) return
    setStatus('Saving flow...')
    try {
      const result = await apiRequest('/api/chat_flow/add_new', {
        method: 'POST', token: tokens.user,
        body: { title: selectedFlowData.title, flowId: selectedFlowData.flowId, nodes, edges },
      })
      setStatus(result?.success ? 'Flow saved.' : (result?.msg || 'Unable to save flow'))
      loadFlows()
    } catch (err) {
      setStatus(err.message || 'Unable to save flow')
    }
  }

  async function deleteFlow(flow) {
    setStatus('Deleting flow...')
    try {
      const result = await apiRequest('/api/chat_flow/del_flow', {
        method: 'POST', token: tokens.user, body: { id: flow.id, flowId: flow.flow_id },
      })
      if (result?.success) {
        if (flow.flow_id === selectedFlowId) { setSelectedFlowId(null); setSelectedFlowData(null) }
        loadFlows()
        setStatus('Flow deleted.')
      } else {
        setStatus(result?.msg || 'Unable to delete flow')
      }
    } catch (err) {
      setStatus(err.message || 'Unable to delete flow')
    }
  }

  /* ── Tabs ────────────────────────────── */
  const tabs = [
    { id: 'templates', label: 'Template Builder', icon: '📝' },
    { id: 'flows', label: 'Flow Canvas', icon: '🔀' },
    { id: 'chatbot', label: 'Chatbot Config', icon: '🤖' },
    { id: 'library', label: 'Template Library', icon: '📚' },
  ]

  /* ── payload preview ─────────────────── */
  const payload = useMemo(() => ({
    name: normalizeTemplateName(form.name),
    language: form.language?.trim() || 'en_US',
    category: form.category,
    components: buildComponents(form),
  }), [form])

  return (
    <div className="af-page">
      {/* Header */}
      <div className="af-top-header">
        <div className="af-top-header-left">
          <h2>Flow Builder & Template Studio</h2>
          <p>Create WhatsApp templates, build automation flows, and connect chatbot triggers — all in one place.</p>
        </div>
        <div className="af-top-actions">
          {activeTab === 'templates' && form._editingName && (
            <button type="button" className="af-btn af-btn-secondary" onClick={cancelEdit}>
              ✕ Cancel Edit
            </button>
          )}
          <button type="button" className="af-btn af-btn-secondary" onClick={() => { loadTemplates(); loadFlows(); setStatus('Refreshed.') }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="af-tab-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`af-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="af-tab-icon">{tab.icon}</span>
            {tab.label}
            {tab.id === 'library' && templates.length > 0 && (
              <span className="af-tab-badge">{templates.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Status */}
      {status && (
        <div className="af-status-bar">
          <span>{status}</span>
          <button type="button" onClick={() => setStatus('')} className="af-status-close">✕</button>
        </div>
      )}

      {/* ── TAB: Template Builder ────────── */}
      {activeTab === 'templates' && (
        <div className="af-builder">
          {/* Left sidebar: Template list */}
          <aside className="af-sidebar">
            <div className="af-sidebar-header">
              <h3>Templates</h3>
              <span className="af-sidebar-count">{templates.length}</span>
            </div>
            <button
              type="button"
              className="af-btn af-btn-primary af-sidebar-new-btn"
              onClick={() => { setForm(createDefaultForm()); setStatus('New template draft.') }}
            >
              + New Template
            </button>
            <div className="af-sidebar-list">
              {templates.map((t) => (
                <div
                  key={t.id || t.name}
                  className={`af-sidebar-item${form._editingName === t.name ? ' active' : ''}`}
                  onClick={() => editTemplate(t)}
                >
                  <div className="af-sidebar-item-name">{t.name}</div>
                  <div className="af-sidebar-item-meta">
                    <span className={`af-status-dot ${String(t.status).toLowerCase()}`} />
                    <span>{statusTone(t.status)}</span>
                    <span>·</span>
                    <span>{t.category || 'N/A'}</span>
                  </div>
                </div>
              ))}
              {!templates.length && (
                <div className="af-sidebar-empty">
                  <div className="af-sidebar-empty-icon">📝</div>
                  <p>No templates yet. Create one to get started!</p>
                </div>
              )}
            </div>
          </aside>

          {/* Center: Wizard Builder */}
          <main className="af-main-panel">
            <TemplateBuilder
              form={form}
              setForm={setForm}
              submitting={submitting}
              onSubmit={handleTemplateSubmit}
              onStatus={setStatus}
              selectedCardIndex={selectedCardIndex}
              setSelectedCardIndex={setSelectedCardIndex}
            />
          </main>

          {/* Right: WhatsApp Preview */}
          <aside className="af-preview-panel">
            <WhatsAppPreview
              form={form}
              selectedCardIndex={selectedCardIndex}
              setSelectedCardIndex={setSelectedCardIndex}
            />
          </aside>
        </div>
      )}

      {/* ── TAB: Flow Canvas ─────────────── */}
      {activeTab === 'flows' && (
        <div className="af-builder af-builder-no-preview">
          {/* Left sidebar: Flow list */}
          <aside className="af-sidebar">
            <div className="af-sidebar-header">
              <h3>Saved Flows</h3>
              <span className="af-sidebar-count">{flows.length}</span>
            </div>
            <div className="af-sidebar-list">
              {flows.map((flow) => (
                <div
                  key={flow.flow_id}
                  className={`af-sidebar-item${selectedFlowId === flow.flow_id ? ' active' : ''}`}
                >
                  <div
                    style={{ flex: 1, cursor: 'pointer' }}
                    onClick={() => openFlow(flow)}
                  >
                    <div className="af-sidebar-item-name">{flow.title}</div>
                    <div className="af-sidebar-item-meta">
                      <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{flow.flow_id}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="af-btn af-btn-danger"
                    style={{ padding: '4px 10px', fontSize: '0.72rem' }}
                    onClick={(e) => { e.stopPropagation(); deleteFlow(flow) }}
                  >
                    Delete
                  </button>
                </div>
              ))}
              {!flows.length && (
                <div className="af-sidebar-empty">
                  <div className="af-sidebar-empty-icon">🔀</div>
                  <p>No flows created yet.</p>
                </div>
              )}
            </div>
          </aside>

          {/* Main: Flow Canvas */}
          <main className="af-main-panel">
            {selectedFlowData ? (
              <FlowCanvas
                key={selectedFlowId}
                nodes={selectedFlowData.nodes}
                edges={selectedFlowData.edges}
                onSave={saveFlowData}
                templates={templates}
              />
            ) : (
              <div className="af-empty-state">
                <div className="af-empty-icon">🔀</div>
                <h3 className="af-empty-title">Select a flow to edit</h3>
                <p className="af-empty-text">Choose a flow from the sidebar to view and edit it on the canvas, or create a new one from the Chatbot Config tab.</p>
              </div>
            )}
          </main>
        </div>
      )}

      {/* ── TAB: Chatbot Config ──────────── */}
      {activeTab === 'chatbot' && (
        <div className="af-builder af-builder-no-preview">
          <aside className="af-sidebar">
            <div className="af-sidebar-header">
              <h3>Flows</h3>
              <span className="af-sidebar-count">{flows.length}</span>
            </div>
            <div className="af-sidebar-list">
              {flows.map((flow) => (
                <div key={flow.flow_id} className="af-sidebar-item">
                  <div className="af-sidebar-item-name">{flow.title}</div>
                  <div className="af-sidebar-item-meta">
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>{flow.flow_id}</span>
                  </div>
                </div>
              ))}
              {!flows.length && (
                <div className="af-sidebar-empty">
                  <div className="af-sidebar-empty-icon">🤖</div>
                  <p>No flows to bind. Create one in the Flow Canvas tab.</p>
                </div>
              )}
            </div>
          </aside>

          <main className="af-main-panel">
            <ChatbotConfig flows={flows} onStatus={setStatus} />
          </main>
        </div>
      )}

      {/* ── TAB: Template Library ─────────── */}
      {activeTab === 'library' && (
        <div className="af-library">
          <div className="af-library-header">
            <h3>Meta Templates</h3>
            <span className="af-sidebar-count">{templates.length} templates</span>
          </div>

          {!templates.length ? (
            <div className="af-empty-state">
              <div className="af-empty-icon">📚</div>
              <h3 className="af-empty-title">No templates yet</h3>
              <p className="af-empty-text">
                Switch to the Template Builder tab to create your first WhatsApp template.
              </p>
              <button type="button" className="af-btn af-btn-primary" onClick={() => setActiveTab('templates')}>
                📝 Create Template
              </button>
            </div>
          ) : (
            <div className="af-library-grid">
              {templates.map((template) => (
                <div key={template.id || template.name} className="af-library-card">
                  <div className="af-library-card-header">
                    <h4>{template.name}</h4>
                    <span className={`af-library-status ${String(template.status).toLowerCase()}`}>
                      {statusTone(template.status)}
                    </span>
                  </div>
                  <div className="af-library-card-meta">
                    <span>{template.category || 'N/A'}</span>
                    <span>·</span>
                    <span>{template.language || 'en_US'}</span>
                  </div>
                  {template.components?.find((c) => c.type === 'BODY')?.text && (
                    <p className="af-library-card-body">
                      {template.components.find((c) => c.type === 'BODY').text.slice(0, 120)}
                      {template.components.find((c) => c.type === 'BODY').text.length > 120 ? '…' : ''}
                    </p>
                  )}
                  <div className="af-library-card-actions">
                    <button type="button" className="af-btn af-btn-secondary" onClick={() => editTemplate(template)}>
                      ✏️ Edit
                    </button>
                    <button type="button" className="af-btn af-btn-danger" onClick={() => deleteTemplate(template.name)}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payload Preview */}
          {form._editingName && (
            <div className="af-library-preview">
              <h4>Payload Preview — {form._editingName}</h4>
              <pre className="af-code-block">{prettyJson(payload)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default UserAutomationFlowsPage
