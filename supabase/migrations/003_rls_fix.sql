-- ============================================================
-- 003_rls_fix.sql
-- RLS для всех таблиц проекта.
-- SELECT: только authenticated (не anonymous).
-- UPDATE/INSERT/DELETE: только role='admin' из таблицы profiles.
-- Без service_role key в браузере.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Хелпер is_admin()
-- SECURITY DEFINER: выполняется с правами владельца функции,
-- поэтому может читать profiles даже до того как RLS применится.
-- SET search_path = public: защита от подмены search_path.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM   public.profiles
    WHERE  id   = auth.uid()
    AND    role = 'admin'
  );
$$;

-- Убеждаемся, что функцию может вызывать anon-роль
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;


-- ============================================================
-- months
-- SELECT authenticated, UPDATE admin
-- ============================================================
ALTER TABLE public.months ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "months_select_auth"   ON public.months;
DROP POLICY IF EXISTS "months_admin_update"  ON public.months;
-- удаляем старые политики с "true" если были
DROP POLICY IF EXISTS "months_select_all"    ON public.months;

CREATE POLICY "months_select_auth" ON public.months
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "months_admin_update" ON public.months
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- lessons
-- SELECT authenticated, INSERT/UPDATE/DELETE admin
-- ============================================================
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lessons_select_auth"   ON public.lessons;
DROP POLICY IF EXISTS "lessons_admin_insert"  ON public.lessons;
DROP POLICY IF EXISTS "lessons_admin_update"  ON public.lessons;
DROP POLICY IF EXISTS "lessons_admin_delete"  ON public.lessons;
DROP POLICY IF EXISTS "lessons_select_all"    ON public.lessons;

CREATE POLICY "lessons_select_auth" ON public.lessons
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "lessons_admin_insert" ON public.lessons
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "lessons_admin_update" ON public.lessons
  FOR UPDATE
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "lessons_admin_delete" ON public.lessons
  FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- techniques
-- SELECT authenticated, UPDATE admin
-- ============================================================
ALTER TABLE public.techniques ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "techniques_select_auth"   ON public.techniques;
DROP POLICY IF EXISTS "techniques_admin_update"  ON public.techniques;
DROP POLICY IF EXISTS "techniques_select_all"    ON public.techniques;

CREATE POLICY "techniques_select_auth" ON public.techniques
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "techniques_admin_update" ON public.techniques
  FOR UPDATE
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- technique_videos
-- SELECT authenticated, INSERT/UPDATE/DELETE admin
-- ============================================================
ALTER TABLE public.technique_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tech_videos_select_auth"   ON public.technique_videos;
DROP POLICY IF EXISTS "tech_videos_admin_insert"  ON public.technique_videos;
DROP POLICY IF EXISTS "tech_videos_admin_update"  ON public.technique_videos;
DROP POLICY IF EXISTS "tech_videos_admin_delete"  ON public.technique_videos;
DROP POLICY IF EXISTS "tech_videos_select_all"    ON public.technique_videos;

CREATE POLICY "tech_videos_select_auth" ON public.technique_videos
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "tech_videos_admin_insert" ON public.technique_videos
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "tech_videos_admin_update" ON public.technique_videos
  FOR UPDATE
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "tech_videos_admin_delete" ON public.technique_videos
  FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- technique_mistakes
-- SELECT authenticated, INSERT/DELETE admin
-- (UPDATE не нужен — удаляем и вставляем заново через saveMistakes)
-- ============================================================
ALTER TABLE public.technique_mistakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tech_mistakes_select_auth"   ON public.technique_mistakes;
DROP POLICY IF EXISTS "tech_mistakes_admin_insert"  ON public.technique_mistakes;
DROP POLICY IF EXISTS "tech_mistakes_admin_delete"  ON public.technique_mistakes;
DROP POLICY IF EXISTS "tech_mistakes_select_all"    ON public.technique_mistakes;

CREATE POLICY "tech_mistakes_select_auth" ON public.technique_mistakes
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "tech_mistakes_admin_insert" ON public.technique_mistakes
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "tech_mistakes_admin_delete" ON public.technique_mistakes
  FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- profiles
-- SELECT: своя строка | admin видит все
-- UPDATE: своя строка | admin
-- INSERT: сам себя (при регистрации через trigger или вручную)
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"    ON public.profiles;
DROP POLICY IF EXISTS "profiles_admin_update"  ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own"    ON public.profiles;

-- Каждый видит только себя
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (id = auth.uid());

-- Admin видит всех (нужно для AdminPanel → список учеников)
CREATE POLICY "profiles_select_admin" ON public.profiles
  FOR SELECT
  USING (public.is_admin());

-- Каждый обновляет только себя
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING    (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Admin обновляет любого (смена уровня, роли, статуса)
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- INSERT для регистрации (trigger handle_new_user или клиент)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (id = auth.uid());


-- ============================================================
-- comments
-- SELECT authenticated, INSERT своё, DELETE admin
-- ============================================================
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_auth"    ON public.comments;
DROP POLICY IF EXISTS "comments_insert_own"     ON public.comments;
DROP POLICY IF EXISTS "comments_admin_delete"   ON public.comments;
DROP POLICY IF EXISTS "comments_select_all"     ON public.comments;

CREATE POLICY "comments_select_auth" ON public.comments
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "comments_admin_delete" ON public.comments
  FOR DELETE
  USING (public.is_admin());


-- ============================================================
-- exams
-- SELECT: своё | admin; INSERT: своё | admin; UPDATE: admin
-- ============================================================
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "exams_select_own"    ON public.exams;
DROP POLICY IF EXISTS "exams_select_admin"  ON public.exams;
DROP POLICY IF EXISTS "exams_insert_own"    ON public.exams;
DROP POLICY IF EXISTS "exams_admin_update"  ON public.exams;
DROP POLICY IF EXISTS "exams_admin_insert"  ON public.exams;

CREATE POLICY "exams_select_own" ON public.exams
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "exams_select_admin" ON public.exams
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "exams_insert_own" ON public.exams
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admin может вставлять экзамен от имени ученика (ручное внесение)
CREATE POLICY "exams_admin_insert" ON public.exams
  FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "exams_admin_update" ON public.exams
  FOR UPDATE
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- user_access
-- SELECT: своё | admin; ALL: admin
-- ============================================================
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_access_own"    ON public.user_access;
DROP POLICY IF EXISTS "user_access_admin"  ON public.user_access;

-- Ученик видит свои оплаты
CREATE POLICY "user_access_own" ON public.user_access
  FOR SELECT
  USING (user_id = auth.uid());

-- Admin делает всё
CREATE POLICY "user_access_admin" ON public.user_access
  FOR ALL
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());
