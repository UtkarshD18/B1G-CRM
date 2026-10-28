const mockQuery = jest.fn();
jest.mock('../database/dbpromise', () => ({ query: mockQuery }));
const { sendInstagramMsg } = require('../helper/socket/function');
beforeEach(() => mockQuery.mockReset());
test('new Instagram connection queues via the existing channel adapter without legacy credentials', async () => {
  mockQuery.mockResolvedValueOnce([{ channel_type: 'instagram' }]).mockResolvedValueOnce([]);
  const result = await sendInstagramMsg({
    uid: 'tenant',
    to: 'visitor',
    chatId: 'chat',
    msgObj: { type: 'text', text: { body: 'Hello' } },
  });
  expect(result).toMatchObject({ success: true, queued: true });
  expect(mockQuery.mock.calls.some(([sql]) => sql.includes('instagram_api'))).toBe(false);
  const payload = JSON.parse(mockQuery.mock.calls[1][1][1]);
  expect(payload).toMatchObject({
    channel: 'instagram',
    chatId: 'chat',
    recipientId: 'visitor',
    text: 'Hello',
  });
});
test('legacy credential fallback returns a useful error when no connection exists', async () => {
  mockQuery.mockResolvedValue([]);
  expect(
    await sendInstagramMsg({ uid: 'tenant', to: 'visitor', msgObj: { type: 'text' } }),
  ).toMatchObject({ success: false });
});
