## 5. Схема базы данных

Запустить в Supabase → SQL Editor:

```sql
-- ─────────────────────────────────────────
-- Профили пользователей
-- (расширяет встроенную auth.users)
-- ─────────────────────────────────────────
CREATE TABLE profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  level        TEXT NOT NULL DEFAULT '6kyu'
                 CHECK (level IN ('6kyu','5kyu','4kyu','3kyu','2kyu','1kyu','1dan','2dan','3dan')),
  role         TEXT NOT NULL DEFAULT 'student'
                 CHECK (role IN ('student','teacher','admin')),
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK (status IN ('active','inactive')),
  -- Поля из анкеты при регистрации:
  self_level   TEXT DEFAULT 'none'
                 CHECK (self_level IN ('none','6kyu','5kyu','4kyu','3kyu','2kyu','1kyu','1dan','2dan','3dan')),
  sensei_name  TEXT DEFAULT '',          -- имя сэнсэя (пусто = Станислав Копин)
  experience   TEXT DEFAULT '',          -- свободный текст об опыте и целях
  joined_at    TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- Автосоздание профиля при регистрации
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, email, self_level, sensei_name, experience)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'self_level', 'none'),
    COALESCE(NEW.raw_user_meta_data->>'sensei_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'experience', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ─────────────────────────────────────────
-- Доступы пользователей
-- ─────────────────────────────────────────
CREATE TABLE user_access (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('month','section')),
  reference   TEXT NOT NULL,  -- 'jan', 'feb', 'ikkajo', 'nikkajo' и т.д.
  paid_at     TIMESTAMPTZ DEFAULT now(),
  amount      INTEGER,        -- в рублях
  UNIQUE(user_id, type, reference)
);


-- ─────────────────────────────────────────
-- Экзамены
-- ─────────────────────────────────────────
CREATE TABLE exams (
  id             SERIAL PRIMARY KEY,
  user_id        UUID REFERENCES profiles(id) ON DELETE CASCADE,
  target_level   TEXT NOT NULL,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','approved','rejected')),
  teacher_id     UUID REFERENCES profiles(id),
  teacher_note   TEXT,
  requested_at   TIMESTAMPTZ DEFAULT now(),
  resolved_at    TIMESTAMPTZ
);

-- Обновляем уровень профиля при подтверждении экзамена
CREATE OR REPLACE FUNCTION handle_exam_approved()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE profiles SET level = NEW.target_level WHERE id = NEW.user_id;
    NEW.resolved_at = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_exam_approved
  BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION handle_exam_approved();


-- ─────────────────────────────────────────
-- Месяцы (метаданные)
-- ─────────────────────────────────────────
CREATE TABLE months (
  id          TEXT PRIMARY KEY,  -- 'jan', 'feb', ...
  label       TEXT NOT NULL,
  kanji       TEXT,
  description TEXT,
  is_open     BOOLEAN DEFAULT FALSE,
  sort_order  INTEGER
);

-- Наполнить:
INSERT INTO months (id, label, kanji, description, is_open, sort_order) VALUES
  ('jan', 'Январь',   '一', 'Основы дистанции. Базовые захваты.',         TRUE,  1),
  ('feb', 'Февраль',  '二', 'Укэми — техника падений. Стойки.',           TRUE,  2),
  ('mar', 'Март',     '三', 'Кихон — базовая техника.',                   TRUE,  3),
  ('apr', 'Апрель',   '四', 'Ирими — вход. Управление балансом укэ.',     FALSE, 4),
  ('may', 'Май',      '五', 'Тэнкан — разворот. Слияние с атакой.',      FALSE, 5),
  ('jun', 'Июнь',     '六', 'Атэми — вспомогательные удары.',            FALSE, 6),
  ('jul', 'Июль',     '七', 'Техники с оружием. Введение в дзё.',        FALSE, 7),
  ('aug', 'Август',   '八', 'Работа с вооружённым партнёром.',            FALSE, 8),
  ('sep', 'Сентябрь', '九', 'Подготовка к аттестации.',                  FALSE, 9),
  ('oct', 'Октябрь',  '十', 'Оё — прикладные техники.',                  FALSE, 10),
  ('nov', 'Ноябрь', '十一', 'Рандори — свободная практика.',             FALSE, 11),
  ('dec', 'Декабрь','十二', 'Итоги года.',                                FALSE, 12);


-- ─────────────────────────────────────────
-- Уроки месяца
-- ─────────────────────────────────────────
CREATE TABLE lessons (
  id          TEXT PRIMARY KEY,           -- 'jan-1', 'feb-3' и т.д.
  month_id    TEXT REFERENCES months(id),
  num         INTEGER NOT NULL,
  title       TEXT NOT NULL,
  subtitle    TEXT,
  text        TEXT,
  duration    TEXT,                        -- '18:40'
  video_url   TEXT,                        -- YouTube URL или Supabase Storage URL
  sort_order  INTEGER,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);


-- ─────────────────────────────────────────
-- Прогресс просмотра уроков
-- ─────────────────────────────────────────
CREATE TABLE lesson_progress (
  id          SERIAL PRIMARY KEY,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id   TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  watched     BOOLEAN DEFAULT FALSE,
  watched_at  TIMESTAMPTZ,
  UNIQUE(user_id, lesson_id)
);


-- ─────────────────────────────────────────
-- Техники Иккаджо
-- ─────────────────────────────────────────
CREATE TABLE techniques (
  id            TEXT PRIMARY KEY,       -- 'Ippondori', 'Kurumadaoshi' и т.д.
  name_ru       TEXT NOT NULL,
  kyu           TEXT NOT NULL,
  section       TEXT NOT NULL,          -- 'Tachiai', 'Idori' и т.д.
  description   TEXT,
  principles    TEXT[],                 -- массив строк
  sensei_quote  TEXT,
  sort_order    INTEGER
);

-- Ошибки хранятся отдельно (у каждой заголовок + описание)
CREATE TABLE technique_mistakes (
  id            SERIAL PRIMARY KEY,
  technique_id  TEXT REFERENCES techniques(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  sort_order    INTEGER
);

-- Видео техники
CREATE TABLE technique_videos (
  id            TEXT PRIMARY KEY,
  technique_id  TEXT REFERENCES techniques(id) ON DELETE CASCADE,
  category      TEXT NOT NULL CHECK (category IN ('overview','details','mistakes','variations')),
  title         TEXT NOT NULL,
  duration      TEXT,
  video_url     TEXT,
  sort_order    INTEGER
);


-- ─────────────────────────────────────────
-- Комментарии
-- ─────────────────────────────────────────
CREATE TABLE comments (
  id          SERIAL PRIMARY KEY,
  lesson_id   TEXT REFERENCES lessons(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

