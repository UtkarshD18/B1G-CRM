import { useCallback, useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { API_BASE, apiFormRequest, apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { classNames, decodeTokenPayload, formatRelativeTimestamp, normalizeConversationMessage } from '../../shared/format'

const channelFilters = [
  { key: 'all', label: 'All' },
  { key: 'whatsapp', label: 'WhatsApp' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'website', label: 'Website' },
]

const mediaTypeOptions = [
  { key: 'image', label: 'Image', accept: 'image/*' },
  { key: 'video', label: 'Video', accept: 'video/*' },
  { key: 'document', label: 'Document', accept: '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,application/*' },
  { key: 'audio', label: 'Audio', accept: 'audio/*' },
]

function getMediaAccept(mediaType) {
  return mediaTypeOptions.find((option) => option.key === mediaType)?.accept || '*/*'
}

function buildMediaMessage({ mediaType, url, caption, origin }) {
  const cleanCaption = String(caption || '').trim()

  if (mediaType === 'audio') {
    return {
      type: 'audio',
      audio: {
        link: url,
      },
    }
  }

  const mediaBody = {
    link: url,
    ...(cleanCaption ? { caption: cleanCaption } : {}),
  }

  return {
    type: mediaType,
    ...(origin === 'qr' && cleanCaption ? { caption: cleanCaption } : {}),
    [mediaType]: mediaBody,
  }
}

function getContactName(chat) {
  return chat?.phonebook?.name || chat?.sender_name || chat?.name || chat?.sender_mobile || 'Unknown contact'
}

function getContactNumber(chat) {
  return chat?.sender_mobile || chat?.mobile || chat?.number || 'No number'
}

function getInitials(value) {
  const source = String(value || '').trim()
  if (!source) {
    return 'U'
  }

  const parts = source.split(/\s+/).filter(Boolean)
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getChannel(chat) {
  const origin = String(chat?.origin || chat?.channel || '').toLowerCase()
  if (origin.includes('insta') || origin.includes('instagram')) {
    return 'instagram'
  }
  if (origin.includes('widget') || origin.includes('web')) {
    return 'website'
  }
  return 'whatsapp'
}

function getChannelLabel(chat) {
  const channel = getChannel(chat)
  if (channel === 'instagram') {
    return 'Instagram'
  }
  if (channel === 'website') {
    return 'Website'
  }
  return chat?.origin === 'qr' ? 'WhatsApp QR' : 'WhatsApp'
}

function getTicketLabel(chat) {
  const status = String(chat?.chat_status || 'open').toLowerCase()
  if (status === 'solved') {
    return 'Solved'
  }
  if (status === 'pending') {
    return 'Pending'
  }
  return 'Open'
}

function UserInboxPage() {
  const { tokens } = useAuth()
  const socketRef = useRef(null)
  const decoded = decodeTokenPayload(tokens.user)
  const [chats, setChats] = useState([])
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [status, setStatus] = useState('Loading inbox...')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [channelFilter, setChannelFilter] = useState('all')
  const [selectedChat, setSelectedChat] = useState(null)
  const [conversation, setConversation] = useState([])
  const [chatNote, setChatNote] = useState('')
  const [labelsAdded, setLabelsAdded] = useState([])
  const [agentData, setAgentData] = useState([])
  const [chatAssignAgent, setChatAssignAgent] = useState({})
  const [assignAgentUid, setAssignAgentUid] = useState('')
  const [messageDraft, setMessageDraft] = useState('')
  const [mediaType, setMediaType] = useState('image')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaCaption, setMediaCaption] = useState('')
  const [mediaBusy, setMediaBusy] = useState(false)
  const [mediaInputKey, setMediaInputKey] = useState(0)

  function openChat(chat) {
    if (!socketRef.current || !chat?.chat_id) {
      return
    }

    setStatus(`Opening ${getContactName(chat)}...`)
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

  async function sendMedia() {
    if (!selectedChat?.chat_id || !socketRef.current || !mediaFile || mediaBusy) {
      return
    }

    const formData = new FormData()
    formData.append('file', mediaFile)
    setMediaBusy(true)
    setStatus('Uploading media...')

    try {
      const upload = await apiFormRequest('/api/user/return_media_url', {
        token: tokens.user,
        formData,
      })

      if (!upload?.success || !upload?.url) {
        throw new Error(upload?.msg || 'Unable to upload media')
      }

      const msgCon = buildMediaMessage({
        mediaType,
        url: upload.url,
        caption: mediaCaption,
        origin: selectedChat.origin,
      })

      setStatus('Sending media...')
      socketRef.current.emit('send_chat_message', {
        data: {
          type: mediaType,
          msgCon,
          chatInfo: selectedChat,
        },
      })

      setMediaFile(null)
      setMediaCaption('')
      setMediaInputKey((current) => current + 1)

      window.setTimeout(() => {
        openChat(selectedChat)
        refreshChatList()
      }, 900)
    } catch (error) {
      setStatus(error.message || 'Unable to send media')
    } finally {
      setMediaBusy(false)
    }
  }

  const visibleChats = chats.filter((chat) => {
    if (channelFilter === 'all') {
      return true
    }

    return getChannel(chat) === channelFilter
  })

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">inbox</span>
          <h2>Omnichannel operator inbox</h2>
          <p>WhatsApp-style web console for tenant conversations, assignment, notes, and live replies.</p>
        </div>
        <div className="status-chip">{connectionStatus}</div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="inbox-console">
        <aside className="inbox-rail">
          <div className="inbox-rail-header">
            <h2>Chats</h2>
            <span>{visibleChats.length}</span>
          </div>
          <div className="channel-tabs" aria-label="Channel filter">
            {channelFilters.map((filter) => (
              <button
                className={classNames('channel-tab', channelFilter === filter.key ? 'active' : '')}
                key={filter.key}
                type="button"
                onClick={() => setChannelFilter(filter.key)}
              >
                {filter.label}
              </button>
            ))}
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
            {visibleChats.map((chat) => (
              <button
                className={classNames(
                  'wa-chat-row',
                  selectedChat?.chat_id === chat.chat_id ? 'active' : '',
                )}
                key={chat.chat_id}
                type="button"
                onClick={() => openChat(chat)}
              >
                <span className="wa-avatar">{getInitials(getContactName(chat))}</span>
                <span className="wa-chat-main">
                  <strong>{getContactName(chat)}</strong>
                  <span>{chat.last_message || 'No messages yet.'}</span>
                </span>
                <span className="wa-chat-meta">
                  <small>{formatRelativeTimestamp(chat.last_message_came)}</small>
                  <em>{getChannelLabel(chat)}</em>
                </span>
              </button>
            ))}
            {!visibleChats.length ? <p className="empty-state">No chats match this filter.</p> : null}
          </div>
        </aside>

        <section className="wa-conversation-panel">
          <div className="wa-conversation-header">
            {selectedChat ? (
              <>
                <span className="wa-avatar large">{getInitials(getContactName(selectedChat))}</span>
                <div>
                  <h2>{getContactName(selectedChat)}</h2>
                  <p>{getContactNumber(selectedChat)} · {getChannelLabel(selectedChat)} · {getTicketLabel(selectedChat)}</p>
                </div>
              </>
            ) : (
              <div>
                <h2>Conversation</h2>
                <p>Open a chat to start working.</p>
              </div>
            )}
          </div>
          <div className="wa-thread-shell">
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
                    {message.type === 'image' ? (
                      <div className="message-media">
                        <img
                          src={message.msgContext?.image?.link || message.msgContext?.image?.url || message.msgContext?.link}
                          alt={message.msgContext?.image?.caption || 'Image'}
                          style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', display: 'block', marginTop: '4px' }}
                        />
                        {message.msgContext?.image?.caption && (
                          <strong style={{ display: 'block', marginTop: '4px' }}>
                            {message.msgContext.image.caption}
                          </strong>
                        )}
                      </div>
                    ) : message.type === 'video' ? (
                      <div className="message-media">
                        <video
                          src={message.msgContext?.video?.link || message.msgContext?.video?.url || message.msgContext?.link}
                          controls
                          style={{ maxWidth: '100%', maxHeight: '240px', borderRadius: '8px', display: 'block', marginTop: '4px' }}
                        />
                        {message.msgContext?.video?.caption && (
                          <strong style={{ display: 'block', marginTop: '4px' }}>
                            {message.msgContext.video.caption}
                          </strong>
                        )}
                      </div>
                    ) : message.type === 'document' ? (
                      <div className="message-media">
                        <a
                          href={message.msgContext?.document?.link || message.msgContext?.document?.url || message.msgContext?.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#1ea085', textDecoration: 'underline', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                        >
                          📄 Download Document
                        </a>
                        {message.msgContext?.document?.caption && (
                          <strong style={{ display: 'block', marginTop: '4px' }}>
                            {message.msgContext.document.caption}
                          </strong>
                        )}
                      </div>
                    ) : message.type === 'audio' ? (
                      <div className="message-media">
                        <audio
                          src={message.msgContext?.audio?.link || message.msgContext?.audio?.url || message.msgContext?.link}
                          controls
                          style={{ maxWidth: '100%', display: 'block', marginTop: '4px' }}
                        />
                      </div>
                    ) : (
                      <strong>{normalizeConversationMessage(message)}</strong>
                    )}
                    <small>{formatRelativeTimestamp(message.timestamp)}</small>
                  </article>
                ))
              ) : (
                <p className="empty-state">Open a chat to load its conversation.</p>
              )}
            </div>
            <form className="wa-composer" onSubmit={sendMessage}>
              <input
                value={messageDraft}
                onChange={(event) => setMessageDraft(event.target.value)}
                placeholder={selectedChat ? 'Type a WhatsApp reply' : 'Open a chat before replying'}
                disabled={!selectedChat}
              />
              <button className="primary-button" type="submit" disabled={!selectedChat || !messageDraft.trim()}>
                Send
              </button>
            </form>
            <div className="media-composer" aria-label="Media composer">
              <select
                aria-label="Media type"
                value={mediaType}
                onChange={(event) => {
                  setMediaType(event.target.value)
                  if (event.target.value === 'audio') {
                    setMediaCaption('')
                  }
                }}
                disabled={!selectedChat || mediaBusy}
              >
                {mediaTypeOptions.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
              <input
                key={mediaInputKey}
                aria-label="Media file"
                type="file"
                accept={getMediaAccept(mediaType)}
                onChange={(event) => setMediaFile(event.target.files?.[0] || null)}
                disabled={!selectedChat || mediaBusy}
              />
              {mediaType !== 'audio' ? (
                <input
                  aria-label="Media caption"
                  value={mediaCaption}
                  onChange={(event) => setMediaCaption(event.target.value)}
                  placeholder="Optional caption"
                  disabled={!selectedChat || mediaBusy}
                />
              ) : null}
              <button
                className="secondary-button dark-text"
                type="button"
                onClick={sendMedia}
                disabled={!selectedChat || !mediaFile || mediaBusy}
              >
                {mediaBusy ? 'Sending...' : 'Send media'}
              </button>
            </div>
          </div>
        </section>

        <aside className="inbox-context-panel">
          <div className="panel form-panel">
            <div className="panel-header">
              <h2>Conversation context</h2>
            </div>
            <div className="meta-block">
              <p>Contact: {selectedChat ? getContactName(selectedChat) : 'None selected'}</p>
              <p>Channel: {selectedChat ? getChannelLabel(selectedChat) : 'N/A'}</p>
              <p>Status: {selectedChat ? getTicketLabel(selectedChat) : 'N/A'}</p>
              <p>Assigned: {chatAssignAgent?.uid ? chatAssignAgent.email || chatAssignAgent.uid : 'Unassigned'}</p>
            </div>
          </div>

          <div className="panel form-panel">
            <div className="panel-header">
              <h2>Chat note</h2>
            </div>
            <textarea
              rows={6}
              value={chatNote}
              onChange={(event) => setChatNote(event.target.value)}
              placeholder="Internal note for this conversation"
              disabled={!selectedChat}
            />
            <button className="primary-button" type="button" onClick={saveNote} disabled={!selectedChat}>
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
                disabled={!selectedChat}
              >
                <option value="">Unassigned</option>
                {agentData.map((agent) => (
                  <option key={agent.uid} value={agent.uid}>
                    {agent.name} ({agent.email})
                  </option>
                ))}
              </select>
            </label>
            <button className="primary-button" type="button" onClick={assignAgent} disabled={!selectedChat}>
              {assignAgentUid ? 'Save assignment' : 'Remove assignment'}
            </button>
            <div className="meta-block">
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
        </aside>
      </div>
    </div>
  )
}

export default UserInboxPage
