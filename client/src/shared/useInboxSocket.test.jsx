import { act, renderHook } from '@testing-library/react';
import { useInboxSocket } from './useInboxSocket';

const mockHandlers = {};
const mockEmit = jest.fn();
const mockDisconnect = jest.fn();
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => ({
    on: (event, handler) => {
      mockHandlers[event] = handler;
    },
    emit: mockEmit,
    disconnect: mockDisconnect,
  })),
}));

function mount(overrides = {}) {
  const props = {
    token: 'local-token',
    uid: 'tenant-a',
    agent: false,
    socketRef: { current: null },
    search: '',
    filterType: 'all',
    channelFilter: 'all',
    onChats: jest.fn(),
    onOpenChat: jest.fn(),
    onStatus: jest.fn(),
    onConnection: jest.fn(),
    ...overrides,
  };
  const hook = renderHook((input) => useInboxSocket(input), { initialProps: props });
  return { ...hook, props };
}
function lastRequest(event) {
  return mockEmit.mock.calls.filter(([name]) => name === event).at(-1)[1].data;
}

beforeEach(() => {
  jest.useFakeTimers();
  mockEmit.mockClear();
  mockDisconnect.mockClear();
});
afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

test('live list notifications and reconnects retain search, read and channel filters', () => {
  const { props } = mount({ search: 'VIP', filterType: 'unread', channelFilter: 'instagram' });
  act(() => mockHandlers.connect());
  expect(lastRequest('get_chat_filter')).toMatchObject({
    search: 'VIP',
    filterType: 'unread',
    channel: 'instagram',
  });
  act(() => {
    mockHandlers.update_chat_list([{ chat_id: 'unfiltered' }]);
    jest.advanceTimersByTime(80);
  });
  expect(props.onChats).not.toHaveBeenCalled();
  expect(lastRequest('get_chat_filter')).toMatchObject({ search: 'VIP', channel: 'instagram' });
  act(() => mockHandlers.connect());
  expect(lastRequest('get_chat_filter').search).toBe('VIP');
});

test('ignores old search responses and applies the latest result', () => {
  const { props, rerender } = mount({ search: 'first' });
  act(() => jest.advanceTimersByTime(220));
  const first = lastRequest('get_chat_filter').requestId;
  rerender({ ...props, search: 'second' });
  act(() => jest.advanceTimersByTime(220));
  const second = lastRequest('get_chat_filter').requestId;
  act(() => mockHandlers.get_chat({ requestId: first, chats: [{ chat_id: 'stale' }] }));
  expect(props.onChats).not.toHaveBeenCalled();
  act(() => mockHandlers.get_chat({ requestId: second, chats: [{ chat_id: 'current' }] }));
  expect(props.onChats).toHaveBeenCalledWith([{ chat_id: 'current' }]);
});

test('incoming notifications reload the selected conversation without opening another chat', () => {
  const { result, props } = mount();
  act(() => result.current.openChat({ chat_id: 'chat-a' }));
  const first = lastRequest('on_open_chat').requestId;
  act(() => result.current.openChat({ chat_id: 'chat-b' }));
  act(() =>
    mockHandlers.on_open_chat({
      requestId: first,
      requestChatId: 'chat-a',
      chatinfo: { chat_id: 'chat-a' },
    }),
  );
  expect(props.onOpenChat).not.toHaveBeenCalled();
  act(() =>
    mockHandlers.on_open_chat({
      ...lastRequest('on_open_chat'),
      requestChatId: 'chat-b',
      chatinfo: { chat_id: 'chat-b' },
      conversation: [],
    }),
  );
  props.onOpenChat.mockClear();
  act(() => mockHandlers.update_conversation({ conversation: { newMessage: { type: 'text' } } }));
  expect(lastRequest('on_open_chat')).toMatchObject({ chatId: 'chat-b', background: true });
  act(() =>
    mockHandlers.on_open_chat({
      ...lastRequest('on_open_chat'),
      requestChatId: 'chat-b',
      chatinfo: { chat_id: 'chat-b' },
      conversation: [{ type: 'text' }],
    }),
  );
  expect(props.onOpenChat).toHaveBeenCalledWith(expect.objectContaining({ background: true }));
  act(() => result.current.closeChat());
  mockEmit.mockClear();
  act(() => mockHandlers.update_conversation({}));
  expect(mockEmit).not.toHaveBeenCalled();
});

test('shows conversation errors and cleans up the connection on unmount', () => {
  const { result, unmount } = mount();
  act(() => result.current.openChat({ chat_id: 'chat-a' }));
  act(() => mockHandlers.error({ requestChatId: 'chat-a', msg: 'Conversation not found.' }));
  expect(result.current.conversationLoading).toBe(false);
  expect(result.current.conversationError).toBe('Conversation not found.');
  unmount();
  expect(mockDisconnect).toHaveBeenCalledTimes(1);
});

test('times out a stalled conversation with a retryable error', () => {
  const { result } = mount();
  act(() => result.current.openChat({ chat_id: 'chat-a' }));
  expect(result.current.conversationLoading).toBe(true);
  act(() => jest.advanceTimersByTime(12000));
  expect(result.current.conversationLoading).toBe(false);
  expect(result.current.conversationError).toContain('retry');
});

test('assignment revocation clears selection and notifies the inbox immediately', () => {
  const onAccessRevoked = jest.fn();
  const { result, props } = mount({ onAccessRevoked });
  act(() => result.current.openChat({ chat_id: 'chat-a' }));
  act(() => mockHandlers.chat_access_revoked({ chatId: 'chat-a' }));
  expect(onAccessRevoked).toHaveBeenCalledTimes(1);
  expect(props.onStatus).toHaveBeenCalledWith('This conversation is no longer assigned to you.');
  mockEmit.mockClear();
  act(() => mockHandlers.update_conversation({}));
  expect(mockEmit).not.toHaveBeenCalled();
});

test('a successful list refresh does not erase a send failure', () => {
  const { props } = mount();
  act(() => mockHandlers.error({ msg: 'Provider unavailable', operation: 'send' }));
  act(() => mockHandlers.get_chat([]));
  const update = props.onStatus.mock.calls.at(-1)[0];
  expect(update('Provider unavailable')).toBe('Provider unavailable');
  expect(update('Loading inbox...')).toBe('');
});
