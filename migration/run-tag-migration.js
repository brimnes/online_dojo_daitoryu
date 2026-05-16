/**
 * Добавляет колонку tag в knowledge_items
 * Запуск из корня проекта: node migration/run-tag-migration.js
 */

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
  console.log('Подключаемся к базе…');

  await prisma.$executeRaw`
    ALTER TABLE knowledge_items
      ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT NULL
  `;
  console.log('✓ Колонка tag добавлена');

  await prisma.$executeRaw`
    CREATE INDEX IF NOT EXISTS idx_knowledge_items_tag
      ON knowledge_items (tag)
  `;
  console.log('✓ Индекс создан');

  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'knowledge_items'
    ORDER BY ordinal_position
  `;
  console.log('\nСхема knowledge_items:');
  cols.forEach(r => console.log(`  ${r.column_name.padEnd(20)} ${r.data_type}`));

  console.log('\n✅ Готово');
}

migrate()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
