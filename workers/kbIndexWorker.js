const { query } = require("../database/dbpromise");
const { decryptKey } = require("../utils/crypto");
const { indexDocument, markDocumentFailed, config } = require("../utils/ragHelper");

let intervalId = null;
let isProcessing = false;

async function processPendingDocs() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    // Poll for pending/failed documents that haven't exceeded retry count
    const pendingDocs = await query(
      `SELECT id, uid, title, type, source_path, content, retry_count 
       FROM knowledge_base 
       WHERE status IN ('PENDING', 'FAILED') AND retry_count < ?
       ORDER BY priority DESC, created_at ASC`,
      [config.WORKER_MAX_RETRIES]
    );

    for (const doc of pendingDocs) {
      try {
        console.log(`[KB Worker] Indexing document ID ${doc.id}: "${doc.title}" (try ${doc.retry_count + 1}/${config.WORKER_MAX_RETRIES})...`);
        
        // Mark as INDEXING first to avoid double processing (concurrency protection)
        await query("UPDATE knowledge_base SET status = 'INDEXING', index_error = NULL WHERE id = ?", [doc.id]);

        // Get Gemini API key for this user
        const tenantProviders = await query(
          "SELECT api_key FROM tenant_ai_providers WHERE uid = ? AND provider = 'gemini' AND enabled = 1 LIMIT 1",
          [doc.uid]
        );

        if (tenantProviders.length === 0) {
          throw new Error("Gemini API key required. Go to AI Provider Settings and configure Gemini provider.");
        }

        const apiKey = decryptKey(tenantProviders[0].api_key);
        if (!apiKey) {
          throw new Error("Failed to decrypt Gemini API key.");
        }

        // Call indexDocument
        await indexDocument(doc.id, doc.uid, doc.content, apiKey, {
          title: doc.title,
          sourceUrl: doc.source_path,
          filename: doc.title
        });

        console.log(`[KB Worker] Document ID ${doc.id} successfully indexed!`);
      } catch (err) {
        console.error(`[KB Worker] Failed indexing document ID ${doc.id}:`, err.message);
        await markDocumentFailed(doc.id, err.message);
      }
    }
  } catch (globalErr) {
    console.error("[KB Worker] Error in worker polling loop:", globalErr);
  } finally {
    isProcessing = false;
  }
}

function startKbIndexWorker() {
  if (intervalId) {
    console.log("[KB Worker] Worker already running.");
    return;
  }
  console.log("[KB Worker] Starting Knowledge Base Indexing Worker...");
  
  // Run once immediately
  processPendingDocs();
  
  intervalId = setInterval(processPendingDocs, config.WORKER_POLL_INTERVAL_MS);
}

function stopKbIndexWorker() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log("[KB Worker] Stopped Knowledge Base Indexing Worker.");
  }
}

module.exports = {
  startKbIndexWorker,
  stopKbIndexWorker
};
