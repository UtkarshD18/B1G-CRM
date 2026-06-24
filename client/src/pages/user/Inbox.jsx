import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import { io } from 'socket.io-client'
import { API_BASE, apiFormRequest, apiFormRequestWithProgress, apiRequest } from '../../shared/api'
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
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [shortcutFilter, setShortcutFilter] = useState('')
  const [shortcutIndex, setShortcutIndex] = useState(0)
  const [hoveredMsgIndex, setHoveredMsgIndex] = useState(null)
  const [newTagInput, setNewTagInput] = useState('')

  const [templateForm, setTemplateForm] = useState({ id: null, title: '', body: '' })
  const [templateError, setTemplateError] = useState('')
  const [isEditingTemplate, setIsEditingTemplate] = useState(false)

  const filteredTemplates = useMemo(() => {
    if (!shortcutFilter) return templates
    return templates.filter(
      (t) =>
        String(t.title).toLowerCase().includes(shortcutFilter) ||
        String(t.content || '').toLowerCase().includes(shortcutFilter)
    )
  }, [templates, shortcutFilter])

  const loadTemplatesList = useCallback(async () => {
    try {
      const result = await apiRequest('/api/templet/get_templets', { token: tokens.user })
      if (result?.success && Array.isArray(result.data)) {
        setTemplates(result.data)
      }
    } catch (error) {
      console.error('Failed to load templates', error)
    }
  }, [tokens.user])

  useEffect(() => {
    loadTemplatesList()
  }, [loadTemplatesList])

  const saveTemplate = async (e) => {
    e.preventDefault()
    setTemplateError('')
    if (!templateForm.title.trim() || !templateForm.body.trim()) {
      setTemplateError('Title and Body are required.')
      return
    }

    try {
      let result
      if (isEditingTemplate && templateForm.id) {
        result = await apiRequest('/api/templet/update', {
          method: 'POST',
          token: tokens.user,
          body: {
            id: templateForm.id,
            title: templateForm.title.trim(),
            type: 'text',
            content: { body: templateForm.body.trim() },
          },
        })
      } else {
        result = await apiRequest('/api/templet/add_new', {
          method: 'POST',
          token: tokens.user,
          body: {
            title: templateForm.title.trim(),
            type: 'text',
            content: { body: templateForm.body.trim() },
          },
        })
      }

      if (result?.success) {
        setTemplateForm({ id: null, title: '', body: '' })
        setIsEditingTemplate(false)
        await loadTemplatesList()
      } else {
        setTemplateError(result?.msg || 'Failed to save template.')
      }
    } catch (err) {
      setTemplateError(err.message || 'An error occurred.')
    }
  }

  const deleteTemplate = async (templateId) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return
    }
    setTemplateError('')
    try {
      const result = await apiRequest('/api/templet/del_templets', {
        method: 'POST',
        token: tokens.user,
        body: {
          selected: [templateId],
        },
      })
      if (result?.success) {
        await loadTemplatesList()
      } else {
        setTemplateError(result?.msg || 'Failed to delete template.')
      }
    } catch (err) {
      setTemplateError(err.message || 'An error occurred.')
    }
  }

  const editTemplate = (template) => {
    let body = ''
    try {
      const parsedContent = typeof template.content === 'string'
        ? JSON.parse(template.content)
        : template.content
      body = parsedContent?.body || parsedContent?.text || String(parsedContent || '')
    } catch {
      body = String(template.content || '')
    }

    setTemplateForm({
      id: template.id,
      title: template.title,
      body: body,
    })
    setIsEditingTemplate(true)
    setTemplateError('')
  }

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

  async function handleAddTag(tagTitle) {
    if (!selectedChat?.chat_id || !tagTitle.trim()) {
      return
    }
    const cleanTag = tagTitle.trim()
    const currentTags = parseTags(selectedChat.chat_tags)
    if (currentTags.includes(cleanTag)) {
      setStatus('Tag already added')
      return
    }

    setStatus('Adding tag...')
    try {
      const result = await apiRequest('/api/user/push_tag', {
        method: 'POST',
        token: tokens.user,
        body: {
          chatId: selectedChat.chat_id,
          tag: cleanTag,
        },
      })

      if (result?.success) {
        setSelectedChat((prev) => {
          if (!prev) return prev
          const updatedTags = [...parseTags(prev.chat_tags), cleanTag]
          return {
            ...prev,
            chat_tags: JSON.stringify(updatedTags),
          }
        })
        setNewTagInput('')
        setStatus('Tag added.')
        refreshChatList(search, filterType)
      } else {
        setStatus(result?.msg || 'Unable to add tag')
      }
    } catch (error) {
      setStatus(error.message || 'Unable to add tag')
    }
  }

  async function handleRemoveTag(tagTitle) {
    if (!selectedChat?.chat_id) {
      return
    }

    setStatus('Removing tag...')
    try {
      const result = await apiRequest('/api/user/del_tag', {
        method: 'POST',
        token: tokens.user,
        body: {
          chatId: selectedChat.chat_id,
          tag: tagTitle,
        },
      })

      if (result?.success) {
        setSelectedChat((prev) => {
          if (!prev) return prev
          const updatedTags = parseTags(prev.chat_tags).filter((t) => t !== tagTitle)
          return {
            ...prev,
            chat_tags: JSON.stringify(updatedTags),
          }
        })
        setStatus('Tag removed.')
        refreshChatList(search, filterType)
      } else {
        setStatus(result?.msg || 'Unable to remove tag')
      }
    } catch (error) {
      setStatus(error.message || 'Unable to remove tag')
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

  async function handleDeleteMessage(msg) {
    if (!window.confirm('Are you sure you want to delete this message?')) return
    const msgId = msg.metaChatId || msg.timestamp
    try {
      const res = await apiRequest('/api/inbox/delete_message', {
        method: 'POST',
        token: tokens.user,
        body: {
          chatId: selectedChat.chat_id,
          messageId: msgId
        }
      })
      if (res?.success) {
        setConversation(prev => prev.filter(m => (m.metaChatId || m.timestamp) !== msgId))
      } else {
        alert(res?.msg || 'Could not delete message')
      }
    } catch (err) {
      alert(err.message || 'Error deleting message')
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
      const upload = await apiFormRequestWithProgress('/api/user/return_media_url', {
        token: tokens.user,
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
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span>{visibleChats.length}</span>
              {chats.filter((c) => c.is_opened === 0).length > 0 && (
                <span className="unread-indicator-badge" title={`${chats.filter((c) => c.is_opened === 0).length} unread`}>
                  {chats.filter((c) => c.is_opened === 0).length}
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
              <option value="unread">Unread {chats.filter((c) => c.is_opened === 0).length > 0 ? `(${chats.filter((c) => c.is_opened === 0).length})` : ''}</option>
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
                    onMouseEnter={() => setHoveredMsgIndex(index)}
                    onMouseLeave={() => setHoveredMsgIndex(null)}
                    style={{ position: 'relative' }}
                  >
                    {hoveredMsgIndex === index && (
                      <div className="message-actions-bar" style={{ display: 'flex', gap: '4px', position: 'absolute', top: '-14px', right: '10px', background: '#f8f3eb', border: '1px solid rgba(10,25,37,0.12)', borderRadius: '4px', padding: '2px 4px', zIndex: 10, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                        <button
                          type="button"
                          onClick={() => {
                            const bodyText = normalizeConversationMessage(message)
                            navigator.clipboard.writeText(bodyText)
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', padding: '0 2px' }}
                          title="Copy text"
                        >
                          📋
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const bodyText = normalizeConversationMessage(message)
                            setMessageDraft(`Replying to "${bodyText}": `)
                          }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', padding: '0 2px' }}
                          title="Reply/Quote"
                        >
                          💬
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(message)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '10px', padding: '0 2px' }}
                          title="Delete message"
                        >
                          ❌
                        </button>
                      </div>
                    )}
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
            <div style={{ position: 'relative' }}>
              {showShortcuts && filteredTemplates.length > 0 && (
                <div className="shortcuts-popover" style={{ position: 'absolute', bottom: '100%', left: '16px', background: '#f8f3eb', border: '1px solid rgba(10,25,37,0.12)', borderRadius: '12px', zIndex: 100, width: '280px', maxHeight: '200px', overflowY: 'auto', boxShadow: '0 8px 30px rgba(7,19,29,0.1)' }}>
                  {filteredTemplates.map((t, idx) => (
                    <div
                      key={t.id}
                      onClick={() => selectShortcut(t)}
                      style={{
                        padding: '10px 14px',
                        cursor: 'pointer',
                        background: idx === shortcutIndex ? 'rgba(30,160,133,0.1)' : 'transparent',
                        borderBottom: '1px solid rgba(10,25,37,0.06)',
                        color: 'var(--text)'
                      }}
                    >
                      <strong style={{ color: '#1ea085', fontSize: '13px' }}>/{t.title}</strong>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                        {typeof t.content === 'string' ? t.content : JSON.stringify(t.content)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <form className="wa-composer" onSubmit={sendMessage}>
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
            </div>
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
            <div className="meta-block" style={{ marginTop: '16px', borderTop: '1px solid rgba(16, 33, 45, 0.1)', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.85rem', color: '#10212d', fontWeight: '700' }}>Active tags:</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                {parseTags(selectedChat?.chat_tags).length > 0 ? (
                  parseTags(selectedChat.chat_tags).map((tag, idx) => {
                    const tagTitle = typeof tag === 'object' ? tag?.title : tag
                    const tagHex = typeof tag === 'object' ? tag?.hex : '#1ea085'
                    return (
                      <span
                        key={idx}
                        className="chat-card-tag"
                        style={{
                          backgroundColor: tagHex + '1a',
                          color: tagHex,
                          border: `1px solid ${tagHex}4d`,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                      >
                        {tagTitle}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tagTitle)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'inherit',
                            cursor: 'pointer',
                            padding: '0 2px',
                            fontWeight: 'bold',
                            fontSize: '0.75rem',
                            lineHeight: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          title={`Remove ${tagTitle}`}
                        >
                          &times;
                        </button>
                      </span>
                    )
                  })
                ) : (
                  <span style={{ color: '#5d7280', fontSize: '0.82rem', fontStyle: 'italic' }}>No active tags</span>
                )}
              </div>

              {labelsAdded.length > 0 && (
                <label style={{ display: 'grid', gap: '4px', marginTop: '12px' }}>
                  Select predefined label
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddTag(e.target.value)
                      }
                    }}
                    disabled={!selectedChat}
                  >
                    <option value="">-- Choose label --</option>
                    {labelsAdded
                      .filter(l => !parseTags(selectedChat?.chat_tags).map(t => typeof t === 'object' ? t.title : t).includes(l.title))
                      .map((label) => (
                        <option key={label.id || label.title} value={label.title}>
                          {label.title}
                        </option>
                      ))}
                  </select>
                </label>
              )}

              <div style={{ display: 'grid', gap: '4px', marginTop: '12px' }}>
                <span style={{ fontSize: '0.75rem', color: '#365261', fontWeight: '800' }}>Add custom tag</span>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="e.g. Follow-up"
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    disabled={!selectedChat}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid #c5d0d6',
                      fontSize: '0.85rem'
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag(newTagInput)
                      }
                    }}
                  />
                  <button
                    className="primary-button"
                    type="button"
                    onClick={() => handleAddTag(newTagInput)}
                    disabled={!selectedChat || !newTagInput.trim()}
                    style={{
                      padding: '8px 14px',
                      fontSize: '0.85rem',
                      whiteSpace: 'nowrap',
                      marginTop: 0
                    }}
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="panel form-panel">
            <div className="panel-header">
              <h2>Quick Text Templates</h2>
            </div>
            {templateError && <p className="status-line error-line" style={{ color: 'red', fontSize: '0.8rem', margin: '0 0 8px 0' }}>{templateError}</p>}
            
            <form onSubmit={saveTemplate} style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: '#365261', fontWeight: '800' }}>
                {isEditingTemplate ? 'Edit Template' : 'Create Quick Reply Template'}
              </span>
              <label style={{ fontSize: '0.75rem', display: 'grid', gap: '4px' }}>
                Template Name
                <input
                  type="text"
                  placeholder="e.g. welcome_msg"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm({ ...templateForm, title: e.target.value })}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #c5d0d6' }}
                />
              </label>
              <label style={{ fontSize: '0.75rem', display: 'grid', gap: '4px' }}>
                Template Content (Body)
                <textarea
                  rows={3}
                  placeholder="e.g. Hello, thanks for reaching out!"
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #c5d0d6', fontFamily: 'inherit' }}
                />
              </label>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button className="primary-button" type="submit" style={{ padding: '6px 12px', fontSize: '0.8rem', marginTop: 0, flex: 1 }}>
                  {isEditingTemplate ? 'Update' : 'Save'}
                </button>
                {isEditingTemplate && (
                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() => {
                      setTemplateForm({ id: null, title: '', body: '' })
                      setIsEditingTemplate(false)
                      setTemplateError('')
                    }}
                    style={{ padding: '6px 12px', fontSize: '0.8rem', marginTop: 0 }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            <div style={{ borderTop: '1px solid rgba(16, 33, 45, 0.1)', paddingTop: '12px' }}>
              <span style={{ fontSize: '0.85rem', color: '#10212d', fontWeight: '700', display: 'block', marginBottom: '8px' }}>
                Saved Templates ({templates.length})
              </span>
              {templates.length > 0 ? (
                <div style={{ display: 'grid', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {templates.map((t) => {
                    let contentBody = ''
                    try {
                      const parsed = typeof t.content === 'string' ? JSON.parse(t.content) : t.content
                      contentBody = parsed?.body || parsed?.text || String(parsed || '')
                    } catch {
                      contentBody = String(t.content || '')
                    }
                    return (
                      <div
                        key={t.id}
                        style={{
                          padding: '8px',
                          backgroundColor: 'rgba(16, 33, 45, 0.03)',
                          borderRadius: '6px',
                          border: '1px solid rgba(16, 33, 45, 0.08)'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.8rem', color: '#1ea085' }}>/{t.title}</strong>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => editTemplate(t)}
                              style={{ background: 'none', border: 'none', color: '#3498db', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTemplate(t.id)}
                              style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {contentBody}
                        </p>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                  No templates saved yet.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

export default UserInboxPage
