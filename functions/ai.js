const { query } = require('../database/dbpromise');
const env = require('../env');

async function singleReplyAi({
  uid,
  k,
  chatbotFromMysq,
  toName,
  senderNumber,
  sendMetaMsg,
  chatId,
  nodes,
  edges,
  incomingMsg,
  destributeTaskFlow,
}) {
  try {
    console.log(
      `[AI Autopilot] Incoming message: "${incomingMsg}" from ${toName} (${senderNumber})`,
    );

    // 1. Fetch configured AI provider for the tenant
    let providers = await query(
      'SELECT * FROM tenant_ai_providers WHERE uid = ? AND enabled = 1 LIMIT 1',
      [uid],
    );

    if (providers.length === 0) {
      const globalConfig = await query(
        'SELECT ai_provider_active, ai_openai_key, ai_openai_model, ai_gemini_key, ai_gemini_model, ai_claude_key, ai_claude_model, ai_openrouter_key, ai_openrouter_model, ai_ollama_url, ai_ollama_model, ai_custom_url, ai_custom_model FROM web_private',
        [],
      );
      if (globalConfig.length > 0 && globalConfig[0].ai_provider_active) {
        const active = globalConfig[0].ai_provider_active;
        let key = '';
        let model = '';
        let custom_endpoint = '';
        if (active === 'openai') {
          key = globalConfig[0].ai_openai_key;
          model = globalConfig[0].ai_openai_model;
        } else if (active === 'gemini') {
          key = globalConfig[0].ai_gemini_key;
          model = globalConfig[0].ai_gemini_model;
        } else if (active === 'claude') {
          key = globalConfig[0].ai_claude_key;
          model = globalConfig[0].ai_claude_model;
        } else if (active === 'openrouter') {
          key = globalConfig[0].ai_openrouter_key;
          model = globalConfig[0].ai_openrouter_model;
        } else if (active === 'ollama') {
          custom_endpoint = globalConfig[0].ai_ollama_url;
          model = globalConfig[0].ai_ollama_model;
        } else if (active === 'custom') {
          custom_endpoint = globalConfig[0].ai_custom_url;
          model = globalConfig[0].ai_custom_model;
        }

        if (active) {
          providers = [
            {
              provider: active,
              api_key: key,
              model: model,
              temperature: 0.7,
              custom_endpoint: custom_endpoint,
            },
          ];
        }
      }
    }

    if (providers.length === 0) {
      console.log('[AI Autopilot] No AI provider enabled for this tenant.');
      // Send a fallback standard keyword message
      return;
    }

    const { provider, api_key, model, temperature, custom_endpoint } = providers[0];

    // 2. Fetch Gemini API key for embeddings (tries tenant first, then global config)
    let embeddingKey = '';
    const tenantGemini = await query(
      "SELECT api_key FROM tenant_ai_providers WHERE uid = ? AND provider = 'gemini' AND enabled = 1 LIMIT 1",
      [uid],
    );
    if (tenantGemini.length > 0) {
      embeddingKey = tenantGemini[0].api_key;
    } else {
      const globalConfig = await query('SELECT ai_gemini_key FROM web_private LIMIT 1', []);
      if (globalConfig.length > 0) {
        embeddingKey = globalConfig[0].ai_gemini_key;
      }
    }

    // Perform Keyword Search on chunks
    const kbsForKeywords = await query(
      `SELECT kbc.id AS chunk_id, kbc.kb_id, kbc.content, kb.title, kb.updated_at AS doc_updated_at
       FROM knowledge_base_chunks kbc
       JOIN knowledge_base kb ON kbc.kb_id = kb.id
       WHERE kbc.uid = ?`,
      [uid],
    );

    let keywordResults = [];
    if (kbsForKeywords.length > 0 && incomingMsg) {
      const words = incomingMsg
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2);
      for (const kb of kbsForKeywords) {
        let score = 0;
        for (const w of words) {
          if (kb.content.toLowerCase().includes(w)) score++;
        }
        if (score > 0) {
          keywordResults.push({
            chunk_id: kb.chunk_id,
            kb_id: kb.kb_id,
            title: kb.title,
            content: kb.content,
            score,
            doc_updated_at: kb.doc_updated_at,
          });
        }
      }
    }

    // Perform Vector Search on chunks (if Gemini key exists and not mocking)
    let vectorResults = [];
    const hasEmbeddingKey =
      embeddingKey && !embeddingKey.startsWith('mock_') && embeddingKey !== 'CHANGE_ME';
    const isMockEmbedding = env.MOCK_META_DELIVERY || !hasEmbeddingKey;

    if (!isMockEmbedding) {
      try {
        const { vectorSearch } = require('../utils/ragHelper');
        vectorResults = await vectorSearch(uid, incomingMsg, embeddingKey, 10);
      } catch (ragErr) {
        console.error('[AI Autopilot] Vector search failed:', ragErr);
      }
    }

    // Hybrid Rank context chunks
    let context = '';
    if (vectorResults.length > 0 || keywordResults.length > 0) {
      try {
        const { hybridRank } = require('../utils/ragHelper');
        const bestChunks = hybridRank(vectorResults, keywordResults, 4);
        context = bestChunks
          .map((chunk) => `Source (${chunk.title}): ${chunk.content}`)
          .join('\n\n');
      } catch (rankErr) {
        console.error('[AI Autopilot] Hybrid ranking failed:', rankErr);
      }
    }

    // Fetch order information if message mentions "order", "track", "status", "awb", or "where is"
    let orderContext = '';
    const lowerMsg = (incomingMsg || '').toLowerCase();
    if (
      lowerMsg.includes('order') ||
      lowerMsg.includes('track') ||
      lowerMsg.includes('status') ||
      lowerMsg.includes('awb') ||
      lowerMsg.includes('where is')
    ) {
      try {
        const { getOrderTrackingContext } = require('./orderTracker');
        const storefrontOrderContext = await getOrderTrackingContext(senderNumber, incomingMsg);
        if (storefrontOrderContext) {
          orderContext = storefrontOrderContext;
        }
      } catch (err) {
        console.error('[AI Autopilot] Failed to fetch storefront order context:', err);
      }

      if (!orderContext) {
        const cleanNumber = (senderNumber || '').replace(/\D/g, '');
        const shortNumber = cleanNumber.length > 10 ? cleanNumber.slice(-10) : cleanNumber;

        const orders = await query(
          `SELECT id, amount, payment_mode, data, createdat 
           FROM orders 
           WHERE uid = ? AND (data LIKE ? OR data LIKE ?) 
           ORDER BY createdat DESC 
           LIMIT 5`,
          [uid, `%${cleanNumber}%`, `%${shortNumber}%`],
        );

        if (orders.length > 0) {
          orderContext =
            "Customer's Recent CRM Plan Orders:\n" +
            orders
              .map((o) => {
                let details = o.data;
                try {
                  const parsed = JSON.parse(o.data);
                  details = JSON.stringify(parsed);
                } catch (e) {}
                return `- Order ID: ${o.id}, Amount: ${o.amount}, Date: ${o.createdat}, Payment Mode: ${o.payment_mode}, Details: ${details}`;
              })
              .join('\n');
        } else {
          orderContext = 'No orders found for this customer phone number in the database.';
        }
      }
    }

    const systemPrompt = `You are a helpful CRM AI assistant for our customer service workspace. 
Answer the customer's question politely. 
If relevant, use the following official Knowledge Base context retrieved from our company documentation:

${context || 'No specific company docs found for this query.'}

${orderContext ? `\nHere is the customer's order history from the site database:\n${orderContext}\n` : ''}

If the answer is not in the context, answer using your general knowledge but keep it professional.
Keep your response concise, under 3 sentences.`;

    let replyText = '';
    const startTime = Date.now();

    const isMock =
      env.MOCK_META_DELIVERY || !api_key || api_key.startsWith('mock_') || api_key === 'CHANGE_ME';

    // 3. Make LLM API call
    if (isMock) {
      // Simulate network latency of 300ms
      await new Promise((resolve) => setTimeout(resolve, 300));
      replyText = `Mock AI response from ${provider} for query: "${incomingMsg}".`;
      if (context) {
        replyText += ` Context matching: ${context.slice(0, 100)}...`;
      }
    } else if (provider === 'gemini') {
      const geminiModel = model || 'gemini-1.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${api_key}`;
      const payload = {
        contents: [
          {
            parts: [{ text: `${systemPrompt}\n\nCustomer Message: ${incomingMsg}\nAI Response:` }],
          },
        ],
        generationConfig: {
          temperature: parseFloat(temperature || 0.7),
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (provider === 'claude') {
      const claudeModel = model || 'claude-3-5-sonnet-20240620';
      const url = 'https://api.anthropic.com/v1/messages';
      const payload = {
        model: claudeModel,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `${systemPrompt}\n\nCustomer Message: ${incomingMsg}\nAI Response:`,
          },
        ],
        temperature: parseFloat(temperature || 0.7),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-api-key': api_key,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      replyText = data?.content?.[0]?.text || '';
    } else {
      // OpenAI / OpenRouter / Ollama / Custom compatible endpoint
      let url = 'https://api.openai.com/v1/chat/completions';
      let headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${api_key}`,
      };

      if (provider === 'openrouter') {
        url = 'https://openrouter.ai/api/v1/chat/completions';
      } else if (provider === 'ollama') {
        url = custom_endpoint || 'http://localhost:11434/v1/chat/completions';
      } else if (provider === 'custom') {
        url = custom_endpoint;
      } else if (provider === 'deepseek') {
        url = custom_endpoint || 'https://api.deepseek.com/v1/chat/completions';
      }

      const payload = {
        model: model || (provider === 'openai' ? 'gpt-4o-mini' : ''),
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: incomingMsg },
        ],
        temperature: parseFloat(temperature || 0.7),
      };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      replyText = data?.choices?.[0]?.message?.content || '';
    }

    replyText = replyText.trim();
    if (!replyText) {
      console.log('[AI Autopilot] Extracted response was empty.');
      return;
    }

    // 4. Send synthesized response back to the customer
    const msgObj = {
      type: 'text',
      text: {
        preview_url: true,
        body: replyText,
      },
    };

    const savObj = {
      type: 'text',
      metaChatId: '',
      msgContext: msgObj,
      reaction: '',
      timestamp: '',
      senderName: toName,
      senderMobile: senderNumber,
      status: 'sent',
      star: false,
      route: 'OUTGOING',
    };

    await sendMetaMsg({
      uid,
      msgObj,
      toNumber: senderNumber,
      savObj,
      chatId,
      chatbotFromMysq,
    });

    console.log(`[AI Autopilot] Successfully sent response: "${replyText}"`);

    const latencyMs = Date.now() - startTime;

    // Record chatbot log for diagnostics
    const { recordChatbotLog } = require('./chatbotDiagnostics');
    if (chatbotFromMysq) {
      await recordChatbotLog({
        uid,
        chatbot: chatbotFromMysq,
        flow: chatbotFromMysq.flow ? JSON.parse(chatbotFromMysq.flow) : null,
        senderNumber,
        senderName: toName,
        incomingMessage: incomingMsg,
        origin: chatbotFromMysq.origin ? JSON.parse(chatbotFromMysq.origin)?.code : 'META',
        matched: true,
        status: 'replied',
        detail: {
          provider,
          model,
          latency_ms: latencyMs,
          reply: replyText,
        },
      });
    }
  } catch (err) {
    console.error('[AI Autopilot] Error generating response:', err);
  }
}

module.exports = { singleReplyAi };
