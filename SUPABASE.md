# Supabase — Подключение и схема базы данных

## Что такое Supabase

Supabase — это open-source Backend-as-a-Service на PostgreSQL. Даёт из коробки:
- **База данных** PostgreSQL с REST API
- **Авторизация** — email, Google, Telegram и др.
- **Хранилище файлов** — для загрузки видео
- **Realtime** — обновления в браузере без перезагрузки
- **Бесплатный tier** — достаточен для старта (500 МБ БД, 1 ГБ Storage)

---

## 1. Создание проекта

1. Зайти на https://supabase.com и создать аккаунт
2. Нажать **New project**, дать название `online-dojo`
3. Выбрать регион **Central EU (Frankfurt)** — ближе к RU
4. Запомнить пароль от БД

---

## 2. Переменные окружения

Создать файл `.env.local` в корне проекта:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...   # только на сервере, не в браузере!
```

Значения берутся из: Supabase Dashboard → Settings → API

---

## 3. Установка пакетов

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## 4. Клиент Supabase

Создать файл `src/lib/supabase.js`:

```javascript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Серверный клиент (для API routes и Server Components)
export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}
```

---

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

---

## 6. Политики безопасности (RLS)

```sql
-- Включить RLS на всех таблицах
ALTER TABLE profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_access    ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams          ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments       ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свой профиль
CREATE POLICY "Own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

-- Админ видит всё
CREATE POLICY "Admin all" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Уроки и техники — видят все авторизованные
ALTER TABLE lessons       ENABLE ROW LEVEL SECURITY;
ALTER TABLE techniques    ENABLE ROW LEVEL SECURITY;
ALTER TABLE months        ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read" ON lessons    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON techniques FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated read" ON months     FOR SELECT USING (auth.role() = 'authenticated');

-- Редактировать уроки и техники — только admin/teacher
CREATE POLICY "Admin write lessons" ON lessons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin','teacher'))
  );
```

---

## 7. Как заменить mock-данные на реальные

### Пример: загрузка пользователей в AdminPanel

```javascript
// Было (mock):
const [users, setUsers] = useState(INIT_USERS);

// Стало (Supabase):
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';

const [users, setUsers] = useState([]);

useEffect(() => {
  supabase
    .from('profiles')
    .select('*')
    .then(({ data }) => setUsers(data || []));
}, []);
```

### Пример: сохранение уровня пользователя

```javascript
// Было (только state):
setUsers(prev => prev.map(u => u.id === selected ? {...u, level: editLevel} : u));

// Стало (state + Supabase):
const saveLevel = async () => {
  const { error } = await supabase
    .from('profiles')
    .update({ level: editLevel })
    .eq('id', selected);
  
  if (!error) {
    setUsers(prev => prev.map(u => u.id === selected ? {...u, level: editLevel} : u));
    showToast('Уровень обновлён');
  }
};
```

### Пример: сохранение видео урока

```javascript
const saveLesson = async () => {
  const { error } = await supabase
    .from('lessons')
    .update({
      title:    draft.title,
      subtitle: draft.subtitle,
      text:     draft.text,
      video_url: draft.videoUrl,
    })
    .eq('id', editLesson);
  
  if (!error) showToast('Урок сохранён');
};
```

---

## 8. Загрузка видео файлов на Supabase Storage

```javascript
// Создать bucket 'videos' в Supabase → Storage

const uploadVideo = async (file, lessonId) => {
  const ext  = file.name.split('.').pop();
  const path = `lessons/${lessonId}/video.${ext}`;
  
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(path, file, { upsert: true });
  
  if (error) throw error;
  
  // Получить публичный URL
  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(path);
  
  return publicUrl;
};
```

---

## 9. Авторизация

```javascript
// Регистрация (передаём все поля анкеты в metadata)
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      name:        userName,    // ФИО
      self_level:  selfLevel,   // уровень при регистрации ('none','6kyu',...)
      sensei_name: senseiName,  // имя сэнсэя (пусто = Копин)
      experience:  experience,  // свободный текст об опыте
    }
  }
});
// Триггер handle_new_user автоматически создаст запись в profiles со всеми полями

// Вход
const { error } = await supabase.auth.signInWithPassword({ email, password });

// Выход
await supabase.auth.signOut();

// Получить текущего пользователя
const { data: { user } } = await supabase.auth.getUser();

// Получить профиль с ролью
const { data: profile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', user.id)
  .single();

// Проверить доступ к админке
if (profile.role !== 'admin') redirect('/');
```

---

## 10. Защита роута /admin

Создать `src/app/admin/page.js`:

```javascript
import { createServerClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';

export default async function AdminPage() {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (profile?.role !== 'admin') redirect('/');
  
  return <AdminPanel />;
}
```

---

## Порядок подключения

1. Создать проект на supabase.com
2. Выполнить SQL из раздела 5 в SQL Editor
3. Добавить `.env.local` с ключами
4. `npm install @supabase/supabase-js @supabase/ssr`
5. Создать `src/lib/supabase.js`
6. Поочерёдно заменять mock-данные на запросы к Supabase (по примерам из раздела 7)
7. Настроить RLS политики (раздел 6)
8. Защитить роут /admin (раздел 10)
