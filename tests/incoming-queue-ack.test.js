const mockWithTransaction = jest.fn();
const mockEmitAsync = jest.fn();
const mockGetAdapterClass = jest.fn();

jest.mock('../database/config', () => ({ end: jest.fn() }));
jest.mock('../database/dbpromise', () => ({ query: jest.fn(), withTransaction: mockWithTransaction }));
jest.mock('../utils/channels/eventBus', () => ({ emitAsync: mockEmitAsync }));
jest.mock('../utils/channels/ChannelAdapterRegistry', () => ({ getAdapterClass: mockGetAdapterClass }));
jest.mock('../utils/ConfigService', () => ({ getAll: jest.fn() }));

const { processQueueRow } = require('../utils/channels/incomingQueueWorker');

function fakeTransaction(sqlLog) {
  mockWithTransaction.mockImplementation(async (callback) => callback(async (sql) => {
    sqlLog.push(sql);
    if (sql.includes('SELECT * FROM channel_incoming_queue')) {
      return [{ id: 8, uid: 'tenant-a', channel_type: 'whatsapp_cloud', payload: {}, correlation_id: 'c8' }];
    }
    if (sql.includes('INSERT INTO channel_inbound_idempotency')) return [{ provider_message_id: 'provider-8' }];
    return [];
  }));
  mockGetAdapterClass.mockReturnValue(class {
    async beforeReceive() {}
    normalizeIncoming() { return { senderId: 'synthetic', metadata: { message_id: 'provider-8' } }; }
    async afterReceive() {}
  });
}

beforeEach(() => {
  mockWithTransaction.mockReset();
  mockEmitAsync.mockReset();
  mockGetAdapterClass.mockReset();
});

test('does not acknowledge an inbound item when persistence fails', async () => {
  const sqlLog = [];
  fakeTransaction(sqlLog);
  mockEmitAsync.mockRejectedValue(new Error('synthetic persistence failure'));
  const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
  try { await processQueueRow(8); } finally { logError.mockRestore(); }
  expect(mockEmitAsync).toHaveBeenCalledTimes(1);
  expect(sqlLog.some((sql) => sql.includes("state = 'processed'"))).toBe(false);
});

test('acknowledges only after the inbox handler resolves', async () => {
  const sqlLog = [];
  fakeTransaction(sqlLog);
  mockEmitAsync.mockImplementation(async () => { sqlLog.push('HANDLER_PERSISTED'); });
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  try { await processQueueRow(8); } finally { log.mockRestore(); }
  const persistedAt = sqlLog.indexOf('HANDLER_PERSISTED');
  const acknowledgedAt = sqlLog.findIndex((sql) => sql.includes("state = 'processed'"));
  expect(persistedAt).toBeGreaterThan(-1);
  expect(acknowledgedAt).toBeGreaterThan(persistedAt);
});
