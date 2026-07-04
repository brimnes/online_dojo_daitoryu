-- 010: источник оплаты доступа
-- 'yookassa' — оплата через ЮKassa (webhook/verify)
-- 'free'     — выдан бесплатно вручную
-- 'cash'     — наличные
-- 'card'     — перевод на карту
-- 'crypto'   — криптовалюта
ALTER TABLE user_access ADD COLUMN IF NOT EXISTS source TEXT;

-- Бэкфилл существующих строк: платные считаем ЮKassa, нулевые — бесплатной выдачей
UPDATE user_access SET source = 'yookassa' WHERE source IS NULL AND amount > 0;
UPDATE user_access SET source = 'free'     WHERE source IS NULL;
