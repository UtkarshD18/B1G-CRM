import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiRequest } from '../../shared/api';
import { useAuth } from '../../shared/auth';
import {
  formatChatTimestamp,
  formatRelativeTimestamp,
  normalizeConversationMessage,
  parseStoredJson,
} from '../../shared/format';
import './Kanban.css';
import { FaWhatsapp, FaInstagram, FaTelegram, FaGlobe, FaFacebook } from 'react-icons/fa';

const columns = [
  { key: 'open', title: 'Open' },
  { key: 'pending', title: 'Pending' },
  { key: 'solved', title: 'Solved' },
];

function normalizeStatus(value) {
  const normalized = String(value || 'open').toLowerCase();
  return columns.some((column) => column.key === normalized) ? normalized : 'open';
}

function getChatTitle(chat) {
  return (
    chat.contact?.name ||
    chat.sender_name ||
    chat.name ||
    chat.sender_mobile ||
    chat.mobile ||
    'Unknown contact'
  );
}

function getChatNumber(chat) {
  return chat.sender_mobile || chat.mobile || chat.number || 'No number';
}

function getChannelIcon(chat) {
  const origin = String(chat?.origin || chat?.channel || '').toLowerCase();
  if (origin === 'meta') {
    return <FaFacebook className="platform-icon meta" title="Meta" />;
  }
  if (origin === 'qr') {
    return <FaWhatsapp className="platform-icon qr" title="WhatsApp QR" />;
  }
  if (origin.includes('insta') || origin.includes('instagram')) {
    return <FaInstagram className="platform-icon instagram" title="Instagram" />;
  }
  if (origin.includes('telegram')) {
    return <FaTelegram className="platform-icon telegram" title="Telegram" />;
  }
  if (origin.includes('widget') || origin.includes('web')) {
    return <FaGlobe className="platform-icon website" title="Website" />;
  }
  return <FaWhatsapp className="platform-icon whatsapp" title="WhatsApp" />;
}

function formatLastMessage(lastMessage) {
  if (!lastMessage) return 'No messages yet.';
  const parsed = parseStoredJson(lastMessage);
  if (parsed) {
    return normalizeConversationMessage(parsed);
  }
  return lastMessage;
}

