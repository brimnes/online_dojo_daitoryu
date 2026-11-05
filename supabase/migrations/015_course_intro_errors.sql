-- 015: «Иккаджо Оё-вадза» — введение, заключение и видео с ошибками
--
-- • course_videos.errors_video_id / errors_video_status — второе видео раздела
--   «Разбор ошибок» (загружается в админке «Курсы», необязательно)
-- • раздел «Введение» — первым, «Заключение» — последним
-- • у Косигурумы видео с ошибками нет — убираем пункт из описания
-- Безопасно запускать повторно. Требует 013_course_sections.sql.

ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS errors_video_id TEXT;
ALTER TABLE course_videos ADD COLUMN IF NOT EXISTS errors_video_status TEXT DEFAULT 'none';
CREATE INDEX IF NOT EXISTS idx_course_videos_errors_video_id ON course_videos (errors_video_id);

INSERT INTO course_videos (course_id, title, subtitle, description, sort_order)
SELECT 'ikkajo-oyowaza', 'Введение', 'о курсе', '', 0
WHERE NOT EXISTS (SELECT 1 FROM course_videos WHERE course_id = 'ikkajo-oyowaza' AND title = 'Введение');

INSERT INTO course_videos (course_id, title, subtitle, description, sort_order)
SELECT 'ikkajo-oyowaza', 'Заключение', 'итоги курса', '', 13
WHERE NOT EXISTS (SELECT 1 FROM course_videos WHERE course_id = 'ikkajo-oyowaza' AND title = 'Заключение');

UPDATE course_videos SET description = '- Демонстрация техники
- Подробный разбор выполнения, принципов и технических нюансов'
WHERE course_id = 'ikkajo-oyowaza' AND title = 'Косигурума' AND description LIKE '%Разбор характерных ошибок%';

UPDATE courses SET description = REPLACE(description, 'Фильм состоит из 12 разделов.', 'Фильм состоит из введения, 12 разделов с техниками и заключения.')
WHERE id = 'ikkajo-oyowaza';
