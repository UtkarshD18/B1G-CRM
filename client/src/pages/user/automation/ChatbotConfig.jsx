import { useCallback, useEffect, useState } from 'react'
import { apiRequest } from '../../../shared/api'
import { useAuth } from '../../../shared/auth'
import { parseStoredJson } from '../../../shared/format'

const emptyBot = {
  id: '',
  title: '',
  flowId: '',
  chats: [],
  for_all: false,
  originCode: 'META',
}

function ChatbotConfig({ flows, onStatus }) {
  const { tokens } = useAuth()
  const [bots, setBots] = useState([])
  const [chats, setChats] = useState([])
  const [form, setForm] = useState(emptyBot)
  const [loading, setLoading] = useState(false)

  const loadData = useCallback(async () => {
    try {
      const [botResult, chatResult] = await Promise.all([
        apiRequest('/api/chatbot/get_chatbot', { token: tokens.user }),
        apiRequest('/api/inbox/get_chats', { token: tokens.user }),
      ])
      setBots(Array.isArray(botResult?.data) ? botResult.data : [])
      setChats(Array.isArray(chatResult?.data) ? chatResult.data : [])
    } catch (error) {
      onStatus?.(error.message || 'Unable to load chatbot data')
    }
  }, [tokens.user, onStatus])

  useEffect(() => {
    loadData()
  }, [loadData])

  function editBot(bot) {
    const flow = parseStoredJson(bot.flow, {})
    const origin = parseStoredJson(bot.origin, {})
    setForm({
      id: bot.id,
      title: bot.title || '',
      flowId: String(flow.flow_id || flow.id || bot.flow_id || ''),
      chats: parseStoredJson(bot.chats, []),
      for_all: Number(bot.for_all) > 0,
      originCode: origin.code || 'META',
    })
  }

  function toggleChat(chatId) {
    setForm((prev) => ({
      ...prev,
      chats: prev.chats.includes(chatId)
        ? prev.chats.filter((c) => c !== chatId)
        : [...prev.chats, chatId],
    }))
  }

  async function saveBot(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      onStatus?.('Chatbot title is required.')
      return
    }
    const selectedFlow = flows.find(
      (f) => String(f.flow_id) === String(form.flowId) || String(f.id) === String(form.flowId),
    )
    if (!selectedFlow) {
      onStatus?.('Select a saved flow first.')
      return
    }
    if (!form.for_all && form.chats.length < 1) {
      onStatus?.('Select at least one chat target or enable all incoming chats.')
      return
    }

    setLoading(true)
    onStatus?.(form.id ? 'Updating chatbot...' : 'Creating chatbot...')
    try {
      const result = await apiRequest(form.id ? '/api/chatbot/update_chatbot' : '/api/chatbot/add_chatbot', {
        method: 'POST',
        token: tokens.user,
        body: {
          id: form.id,
          title: form.title.trim(),
          flow: selectedFlow,
          chats: form.for_all ? [] : form.chats,
          for_all: form.for_all,
          origin: { title: form.originCode === 'META' ? 'Meta' : 'QR', code: form.originCode, data: {} },
        },
      })
      if (!result?.success) {
        onStatus?.(result?.msg || 'Unable to save chatbot')
        return
      }
      setForm(emptyBot)
      onStatus?.(result.msg || 'Chatbot saved successfully!')
      loadData()
    } catch (error) {
      onStatus?.(error.message || 'Unable to save chatbot')
    } finally {
      setLoading(false)
    }
  }

  async function toggleBotStatus(id, active) {
    try {
      const result = await apiRequest('/api/chatbot/change_bot_status', {
        method: 'POST',
        token: tokens.user,
        body: { id, status: active },
      })
      if (result?.success) loadData()
      else onStatus?.(result?.msg || 'Unable to change status')
    } catch (error) {
      onStatus?.(error.message)
    }
  }

  async function deleteBot(id) {
    try {
      const result = await apiRequest('/api/chatbot/del_chatbot', {
        method: 'POST',
        token: tokens.user,
        body: { id },
      })
      if (result?.success) {
        onStatus?.('Chatbot deleted.')
        loadData()
      } else {
        onStatus?.(result?.msg || 'Unable to delete chatbot')
      }
    } catch (error) {
      onStatus?.(error.message)
    }
  }

  return (
    <div>
      <h3 className="af-step-title">Chatbot Configuration</h3>
      <p className="af-step-description">
        Bind automation flows to chatbots. Chatbots automatically execute flows when triggered by incoming messages.
      </p>

      <div className="af-chatbot-grid">
        {/* Form */}
        <form className="af-chatbot-form" onSubmit={saveBot}>
          <div className="af-field">
            <label className="af-field-label">Chatbot Title</label>
            <input className="af-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Order Bot" />
          </div>

          <div className="af-field">
            <label className="af-field-label">Automation Flow</label>
            <select className="af-select" value={form.flowId} onChange={(e) => setForm({ ...form, flowId: e.target.value })}>
              <option value="">Select flow</option>
              {flows.map((flow) => (
                <option key={flow.flow_id} value={flow.flow_id}>{flow.title}</option>
              ))}
            </select>
          </div>

          <div className="af-field">
            <label className="af-field-label">Channel Origin</label>
            <select className="af-select" value={form.originCode} onChange={(e) => setForm({ ...form, originCode: e.target.value })}>
              <option value="META">Meta WhatsApp</option>
              <option value="QR">QR WhatsApp</option>
            </select>
          </div>

          <div className="af-toggle-row">
            <label className="af-toggle">
              <input type="checkbox" checked={form.for_all} onChange={(e) => setForm({ ...form, for_all: e.target.checked, chats: e.target.checked ? [] : form.chats })} />
              <div className="af-toggle-track" />
              <div className="af-toggle-thumb" />
            </label>
            <span className="af-toggle-label">Run on every incoming chat</span>
          </div>

          {!form.for_all ? (
            <div className="af-field">
              <label className="af-field-label">Chat Targets</label>
              <div className="af-chatbot-targets">
                {chats.map((chat) => (
                  <label className="af-chatbot-target" key={chat.chat_id}>
                    <input type="checkbox" checked={form.chats.includes(chat.chat_id)} onChange={() => toggleChat(chat.chat_id)} />
                    <span className="af-chatbot-target-name">{chat.sender_name || chat.sender_mobile || chat.chat_id}</span>
                  </label>
                ))}
                {!chats.length ? (
                  <p style={{ fontSize: '0.85rem', color: '#7a8f9c' }}>No chats available. Open conversations in Inbox first.</p>
                ) : null}
              </div>
            </div>
          ) : null}

          <button type="submit" className="af-btn af-btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? '⏳ Saving...' : form.id ? '📝 Update Chatbot' : '🤖 Create Chatbot'}
          </button>

          {form.id ? (
            <button type="button" className="af-btn af-btn-secondary" onClick={() => setForm(emptyBot)}>
              Cancel Edit
            </button>
          ) : null}
        </form>

        {/* Existing Chatbots */}
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: '0.85rem', fontWeight: 700, color: '#10212d', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Active Chatbots ({bots.length})
          </h4>
          {bots.length ? (
            <table className="af-chatbot-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bots.map((bot) => {
                  const origin = parseStoredJson(bot.origin, {})
                  return (
                    <tr key={bot.id}>
                      <td>
                        <strong>{bot.title}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#7a8f9c' }}>{origin.code || 'META'}</div>
                      </td>
                      <td>
                        <span className={Number(bot.active) > 0 ? 'af-status-active' : 'af-status-inactive'}>
                          {Number(bot.active) > 0 ? '● Active' : '○ Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button type="button" className="af-btn af-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => editBot(bot)}>
                            Edit
                          </button>
                          <button type="button" className="af-btn af-btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => toggleBotStatus(bot.id, Number(bot.active) < 1)}>
                            {Number(bot.active) > 0 ? 'Pause' : 'Activate'}
                          </button>
                          <button type="button" className="af-btn af-btn-danger" style={{ padding: '6px 12px', fontSize: '0.78rem' }} onClick={() => deleteBot(bot.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="af-empty-state" style={{ padding: '30px 16px' }}>
              <div className="af-empty-icon">🤖</div>
              <p className="af-empty-text">No chatbots created yet. Build a flow, then bind it to a chatbot here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChatbotConfig
