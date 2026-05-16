/**
 * Запуск: node migration/run-tag-migration.js
 * (из корня проекта, где лежит .env.local)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Загружаем .env.local вручную
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local не найден');
    process.exit(1);
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const m = line.match(/^([A-Z_]+)\s*=\s*"?([^"]+)"?/);
    if (m) process.env[m[1]] = m[2];
  }
}

loadEnv();

const { Client } = require('pg');

async function migrate() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('✓ Подключились к базе');

  await client.query(`
    ALTER TABLE knowledge_items
      ADD COLUMN IF NOT EXISTS tag TEXT DEFAULT NULL;
  `);
  console.log('✓ Колонка tag добавлена');

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_knowledge_items_tag
      ON knowledge_items (tag);
  `);
  console.log('✓ Индекс создан');

  const { rows } = await client.query(`
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'knowledge_items'
    ORDER BY ordinal_position;
  `);
  console.log('\nСхема knowledge_items:');
  rows.forEach(r => console.log(`  ${r.column_name.padEnd(20)} ${r.data_type}`));

  await client.end();
  console.log('\n✅ Миграция выполнена успешно');
}

migrate().catch(e => {
  console.error('❌ Ошибка:', e.message);
  process.exit(1);
});
