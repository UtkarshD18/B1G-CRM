import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from './api';

export function useInboxSocket({
  token,
  uid,
  agent = false,
  socketRef,
  search,
  filterType,
  channelFilter,
  onChats,
  onOpenChat,
  onStatus,
  onConnection,
  onAccessRevoked,
  onPermissions,
}) {
  const latest = useRef({});
  useLayoutEffect(() => {
    latest.current = {
      search,
      filterType,
      channelFilter,
      onChats,
      onOpenChat,
      onStatus,
      onConnection,
      onAccessRevoked,
      onPermissions,
    };
  });
  const selected = useRef(null);
  const loadedChat = useRef(null);
  const chatTimeout = useRef(null);
  const listRequest = useRef(0);
  const chatRequest = useRef(0);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState('');

  const refreshChatList = useCallback(() => {
    const state = latest.current;
    socketRef.current?.emit('get_chat_filter', {
      data: {
        search: state.search,
        filterType: state.filterType,
        channel: state.channelFilter,
        limit: 100,
        requestId: ++listRequest.current,
      },
    });
  }, [socketRef]);

  const requestConversation = useCallback(
    (chat, background = false) => {
      if (!socketRef.current || !chat?.chat_id) return;
      selected.current = chat;
      background = background && loadedChat.current === chat.chat_id;
      const requestId = ++chatRequest.current;
      clearTimeout(chatTimeout.current);
      if (!background) {
        chatTimeout.current = setTimeout(() => {
          if (requestId !== chatRequest.current) return;
          setConversationLoading(false);
          setConversationError('The conversation did not load. Check your connection and retry.');
        }, 12000);
        setConversationLoading(true);
        setConversationError('');
        latest.current.onStatus('Opening conversation…');
      }
      socketRef.current.emit('on_open_chat', {
        data: {
          chatId: chat.chat_id,
          chat,
          limit: 200,
          background,
          requestId,
        },
      });
    },
    [socketRef],
  );

  const openChat = useCallback((chat) => requestConversation(chat), [requestConversation]);

  useEffect(() => {
    if (!uid) return undefined;
    const socket = io(API_BASE || window.location.origin, {
      query: { uid, userToken: token, ...(agent ? { agent: 'true' } : {}) },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;
    let timeout;
    socket.on('connect', () => {
      latest.current.onConnection('Live');
      refreshChatList();
      if (selected.current) requestConversation(selected.current, true);
    });
    const updatePermissions = (payload) => {
      latest.current.onPermissions?.(payload.permissions || []);
      if (agent)
        window.dispatchEvent(
          new CustomEvent('omnicrm-agent-permissions', { detail: payload.permissions || [] }),
        );
    };
    socket.on('connection_ack', updatePermissions);
    socket.on('permissions_updated', updatePermissions);
    socket.on('chat_access_revoked', ({ chatId }) => {
      if (selected.current?.chat_id === chatId) {
        selected.current = null;
        loadedChat.current = null;
        chatRequest.current += 1;
        clearTimeout(chatTimeout.current);
        setConversationLoading(false);
        setConversationError('');
        latest.current.onAccessRevoked?.();
        latest.current.onStatus('This conversation is no longer assigned to you.');
      }
      refreshChatList();
    });
    socket.on('disconnect', () => latest.current.onConnection('Reconnecting…'));
    socket.on('connect_error', () => {
      latest.current.onConnection('Disconnected');
      latest.current.onStatus(
        'Connection unavailable. Changes will sync when the connection returns.',
      );
    });
    socket.on('get_chat', (payload) => {
      if (payload?.requestId != null && payload.requestId !== listRequest.current) return;
      latest.current.onChats(Array.isArray(payload) ? payload : payload?.chats || []);
      // Background refreshes must not erase action feedback.
      latest.current.onStatus((current) =>
        ['Loading inbox...', 'Opening conversation…'].includes(current) ? '' : current,
      );
    });
    // A notification may contain a truncated/unfiltered list from an older
    // adapter. Requery using the current search/channel instead of replacing it.
    socket.on('update_chat_list', () => {
      clearTimeout(timeout);
      timeout = setTimeout(refreshChatList, 80);
    });
    socket.on('update_conversation', () => {
      if (selected.current) requestConversation(selected.current, true);
    });
    socket.on('on_open_chat', (payload) => {
      if (payload?.requestId != null && payload.requestId !== chatRequest.current) return;
      const responseId = payload?.requestChatId || payload?.chatinfo?.chat_id;
      if (!selected.current || responseId !== selected.current.chat_id) return;
      selected.current = payload.chatinfo;
      loadedChat.current = payload.chatinfo?.chat_id;
      clearTimeout(chatTimeout.current);
      setConversationLoading(false);
      setConversationError('');
      latest.current.onOpenChat(payload);
      // Background refreshes must not erase action feedback.
      latest.current.onStatus((current) =>
        ['Loading inbox...', 'Opening conversation…'].includes(current) ? '' : current,
      );
      refreshChatList();
    });
    socket.on('error', (payload) => {
      if (payload?.requestId != null && payload.requestId !== listRequest.current) return;
      if (payload?.requestChatId && payload.requestChatId !== selected.current?.chat_id) return;
      if (payload?.requestChatId) {
        clearTimeout(chatTimeout.current);
        setConversationLoading(false);
        setConversationError(payload.msg);
      }
      latest.current.onStatus(payload?.msg || 'Inbox connection error');
    });
    const resync = () => {
      if (document.visibilityState === 'hidden') return;
      refreshChatList();
      if (selected.current) requestConversation(selected.current, true);
    };
    const interval = window.setInterval(resync, 30000);
    window.addEventListener('online', resync);
    document.addEventListener('visibilitychange', resync);
    return () => {
      clearTimeout(timeout);
      clearTimeout(chatTimeout.current);
      window.clearInterval(interval);
      window.removeEventListener('online', resync);
      document.removeEventListener('visibilitychange', resync);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, uid, agent, socketRef, refreshChatList, requestConversation]);

  useEffect(() => {
    const timer = window.setTimeout(refreshChatList, 220);
    return () => window.clearTimeout(timer);
  }, [search, filterType, channelFilter, refreshChatList]);

  const closeChat = useCallback(() => {
    selected.current = null;
    loadedChat.current = null;
    clearTimeout(chatTimeout.current);
    chatRequest.current += 1;
    setConversationLoading(false);
    setConversationError('');
  }, []);

  return { openChat, closeChat, refreshChatList, conversationLoading, conversationError };
}
