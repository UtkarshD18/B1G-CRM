import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { API_BASE, apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { classNames, decodeTokenPayload, formatRelativeTimestamp, normalizeConversationMessage } from '../../shared/format'

function UserInboxPage() {
  const { tokens } = useAuth()
  const socketRef = useRef(null)
  const decoded = decodeTokenPayload(tokens.user)
  const [chats, setChats] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [status, setStatus] = useState('Loading inbox...')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedChat, setSelectedChat] = useState(null)
  const [conversation, setConversation] = useState([])
  const [chatNote, setChatNote] = useState('')
  const [labelsAdded, setLabelsAdded] = useState([])
  const [agentData, setAgentData] = useState([])
  const [chatAssignAgent, setChatAssignAgent] = useState({})
  const [assignAgentUid, setAssignAgentUid] = useState('')
  const [messageDraft, setMessageDraft] = useState('')

  function openChat(chat) {
    if (!socketRef.current || !chat?.chat_id) {
      return
    }

    setStatus(`Opening ${chat.sender_name || chat.sender_mobile}...`)
    socketRef.current.emit('on_open_chat', {
      data: {
        chatId: chat.chat_id,
        limit: 200,
        chat,
      },
    })
  }

  const refreshChatList = useCallback((nextSearch = search, nextFilter = filterType) => {
    if (!socketRef.current) {
      return
    }

    socketRef.current.emit('get_chat_filter', {
      data: {
        search: nextSearch,
        filterType: nextFilter,
      },
    })
  }, [filterType, search])

  useEffect(() => {
    if (!decoded?.uid) {
      return undefined
    }

    const socket = io(API_BASE || window.location.origin, {
      query: {
        uid: decoded.uid,
        userToken: tokens.user,
      },
      transports: ['websocket', 'polling'],
    })

    socketRef.current = socket

    socket.on('connect', () => {
      setConnectionStatus('Live')
      socket.emit('get_chat', { data: { limit: 40 } })
    })

    socket.on('disconnect', () => {
      setConnectionStatus('Disconnected')
    })

    socket.on('connection_ack', () => {
      setConnectionStatus('Live')
    })

    socket.on('get_chat', (data) => {
      setChats(Array.isArray(data) ? data : [])
      setStatus('')
    })

    socket.on('update_chat_list', (data) => {
      setChats(Array.isArray(data) ? data : [])
    })

    socket.on('on_open_chat', (payload) => {
      setConversation(Array.isArray(payload?.conversation) ? payload.conversation : [])
      setSelectedChat(payload?.chatinfo || null)
      setChatNote(payload?.chatnote || '')
      setLabelsAdded(Array.isArray(payload?.labelsAdded) ? payload.labelsAdded : [])
      setAgentData(Array.isArray(payload?.agentData) ? payload.agentData : [])
      setChatAssignAgent(payload?.chatAssignAgent || {})
      setAssignAgentUid(payload?.chatAssignAgent?.uid || '')
      setStatus('')
    })

    socket.on('error', (payload) => {
      setStatus(payload?.msg || 'Inbox socket error')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [decoded?.uid, tokens.user])

  useEffect(() => {
    if (!socketRef.current) {
      return undefined
    }

    const timer = window.setTimeout(() => {
      refreshChatList(search, filterType)
    }, 220)

    return () => {
      window.clearTimeout(timer)
    }
  }, [filterType, refreshChatList, search])

  async function saveNote() {
    if (!selectedChat?.chat_id) {
      return
    }

    setStatus('Saving note...')
    try {
      const result = await apiRequest('/api/user/save_note', {
        method: 'POST',
        token: tokens.user,
        body: {
          chatId: selectedChat.chat_id,
          note: chatNote,
        },
      })

      setStatus(result?.success ? 'Note updated.' : result?.msg || 'Unable to save note')
    } catch (error) {
      setStatus(error.message || 'Unable to save note')
    }
  }

  function assignAgent() {
    if (!selectedChat?.chat_id || !socketRef.current) {
      return
    }

    setStatus(assignAgentUid ? 'Assigning agent...' : 'Removing agent assignment...')
    socketRef.current.emit('assign_agent_to_chat', {
      data: {
        chatId: selectedChat.chat_id,
        agentUid: assignAgentUid,
        unAssign: !assignAgentUid,
      },
    })

    setChatAssignAgent(
      assignAgentUid ? agentData.find((agent) => agent.uid === assignAgentUid) || {} : {},
    )
    refreshChatList()
  }

  function sendMessage(event) {
    event.preventDefault()

    if (!messageDraft.trim() || !selectedChat?.chat_id || !socketRef.current) {
      return
    }

    setStatus('Sending message...')
    socketRef.current.emit('send_chat_message', {
      data: {
        type: 'text',
        msgCon: {
          type: 'text',
          text: {
            preview_url: true,
            body: messageDraft.trim(),
          },
        },
        chatInfo: selectedChat,
      },
    })

    setMessageDraft('')

    window.setTimeout(() => {
      openChat(selectedChat)
      refreshChatList()
    }, 800)
  }

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">inbox</span>
          <h2>Live inbox workbench</h2>
          <p>Socket-backed chat list, conversation loading, notes, assignment, and outbound text messaging.</p>
        </div>
        <div className="status-chip">{connectionStatus}</div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="inbox-layout">
        <aside className="panel inbox-sidebar">
          <div className="panel-header">
            <h2>Chats</h2>
          </div>
          <div className="filter-row">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, number, note, or tag"
            />
            <select value={filterType} onChange={(event) => setFilterType(event.target.value)}>
              <option value="all">All</option>
              <option value="read">Read</option>
              <option value="unread">Unread</option>
            </select>
          </div>
          <div className="chat-list">
            {chats.map((chat) => (
              <button
                className={classNames(
                  'chat-list-item',
                  selectedChat?.chat_id === chat.chat_id ? 'active' : '',
                )}
                key={chat.chat_id}
                type="button"
                onClick={() => openChat(chat)}
              >
                <strong>{chat.phonebook?.name || chat.sender_name || chat.sender_mobile}</strong>
                <span>{chat.sender_mobile}</span>
                <p>{chat.last_message || 'No messages yet.'}</p>
              </button>
            ))}
          </div>
        </aside>

        <section className="page-stack">
          <div className="panel">
            <div className="panel-header">
              <h2>{selectedChat ? selectedChat.sender_name || selectedChat.sender_mobile : 'Conversation'}</h2>
            </div>
            <div className="conversation-thread">
              {conversation.length ? (
                conversation.map((message, index) => (
                  <article
                    className={classNames(
                      'message-bubble',
                      message.route === 'OUTGOING' ? 'outgoing' : 'incoming',
                    )}
                    key={`${message.metaChatId || message.timestamp || 'message'}-${index}`}
                  >
                    <span>{message.route === 'OUTGOING' ? 'You' : message.senderName || 'Contact'}</span>
                    <strong>{normalizeConversationMessage(message)}</strong>
                    <small>{formatRelativeTimestamp(message.timestamp)}</small>
                  </article>
                ))
              ) : (
                <p className="empty-state">Open a chat to load its conversation.</p>
              )}
            </div>
            <form className="composer-row" onSubmit={sendMessage}>
              <input
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder="Type a text reply"
              />
              <button className="primary-button" type="submit">
                Send
              </button>
            </form>
          </div>

          <div className="two-column-grid">
            <div className="panel form-panel">
              <div className="panel-header">
                <h2>Chat note</h2>
              </div>
              <textarea
                rows={6}
                value={chatNote}
                onChange={(event) => setChatNote(event.target.value)}
                placeholder="Internal note for this conversation"
              />
              <button className="primary-button" type="button" onClick={saveNote}>
                Save note
              </button>
            </div>

            <div className="panel form-panel">
              <div className="panel-header">
                <h2>Assignment and labels</h2>
              </div>
              <label>
                Assigned agent
                <select
                  value={assignAgentUid}
                  onChange={(event) => setAssignAgentUid(event.target.value)}
                >
                  <option value="">Unassigned</option>
                  {agentData.map((agent) => (
                    <option key={agent.uid} value={agent.uid}>
                      {agent.name} ({agent.email})
                    </option>
                  ))}
                </select>
              </label>
              <button className="primary-button" type="button" onClick={assignAgent}>
                {assignAgentUid ? 'Save assignment' : 'Remove assignment'}
              </button>
              <div className="meta-block">
                <p>Current assignment: {chatAssignAgent?.uid ? chatAssignAgent.email || chatAssignAgent.uid : 'None'}</p>
                <p>
                  Active labels:{' '}
                  {selectedChat?.chat_tags
                    ? Array.isArray(selectedChat.chat_tags)
                      ? selectedChat.chat_tags.join(', ')
                      : String(selectedChat.chat_tags)
                    : 'None'}
                </p>
                <p>Available labels: {labelsAdded.map((label) => label.title).join(', ') || 'None'}</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default UserInboxPage
