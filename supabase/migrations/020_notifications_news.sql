-- 020: колокольчик — новые ответы сэнсэя и новости додзё

-- Отметка «ученик увидел ответ сэнсэя»
ALTER TABLE comments           ADD COLUMN IF NOT EXISTS read_at TIMESTAMP(3);
ALTER TABLE knowledge_comments ADD COLUMN IF NOT EXISTS read_at TIMESTAMP(3);

-- Уже существующие ответы считаем прочитанными, чтобы у всех
-- не загорелись старые уведомления
UPDATE comments           SET read_at = CURRENT_TIMESTAMP WHERE is_admin_reply = TRUE AND read_at IS NULL;
UPDATE knowledge_comments SET read_at = CURRENT_TIMESTAMP WHERE is_admin_reply = TRUE AND read_at IS NULL;

CREATE TABLE IF NOT EXISTS news (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind       TEXT NOT NULL DEFAULT 'announcement',
  title      TEXT NOT NULL,
  body       TEXT DEFAULT '',
  link_type  TEXT,
  link_ref   TEXT,
  auto_key   TEXT UNIQUE,
  is_hidden  BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news (created_at);

CREATE TABLE IF NOT EXISTS news_reads (
  news_id UUID NOT NULL REFERENCES news(id)  ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (news_id, user_id)
);
