const mockQuery = jest.fn();
const mockSave = jest.fn();
const mockMeta = jest.fn();
const mockInstagram = jest.fn();
const mockQr = jest.fn();
jest.mock('../database/dbpromise', () => ({ query: mockQuery }));
jest.mock('../functions/function', () => ({ readJSONFile: () => [], addObjectToFile: mockSave }));
jest.mock('../helper/socket/function', () => ({
  returnMsgObjAfterAddingKey: (x) => x,
  sendMetaMsg: mockMeta,
  sendInstagramMsg: mockInstagram,
  sendQrMsg: mockQr,
}));
jest.mock('../helper/socket/chatList', () => ({ loadChatList: async () => [] }));
const { processSocketEvent } = require('../helper/socket');
function client(permissions = ['inbox.reply'], origin = 'instagram') {
  const events = {},
    ack = jest.fn(),
    send = jest.fn();
  const chat = { id: 1, chat_id: 'chat', origin, uid: 'tenant', sender_mobile: 'visitor' };
  const info = {
    uid: 'agent',
    id: 'socket',
    agent: true,
    permissions,
    decodedValue: { owner_uid: 'tenant' },
    data: { selectedChat: chat },
  };
  processSocketEvent({
    socket: {
      on: (e, fn) => {
        events[e] = fn;
      },
    },
    connectionInfo: info,
    sendToSocketId: send,
    getConnectionsByUid: () => [],
  });
  return {
    events,
    ack,
    send,
    chat,
    info,
    payload: {
      data: {
        type: 'text',
        msgCon: { type: 'text', text: { body: 'Hello' } },
        chatInfo: { origin: 'meta' },
      },
    },
  };
}
beforeEach(() => {
  jest.clearAllMocks();
  mockQuery.mockImplementation(async (sql) =>
    sql.includes('SELECT 1 FROM agent_chats')
      ? [{}]
      : sql.includes('SELECT * FROM chats')
        ? [{ id: 1, chat_id: 'chat', origin: 'instagram', uid: 'tenant', sender_mobile: 'visitor' }]
        : [],
  );
  for (const sender of [mockMeta, mockInstagram, mockQr])
    sender.mockResolvedValue({ success: true, id: 'provider-id', queued: true });
});
test('read-only agent cannot call any provider or save a reply', async () => {
  const c = client(['inbox.read']);
  await c.events.send_chat_message(c.payload, c.ack);
  expect(c.ack).toHaveBeenCalledWith(
    expect.objectContaining({ success: false, msg: expect.stringContaining('inbox.reply') }),
  );
  expect(mockInstagram).not.toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
});
test('unassignment is checked again even when the conversation was already selected', async () => {
  mockQuery.mockResolvedValueOnce([]);
  const c = client();
  await c.events.send_chat_message(c.payload, c.ack);
  expect(c.ack).toHaveBeenCalledWith({ success: false, msg: 'Not assigned to this chat' });
  expect(mockSave).not.toHaveBeenCalled();
});
test('routing ignores client channel and persists actual channel plus queued state', async () => {
  const c = client();
  await c.events.send_chat_message(c.payload, c.ack);
  expect(mockMeta).not.toHaveBeenCalled();
  expect(mockInstagram).toHaveBeenCalled();
  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({ origin: 'instagram', status: 'queued' }),
    expect.any(String),
  );
  expect(c.ack).toHaveBeenCalledWith(expect.objectContaining({ success: true, queued: true }));
});
test('website reply saves to its conversation without calling a provider', async () => {
  const c = client(['inbox.reply'], 'website');
  mockQuery.mockImplementation(async (sql) =>
    sql.includes('SELECT 1') ? [{}] : sql.includes('SELECT * FROM chats') ? [c.chat] : [],
  );
  await c.events.send_chat_message(c.payload, c.ack);
  expect(mockMeta).not.toHaveBeenCalled();
  expect(mockInstagram).not.toHaveBeenCalled();
  expect(mockSave).toHaveBeenCalledWith(
    expect.objectContaining({ origin: 'website', status: 'available' }),
    expect.any(String),
  );
});
test('provider failure acknowledges failure and never saves an outgoing message', async () => {
  mockInstagram.mockResolvedValue({ success: false, msg: 'Provider unavailable' });
  const c = client();
  await c.events.send_chat_message(c.payload, c.ack);
  expect(c.ack).toHaveBeenCalledWith({ success: false, msg: 'Provider unavailable' });
  expect(mockSave).not.toHaveBeenCalled();
});
test('no generic client event can inject selectedChat', () => {
  expect(client().events.add).toBeUndefined();
});
