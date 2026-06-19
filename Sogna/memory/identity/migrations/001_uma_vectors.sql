-- UMA semantic index — Supabase Postgres + pgvector (Sogna Core F0+)
-- Ejecutar en SQL Editor de Supabase o: psql $SUPABASE_DB_URL -f 001_uma_vectors.sql

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS uma_embeddings (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  layer TEXT,
  content TEXT NOT NULL,
  size INTEGER DEFAULT 0,
  embedding vector(384) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS uma_embeddings_path_idx ON uma_embeddings (path);
CREATE INDEX IF NOT EXISTS uma_embeddings_layer_idx ON uma_embeddings (layer);

-- IVFFlat opcional tras >10k filas — crear tras primera indexacion masiva
-- CREATE INDEX uma_embeddings_embedding_idx ON uma_embeddings
--   USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);