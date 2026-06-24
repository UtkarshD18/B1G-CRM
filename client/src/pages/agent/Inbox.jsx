import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import { API_BASE, apiFormRequestWithProgress, apiRequest } from '../../shared/api'
import { useAuth } from '../../shared/auth'
import { classNames, decodeTokenPayload, formatRelativeTimestamp, normalizeConversationMessage, parseStoredJson } from '../../shared/format'
import { FaWhatsapp, FaInstagram, FaTelegram, FaGlobe, FaFacebook } from 'react-icons/fa'

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

function parseTags(tagsField) {
  if (!tagsField) return []
  if (Array.isArray(tagsField)) return tagsField
  try {
    const parsed = JSON.parse(tagsField)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return String(tagsField).split(',').map((t) => t.trim()).filter(Boolean)
  }
}

function formatLastMessage(lastMessage) {
  if (!lastMessage) return 'No messages yet.'
  const parsed = parseStoredJson(lastMessage)
  if (parsed) {
    return normalizeConversationMessage(parsed)
  }
  return lastMessage
}

function AgentInboxPage() {
  const { tokens } = useAuth()
  const socketRef = useRef(null)
  const decoded = decodeTokenPayload(tokens.agent)
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
  const [chatAssignAgent, setChatAssignAgent] = useState({})
  const [messageDraft, setMessageDraft] = useState('')
  const [mediaType, setMediaType] = useState('image')
  const [mediaFile, setMediaFile] = useState(null)
  const [mediaCaption, setMediaCaption] = useState('')
  const [mediaBusy, setMediaBusy] = useState(false)
  const [mediaInputKey, setMediaInputKey] = useState(0)
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [chatStatusVal, setChatStatusVal] = useState('open')
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [shortcutFilter, setShortcutFilter] = useState('')
  const [shortcutIndex, setShortcutIndex] = useState(0)

  const filteredTemplates = useMemo(() => {
    if (!shortcutFilter) return templates
    return templates.filter(
      (t) =>
        String(t.title).toLowerCase().includes(shortcutFilter) ||
        String(t.content || '').toLowerCase().includes(shortcutFilter)
    )
  }, [templates, shortcutFilter])

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

  const loadTemplatesList = useCallback(async () => {
    try {
      const result = await apiRequest('/api/agent/get_templets', { token: tokens.agent })
      if (result?.success && Array.isArray(result.data)) {
        setTemplates(result.data)
      }
    } catch (error) {
      console.error('Failed to load templates', error)
    }
  }, [tokens.agent])

  useEffect(() => {
    loadTemplatesList()
  }, [loadTemplatesList])

  useEffect(() => {
    if (!decoded?.uid) {
      return undefined
    }

    const socket = io(API_BASE || window.location.origin, {
      query: {
        uid: decoded.uid,
        agent: 'true',
        userToken: tokens.agent,
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
      const chatList = Array.isArray(data) ? data : []
      setChats(chatList)
      setStatus('')

      // Auto-open chat if URL query has chatId
      const params = new URLSearchParams(window.location.search)
      const queryChatId = params.get('chatId')
      if (queryChatId) {
        const found = chatList.find((c) => String(c.chat_id) === String(queryChatId))
        if (found) {
          setStatus(`Opening ${getContactName(found)}...`)
          socket.emit('on_open_chat', {
            data: {
              chatId: found.chat_id,
              limit: 200,
              chat: found,
            },
          })
          // Clean the query parameter from the URL
          params.delete('chatId')
          const newSearch = params.toString()
          const newPath = window.location.pathname + (newSearch ? '?' + newSearch : '')
          window.history.replaceState(null, '', newPath)
        }
      }
    })

    socket.on('update_chat_list', (data) => {
      setChats(Array.isArray(data) ? data : [])
    })

    socket.on('on_open_chat', (payload) => {
      setConversation(Array.isArray(payload?.conversation) ? payload.conversation : [])
      setSelectedChat(payload?.chatinfo || null)
      setChatStatusVal(payload?.chatinfo?.chat_status || 'open')
      setChatNote(payload?.chatnote || '')
      setLabelsAdded(Array.isArray(payload?.labelsAdded) ? payload.labelsAdded : [])
      setChatAssignAgent(payload?.chatAssignAgent || {})
      setStatus('')
    })

    socket.on('error', (payload) => {
      setStatus(payload?.msg || 'Inbox socket error')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [decoded?.uid, tokens.agent])

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
      const result = await apiRequest('/api/agent/save_note', {
        method: 'POST',
        token: tokens.agent,
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

  async function updateChatStatus() {
    if (!selectedChat?.chat_id) {
      return
    }
    setStatus('Updating status...')
    try {
      const result = await apiRequest('/api/agent/change_chat_ticket_status', {
        method: 'POST',
        token: tokens.agent,
        body: {
          chatId: selectedChat.chat_id,
          status: chatStatusVal,
        },
      })
      if (result?.success) {
        setStatus('Status updated.')
        setSelectedChat((current) => current ? { ...current, chat_status: chatStatusVal } : null)
        refreshChatList()
      } else {
        setStatus(result?.msg || 'Unable to update status')
      }
    } catch (error) {
      setStatus(error.message || 'Unable to update status')
    }
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

  const handleKeyDown = (event) => {
    if (showShortcuts && filteredTemplates.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setShortcutIndex((prev) => (prev + 1) % filteredTemplates.length)
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setShortcutIndex((prev) => (prev - 1 + filteredTemplates.length) % filteredTemplates.length)
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        selectShortcut(filteredTemplates[shortcutIndex])
        return
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        setShowShortcuts(false)
        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage(event)
    }
  }

  const handleComposerChange = (val) => {
    setMessageDraft(val)
    if (val.startsWith('/') && !val.includes(' ')) {
      setShowShortcuts(true)
      setShortcutFilter(val.substring(1).toLowerCase())
      setShortcutIndex(0)
    } else {
      setShowShortcuts(false)
    }
  }

  const selectShortcut = (temp) => {
    if (!temp) return
    let text = ''
    try {
      const parsedContent = typeof temp.content === 'string'
        ? JSON.parse(temp.content)
        : temp.content
      text = parsedContent?.body || parsedContent?.text || String(parsedContent || '')
    } catch {
      text = String(temp.content || '')
    }
    setMessageDraft(text)
    setShowShortcuts(false)
  }

  const handleTemplateChange = (event) => {
    const templetId = event.target.value
    setSelectedTemplateId(templetId)
    if (!templetId) return
    const selectedTemp = templates.find((t) => String(t.id) === String(templetId))
    if (selectedTemp) {
      let text = ''
      try {
        const parsedContent = typeof selectedTemp.content === 'string'
          ? JSON.parse(selectedTemp.content)
          : selectedTemp.content
        text = parsedContent?.body || parsedContent?.text || String(parsedContent || '')
      } catch {
        text = String(selectedTemp.content || '')
      }
      setMessageDraft(text)
    }
  }

  async function sendMedia() {
    if (!selectedChat?.chat_id || !socketRef.current || !mediaFile || mediaBusy) {
      return
    }

    const formData = new FormData()
    formData.append('file', mediaFile)
    setMediaBusy(true)
    setUploading(true)
    setUploadProgress(0)
    setStatus('Uploading media...')

    try {
      const upload = await apiFormRequestWithProgress('/api/agent/return_media_url', {
        token: tokens.agent,
        formData,
        onProgress: (percent) => setUploadProgress(percent),
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
      setUploading(false)
    }
  }

  const visibleChats = chats.filter((chat) => {
    if (channelFilter === 'all') {
      return true
    }

    return getChannel(chat) === channelFilter
  })

  const unreadCount = chats.filter((c) => c.is_opened === 0).length

  return (
    <div className="page-stack">
      <div className="page-header">
        <div>
          <span className="eyebrow">workspace</span>
          <h2>Agent assigned inbox</h2>
          <p>Restricted chat console listing only chats assigned to you.</p>
        </div>
        <div className="status-chip">{connectionStatus}</div>
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="inbox-console">
        <aside className="inbox-rail">
          <div className="inbox-rail-header">
            <h2>Chats</h2>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>{visibleChats.length}</span>
              {unreadCount > 0 && (
                <span className="unread-indicator-badge" title={`${unreadCount} unread`}>
                  {unreadCount}
                </span>
              )}
            </div>
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
              <option value="unread">Unread {unreadCount > 0 ? `(${unreadCount})` : ''}</option>
            </select>
          </div>
          <div className="chat-list">
            {visibleChats.map((chat) => {
              const tags = parseTags(chat.chat_tags)
              return (
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
                    <span>{formatLastMessage(chat.last_message)}</span>
                    {tags.length > 0 && (
                      <div className="chat-card-tags">
                        {tags.map((tag, idx) => {
                          const title = typeof tag === 'object' ? tag?.title : tag
                          const hex = typeof tag === 'object' ? tag?.hex : '#1ea085'
                          return (
                            <span
                              key={idx}
                              className="chat-card-tag"
                              style={{
                                backgroundColor: hex + '1a',
                                color: hex,
                                border: `1px solid ${hex}33`,
                              }}
                            >
                              {title}
                            </span>
                          )
                        })}
                      </div>
                    )}
                    {chat.agent_name && (
                      <span className="chat-card-agent-badge">
                        Agent: {chat.agent_name}
                      </span>
                    )}
                  </span>
                  <span className="wa-chat-meta">
                    <small>{formatRelativeTimestamp(chat.last_message_came)}</small>
                    <em>{getChannelIcon(chat)}</em>
                    {chat.is_opened === 0 && (
                      <span className="unread-indicator-badge" style={{ marginTop: '4px' }}>
                        1
                      </span>
                    )}
                  </span>
                </button>
              )
            })}
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
                  <p style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', margin: 0 }}>
                    <span>{getContactNumber(selectedChat)}</span>
                    <span>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      {getChannelIcon(selectedChat)} {getChannelLabel(selectedChat)}
                    </span>
                    <span>·</span>
                    <span>{getTicketLabel(selectedChat)}</span>
                    <span>·</span>
                    {chatAssignAgent?.name ? (
                      <span className="agent-badge">Assigned: {chatAssignAgent.name}</span>
                    ) : (
                      <span className="agent-badge unassigned">Unassigned</span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <div>
                <h2>Conversation</h2>
                <p>Open an assigned chat to start working.</p>
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
            <form className="wa-composer" onSubmit={sendMessage} style={{ position: 'relative' }}>
              {showShortcuts && filteredTemplates.length > 0 && (
                <div className="shortcuts-popover" style={{ position: 'absolute', bottom: '100%', left: '16px', background: '#f8f3eb', border: '1px solid rgba(10,25,37,0.12)', borderRadius: '12px', zIndex: 100, width: '280px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 30px rgba(7,19,29,0.1)' }}>
                  {filteredTemplates.map((t, idx) => (
                    <div
                      key={t.id}
                      onClick={() => selectShortcut(t)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        borderRadius: idx === 0 ? '12px 12px 0 0' : idx === filteredTemplates.length - 1 ? '0 0 12px 12px' : '0',
                        background: idx === shortcutIndex ? 'rgba(30,160,133,0.1)' : 'transparent',
                        borderBottom: idx < filteredTemplates.length - 1 ? '1px solid rgba(10,25,37,0.06)' : 'none',
                      }}
                    >
                      <strong style={{ fontSize: '13px', display: 'block' }}>{t.title}</strong>
                      <span style={{ fontSize: '11px', color: '#6b7280', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(() => { try { const p = typeof t.content === 'string' ? JSON.parse(t.content) : t.content; return p?.body || p?.text || String(p || '') } catch { return String(t.content || '') } })()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {templates.length > 0 && (
                <select
                  className="quick-reply-select"
                  value={selectedTemplateId}
                  onChange={handleTemplateChange}
                  aria-label="Quick reply template select"
                >
                  <option value="">Quick Reply</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              )}
              <textarea
                value={messageDraft}
                onChange={(event) => handleComposerChange(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedChat ? 'Type a WhatsApp reply (Type / for shortcuts)' : 'Open a chat before replying'}
                disabled={!selectedChat}
                className="wa-composer-textarea"
                rows={1}
              />
              <button className="primary-button" type="submit" disabled={!selectedChat || !messageDraft.trim()}>
                Send
              </button>
            </form>
            {uploading && (
              <div className="upload-progress-container" style={{ margin: '0 24px 8px 24px' }}>
                <div className="upload-progress-bar" style={{ width: `${uploadProgress}%` }} />
                <span className="upload-progress-text">{uploadProgress}% uploaded</span>
              </div>
            )}
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
              <p>Assigned: {chatAssignAgent?.uid ? chatAssignAgent.name || chatAssignAgent.uid : 'Unassigned'}</p>
            </div>
          </div>

          <div className="panel form-panel">
            <div className="panel-header">
              <h2>Ticket Status</h2>
            </div>
            <label>
              Chat status
              <select
                value={chatStatusVal}
                onChange={(event) => setChatStatusVal(event.target.value)}
                disabled={!selectedChat}
              >
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="solved">Solved</option>
              </select>
            </label>
            <button className="primary-button" type="button" onClick={updateChatStatus} disabled={!selectedChat}>
              Save status
            </button>
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
              <h2>Labels</h2>
            </div>
            <div className="meta-block">
              <p>
                Active labels:{' '}
                {selectedChat?.chat_tags
                  ? parseTags(selectedChat.chat_tags).map(t => typeof t === 'object' ? t.title : t).join(', ')
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

export default AgentInboxPage
