jest.mock('../database/config', () => ({ connect: jest.fn() }));
const bcrypt = require('bcrypt');
const { bootstrapAdmin } = require('../database/bootstrap-admin');

function database(existing = false) {
  const client = {
    query: jest.fn(async sql => ({ rows: sql.startsWith('SELECT') && existing ? [{}] : [] })),
    release: jest.fn(),
  };
  return { db: {connect: async () => client}, client };
}

test('creates the first administrator with a hashed password', async () => {
  const {db, client} = database();
  const password = 'a-strong-generated-test-password';
  expect(await bootstrapAdmin({db, email: 'owner@example.invalid', password})).toBe(true);
  const insert = client.query.mock.calls.find(([sql]) => sql.startsWith('INSERT'));
  expect(insert[1][1]).toBe('owner@example.invalid');
  expect(insert[1][2]).not.toBe(password);
  expect(await bcrypt.compare(password, insert[1][2])).toBe(true);
  expect(client.release).toHaveBeenCalled();
});

test('never resets or replaces an existing administrator', async () => {
  const {db, client} = database(true);
  expect(await bootstrapAdmin({db, email: 'owner@example.invalid', password: 'a-strong-generated-test-password'})).toBe(false);
  expect(client.query.mock.calls.some(([sql]) => sql.startsWith('INSERT') || sql.startsWith('UPDATE'))).toBe(false);
});

test('does nothing when initial credentials are not provided', async () => {
  const {db, client} = database();
  expect(await bootstrapAdmin({db})).toBe(false);
  expect(client.query).not.toHaveBeenCalled();
});

test('rejects incomplete or weak setup credentials', async () => {
  await expect(bootstrapAdmin({email: 'owner@example.invalid', password: 'short'})).rejects.toThrow(/at least 20/);
});
