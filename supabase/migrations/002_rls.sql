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
