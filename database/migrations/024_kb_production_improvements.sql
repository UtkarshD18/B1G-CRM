-- KB Production Improvements: status system, chunk metadata, worker support

-- 1. Add status system to knowledge_base
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'PENDING';
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS index_error TEXT;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS indexed_at TIMESTAMPTZ;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS embedding_model VARCHAR(100);
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS chunk_count INTEGER DEFAULT 0;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;

-- 2. Add metadata to knowledge_base_chunks
ALTER TABLE knowledge_base_chunks ADD COLUMN IF NOT EXISTS doc_title VARCHAR(500);
ALTER TABLE knowledge_base_chunks ADD COLUMN IF NOT EXISTS source_url TEXT;
ALTER TABLE knowledge_base_chunks ADD COLUMN IF NOT EXISTS filename VARCHAR(500);
ALTER TABLE knowledge_base_chunks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;

-- 3. Mark existing indexed documents
UPDATE knowledge_base SET status = 'INDEXED', indexed_at = updated_at, embedding_model = 'gemini-embedding-001'
WHERE id IN (SELECT DISTINCT kb_id FROM knowledge_base_chunks WHERE embedding_vector IS NOT NULL)
AND (status IS NULL OR status = 'PENDING');

-- 4. Update chunk counts for existing documents
UPDATE knowledge_base kb SET chunk_count = (
  SELECT COUNT(*) FROM knowledge_base_chunks kbc WHERE kbc.kb_id = kb.id
) WHERE status = 'INDEXED';

-- 5. Backfill chunk metadata from parent docs
UPDATE knowledge_base_chunks kbc SET
  doc_title = kb.title,
  source_url = kb.source_path,
  filename = kb.title
FROM knowledge_base kb
WHERE kbc.kb_id = kb.id AND kbc.doc_title IS NULL;

-- 6. Index for worker polling
CREATE INDEX IF NOT EXISTS idx_kb_status ON knowledge_base(status);
