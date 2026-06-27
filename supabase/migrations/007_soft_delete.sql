-- 007_soft_delete.sql
-- Расширяем допустимые значения статуса пользователя: добавляем 'deleted'

ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_status_check;

ALTER TABLE users
  ADD CONSTRAINT users_status_check
  CHECK (status IN ('active', 'inactive', 'deleted'));
