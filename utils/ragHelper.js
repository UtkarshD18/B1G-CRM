const fetch = require("node-fetch");
const { query } = require("../database/dbpromise");
const config = require("./ragConfig");

const EMBEDDING_API_URL = `${config.EMBEDDING_API_BASE}/${config.EMBEDDING_MODEL}:embedContent`;

/**
 * Format a JS float array as a pgvector literal string: [0.1,0.2,...]
 */
function pgvectorFormat(vector) {
  return `[${vector.join(",")}]`;
}

/**
 * Generate embedding using Gemini API
 * Returns a float array of EMBEDDING_DIMS dimensions
 * Throws if no API key or API call fails
 */
async function getEmbedding(text, apiKey) {
  if (!apiKey || apiKey === "••••••••••••••••") {
    throw new Error("Gemini API key required for embedding generation. Configure it in AI Provider Settings.");
  }

  const res = await fetch(`${EMBEDDING_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      outputDimensionality: config.EMBEDDING_DIMS
    })
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(`Gemini embedding API error (${res.status}): ${errBody}`);
  }

  const data = await res.json();
  if (!data.embedding || !data.embedding.values) {
    throw new Error("Gemini embedding API returned no embedding values");
  }

  return data.embedding.values;
}

/**
 * Chunk text into segments with overlap
 */
function chunkText(text, size, overlap) {
  const chunkSize = size || config.MAX_CHUNK_SIZE;
  const chunkOverlap = overlap || config.CHUNK_OVERLAP;
  const chunks = [];
  if (!text) return chunks;

  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    let chunk = text.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }
    if (end >= text.length) break;
    start += (chunkSize - chunkOverlap);
  }
  return chunks;
}

/**
 * Chunk and index a document using Gemini embeddings + pgvector storage
 * Stores metadata alongside each chunk
 * Updates parent document status on completion
 */
async function indexDocument(kbId, uid, content, apiKey, metadata = {}) {
  const { title, sourceUrl, filename } = metadata;

  // Set status to INDEXING
  await query("UPDATE knowledge_base SET status = 'INDEXING', index_error = NULL WHERE id = ?", [kbId]);

  // Delete existing chunks
  await query("DELETE FROM knowledge_base_chunks WHERE kb_id = ?", [kbId]);

  const chunks = chunkText(content);
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = await getEmbedding(chunk, apiKey);
    const vectorLiteral = pgvectorFormat(embedding);

    await query(
      `INSERT INTO knowledge_base_chunks
        (kb_id, uid, chunk_index, content, embedding, embedding_vector, doc_title, source_url, filename)
       VALUES (?, ?, ?, ?, ?, ?::vector, ?, ?, ?)`,
      [kbId, uid, i, chunk, JSON.stringify(embedding), vectorLiteral, title || null, sourceUrl || null, filename || null]
    );
  }

  // Update parent document status
  await query(
    `UPDATE knowledge_base SET status = 'INDEXED', indexed_at = NOW(), embedding_model = ?, chunk_count = ?, index_error = NULL, retry_count = 0 WHERE id = ?`,
    [config.EMBEDDING_MODEL, chunks.length, kbId]
  );
}

/**
 * Mark a document as failed
 */
async function markDocumentFailed(kbId, errorMessage) {
  await query(
    "UPDATE knowledge_base SET status = 'FAILED', index_error = ?, retry_count = retry_count + 1 WHERE id = ?",
    [errorMessage, kbId]
  );
}

/**
 * Perform semantic vector search using pgvector cosine distance
 */
async function vectorSearch(uid, queryText, apiKey, topK) {
  const k = topK || config.TOP_K;
  const queryVec = await getEmbedding(queryText, apiKey);
  const vectorLiteral = pgvectorFormat(queryVec);

  const rows = await query(
    `SELECT
       kbc.id AS chunk_id,
       kbc.kb_id,
       kbc.content,
       kbc.doc_title,
       kbc.source_url,
       kbc.created_at,
       kb.title,
       kb.updated_at AS doc_updated_at,
       1 - (kbc.embedding_vector <=> ?::vector) AS similarity
     FROM knowledge_base_chunks kbc
     JOIN knowledge_base kb ON kbc.kb_id = kb.id
     WHERE kbc.uid = ? AND kbc.embedding_vector IS NOT NULL
     ORDER BY kbc.embedding_vector <=> ?::vector
     LIMIT ?`,
    [vectorLiteral, uid, vectorLiteral, k]
  );

  return rows.map(row => ({
    chunk_id: row.chunk_id,
    kb_id: row.kb_id,
    title: row.title || row.doc_title,
    content: row.content,
    score: parseFloat(row.similarity),
    doc_updated_at: row.doc_updated_at
  }));
}

/**
 * Compute freshness score (0-1) based on document age
 */
function freshnessScore(docUpdatedAt) {
  if (!docUpdatedAt) return 0;
  const ageMs = Date.now() - new Date(docUpdatedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= 0) return 1;
  if (ageDays >= config.FRESHNESS_DECAY_DAYS) return 0;
  return 1 - (ageDays / config.FRESHNESS_DECAY_DAYS);
}

/**
 * Hybrid ranking: combine vector similarity, keyword relevance, and freshness
 * Returns sorted, deduplicated chunks with composite scores
 */
function hybridRank(vectorResults, keywordResults, topK) {
  const k = topK || config.TOP_K;
  const w = config.HYBRID_WEIGHTS;

  // Normalize keyword scores to 0-1 range
  const maxKeywordScore = Math.max(1, ...keywordResults.map(r => r.score));

  // Build a map keyed by content text (for dedup)
  const chunkMap = new Map();

  for (const vr of vectorResults) {
    const key = vr.content.trim().toLowerCase();
    const fresh = freshnessScore(vr.doc_updated_at);
    const existing = chunkMap.get(key);
    if (!existing || vr.score > existing.vectorScore) {
      chunkMap.set(key, {
        chunk_id: vr.chunk_id,
        kb_id: vr.kb_id,
        title: vr.title,
        content: vr.content,
        vectorScore: vr.score,
        keywordScore: 0,
        freshnessScore: fresh,
        finalScore: (w.vector * vr.score) + (w.freshness * fresh),
        type: "vector"
      });
    }
  }

  for (const kr of keywordResults) {
    const key = kr.content ? kr.content.trim().toLowerCase() : kr.text.trim().toLowerCase();
    const normalizedKwScore = kr.score / maxKeywordScore;
    const existing = chunkMap.get(key);
    if (existing) {
      existing.keywordScore = normalizedKwScore;
      existing.finalScore = (w.vector * existing.vectorScore) + (w.keyword * normalizedKwScore) + (w.freshness * existing.freshnessScore);
      existing.type = "hybrid";
    } else {
      chunkMap.set(key, {
        chunk_id: kr.chunk_id || null,
        kb_id: kr.kb_id || null,
        title: kr.title,
        content: kr.content || kr.text,
        vectorScore: 0,
        keywordScore: normalizedKwScore,
        freshnessScore: 0,
        finalScore: (w.keyword * normalizedKwScore),
        type: "keyword"
      });
    }
  }

  // Sort by final score descending
  const ranked = Array.from(chunkMap.values()).sort((a, b) => b.finalScore - a.finalScore);
  return ranked.slice(0, k);
}

module.exports = {
  getEmbedding,
  chunkText,
  indexDocument,
  markDocumentFailed,
  vectorSearch,
  hybridRank,
  freshnessScore,
  pgvectorFormat,
  config
};
