-- Migration: add tag column to knowledge_items
-- Run via psql or any PostgreSQL client (Timeweb, DBeaver, TablePlus и т.д.)
-- Safe to run multiple times (IF NOT EXISTS)

ALTER TABLE knowledge_items
  ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT NULL;

-- Optional: add index for faster filtering by tag
CREATE INDEX IF NOT EXISTS idx_knowledge_items_tag ON knowledge_items (tag);

-- Verify:
-- SELECT id, title, tag FROM knowledge_items ORDER BY sort_order;

-- Подключение через psql (данные из панели Timeweb):
-- psql "host=<хост> port=5432 dbname=<база> user=<юзер> password=<пароль> sslmode=require"
