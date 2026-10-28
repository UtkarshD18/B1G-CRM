const mockQuery = jest.fn();
jest.mock('../database/dbpromise', () => ({ query: mockQuery }));
const { hasPermission, permissionCache } = require('../utils/permissionResolver');

beforeEach(() => {
  mockQuery.mockReset();
  for (const key of Object.keys(permissionCache)) delete permissionCache[key];
});

function agentWith(grants) {
  mockQuery.mockImplementation(async (sql) => {
    if (sql.includes('SELECT owner_uid, permissions FROM agents')) {
      return [{ owner_uid: 'owner', permissions: grants }];
    }
    return [];
  });
}

test('an agent without an assigned role receives no implicit contact or reply grant', async () => {
  agentWith('[]');
  expect(await hasPermission('agent', 'contacts.read')).toBe(false);
  expect(await hasPermission('agent', 'inbox.reply')).toBe(false);
  expect(mockQuery.mock.calls.some(([sql]) => sql.includes("name = 'Agent'"))).toBe(false);
});

test.each([JSON.stringify(['flows_access']), ['flows_access']])(
  'normalizes explicit legacy grants without adding unrelated permissions: %s',
  async (grants) => {
    agentWith(grants);
    expect(await hasPermission('agent', 'automation.read')).toBe(true);
    expect(await hasPermission('agent', 'automation.publish')).toBe(false);
    expect(await hasPermission('agent', 'contacts.read')).toBe(false);
  },
);

test('preserves permissions from explicitly assigned roles', async () => {
  mockQuery.mockImplementation(async (sql) =>
    sql.includes('JOIN role_permissions') ? [{ key: 'contacts.read' }] : [],
  );
  expect(await hasPermission('agent', 'contacts.read')).toBe(true);
  expect(await hasPermission('agent', 'contacts.write')).toBe(false);
});

test('malformed grants fail closed', async () => {
  agentWith('{broken');
  const error = jest.spyOn(console, 'error').mockImplementation(() => {});
  try {
    expect(await hasPermission('agent', 'contacts.read')).toBe(false);
  } finally {
    error.mockRestore();
  }
});
