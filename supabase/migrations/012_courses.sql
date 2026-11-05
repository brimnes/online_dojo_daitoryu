-- 012: тематические курсы (раздел «Курсы» → «Тематические курсы»)
--
-- Курс продаётся отдельно: products(type='course', reference=courses.id),
-- доступ хранится в user_access(type='course', reference=courses.id).
-- Существующие доступы (month / section) не затрагиваются.
-- Безопасно запускать повторно.

CREATE TABLE IF NOT EXISTS courses (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  subtitle     TEXT DEFAULT '',
  description  TEXT DEFAULT '',
  kanji        TEXT DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS course_videos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        TEXT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT DEFAULT '',
  duration         TEXT,
  video_provider   TEXT DEFAULT 'kinescope',
  video_id         TEXT,
  video_status     TEXT DEFAULT 'none',
  video_poster_url TEXT,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_videos_video_id ON course_videos (video_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_course_id ON course_videos (course_id);

-- Стартовые курсы. Создаются неопубликованными: сначала загрузите видео
-- и проверьте цену в админке («Курсы»), затем включите «Опубликован».
INSERT INTO courses (id, title, subtitle, description, kanji, sort_order, is_published) VALUES
  ('ikkajo-oyowaza', 'Иккаджо Оёвадза', 'Прикладное применение техник Иккаджо',
   'Полноценный обучающий фильм о прикладном применении техник и принципов Иккаджо: как формы экзаменационной программы работают в свободной ситуации.',
   '応', 10, FALSE),
  ('strength', 'Силовая подготовка', 'Физическая база для занятий Дайто-рю',
   'Видеокурс общей и специальной физической подготовки: упражнения, которые укрепляют тело и помогают безопасно и эффективно работать на татами.',
   '力', 20, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Один фильм для «Оёвадза» — видео загружается в админке
INSERT INTO course_videos (course_id, title, sort_order)
SELECT 'ikkajo-oyowaza', 'Иккаджо Оёвадза', 1
WHERE NOT EXISTS (SELECT 1 FROM course_videos WHERE course_id = 'ikkajo-oyowaza');

-- Продукты. ⚠️ Цены — заглушки, поменяйте в админке перед публикацией.
INSERT INTO products (id, type, reference, title, description, price, is_active, sort_order) VALUES
  (gen_random_uuid(), 'course', 'ikkajo-oyowaza', 'Курс «Иккаджо Оёвадза»',
   'Обучающий фильм о прикладном применении техник Иккаджо.', 3000, TRUE, 40),
  (gen_random_uuid(), 'course', 'strength', 'Курс «Силовая подготовка»',
   'Видеокурс физической подготовки для занятий Дайто-рю.', 3000, TRUE, 41)
ON CONFLICT (type, reference) DO NOTHING;
