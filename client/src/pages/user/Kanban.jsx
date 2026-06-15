import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { formatRelativeTimestamp } from '../../shared/format'

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
  return chat.phonebook?.name || chat.name || chat.sender_name || chat.sender_mobile || chat.mobile || 'Unknown contact'
}

function getChatNumber(chat) {
  return chat.sender_mobile || chat.mobile || chat.number || 'No number'
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
                <article className="kanban-card" key={chat.chat_id}>
                  <strong>{getChatTitle(chat)}</strong>
                  <span>{getChatNumber(chat)}</span>
                  <p>{chat.last_message || 'No recent message.'}</p>
                  <small>{formatRelativeTimestamp(chat.last_message_came)}</small>
                  <div className="action-row">
                    {columns
                      .filter((target) => target.key !== column.key)
                      .map((target) => (
                        <button className="mini-button dark-text" type="button" key={target.key} onClick={() => moveChat(chat, target.key)}>
                          Move to {target.title}
                        </button>
                      ))}
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
