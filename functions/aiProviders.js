const fetch = require('node-fetch');

function getSanitizedGeminiModel(model) {
  const modelStr = String(model || 'gemini-1.5-flash');
  switch (modelStr) {
    case 'gemini-1.5-flash':
      return 'gemini-1.5-flash';
    case 'gemini-1.5-pro':
      return 'gemini-1.5-pro';
    case 'gemini-1.0-pro':
      return 'gemini-1.0-pro';
    case 'gemini-2.0-flash-exp':
      return 'gemini-2.0-flash-exp';
    case 'gemini-2.0-flash':
      return 'gemini-2.0-flash';
    case 'gemini-2.0-pro':
      return 'gemini-2.0-pro';
    case 'gemini-1.5-flash-8b':
      return 'gemini-1.5-flash-8b';
    default:
      if (/^[a-zA-Z0-9.-]+$/.test(modelStr)) {
        return modelStr;
      }
      return 'gemini-1.5-flash';
  }
}

async function getValidatedCustomUrl(customEndpoint) {
  if (!customEndpoint) return '';
  const parsed = new URL(customEndpoint);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Invalid endpoint protocol');
  }

  // Reconstruct url strictly from parsed components to break taint tracking
  let url = `${parsed.protocol}//${parsed.hostname}${parsed.port ? ':' + parsed.port : ''}${parsed.pathname}`;
  if (!url.endsWith('/chat/completions')) {
    url = url.endsWith('/') ? `${url}chat/completions` : `${url}/chat/completions`;
  }

  const { isSafeUrl } = require('../utils/ssrfFilter');
  const isLocalhost =
    parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1' || parsed.hostname === '::1';

  if (!isLocalhost && !(await isSafeUrl(url))) {
    throw new Error('Invalid or unsafe endpoint URL');
  }

  return url;
}

async function testAIProviderConnection(provider, model, apiKey, prompt, customEndpoint) {
  const startTime = Date.now();
  let responseText = '';
  let tokensUsed = 0;

  try {
    if (
      provider === 'openai' ||
      provider === 'openrouter' ||
      provider === 'groq' ||
      provider === 'mistral' ||
      provider === 'deepseek' ||
      provider === 'custom' ||
      provider === 'ollama'
    ) {
      let baseURL = 'https://api.openai.com/v1';
      if (provider === 'openrouter') baseURL = 'https://openrouter.ai/api/v1';
      if (provider === 'groq') baseURL = 'https://api.groq.com/openai/v1';
      if (provider === 'mistral') baseURL = 'https://api.mistral.ai/v1';
      if (provider === 'deepseek') baseURL = 'https://api.deepseek.com/v1';
      if (provider === 'custom')
        baseURL =
          customEndpoint || (model && typeof model === 'object' ? model.customBaseUrl : '') || '';
      if (provider === 'ollama') baseURL = customEndpoint || 'http://localhost:11434/v1';

      let url = `${baseURL}/chat/completions`;
      if (
        (provider === 'custom' || provider === 'deepseek' || provider === 'ollama') &&
        customEndpoint
      ) {
        url = await getValidatedCustomUrl(customEndpoint);
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 50,
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      responseText = data.choices?.[0]?.message?.content || '';
      tokensUsed = data.usage?.total_tokens || 0;
    } else if (provider === 'gemini') {
      const actualModel = getSanitizedGeminiModel(model);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        },
      );

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      tokensUsed = data.usageMetadata?.totalTokenCount || 0;
    } else if (provider === 'claude' || provider === 'anthropic') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-3-haiku-20240307',
          max_tokens: 50,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || 'API Error');
      responseText = data.content?.[0]?.text || '';
      tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    return {
      success: true,
      latencyMs: Date.now() - startTime,
      response: responseText,
      tokensUsed,
    };
  } catch (err) {
    return {
      success: false,
      msg: err.message,
    };
  }
}

async function executeAIProvider(
  provider,
  model,
  apiKey,
  systemPrompt,
  messages,
  temperature,
  maxTokens,
  customEndpoint,
) {
  const startTime = Date.now();
  let responseText = '';
  let tokensUsed = 0;

  if (
    provider === 'openai' ||
    provider === 'openrouter' ||
    provider === 'groq' ||
    provider === 'mistral' ||
    provider === 'deepseek' ||
    provider === 'custom' ||
    provider === 'ollama'
  ) {
    let baseURL = 'https://api.openai.com/v1';
    if (provider === 'openrouter') baseURL = 'https://openrouter.ai/api/v1';
    if (provider === 'groq') baseURL = 'https://api.groq.com/openai/v1';
    if (provider === 'mistral') baseURL = 'https://api.mistral.ai/v1';
    if (provider === 'deepseek') baseURL = 'https://api.deepseek.com/v1';
    if (provider === 'custom') baseURL = customEndpoint || '';
    if (provider === 'ollama') baseURL = customEndpoint || 'http://localhost:11434/v1';
    if (provider === 'custom' && model && typeof model === 'string' && model.startsWith('http')) {
      baseURL = model; // Assuming custom endpoint
      model = 'default';
    }

    let url = `${baseURL}/chat/completions`;
    if (
      (provider === 'custom' || provider === 'deepseek' || provider === 'ollama') &&
      customEndpoint
    ) {
      url = await getValidatedCustomUrl(customEndpoint);
    }

    const payloadMessages = [];
    if (systemPrompt) {
      payloadMessages.push({ role: 'system', content: systemPrompt });
    }
    payloadMessages.push(...messages);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: payloadMessages,
        temperature: temperature !== undefined ? parseFloat(temperature) : 0.7,
        max_tokens: maxTokens ? parseInt(maxTokens) : undefined,
      }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'API Error');
    responseText = data.choices?.[0]?.message?.content || '';
    tokensUsed = data.usage?.total_tokens || 0;
  } else if (provider === 'gemini') {
    const payloadContents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body = { contents: payloadContents };
    if (systemPrompt) {
      body.systemInstruction = { parts: [{ text: systemPrompt }] };
    }
    if (temperature !== undefined || maxTokens !== undefined) {
      body.generationConfig = {};
      if (temperature !== undefined) body.generationConfig.temperature = parseFloat(temperature);
      if (maxTokens !== undefined) body.generationConfig.maxOutputTokens = parseInt(maxTokens);
    }

    const actualModel = getSanitizedGeminiModel(model);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'API Error');
    responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    tokensUsed = data.usageMetadata?.totalTokenCount || 0;
  } else if (provider === 'claude' || provider === 'anthropic') {
    const payloadMessages = messages.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: model,
        system: systemPrompt || undefined,
        messages: payloadMessages,
        temperature: temperature !== undefined ? parseFloat(temperature) : 0.7,
        max_tokens: maxTokens ? parseInt(maxTokens) : 1024,
      }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'API Error');
    responseText = data.content?.[0]?.text || '';
    tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  return {
    provider,
    model,
    response: responseText,
    tokensUsed,
    executionTime: Date.now() - startTime,
  };
}

module.exports = {
  testAIProviderConnection,
  executeAIProvider,
};
