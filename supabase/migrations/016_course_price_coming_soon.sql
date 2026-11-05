-- 016: цена «Иккаджо Оё-вадза» и флаг «В разработке»
--
-- • courses.is_coming_soon — карточка курса видна, но купить нельзя
-- • «Силовая подготовка» — в разработке
-- • «Иккаджо Оё-вадза» — 4 000 ₽
-- Безопасно запускать повторно. Требует 012_courses.sql.

ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_coming_soon BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE courses SET is_coming_soon = TRUE WHERE id = 'strength';

UPDATE products SET price = 4000 WHERE type = 'course' AND reference = 'ikkajo-oyowaza';
