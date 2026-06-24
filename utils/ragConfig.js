/**
 * RAG Configuration — Single source of truth
 * All RAG code imports constants from here.
 * Changing models or tuning requires editing only this file.
 */

module.exports = {
  // Embedding
  EMBEDDING_MODEL: "gemini-embedding-001",
  EMBEDDING_DIMS: 768,
  EMBEDDING_API_BASE: "https://generativelanguage.googleapis.com/v1beta/models",

  // Chunking
  MAX_CHUNK_SIZE: 500,
  CHUNK_OVERLAP: 100,

  // Retrieval
  SIMILARITY_THRESHOLD: 0.3,
  TOP_K: 5,

  // Hybrid ranking weights (must sum to 1.0)
  HYBRID_WEIGHTS: {
    vector: 0.70,
    keyword: 0.20,
    freshness: 0.10,
  },

  // Worker
  WORKER_POLL_INTERVAL_MS: 5000,
  WORKER_MAX_RETRIES: 3,

  // Freshness decay (documents older than this get 0 freshness score)
  FRESHNESS_DECAY_DAYS: 90,
};
