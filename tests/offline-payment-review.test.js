const mockQuery = jest.fn();
const mockWithTransaction = jest.fn();
jest.mock('../database/dbpromise', () => ({
  query: mockQuery,
  withTransaction: mockWithTransaction,
}));

const { review } = require('../services/offlinePaymentReviewService');

beforeEach(() => {
  mockQuery.mockReset();
  mockWithTransaction.mockReset();
  mockWithTransaction.mockImplementation((callback) => callback(mockQuery));
});

test('approval grants the purchased plan once, inside one transaction', async () => {
  const snapshot = { id: 7, price: 99, plan_duration_in_days: 30 };
  mockQuery.mockImplementation(async (sql) => {
    if (sql.includes('SELECT * FROM offline_payment_requests')) {
      return [{ id: 15, uid: 'tenant-a', amount: '99.00', status: 'pending', plan_snapshot: snapshot }];
    }
    if (sql.includes('UPDATE user SET plan')) return [{ uid: 'tenant-a' }];
    return [];
  });
  const result = await review({ id: 15, adminUid: 'admin-a', decision: 'approved', note: 'Synthetic bank reference 123' });
  expect(result.success).toBe(true);
  expect(mockWithTransaction).toHaveBeenCalledTimes(1);
  expect(mockQuery.mock.calls.map(([sql]) => sql)).toEqual([
    expect.stringContaining('FOR UPDATE'),
    expect.stringContaining('UPDATE user SET plan'),
    expect.stringContaining('INSERT INTO orders'),
    expect.stringContaining('UPDATE offline_payment_requests'),
  ]);
});

test('a repeated approval cannot grant a second entitlement', async () => {
  mockQuery.mockResolvedValueOnce([{ id: 15, status: 'approved' }]);
  const result = await review({ id: 15, adminUid: 'admin-a', decision: 'approved', note: 'Synthetic bank reference 123' });
  expect(result.status).toBe(409);
  expect(mockQuery).toHaveBeenCalledTimes(1);
});

test('rejection records the decision without changing the plan or ledger', async () => {
  mockQuery.mockResolvedValueOnce([{ id: 15, status: 'pending' }]).mockResolvedValue([]);
  const result = await review({ id: 15, adminUid: 'admin-a', decision: 'rejected' });
  expect(result.success).toBe(true);
  expect(mockQuery.mock.calls.map(([sql]) => sql)).toEqual([
    expect.stringContaining('FOR UPDATE'),
    expect.stringContaining('UPDATE offline_payment_requests'),
  ]);
});

test('approval requires a verification reference', async () => {
  const result = await review({ id: 15, adminUid: 'admin-a', decision: 'approved' });
  expect(result.status).toBe(400);
  expect(mockWithTransaction).not.toHaveBeenCalled();
});