function UserKanbanPage() {
  const { tokens } = useAuth();
  const [status, setStatus] = useState('Loading Kanban...');
  const [chats, setChats] = useState([]);
  const [loadError, setLoadError] = useState(false);
  const [pageSize, setPageSize] = useState(5);
  const [pages, setPages] = useState({ open: 1, pending: 1, solved: 1 });
  const columnLists = useRef({});

  function changePage(columnKey, page) {
    setPages((previous) => ({ ...previous, [columnKey]: page }));
    if (columnLists.current[columnKey]) columnLists.current[columnKey].scrollTop = 0;
  }
  const [draggedChat, setDraggedChat] = useState(null);
  const [draggedOverColumn, setDraggedOverColumn] = useState(null);

  const loadChats = useCallback(async () => {
    setStatus('Loading Kanban...');
    setLoadError(false);
    try {
      const result = await apiRequest('/api/inbox/get_chats', { token: tokens.user });
      if (!result?.success) {
        setStatus(result?.msg || 'Unable to load chats');
        setLoadError(true);
        return;
      }

      setChats(Array.isArray(result.data) ? result.data : []);
      setStatus('');
    } catch (error) {
      setStatus(error.message || 'Unable to load chats');
      setLoadError(true);
    }
  }, [tokens.user]);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  const groupedChats = useMemo(
    () =>
      columns.reduce((acc, column) => {
        acc[column.key] = chats.filter((chat) => normalizeStatus(chat.chat_status) === column.key);
        return acc;
      }, {}),
    [chats],
  );

  async function saveKanbanState(chatId, nextStatus, currentChats) {
    setStatus(`Saving Kanban state...`);
    try {
      const statusRes = await apiRequest('/api/inbox/change_chat_ticket_status', {
        method: 'POST',
        token: tokens.user,
        body: {
          chatId,
          status: nextStatus,
        },
      });

      if (!statusRes?.success) {
        setStatus(statusRes?.msg || 'Unable to update chat status');
        loadChats();
        return;
      }

      const orderedChatIds = currentChats.map((c) => c.chat_id);
      const orderRes = await apiRequest('/api/inbox/update_kanban_order', {
        method: 'POST',
        token: tokens.user,
        body: {
          orderedChatIds,
        },
      });

      if (!orderRes?.success) {
        setStatus(orderRes?.msg || 'Unable to update Kanban ordering');
        loadChats();
        return;
      }

      setStatus('Kanban state updated.');
    } catch (error) {
      setStatus(error.message || 'Unable to update Kanban state');
      loadChats();
    }
  }

  async function moveChat(chat, nextStatus) {
    if (normalizeStatus(chat.chat_status) === nextStatus) {
      return;
    }

    const updatedChats = chats.map((item) =>
      item.chat_id === chat.chat_id ? { ...item, chat_status: nextStatus } : item,
    );
    setChats(updatedChats);
    await saveKanbanState(chat.chat_id, nextStatus, updatedChats);
  }

  const handleDragStart = (e, chat) => {
    e.dataTransfer.setData('text/plain', chat.chat_id);
    setDraggedChat(chat);
  };

  const handleDragEnd = () => {
    setDraggedChat(null);
    setDraggedOverColumn(null);
  };

  const handleDragOver = (e, columnKey) => {
    e.preventDefault();
    setDraggedOverColumn(columnKey);
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e, columnKey) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const chatId = e.dataTransfer.getData('text/plain') || draggedChat?.chat_id;
    if (!chatId) return;

    const sourceChat = chats.find((c) => String(c.chat_id) === String(chatId));
    if (!sourceChat) return;

    // If it's already in this column, dropping on column does nothing (handled by card drop)
    if (normalizeStatus(sourceChat.chat_status) === columnKey) return;

    // Move to bottom of the new column
    const updatedChats = chats.map((c) => {
      if (String(c.chat_id) === String(chatId)) {
        return { ...c, chat_status: columnKey };
      }
      return c;
    });

    setChats(updatedChats);
    await saveKanbanState(chatId, columnKey, updatedChats);
  };

  const handleCardDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleCardDrop = async (e, targetChat, targetColumn) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOverColumn(null);

    const chatId = e.dataTransfer.getData('text/plain') || draggedChat?.chat_id;
    if (!chatId || String(chatId) === String(targetChat.chat_id)) return;

    const sourceChat = chats.find((c) => String(c.chat_id) === String(chatId));
    if (!sourceChat) return;

    // First update the status locally for target column
    const updatedChats = chats.map((c) => {
      if (String(c.chat_id) === String(chatId)) {
        return { ...c, chat_status: targetColumn };
      }
      return c;
    });

    // Filter chats in target column, excluding the dragged chat
    const targetColumnChats = updatedChats.filter(
      (c) =>
        normalizeStatus(c.chat_status) === targetColumn && String(c.chat_id) !== String(chatId),
    );

    const targetIndex = targetColumnChats.findIndex(
      (c) => String(c.chat_id) === String(targetChat.chat_id),
    );

    // Insert sourceChat at targetIndex
    const newTargetColumnChats = [...targetColumnChats];
    newTargetColumnChats.splice(targetIndex, 0, { ...sourceChat, chat_status: targetColumn });

    // Other column chats
    const otherColumnChats = updatedChats.filter(
      (c) => normalizeStatus(c.chat_status) !== targetColumn,
    );

    const finalChats = [...otherColumnChats, ...newTargetColumnChats];
    setChats(finalChats);

    await saveKanbanState(chatId, targetColumn, finalChats);
  };

  return (
    <div className="page-stack kanban-page">
      <div className="page-header">
        <div>
          <span className="eyebrow">kanban</span>
          <h2>Chat Kanban</h2>
          <p>Operational view of tenant conversations grouped by ticket status.</p>
        </div>
        <div className="kanban-controls">
          <label>
            Tickets per stage
            <select
              aria-label="Tickets per stage"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setPages({ open: 1, pending: 1, solved: 1 });
                Object.values(columnLists.current).forEach((list) => {
                  if (list) list.scrollTop = 0;
                });
              }}
            >
              {[5, 10, 20].map((size) => (
                <option value={size} key={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="button" onClick={loadChats}>
            Refresh
          </button>
        </div>
      </div>

      {status ? (
        <p className="status-line" role="status">
          {status}
        </p>
      ) : null}

      <div className="kanban-board">
        {columns.map((column) => {
          const allChats = groupedChats[column.key] || [];
          const pageCount = Math.max(1, Math.ceil(allChats.length / pageSize));
          const currentPage = Math.min(pages[column.key], pageCount);
          const start = (currentPage - 1) * pageSize;
          const pageChats = allChats.slice(start, start + pageSize);
          return (
            <section
              className={`kanban-column ${draggedOverColumn === column.key ? 'drag-over' : ''}`}
              key={column.key}
              aria-label={`${column.title} tickets`}
              onDragOver={(e) => handleDragOver(e, column.key)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, column.key)}
            >
              <div className="kanban-column-header">
                <h2>{column.title}</h2>
                <span
                  className={`kanban-stage-count kanban-stage--${column.key}`}
                  aria-label={`${allChats.length} ${column.title.toLowerCase()} tickets`}
                >
                  {allChats.length}
                </span>
              </div>
              <div
                className="kanban-card-list"
                id={`kanban-${column.key}-tickets`}
                ref={(element) => {
                  columnLists.current[column.key] = element;
                }}
                role="region"
                aria-label={`${column.title} ticket list`}
                tabIndex={0}
              >
                {pageChats.map((chat) => (
                  <article
                    className={`kanban-card ${draggedChat?.chat_id === chat.chat_id ? 'dragging' : ''}`}
                    key={chat.chat_id}
                    aria-label={`Ticket: ${getChatTitle(chat)}`}
                    draggable
                    onDragStart={(e) => handleDragStart(e, chat)}
                    onDragEnd={handleDragEnd}
                    onDragOver={handleCardDragOver}
                    onDrop={(e) => handleCardDrop(e, chat, column.key)}
                  >
                    <div className="kanban-ticket-heading">
                      <strong>{getChatTitle(chat)}</strong>
                      {getChannelIcon(chat)}
                    </div>
                    <span className="kanban-ticket-number">{getChatNumber(chat)}</span>
                    <p className="kanban-ticket-preview">{formatLastMessage(chat.last_message)}</p>
                    <div className="kanban-ticket-meta">
                      <span className={`agent-badge${chat.agent_name ? '' : ' unassigned'}`}>
                        {chat.agent_name ? `Agent: ${chat.agent_name}` : 'Unassigned'}
                      </span>
                      <time title={formatRelativeTimestamp(chat.last_message_came)}>
                        {formatChatTimestamp(chat.last_message_came) || 'No activity'}
                      </time>
                    </div>
                    <div className="kanban-ticket-footer">
                      <span className={`kanban-ticket-status kanban-stage--${column.key}`}>
                        {column.title}
                      </span>
                      <div className="kanban-ticket-actions">
                        {columns
                          .filter((target) => target.key !== column.key)
                          .map((target) => (
                            <button
                              className="mini-button"
                              type="button"
                              key={target.key}
                              onClick={() => moveChat(chat, target.key)}
                              aria-label={`Move ${getChatTitle(chat)} to ${target.title}`}
                            >
                              {target.title}
                            </button>
                          ))}
                      </div>
                    </div>
                  </article>
                ))}
                {!allChats.length ? (
                  <p className="empty-state">
                    {loadError
                      ? 'Tickets could not be loaded. Use Refresh to retry.'
                      : status === 'Loading Kanban...'
                        ? 'Loading tickets…'
                        : 'No chats in this stage.'}
                  </p>
                ) : null}
              </div>
              <nav className="kanban-pagination" aria-label={`${column.title} ticket pages`}>
                <p aria-live="polite">
                  {allChats.length
                    ? `${start + 1}–${Math.min(start + pageSize, allChats.length)} of ${allChats.length}`
                    : '0 tickets'}{' '}
                  · Page {currentPage} of {pageCount}
                </p>
                <div>
                  <button
                    type="button"
                    className="mini-button"
                    aria-label={`${column.title} previous page`}
                    aria-controls={`kanban-${column.key}-tickets`}
                    disabled={currentPage === 1}
                    onClick={() => changePage(column.key, currentPage - 1)}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    className="mini-button"
                    aria-label={`${column.title} next page`}
                    aria-controls={`kanban-${column.key}-tickets`}
                    disabled={currentPage === pageCount}
                    onClick={() => changePage(column.key, currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </nav>
            </section>
          );
        })}
      </div>
    </div>
  );
}

export default UserKanbanPage;
