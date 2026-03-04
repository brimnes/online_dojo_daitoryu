-- ============================================================
-- 004_payments.sql
-- RPC grant_access + RLS для user_access
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- RPC: grant_access
-- Вызывается из webhook и /api/admin/grant-access
-- SECURITY DEFINER — выполняется с правами владельца,
-- обходит RLS для upsert (webhook не имеет auth.uid())
-- SET search_path = public — защита от подмены
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.grant_access(
  p_user_id   uuid,
  p_type      text,
  p_reference text,
  p_amount    numeric DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_access (user_id, type, reference, amount, paid_at)
  VALUES (p_user_id, p_type, p_reference, p_amount, now())
  ON CONFLICT (user_id, type, reference)
  DO UPDATE SET
    amount  = EXCLUDED.amount,
    paid_at = EXCLUDED.paid_at;
END;
$$;

-- Разрешаем вызов только authenticated и service role
REVOKE ALL ON FUNCTION public.grant_access FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_access TO authenticated;
-- service role имеет доступ по умолчанию

-- ────────────────────────────────────────────────────────────
-- RLS: user_access
-- SELECT: свои записи | admin видит все
-- INSERT/UPDATE/DELETE: только через grant_access (SECURITY DEFINER)
--   или admin напрямую
-- ────────────────────────────────────────────────────────────
ALTER TABLE public.user_access ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_access_own"    ON public.user_access;
DROP POLICY IF EXISTS "user_access_admin"  ON public.user_access;
DROP POLICY IF EXISTS "user_access_select_own"   ON public.user_access;
DROP POLICY IF EXISTS "user_access_select_admin" ON public.user_access;
DROP POLICY IF EXISTS "user_access_admin_all"    ON public.user_access;

-- Ученик видит только свои записи
CREATE POLICY "user_access_select_own" ON public.user_access
  FOR SELECT
  USING (user_id = auth.uid());

-- Admin видит все
CREATE POLICY "user_access_select_admin" ON public.user_access
  FOR SELECT
  USING (public.is_admin());

-- Admin может делать всё (ручная выдача/отзыв напрямую через AdminPanel)
CREATE POLICY "user_access_admin_all" ON public.user_access
  FOR ALL
  USING  (public.is_admin())
  WITH CHECK (public.is_admin());

-- ────────────────────────────────────────────────────────────
-- UNIQUE constraint (если не создан в 001_schema.sql)
-- ────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_access_user_id_type_reference_key'
  ) THEN
    ALTER TABLE public.user_access
      ADD CONSTRAINT user_access_user_id_type_reference_key
      UNIQUE (user_id, type, reference);
  END IF;
END;
$$;
