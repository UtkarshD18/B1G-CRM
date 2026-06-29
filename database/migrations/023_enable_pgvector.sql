-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add native vector column for 768-dim Gemini gemini-embedding-001 embeddings
-- Using outputDimensionality=768 to reduce from 3072 native dims
-- Keeping existing 'embedding' TEXT column for rollback safety
ALTER TABLE knowledge_base_chunks 
ADD COLUMN IF NOT EXISTS embedding_vector vector(768);

-- Create HNSW index for fast approximate nearest neighbor search
-- Using cosine distance operator (vector_cosine_ops)
-- HNSW supports up to 2000 dims, works well for any dataset size
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding_vector 
ON knowledge_base_chunks 
USING hnsw (embedding_vector vector_cosine_ops);
