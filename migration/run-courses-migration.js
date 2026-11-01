/**
 * Создаёт таблицы courses / course_videos, стартовые курсы + продукты
 * и программу курса «Иккаджо Оё-вадза» (12 разделов).
 * SQL — supabase/migrations/012_courses.sql, 013_course_sections.sql (идемпотентны).
 * Запуск из корня проекта: node migration/run-courses-migration.js
 */

import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
  console.log('Подключаемся к базе…');

  const sql = ['012_courses.sql', '013_course_sections.sql']
    .map(f => readFileSync(new URL(`../supabase/migrations/${f}`, import.meta.url), 'utf8'))
    .join('\n');
  // Убираем комментарии и режем на отдельные statements (в файле нет ';' внутри строк)
  const statements = sql
    .split('\n').filter(l => !l.trim().startsWith('--')).join('\n')
    .split(';').map(s => s.trim()).filter(Boolean);

  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
    console.log('✓', stmt.split('\n')[0].slice(0, 70));
  }

  const courses = await prisma.$queryRaw`SELECT id, title, is_published FROM courses ORDER BY sort_order`;
  console.log('\nКурсы:');
  courses.forEach(c => console.log(`  ${c.id.padEnd(18)} ${c.title}${c.is_published ? '' : '  (не опубликован)'}`));

  console.log('\n✅ Готово');
}

migrate()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
