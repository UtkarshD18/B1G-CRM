import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatDateTime, parseStoredJson } from '../../shared/format'

const emptyBot = {
  id: '',
  title: '',
  flowId: '',
  chats: [],
  for_all: false,
  originCode: 'META',
}

function getBotFlow(bot) {
  return parseStoredJson(bot.flow, {})
}

function getBotOrigin(bot) {
  return parseStoredJson(bot.origin, {})
}

function getBotChats(bot) {
  return parseStoredJson(bot.chats, [])
}

function getBotScopeLabel(bot) {
  if (Number(bot.for_all) > 0) {
    return 'All incoming chats'
  }

  const chats = getBotChats(bot)
  return `${chats.length} selected`
}

function summarizeLogDetail(detail) {
  const parsed = parseStoredJson(detail, {})
  if (parsed.reason) {
    return parsed.reason
  }
  if (parsed.error) {
    return parsed.error
  }
  if (Number.isFinite(Number(parsed.reply_count))) {
    return `${parsed.reply_count} replies`
  }
  return 'N/A'
}

function summarizeBots(bots) {
  return bots.reduce(
    (summary, bot) => {
      const origin = getBotOrigin(bot)
      const originCode = origin.code || 'META'
      return {
        total: summary.total + 1,
        active: summary.active + (Number(bot.active) > 0 ? 1 : 0),
        meta: summary.meta + (originCode === 'META' ? 1 : 0),
        qr: summary.qr + (originCode === 'QR' ? 1 : 0),
      }
    },
    { total: 0, active: 0, meta: 0, qr: 0 },
  )
}

