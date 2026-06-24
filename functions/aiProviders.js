const fetch = require("node-fetch");

async function testAIProviderConnection(provider, model, apiKey, prompt) {
  const startTime = Date.now();
  let responseText = "";
  let tokensUsed = 0;

  try {
    if (provider === "openai" || provider === "openrouter" || provider === "groq" || provider === "mistral" || provider === "deepseek" || provider === "custom") {
      let baseURL = "https://api.openai.com/v1";
      if (provider === "openrouter") baseURL = "https://openrouter.ai/api/v1";
      if (provider === "groq") baseURL = "https://api.groq.com/openai/v1";
      if (provider === "mistral") baseURL = "https://api.mistral.ai/v1";
      if (provider === "deepseek") baseURL = "https://api.deepseek.com/v1";
      if (provider === "custom") baseURL = model.customBaseUrl || ""; // Not fully supported in test yet without full config

      const res = await fetch(`${baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model || "gpt-3.5-turbo",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 50
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "API Error");
      responseText = data.choices?.[0]?.message?.content || "";
      tokensUsed = data.usage?.total_tokens || 0;

    } else if (provider === "gemini") {
      const actualModel = model || "gemini-1.5-flash";
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "API Error");
      responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      tokensUsed = data.usageMetadata?.totalTokenCount || 0;
      
    } else if (provider === "claude" || provider === "anthropic") {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: model || "claude-3-haiku-20240307",
          max_tokens: 50,
          messages: [{ role: "user", content: prompt }]
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error.message || "API Error");
      responseText = data.content?.[0]?.text || "";
      tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }

    return {
      success: true,
      latencyMs: Date.now() - startTime,
      response: responseText,
      tokensUsed
    };
  } catch (err) {
    return {
      success: false,
      msg: err.message
    };
  }
}

async function executeAIProvider(provider, model, apiKey, systemPrompt, messages, temperature, maxTokens) {
  const startTime = Date.now();
  let responseText = "";
  let tokensUsed = 0;

  if (provider === "openai" || provider === "openrouter" || provider === "groq" || provider === "mistral" || provider === "deepseek" || provider === "custom") {
    let baseURL = "https://api.openai.com/v1";
    if (provider === "openrouter") baseURL = "https://openrouter.ai/api/v1";
    if (provider === "groq") baseURL = "https://api.groq.com/openai/v1";
    if (provider === "mistral") baseURL = "https://api.mistral.ai/v1";
    if (provider === "deepseek") baseURL = "https://api.deepseek.com/v1";
    if (provider === "custom" && model.startsWith("http")) {
      baseURL = model; // Assuming custom endpoint
      model = "default";
    }

    const payloadMessages = [];
    if (systemPrompt) {
      payloadMessages.push({ role: "system", content: systemPrompt });
    }
    payloadMessages.push(...messages);

    const res = await fetch(`${baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: payloadMessages,
        temperature: temperature !== undefined ? parseFloat(temperature) : 0.7,
        max_tokens: maxTokens ? parseInt(maxTokens) : undefined
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "API Error");
    responseText = data.choices?.[0]?.message?.content || "";
    tokensUsed = data.usage?.total_tokens || 0;

  } else if (provider === "gemini") {
    const payloadContents = messages.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
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

    const actualModel = model || "gemini-1.5-flash";
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${actualModel}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "API Error");
    responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    tokensUsed = data.usageMetadata?.totalTokenCount || 0;

  } else if (provider === "claude" || provider === "anthropic") {
    const payloadMessages = messages.map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content
    }));

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: model,
        system: systemPrompt || undefined,
        messages: payloadMessages,
        temperature: temperature !== undefined ? parseFloat(temperature) : 0.7,
        max_tokens: maxTokens ? parseInt(maxTokens) : 1024
      })
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message || "API Error");
    responseText = data.content?.[0]?.text || "";
    tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);

  } else {
    throw new Error(`Unsupported provider: ${provider}`);
  }

  return {
    provider,
    model,
    response: responseText,
    tokensUsed,
    executionTime: Date.now() - startTime
  };
}

module.exports = {
  testAIProviderConnection,
  executeAIProvider
};
