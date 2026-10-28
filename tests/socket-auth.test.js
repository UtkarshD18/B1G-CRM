const mockQuery = jest.fn();
jest.mock('../database/dbpromise', () => ({ query: mockQuery }));
const jwt = require('jsonwebtoken');
const env = require('../env');
const { authenticateSocket } = require('../utils/socketAuth');
const token = (payload, options) => jwt.sign(payload, env.JWT_SECRET, options);
const socket = (userToken, extra = {}) => ({
  id: 'socket',
  handshake: { query: { userToken, ...extra } },
});
beforeEach(() => mockQuery.mockReset());
test.each([undefined, '', 'invalid'])('rejects missing or invalid tokens: %s', async (value) => {
  await expect(authenticateSocket(socket(value))).rejects.toThrow();
  expect(mockQuery).not.toHaveBeenCalled();
});
test('rejects expired tokens', async () => {
  await expect(
    authenticateSocket(socket(token({ uid: 'a', role: 'user' }, { expiresIn: -1 }))),
  ).rejects.toThrow();
});
test('ignores handshake uid and owner mode spoofing for an authenticated agent', async () => {
  mockQuery
    .mockResolvedValueOnce([
      {
        uid: 'agent',
        owner_uid: 'tenant',
        role: 'agent',
        is_active: 1,
        permissions: '["inbox.read"]',
      },
    ])
    .mockResolvedValueOnce([{ uid: 'tenant' }]);
  const result = await authenticateSocket(
    socket(token({ uid: 'agent', owner_uid: 'tenant', role: 'agent' }), {
      uid: 'foreign-owner',
      agent: 'false',
    }),
  );
  expect(result).toMatchObject({
    uid: 'agent',
    agent: true,
    owner_uid: 'tenant',
    permissions: ['inbox.read'],
  });
});
test('rejects inactive/deleted agents and tenant mismatch', async () => {
  for (const row of [
    undefined,
    { is_active: 0 },
    { role: 'agent', is_active: 1, owner_uid: 'foreign' },
  ]) {
    mockQuery.mockResolvedValueOnce(row ? [row] : []);
    await expect(
      authenticateSocket(socket(token({ uid: 'a', role: 'agent', owner_uid: 'tenant' }))),
    ).rejects.toThrow();
  }
});
test('reloads current permissions instead of trusting stale token grants', async () => {
  mockQuery
    .mockResolvedValueOnce([
      { uid: 'agent', owner_uid: 'tenant', role: 'agent', is_active: 1, permissions: '[]' },
    ])
    .mockResolvedValueOnce([{ uid: 'tenant' }]);
  const result = await authenticateSocket(
    socket(
      token({ uid: 'agent', role: 'agent', owner_uid: 'tenant', permissions: ['inbox.reply'] }),
    ),
  );
  expect(result.permissions).toEqual([]);
});
