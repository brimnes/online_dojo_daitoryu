-- ─────────────────────────────────────────────────────────────
-- 003_kinescope.sql
-- Добавляет поля Kinescope к lessons и technique_videos.
-- Запустить в Supabase → SQL Editor.
-- Существующие данные не затрагиваются.
-- ─────────────────────────────────────────────────────────────

-- lessons: добавляем поля Kinescope (video_url остаётся для совместимости)
ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS video_provider   TEXT DEFAULT 'kinescope',
  ADD COLUMN IF NOT EXISTS video_id         TEXT,
  ADD COLUMN IF NOT EXISTS video_status     TEXT DEFAULT 'none'
    CHECK (video_status IN ('none','uploading','processing','ready','error')),
  ADD COLUMN IF NOT EXISTS video_poster_url TEXT,
  ADD COLUMN IF NOT EXISTS video_duration   TEXT;

-- technique_videos: те же поля
ALTER TABLE technique_videos
  ADD COLUMN IF NOT EXISTS video_provider   TEXT DEFAULT 'kinescope',
  ADD COLUMN IF NOT EXISTS video_id         TEXT,
  ADD COLUMN IF NOT EXISTS video_status     TEXT DEFAULT 'none'
    CHECK (video_status IN ('none','uploading','processing','ready','error')),
  ADD COLUMN IF NOT EXISTS video_poster_url TEXT;

-- Индексы для быстрого поиска по video_id (используется в webhook)
CREATE INDEX IF NOT EXISTS idx_lessons_video_id         ON lessons (video_id);
CREATE INDEX IF NOT EXISTS idx_tech_videos_video_id     ON technique_videos (video_id);
