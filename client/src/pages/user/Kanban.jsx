import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatRelativeTimestamp, normalizeConversationMessage, parseStoredJson } from '../../shared/format'
import { FaWhatsapp, FaInstagram, FaTelegram, FaGlobe, FaFacebook } from 'react-icons/fa'

const columns = [
  { key: 'open', title: 'Open' },
  { key: 'pending', title: 'Pending' },
  { key: 'solved', title: 'Solved' },
]

function normalizeStatus(value) {
  const normalized = String(value || 'open').toLowerCase()
  return columns.some((column) => column.key === normalized) ? normalized : 'open'
}

function getChatTitle(chat) {
  return chat.contact?.name || chat.sender_name || chat.name || chat.sender_mobile || chat.mobile || 'Unknown contact'
}

function getChatNumber(chat) {
  return chat.sender_mobile || chat.mobile || chat.number || 'No number'
}

function getChannelIcon(chat) {
  const origin = String(chat?.origin || chat?.channel || '').toLowerCase()
  if (origin === 'meta') {
    return <FaFacebook className="platform-icon meta" title="Meta" />
  }
  if (origin === 'qr') {
    return <FaWhatsapp className="platform-icon qr" title="WhatsApp QR" />
  }
  if (origin.includes('insta') || origin.includes('instagram')) {
    return <FaInstagram className="platform-icon instagram" title="Instagram" />
  }
  if (origin.includes('telegram')) {
    return <FaTelegram className="platform-icon telegram" title="Telegram" />
  }
  if (origin.includes('widget') || origin.includes('web')) {
    return <FaGlobe className="platform-icon website" title="Website" />
  }
  return <FaWhatsapp className="platform-icon whatsapp" title="WhatsApp" />
}

function formatLastMessage(lastMessage) {
  if (!lastMessage) return 'No messages yet.'
  const parsed = parseStoredJson(lastMessage)
  if (parsed) {
    return normalizeConversationMessage(parsed)
  }
  return lastMessage
}

function UserKanbanPage() {
  const { tokens } = useAuth()
  const [status, setStatus] = useState('Loading Kanban...')
  const [chats, setChats] = useState([])

  const loadChats = useCallback(async () => {
    setStatus('Loading Kanban...')
    try {
      const result = await apiRequest('/api/inbox/get_chats', { token: tokens.user })
      if (!result?.success) {
        setStatus(result?.msg || 'Unable to load chats')
        setChats([])
        return
      }

      setChats(Array.isArray(result.data) ? result.data : [])
      setStatus('')
    } catch (error) {
      setStatus(error.message || 'Unable to load chats')
      setChats([])
    }
  }, [tokens.user])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  const groupedChats = useMemo(
    () =>
      columns.reduce((acc, column) => {
        acc[column.key] = chats.filter((chat) => normalizeStatus(chat.chat_status) === column.key)
        return acc
      }, {}),
    [chats],
  )

  async function moveChat(chat, nextStatus) {
    if (normalizeStatus(chat.chat_status) === nextStatus) {
      return
    }

    setStatus(`Moving ${getChatTitle(chat)} to ${nextStatus}...`)
    try {
      const result = await apiRequest('/api/inbox/change_chat_ticket_status', {
        method: 'POST',
        token: tokens.user,
        body: {
          chatId: chat.chat_id,
          status: nextStatus,
        },
      })

      if (!result?.success) {
        setStatus(result?.msg || 'Unable to update chat status')
        return
      }

      setChats((current) =>
        current.map((item) => (item.chat_id === chat.chat_id ? { ...item, chat_status: nextStatus } : item)),
      )
      setStatus('Chat status updated.')
    } catch (error) {
      setStatus(error.message || 'Unable to update chat status')
    }
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">kanban</span>
          <h2>Chat Kanban</h2>
          <p>Operational view of tenant conversations grouped by ticket status.</p>
        </div>
        <button className="primary-button" type="button" onClick={loadChats}>
          Refresh
        </button>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="kanban-board">
        {columns.map((column) => (
          <section className="kanban-column" key={column.key}>
            <div className="panel-header">
              <h2>{column.title}</h2>
              <span className="status-chip">{groupedChats[column.key]?.length || 0}</span>
            </div>
            <div className="kanban-card-list">
              {(groupedChats[column.key] || []).map((chat) => (
                <article className="kanban-card" key={chat.chat_id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--card-bg)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '0.95rem' }}>{getChatTitle(chat)}</strong>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {getChannelIcon(chat)}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{getChatNumber(chat)}</span>
                  <p style={{ margin: '4px 0', fontSize: '0.85rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {formatLastMessage(chat.last_message)}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{chat.agent_name ? `Agent: ${chat.agent_name}` : 'Unassigned'}</span>
                    <small>{formatRelativeTimestamp(chat.last_message_came)}</small>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span className="status-chip" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>{normalizeStatus(chat.chat_status)}</span>
                    <div className="action-row" style={{ display: 'flex', gap: '4px' }}>
                      {columns
                        .filter((target) => target.key !== column.key)
                        .map((target) => (
                          <button className="mini-button dark-text" type="button" key={target.key} onClick={() => moveChat(chat, target.key)} style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                            {target.title}
                          </button>
                        ))}
                    </div>
                  </div>
                </article>
              ))}
              {!groupedChats[column.key]?.length ? <p className="empty-state">No chats in this stage.</p> : null}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default UserKanbanPage

