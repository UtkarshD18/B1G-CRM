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
  const [draggedChat, setDraggedChat] = useState(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState(null)

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

  async function saveKanbanState(chatId, nextStatus, currentChats) {
    setStatus(`Saving Kanban state...`)
    try {
      const statusRes = await apiRequest('/api/inbox/change_chat_ticket_status', {
        method: 'POST',
        token: tokens.user,
        body: {
          chatId,
          status: nextStatus,
        },
      })

      if (!statusRes?.success) {
        setStatus(statusRes?.msg || 'Unable to update chat status')
        loadChats()
        return
      }

      const orderedChatIds = currentChats.map((c) => c.chat_id)
      const orderRes = await apiRequest('/api/inbox/update_kanban_order', {
        method: 'POST',
        token: tokens.user,
        body: {
          orderedChatIds,
        },
      })

      if (!orderRes?.success) {
        setStatus(orderRes?.msg || 'Unable to update Kanban ordering')
        loadChats()
        return
      }

      setStatus('Kanban state updated.')
    } catch (error) {
      setStatus(error.message || 'Unable to update Kanban state')
      loadChats()
    }
  }

  async function moveChat(chat, nextStatus) {
    if (normalizeStatus(chat.chat_status) === nextStatus) {
      return
    }

    const updatedChats = chats.map((item) =>
      item.chat_id === chat.chat_id ? { ...item, chat_status: nextStatus } : item
    )
    setChats(updatedChats)
    await saveKanbanState(chat.chat_id, nextStatus, updatedChats)
  }

  const handleDragStart = (e, chat) => {
    e.dataTransfer.setData('text/plain', chat.chat_id)
    setDraggedChat(chat)
  }

  const handleDragEnd = () => {
    setDraggedChat(null)
    setDraggedOverColumn(null)
  }

  const handleDragOver = (e, columnKey) => {
    e.preventDefault()
    setDraggedOverColumn(columnKey)
  }

  const handleDragLeave = () => {
    setDraggedOverColumn(null)
  }

  const handleDrop = async (e, columnKey) => {
    e.preventDefault()
    setDraggedOverColumn(null)
    const chatId = e.dataTransfer.getData('text/plain') || draggedChat?.chat_id
    if (!chatId) return

    const sourceChat = chats.find((c) => String(c.chat_id) === String(chatId))
    if (!sourceChat) return

    // If it's already in this column, dropping on column does nothing (handled by card drop)
    if (normalizeStatus(sourceChat.chat_status) === columnKey) return

    // Move to bottom of the new column
    const updatedChats = chats.map((c) => {
      if (String(c.chat_id) === String(chatId)) {
        return { ...c, chat_status: columnKey }
      }
      return c
    })

    setChats(updatedChats)
    await saveKanbanState(chatId, columnKey, updatedChats)
  }

  const handleCardDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleCardDrop = async (e, targetChat, targetColumn) => {
    e.preventDefault()
    e.stopPropagation()
    setDraggedOverColumn(null)

    const chatId = e.dataTransfer.getData('text/plain') || draggedChat?.chat_id
    if (!chatId || String(chatId) === String(targetChat.chat_id)) return

    const sourceChat = chats.find((c) => String(c.chat_id) === String(chatId))
    if (!sourceChat) return

    // First update the status locally for target column
    const updatedChats = chats.map((c) => {
      if (String(c.chat_id) === String(chatId)) {
        return { ...c, chat_status: targetColumn }
      }
      return c
    })

    // Filter chats in target column, excluding the dragged chat
    const targetColumnChats = updatedChats.filter(
      (c) => normalizeStatus(c.chat_status) === targetColumn && String(c.chat_id) !== String(chatId)
    )

    const targetIndex = targetColumnChats.findIndex(
      (c) => String(c.chat_id) === String(targetChat.chat_id)
    )

    // Insert sourceChat at targetIndex
    const newTargetColumnChats = [...targetColumnChats]
    newTargetColumnChats.splice(targetIndex, 0, { ...sourceChat, chat_status: targetColumn })

    // Other column chats
    const otherColumnChats = updatedChats.filter(
      (c) => normalizeStatus(c.chat_status) !== targetColumn
    )

    const finalChats = [...otherColumnChats, ...newTargetColumnChats]
    setChats(finalChats)

    await saveKanbanState(chatId, targetColumn, finalChats)
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
          <section
            className={`kanban-column ${draggedOverColumn === column.key ? 'drag-over' : ''}`}
            key={column.key}
            onDragOver={(e) => handleDragOver(e, column.key)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.key)}
          >
            <div className="panel-header">
              <h2>{column.title}</h2>
              <span className="status-chip">{groupedChats[column.key]?.length || 0}</span>
            </div>
            <div className="kanban-card-list">
              {(groupedChats[column.key] || []).map((chat) => (
                <article
                  className={`kanban-card ${draggedChat?.chat_id === chat.chat_id ? 'dragging' : ''}`}
                  key={chat.chat_id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, chat)}
                  onDragEnd={handleDragEnd}
                  onDragOver={handleCardDragOver}
                  onDrop={(e) => handleCardDrop(e, chat, column.key)}
                  style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--card-bg)' }}
                >
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