function UserChatBotPage() {
  const { tokens } = useAuth()
  const [bots, setBots] = useState([])
  const [flows, setFlows] = useState([])
  const [chats, setChats] = useState([])
  const [logs, setLogs] = useState([])
  const [status, setStatus] = useState('Loading chatbots...')
  const [form, setForm] = useState(emptyBot)
  const botSummary = useMemo(() => summarizeBots(bots), [bots])
  const selectedFlow = useMemo(
    () => flows.find((item) => String(item.flow_id) === String(form.flowId) || String(item.id) === String(form.flowId)),
    [flows, form.flowId],
  )

  const loadData = useCallback(async (options = {}) => {
    const silent = options?.silent === true
    const finalStatus = options?.finalStatus || ''

    if (!silent) {
      setStatus('Loading chatbots...')
    }

    try {
      const [botResult, flowResult, chatResult, logResult] = await Promise.all([
        apiRequest('/api/chatbot/get_chatbot', { token: tokens.user }),
        apiRequest('/api/chat_flow/get_mine', { token: tokens.user }),
        apiRequest('/api/inbox/get_chats', { token: tokens.user }),
        apiRequest('/api/chatbot/get_logs?limit=25', { token: tokens.user }),
      ])

      setBots(Array.isArray(botResult?.data) ? botResult.data : [])
      setFlows(Array.isArray(flowResult?.data) ? flowResult.data : [])
      setChats(Array.isArray(chatResult?.data) ? chatResult.data : [])
      setLogs(Array.isArray(logResult?.data) ? logResult.data : [])
      setStatus(finalStatus)
    } catch (error) {
      setStatus(error.message || 'Unable to load chatbots')
    }
  }, [tokens.user])

  useEffect(() => {
    loadData()
  }, [loadData])

  function editBot(bot) {
    const flow = getBotFlow(bot)
    const origin = getBotOrigin(bot)
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
    setForm((current) => ({
      ...current,
      chats: current.chats.includes(chatId)
        ? current.chats.filter((item) => item !== chatId)
        : [...current.chats, chatId],
    }))
  }

  async function saveBot(event) {
    event.preventDefault()

    if (!form.title.trim()) {
      setStatus('Chatbot title is required.')
      return
    }

    if (!selectedFlow) {
      setStatus('Select a saved flow first.')
      return
    }

    if (!form.for_all && form.chats.length < 1) {
      setStatus('Select at least one chat target or enable all incoming chats.')
      return
    }

    setStatus(form.id ? 'Updating chatbot...' : 'Creating chatbot...')
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
          origin: {
            title: form.originCode === 'META' ? 'Meta' : 'QR',
            code: form.originCode,
            data: {},
          },
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to save chatbot')
        return
      }

      setForm(emptyBot)
      await loadData({ silent: true, finalStatus: result.msg || 'Chatbot saved.' })
    } catch (error) {
      setStatus(error.message || 'Unable to save chatbot')
    }
  }

  async function changeStatus(id, active) {
    setStatus('Changing chatbot status...')
    try {
      const result = await apiRequest('/api/chatbot/change_bot_status', {
        method: 'POST',
        token: tokens.user,
        body: { id, status: active },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to change chatbot status')
        return
      }

      await loadData({ silent: true, finalStatus: 'Chatbot status changed.' })
    } catch (error) {
      setStatus(error.message || 'Unable to change chatbot status')
    }
  }

  async function deleteBot(id) {
    setStatus('Deleting chatbot...')
    try {
      const result = await apiRequest('/api/chatbot/del_chatbot', {
        method: 'POST',
        token: tokens.user,
        body: { id },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to delete chatbot')
        return
      }

      await loadData({ silent: true, finalStatus: 'Chatbot deleted.' })
    } catch (error) {
      setStatus(error.message || 'Unable to delete chatbot')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">chatbot</span>
          <h2>Chatbot automation over saved flows</h2>
          <p>Create bots from flow definitions and bind them to all or selected chats.</p>
        </div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="dashboard-grid">
        <article className="dashboard-card">
          <span>Total bots</span>
          <strong>{botSummary.total}</strong>
        </article>
        <article className="dashboard-card">
          <span>Active</span>
          <strong>{botSummary.active}</strong>
        </article>
        <article className="dashboard-card">
          <span>Meta bots</span>
          <strong>{botSummary.meta}</strong>
        </article>
        <article className="dashboard-card">
          <span>QR bots</span>
          <strong>{botSummary.qr}</strong>
        </article>
      </div>

      <form className="panel form-panel" onSubmit={saveBot}>
        <div className="panel-header">
          <h2>{form.id ? 'Edit chatbot' : 'Create chatbot'}</h2>
          {form.id ? (
            <button className="mini-button" type="button" onClick={() => setForm(emptyBot)}>
              New chatbot
            </button>
          ) : null}
        </div>
        <div className="form-grid">
          <label>
            Title
            <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </label>
          <label>
            Flow
            <select value={form.flowId} onChange={(event) => setForm({ ...form, flowId: event.target.value })}>
              <option value="">Select flow</option>
              {flows.map((flow) => (
                <option key={flow.flow_id} value={flow.flow_id}>
                  {flow.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Origin
            <select value={form.originCode} onChange={(event) => setForm({ ...form, originCode: event.target.value })}>
              <option value="META">Meta</option>
              <option value="QR">QR</option>
            </select>
          </label>
        </div>
        <label className="checkbox-row">
          <input
            checked={form.for_all}
            type="checkbox"
            onChange={(event) =>
              setForm({
                ...form,
                for_all: event.target.checked,
                chats: event.target.checked ? [] : form.chats,
              })
            }
          />
          <span>Run on every incoming chat</span>
        </label>
        {selectedFlow ? (
          <p className="muted-copy">
            Selected flow: {selectedFlow.title} ({selectedFlow.flow_id})
          </p>
        ) : null}
        <div className="meta-block">
          <div className="panel-header">
            <h2>Chat targets</h2>
          </div>
          {form.for_all ? (
            <p className="muted-copy">This bot will run for every new incoming conversation on the selected origin.</p>
          ) : (
            <div className="action-row">
              {chats.map((chat) => (
                <label className="checkbox-row" key={chat.chat_id}>
                  <input
                    checked={form.chats.includes(chat.chat_id)}
                    type="checkbox"
                    onChange={() => toggleChat(chat.chat_id)}
                  />
                  <span>{chat.sender_name || chat.sender_mobile || chat.chat_id}</span>
                </label>
              ))}
              {!chats.length ? <p className="muted-copy">No chats yet. Create/open inbox conversations first.</p> : null}
            </div>
          )}
        </div>
        <button className="primary-button" type="submit">
          {form.id ? 'Save chatbot' : 'Create chatbot'}
        </button>
      </form>

      <div className="panel table-panel">
        <div className="panel-header">
          <h2>Chatbots</h2>
          <button className="mini-button" type="button" onClick={loadData}>
            Refresh
          </button>
        </div>
        {!bots.length ? (
          <div className="empty-onboarding-card">
            <h3>No chatbots available</h3>
            <p>To automate replies using a chatbot, follow these steps:</p>
            <ol>
              <li>Open <strong>Inbox</strong>, and receive or create a conversation.</li>
              <li>Navigate to <strong>Automation Flows</strong>, and build your visual workflow logic.</li>
              <li>Return here, describe the bot parameters, select your flow, and click Create chatbot.</li>
            </ol>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Flow</th>
                <th>Origin</th>
                <th>Scope</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bots.map((bot) => {
                const origin = getBotOrigin(bot)
                const flow = getBotFlow(bot)
                return (
                  <tr key={bot.id}>
                    <td>{bot.title}</td>
                    <td>{flow.title || bot.flow_id || 'N/A'}</td>
                    <td>{origin.code || 'META'}</td>
                    <td>{getBotScopeLabel(bot)}</td>
                    <td>{Number(bot.active) > 0 ? 'Active' : 'Inactive'}</td>
                    <td>
                      <div className="action-row">
                        <button className="mini-button" type="button" onClick={() => editBot(bot)}>
                          Edit
                        </button>
                        <button
                          className="mini-button"
                          type="button"
                          onClick={() => changeStatus(bot.id, Number(bot.active) < 1)}
                        >
                          {Number(bot.active) > 0 ? 'Deactivate' : 'Activate'}
                        </button>
                        <button className="mini-button subtle-danger" type="button" onClick={() => deleteBot(bot.id)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="panel table-panel">
        <div className="panel-header">
          <h2>Recent chatbot diagnostics</h2>
          <span className="status-chip">{logs.length} events</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Bot</th>
              <th>Status</th>
              <th>Matched</th>
              <th>Contact</th>
              <th>Message</th>
              <th>Detail</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.chatbot_title || log.chatbot_id || 'N/A'}</td>
                <td>{log.status}</td>
                <td>{Number(log.matched) > 0 ? 'Yes' : 'No'}</td>
                <td>{log.sender_name || log.sender_number || 'N/A'}</td>
                <td>{log.incoming_message || 'N/A'}</td>
                <td>{summarizeLogDetail(log.detail)}</td>
                <td>{formatDateTime(log.created_at || log.createdAt)}</td>
              </tr>
            ))}
            {!logs.length ? (
              <tr>
                <td colSpan="7">No chatbot diagnostics yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserChatBotPage
