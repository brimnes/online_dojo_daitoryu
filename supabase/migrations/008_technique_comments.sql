-- 008_technique_comments.sql
-- Разрешаем комментарии к техникам:
-- lesson_id становится необязательным, добавляем technique_id

ALTER TABLE comments
  ALTER COLUMN lesson_id DROP NOT NULL;

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS technique_id TEXT;
