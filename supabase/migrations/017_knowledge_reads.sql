-- 017: счётчик прочтений статей базы знаний
--
-- Одна строка на ученика и статью; read_count — сколько раз открывал.
-- Прочтения админов и преподавателей не пишутся.
-- Безопасно запускать повторно.

CREATE TABLE IF NOT EXISTS knowledge_reads (
  item_id       UUID        NOT NULL REFERENCES knowledge_items(id) ON DELETE CASCADE,
  user_id       UUID        NOT NULL REFERENCES users(id)           ON DELETE CASCADE,
  read_count    INTEGER     NOT NULL DEFAULT 1,
  first_read_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_read_at  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (item_id, user_id)
);
