-- 019: месяцы по годам — добавляем 2027
--
-- • months.year — год месяца. Месяцы 2026 остаются с id 'jan'…'dec'
--   (на них завязаны покупки), 2027 — '2027-jan'…'2027-dec'.
-- • все 12 месяцев 2027 закрыты (is_open = FALSE), админ открывает по мере выхода
-- • товары для месяцев 2027 — по той же цене, что у соответствующего месяца 2026
-- Безопасно запускать повторно.

ALTER TABLE months ADD COLUMN IF NOT EXISTS year INTEGER NOT NULL DEFAULT 2026;

INSERT INTO months (id, label, kanji, year, is_open, sort_order)
SELECT '2027-' || m.id, m.label, m.kanji, 2027, FALSE, m.sort_order
FROM months m
WHERE m.year = 2026 AND m.id IN ('jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec')
ON CONFLICT (id) DO NOTHING;

INSERT INTO products (id, type, reference, title, description, price, is_active, sort_order)
SELECT gen_random_uuid(), 'month', '2027-' || p.reference, p.title || ' 2027', NULL, p.price, TRUE, 100 + COALESCE(p.sort_order, 0)
FROM products p
WHERE p.type = 'month' AND p.reference IN ('jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec')
ON CONFLICT (type, reference) DO NOTHING;

