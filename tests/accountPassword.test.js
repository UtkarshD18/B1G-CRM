jest.mock('../database/dbpromise', () => ({query:jest.fn()}));
const {query} = require('../database/dbpromise');
const bcrypt = require('bcrypt');
const {resetAccountPassword} = require('../services/accountPasswordService');

beforeEach(() => jest.clearAllMocks());

test.each(['admin','user','agent'])('updates only the selected %s password using a hash', async role => {
  query.mockResolvedValue([{uid:'account-id'}]);
  const result = await resetAccountPassword({role,uid:'account-id',password:'test-only-password'});
  expect(result.success).toBe(true);
  const [sql, values] = query.mock.calls[0];
  expect(sql).toMatch(/SET password = \? WHERE uid = \?/);
  expect(values[1]).toBe('account-id');
  expect(await bcrypt.compare('test-only-password', values[0])).toBe(true);
});

test.each(['unknown', '__proto__', 'user; DROP TABLE admin'])('rejects an invalid role %s', async role => {
  expect((await resetAccountPassword({role,uid:'account-id',password:'test-only-password'})).status).toBe(400);
  expect(query).not.toHaveBeenCalled();
});

test('reports a missing account', async () => {
  query.mockResolvedValue([]);
  expect((await resetAccountPassword({role:'user',uid:'missing',password:'test-only-password'})).status).toBe(404);
});
