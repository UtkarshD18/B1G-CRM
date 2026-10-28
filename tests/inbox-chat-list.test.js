const mockQuery = jest.fn();
jest.mock('../database/dbpromise', () => ({ query: mockQuery }));
const { loadChatList } = require('../helper/socket/chatList');

beforeEach(() => mockQuery.mockReset());

test('search, read state, channel and tenant/agent restrictions apply before the result limit', async () => {
  mockQuery
    .mockResolvedValueOnce([{ permissions: '["inbox.read"]', is_active: 1, owner_uid: 'tenant-a' }])
    .mockResolvedValueOnce([])
    .mockResolvedValueOnce([]);
  await loadChatList({
    connectionInfo: {
      uid: 'agent-a',
      agent: true,
      decodedValue: { owner_uid: 'tenant-a' },
      data: { inboxFilters: { search: 'VIP_%', filterType: 'unread', channel: 'instagram' } },
    },
  });
  const [sql, params] = mockQuery.mock.calls[1];
  expect(sql).toContain('assigned.owner_uid = c.uid');
  expect(sql).toContain('contact_match.name ILIKE');
  expect(sql).toContain('CAST(c.chat_tags AS TEXT) ILIKE');
  expect(sql).toContain("LIKE '%insta%'");
  expect(sql.indexOf('c.is_opened = ?')).toBeLessThan(sql.indexOf('LIMIT ?'));
  expect(params).toEqual(['tenant-a', 'agent-a', 0, ...Array(6).fill('%VIP\\_\\%%'), 100]);
  expect(mockQuery.mock.calls[2][1]).toEqual(['tenant-a']);
});

test('contact-only placeholders never leak into unread or another channel', async () => {
  const contact = { uid: 'tenant-a', mobile: '123', name: 'Contact Only' };
  for (const inboxFilters of [
    { filterType: 'unread' },
    { channel: 'website' },
    { channel: 'instagram' },
  ]) {
    mockQuery.mockResolvedValueOnce([]).mockResolvedValueOnce([contact]);
    expect(
      await loadChatList({ connectionInfo: { uid: 'tenant-a', data: { inboxFilters } } }),
    ).toEqual([]);
  }
});

test('maintains phonebook enrichment and a matching contact name', async () => {
  mockQuery
    .mockResolvedValueOnce([{ chat_id: 'real-chat', sender_mobile: '123' }])
    .mockResolvedValueOnce([{ uid: 'tenant-a', mobile: '123', name: 'Alice VIP' }]);
  const list = await loadChatList({
    connectionInfo: { uid: 'tenant-a', data: { inboxFilters: { search: 'alice' } } },
  });
  expect(list[0].phonebook.name).toBe('Alice VIP');
  expect(list).toHaveLength(1);
});

test('notification list loading rejects revoked permissions before reading chat data', async () => {
  mockQuery.mockResolvedValueOnce([{ permissions: '[]', is_active: 1, owner_uid: 'tenant-a' }]);
  expect(
    await loadChatList({
      connectionInfo: { uid: 'agent-a', agent: true, decodedValue: { owner_uid: 'tenant-a' } },
    }),
  ).toEqual([]);
  expect(mockQuery).toHaveBeenCalledTimes(1);
});
