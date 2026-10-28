const { EventEmitter } = require('events');
const mockClients = [];
const mockQuery = jest.fn();
jest.mock('../database/config', () => ({ options: { host: 'local-test' }, query: mockQuery }));
jest.mock('pg', () => ({
  Client: jest.fn().mockImplementation(() => {
    const client = new (require('events').EventEmitter)();
    client.connect = jest.fn().mockResolvedValue();
    client.query = jest.fn().mockResolvedValue();
    client.end = jest.fn(async () => {
      client.emit('end');
    });
    mockClients.push(client);
    return client;
  }),
}));
const {
  publishInboxChange,
  subscribeInboxChanges,
} = require('../utils/channels/inboxNotifications');

beforeEach(() => {
  mockClients.length = 0;
  mockQuery.mockReset();
  jest.useFakeTimers();
});
afterEach(() => jest.useRealTimers());
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

test('publishes only tenant/chat identifiers through PostgreSQL for cross-process delivery', async () => {
  await publishInboxChange({ uid: 'tenant-a', chatId: 'chat-a', text: 'private content' });
  expect(mockQuery).toHaveBeenCalledWith('SELECT pg_notify($1, $2)', [
    'b1gcrm_inbox_changes',
    '{"uid":"tenant-a","chatId":"chat-a"}',
  ]);
});

test('listens for valid notifications, ignores malformed data, and stops cleanly', async () => {
  const receive = jest.fn();
  const stop = subscribeInboxChanges(receive);
  await flush();
  expect(mockClients[0].query).toHaveBeenCalledWith('LISTEN b1gcrm_inbox_changes');
  mockClients[0].emit('notification', {
    channel: 'b1gcrm_inbox_changes',
    payload: '{"uid":"tenant-a","chatId":"chat-a"}',
  });
  mockClients[0].emit('notification', { channel: 'b1gcrm_inbox_changes', payload: 'invalid' });
  mockClients[0].emit('notification', {
    channel: 'another-channel',
    payload: '{"uid":"tenant-a","chatId":"chat-a"}',
  });
  expect(receive).toHaveBeenCalledTimes(1);
  await stop();
  jest.advanceTimersByTime(10000);
  expect(mockClients).toHaveLength(1);
});

test('reconnects once after a dropped listener without repeated reconnects from the old client', async () => {
  const stop = subscribeInboxChanges(jest.fn(), { retryMs: 50 });
  await flush();
  mockClients[0].emit('error', new Error('connection lost'));
  jest.advanceTimersByTime(50);
  await flush();
  expect(mockClients).toHaveLength(2);
  jest.advanceTimersByTime(500);
  await flush();
  expect(mockClients).toHaveLength(2);
  await stop();
});
