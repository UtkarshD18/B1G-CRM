const mockTx = jest.fn();
jest.mock('../database/dbpromise', () => ({ withTransaction: (fn) => fn(mockTx) }));
const { assignChat } = require('../services/chatAssignment');
beforeEach(() => mockTx.mockReset());
test('rejects foreign chat before deleting assignments', async () => {
  mockTx.mockResolvedValueOnce([]);
  await expect(assignChat({ ownerUid: 'a', chatId: 'foreign', agentUid: 'agent' })).rejects.toThrow(
    'Chat was not found',
  );
  expect(mockTx).toHaveBeenCalledTimes(1);
});
test('rejects a foreign or inactive agent before modifying assignment', async () => {
  mockTx.mockResolvedValueOnce([{ id: 1 }]).mockResolvedValueOnce([]);
  await expect(assignChat({ ownerUid: 'a', chatId: 'chat', agentUid: 'foreign' })).rejects.toThrow(
    'Agent was not found',
  );
  expect(mockTx).toHaveBeenCalledTimes(2);
});
test('assignment and its commit-delivered invalidation share a transaction', async () => {
  mockTx.mockResolvedValue([{ id: 1 }]);
  await assignChat({ ownerUid: 'a', chatId: 'chat', agentUid: 'agent' });
  expect(mockTx.mock.calls.map(([sql]) => sql)).toEqual(
    expect.arrayContaining([
      expect.stringContaining('FOR UPDATE'),
      expect.stringContaining('INSERT INTO agent_chats'),
      'SELECT pg_notify(?, ?)',
    ]),
  );
  expect(JSON.parse(mockTx.mock.calls.at(-1)[1][1])).toEqual({
    uid: 'a',
    chatId: 'chat',
    assignmentChanged: true,
  });
});
test('unassignment emits the same immediate invalidation without inserting', async () => {
  mockTx.mockResolvedValue([{ id: 1 }]);
  await assignChat({ ownerUid: 'a', chatId: 'chat' });
  expect(mockTx.mock.calls.some(([sql]) => sql.includes('INSERT INTO'))).toBe(false);
  expect(mockTx.mock.calls.at(-1)[0]).toBe('SELECT pg_notify(?, ?)');
});
