const mockQuery = jest.fn();
const mockRead = jest.fn();
const mockList = jest.fn();
jest.mock('../database/dbpromise', () => ({ query: mockQuery }));
jest.mock('../functions/function', () => ({ readJSONFile: mockRead, addObjectToFile: jest.fn() }));
jest.mock('../helper/socket/function', () => ({}));
jest.mock('../helper/socket/chatList', () => ({ loadChatList: mockList }));
const { processSocketEvent } = require('../helper/socket');

function connection() {
  const events = {};
  const info = { uid: 'tenant-a', id: 'socket-a', data: {}, decodedValue: { uid: 'tenant-a' } };
  const send = jest.fn();
  const broadcast = jest.fn();
  const update = jest.fn();
  processSocketEvent({
    socket: {
      id: 'socket-a',
      on: (name, fn) => {
        events[name] = fn;
      },
    },
    connectionInfo: info,
    sendToSocketId: send,
    sendToUid: broadcast,
    updateConnectionDataBySocketId: update,
    getConnectionsByUid: () => [],
  });
  return { events, info, send, broadcast, update };
}

beforeEach(() => {
  mockQuery.mockReset();
  mockRead.mockReset();
  mockList.mockReset();
});

test('search results are returned only to the requesting socket and identify their request', async () => {
  const c = connection();
  mockList.mockResolvedValue([{ chat_id: 'match' }]);
  await c.events.get_chat_filter({
    data: { search: 'Alice', channel: 'instagram', filterType: 'unread', requestId: 42 },
  });
  expect(c.info.data.inboxFilters).toEqual({
    search: 'Alice',
    channel: 'instagram',
    filterType: 'unread',
  });
  expect(c.send).toHaveBeenCalledWith(
    'socket-a',
    { requestId: 42, chats: [{ chat_id: 'match' }] },
    'get_chat',
  );
  expect(c.broadcast).not.toHaveBeenCalled();
});

test('opening a chat trusts the tenant-scoped stored row instead of a client row ID', async () => {
  const c = connection();
  const stored = {
    id: 10,
    chat_id: 'chat-a',
    sender_mobile: '123',
    uid: 'tenant-a',
    origin: 'instagram',
  };
  mockQuery
    .mockResolvedValueOnce([stored])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([stored])
    .mockResolvedValueOnce([{ timezone: 'Asia/Kolkata' }])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([]);
  mockRead.mockReturnValue([
    { type: 'text', msgContext: { text: { body: 'Stored inbound message' } } },
  ]);
  await c.events.on_open_chat({
    data: { chatId: 'chat-a', limit: 200, requestId: 3, chat: { id: 999, chat_id: 'chat-a' } },
  });
  expect(mockQuery.mock.calls[0]).toEqual([
    'SELECT * FROM chats WHERE chat_id = ? AND uid = ?',
    ['chat-a', 'tenant-a'],
  ]);
  expect(mockQuery.mock.calls[1][1]).toEqual([1, 10]);
  expect(c.send).toHaveBeenCalledWith(
    'socket-a',
    expect.objectContaining({
      requestChatId: 'chat-a',
      requestId: 3,
      conversation: expect.any(Array),
      chatinfo: expect.objectContaining({ id: 10 }),
    }),
    'on_open_chat',
  );
});

test('missing or foreign conversations return a useful error and do not load history', async () => {
  const c = connection();
  mockQuery.mockResolvedValueOnce([]);
  await c.events.on_open_chat({ data: { chatId: 'foreign-chat', limit: 200, chat: { id: 10 } } });
  expect(mockRead).not.toHaveBeenCalled();
  expect(c.send).toHaveBeenCalledWith(
    'socket-a',
    { msg: 'Conversation not found.', requestChatId: 'foreign-chat' },
    'error',
  );
  expect(c.update).not.toHaveBeenCalled();
});
