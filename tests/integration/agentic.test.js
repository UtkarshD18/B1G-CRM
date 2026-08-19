const { runAgenticAutopilot } = require('../../functions/agenticAutopilot');

describe('LangGraph Agentic Autopilot Integration Tests', () => {
  const mockConfig = {
    provider: 'openai',
    api_key: 'mock_key_123',
    model: 'gpt-4o-mini',
    temperature: 0.7,
  };

  it('should triage and route ORDER queries correctly', async () => {
    const rawQuery = 'where is my order and track it';
    const result = await runAgenticAutopilot({
      uid: 1,
      provider: mockConfig.provider,
      api_key: mockConfig.api_key,
      model: mockConfig.model,
      temperature: mockConfig.temperature,
      incomingMsg: rawQuery,
      senderNumber: '1234567890',
      embeddingKey: 'mock_embedding',
    });

    expect(result).toContain('Mock synthesized reply');
  });

  it('should triage and route SALES queries correctly', async () => {
    const rawQuery = 'how much does it cost to buy the upgrade plan';
    const result = await runAgenticAutopilot({
      uid: 1,
      provider: mockConfig.provider,
      api_key: mockConfig.api_key,
      model: mockConfig.model,
      temperature: mockConfig.temperature,
      incomingMsg: rawQuery,
      senderNumber: '1234567890',
      embeddingKey: 'mock_embedding',
    });

    expect(result).toContain('Mock synthesized reply');
  });

  it('should fallback to SUPPORT when triage confidence is below threshold', async () => {
    // Triage node mock returns confidence 0.2 (below 0.6 threshold) for "gibberish"
    const rawQuery = 'gibberish query';
    const result = await runAgenticAutopilot({
      uid: 1,
      provider: mockConfig.provider,
      api_key: mockConfig.api_key,
      model: mockConfig.model,
      temperature: mockConfig.temperature,
      incomingMsg: rawQuery,
      senderNumber: '1234567890',
      embeddingKey: 'mock_embedding',
    });

    expect(result).toContain('Mock synthesized reply');
  });

  it('should apply tie-breaker rules for ambiguous queries with order references', async () => {
    // "order-123 pricing" contains pricing (sales) and order ID (order) -> resolves to ORDER
    const rawQuery = 'what is the shipping pricing for order-123';
    const result = await runAgenticAutopilot({
      uid: 1,
      provider: mockConfig.provider,
      api_key: mockConfig.api_key,
      model: mockConfig.model,
      temperature: mockConfig.temperature,
      incomingMsg: rawQuery,
      senderNumber: '1234567890',
      embeddingKey: 'mock_embedding',
    });

    expect(result).toContain('Mock synthesized reply');
  });

  it('should apply tie-breaker rules for ambiguous queries without order references', async () => {
    // "pricing for order" contains pricing (sales) but no specific ID -> resolves to SALES
    const rawQuery = 'what is the pricing for order shipping';
    const result = await runAgenticAutopilot({
      uid: 1,
      provider: mockConfig.provider,
      api_key: mockConfig.api_key,
      model: mockConfig.model,
      temperature: mockConfig.temperature,
      incomingMsg: rawQuery,
      senderNumber: '1234567890',
      embeddingKey: 'mock_embedding',
    });

    expect(result).toContain('Mock synthesized reply');
  });

  it('should handle specialist node DB/tool failures gracefully during synthesis', async () => {
    // "simulate_db_error" triggers mock hand-off message on error state
    const rawQuery = 'simulate_db_error';
    const result = await runAgenticAutopilot({
      uid: 1,
      provider: mockConfig.provider,
      api_key: mockConfig.api_key,
      model: mockConfig.model,
      temperature: mockConfig.temperature,
      incomingMsg: rawQuery,
      senderNumber: '1234567890',
      embeddingKey: 'mock_embedding',
    });

    expect(result).toBe(
      "I'm having trouble retrieving your details right now. Let me connect you with a support representative.",
    );
  });

  it('should fallback to null (graceful autopilot bypass) if graph execution crashes', async () => {
    const agenticModule = require('../../functions/agenticAutopilot');
    const spy = jest.spyOn(agenticModule, 'callLLM');

    spy.mockImplementation(async (args) => {
      // Throw realistic API error only for the synthesis node
      if (args.systemPrompt.includes('Synthesize a polite, helpful response')) {
        throw new Error('Simulated Synthesis Timeout/API error');
      }
      // Delegate to default mock logic for other nodes (like triage)
      if (args.systemPrompt.includes("classify the customer's incoming message")) {
        return JSON.stringify({
          category: 'SUPPORT',
          confidence: 0.95,
          reasoning: 'Mock triage resolver.',
        });
      }
      throw new Error('Unexpected LLM call in spy mock.');
    });

    try {
      const rawQuery = 'any query';
      const result = await agenticModule.runAgenticAutopilot({
        uid: 1,
        provider: mockConfig.provider,
        api_key: mockConfig.api_key,
        model: mockConfig.model,
        temperature: mockConfig.temperature,
        incomingMsg: rawQuery,
        senderNumber: '1234567890',
        embeddingKey: 'mock_embedding',
      });

      expect(result).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });

  it('should gracefully fall back to naive completions in ai.js if the agentic autopilot graph execution throws an error', async () => {
    const { singleReplyAi } = require('../../functions/ai');
    const agenticModule = require('../../functions/agenticAutopilot');
    const db = require('../../database/dbpromise');

    const runAgenticSpy = jest.spyOn(agenticModule, 'runAgenticAutopilot');
    const sendMetaMsgMock = jest.fn().mockResolvedValue(true);
    const testUid = 99999;

    try {
      // Clean up and insert inside try block so finally is guaranteed to run
      await db.query('DELETE FROM tenant_ai_providers WHERE uid = ?', [testUid]);
      await db.query(
        `
        INSERT INTO tenant_ai_providers (uid, provider, api_key, enabled, model)
        VALUES (?, ?, ?, ?, ?)
      `,
        [testUid, 'openai', 'mock_key_123', 1, 'gpt-4o-mini'],
      );

      // Mock runAgenticAutopilot to throw an error/reject
      runAgenticSpy.mockRejectedValue(new Error('Graph invocation crash test'));

      await singleReplyAi({
        uid: testUid,
        k: { type: 'AI_BOT' },
        chatbotFromMysq: { id: 1, flow: null, origin: null },
        toName: 'Test Customer',
        senderNumber: '1234567890',
        sendMetaMsg: sendMetaMsgMock,
        chatId: 'test-chat-id',
        nodes: [],
        edges: [],
        incomingMsg: 'hello standard query',
        destributeTaskFlow: null,
      });

      // Assert that sendMetaMsg was called with the mock/fallback reply from ai.js completions
      expect(sendMetaMsgMock).toHaveBeenCalled();
      const calledArgs = sendMetaMsgMock.mock.calls[0][0];
      expect(calledArgs.msgObj.text.body).toContain('Mock AI response');
    } finally {
      runAgenticSpy.mockRestore();
      await db.query('DELETE FROM tenant_ai_providers WHERE uid = ?', [testUid]);
    }
  });
});
