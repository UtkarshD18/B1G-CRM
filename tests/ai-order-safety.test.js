const mockQuery = jest.fn();
jest.mock('../database/dbpromise', () => ({ query: mockQuery }));
jest.mock('../env', () => ({ MOCK_META_DELIVERY: false }));
jest.mock('../utils/ragHelper', () => ({ hybridRank: (_vector, keywords) => keywords }));

const agentic = require('../functions/agenticAutopilot');
const { runAgenticAutopilot } = agentic;
const { singleReplyAi } = require('../functions/ai');

const originalNodeEnv = process.env.NODE_ENV;
afterEach(() => {
  process.env.NODE_ENV = originalNodeEnv;
  mockQuery.mockReset();
  jest.restoreAllMocks();
});

test('order request returns verification handoff without querying orders', async () => {
  const result = await runAgenticAutopilot({
    uid: 'tenant-a', provider: 'openai', api_key: 'mock_test_key',
    incomingMsg: 'Where is my order?', senderNumber: '1234567890',
  });
  expect(result).toBe('An agent can help with your order after verifying your account.');
  expect(mockQuery.mock.calls.some(([sql]) => /\borders\b/i.test(sql))).toBe(false);
});

test('production missing provider secret sends no mock reply', async () => {
  process.env.NODE_ENV = 'production';
  mockQuery.mockResolvedValueOnce([{ provider: 'openai', api_key: 'mock_placeholder', enabled: 1 }]);
  const sendMetaMsg = jest.fn();
  const logError = jest.spyOn(console, 'error').mockImplementation(() => {});
  const log = jest.spyOn(console, 'log').mockImplementation(() => {});
  try {
    await singleReplyAi({ uid: 'tenant-a', incomingMsg: 'hello', senderNumber: '1234567890', sendMetaMsg });
  } finally {
    logError.mockRestore();
    log.mockRestore();
  }
  expect(sendMetaMsg).not.toHaveBeenCalled();
  expect(mockQuery).toHaveBeenCalledTimes(1);
});

test('production graph failure sends no ungrounded fallback', async () => {
  process.env.NODE_ENV = 'production';
  mockQuery.mockImplementation(async (sql) => {
    if (sql.includes('SELECT * FROM tenant_ai_providers')) {
      return [{ provider: 'openai', api_key: 'real-looking-test-key', enabled: 1 }];
    }
    if (sql.includes('knowledge_base_chunks')) {
      return [{ id: 1, title: 'Synthetic support guide', content: 'Help with account settings' }];
    }
    return [];
  });
  jest.spyOn(agentic, 'runAgenticAutopilot').mockResolvedValue(null);
  const sendMetaMsg = jest.fn();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  await singleReplyAi({ uid: 'tenant-a', incomingMsg: 'Help with account settings', senderNumber: '1234567890', sendMetaMsg });
  expect(sendMetaMsg).not.toHaveBeenCalled();
});

test('production direct model calls reject mock credentials', async () => {
  process.env.NODE_ENV = 'production';
  await expect(agentic.callLLM({ systemPrompt: 'help', userPrompt: 'hi', config: {
    provider: 'openai', api_key: 'mock_placeholder', model: 'test',
  } })).rejects.toThrow('not configured for production');
});
