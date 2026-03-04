/**
 * scripts/seed.js  — v4 (финальный)
 *
 * Запуск:
 *   node --env-file=.env.local scripts/seed.js
 */

import { createClient } from '@supabase/supabase-js';

// ─── Client ───────────────────────────────────────────────────
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Нет NEXT_PUBLIC_SUPABASE_URL или NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(url, key);

// ─── Данные ───────────────────────────────────────────────────
const { MONTHS, MONTH_LESSONS }                          = await import('../src/data/months.js');
const { KYU_DATA, TECHNIQUE_CONTENT, TECHNIQUE_VIDEOS }  = await import('../src/data/techniques.js');

// ─── Утилиты ──────────────────────────────────────────────────

/** Дедупликация по id: Map гарантирует что каждый id встречается ровно один раз */
function uniqById(rows) {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.id)) map.set(r.id, r);
  }
  return [...map.values()];
}

/** upsert батчами по 50 строк — батч не может содержать дубли по onConflict-колонке */
async function upsertBatched(table, rows, label, conflictCol = 'id') {
  if (!rows.length) {
    console.log(`  -  ${label}: нет данных`);
    return 0;
  }
  const BATCH = 50;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from(table)
      .upsert(batch, { onConflict: conflictCol });
    if (error) {
      console.error(`  X  ${label}:`, error.message);
      return inserted;
    }
    inserted += batch.length;
  }
  console.log(`  v  ${label}: ${inserted} записей`);
  return inserted;
}

// ─────────────────────────────────────────────────────────────
// 1. LESSONS
// ─────────────────────────────────────────────────────────────
function buildLessons() {
  const rows = [];
  for (const month of MONTHS) {
    for (const [idx, l] of (MONTH_LESSONS[month.id] || []).entries()) {
      rows.push({
        id:        l.id,
        month_id:  month.id,
        num:       l.num      ?? idx + 1,
        title:     l.title    || '',
        subtitle:  l.subtitle || '',
        duration:  l.duration || '',
        video_url: l.videoUrl || '',
        text:      l.text     || '',
      });
    }
  }
  return uniqById(rows);
}

// ─────────────────────────────────────────────────────────────
// 2. TECHNIQUES
//
// Каждая техника (Ippondori, Shihonage...) встречается в KYU_DATA
// много раз — в разных уровнях кю и разных секциях.
// id = tech.name, поэтому в одном upsert-батче не должно быть
// двух строк с одинаковым tech.name.
//
// Решение: Map по tech.name — первое вхождение побеждает.
// ─────────────────────────────────────────────────────────────
function buildTechniques() {
  const map = new Map();   // tech.name -> row
  let sortOrder = 0;

  for (const kyu of KYU_DATA) {
    for (const section of kyu.sections) {
      for (const tech of section.techniques) {
        if (map.has(tech.name)) continue;  // уже есть — пропускаем

        const content = TECHNIQUE_CONTENT[tech.name] || {};
        map.set(tech.name, {
          id:           tech.name,          // строковый PK, стабилен
          name_ru:      tech.nameRu || tech.name,
          kyu:          kyu.id,             // уровень первого появления
          section:      section.name,
          section_ru:   section.nameRu || section.name,
          description:  content.description || '',
          principles:   content.principles  || [],
          sensei_quote: content.senseiQuote || '',
          sort_order:   sortOrder++,
        });
      }
    }
  }

  const rows = [...map.values()];
  console.log(`     Техник в данных: ${rows.length} уникальных`);
  return rows;
}

// ─────────────────────────────────────────────────────────────
// 3. TECHNIQUE_VIDEOS
//
// FK technique_id -> techniques.id:
// вставляем ТОЛЬКО видео для техник из validTechIds.
// ─────────────────────────────────────────────────────────────
function buildTechniqueVideos(validTechIds) {
  const rows = [];
  for (const [techName, videos] of Object.entries(TECHNIQUE_VIDEOS)) {
    if (!validTechIds.has(techName)) continue;
    for (const [idx, v] of videos.entries()) {
      rows.push({
        id:           v.id,
        technique_id: techName,
        title:        v.title    || '',
        duration:     v.duration || '',
        category:     v.category || 'overview',
        video_url:    v.videoUrl || '',
        sort_order:   idx,
      });
    }
  }
  return uniqById(rows);
}

// ─────────────────────────────────────────────────────────────
// 4. TECHNIQUE_MISTAKES
//
// id в таблице — SERIAL integer, НЕ передаём его вообще.
// Идемпотентность: DELETE по technique_id, затем INSERT.
// ─────────────────────────────────────────────────────────────
function buildTechniqueMistakes(validTechIds) {
  const rows = [];
  for (const [techName, content] of Object.entries(TECHNIQUE_CONTENT)) {
    if (!validTechIds.has(techName)) continue;
    for (const [idx, m] of (content.mistakes || []).entries()) {
      rows.push({
        // id отсутствует намеренно — SERIAL генерирует сам
        technique_id: techName,
        title:        m.title || '',
        description:  m.desc  || '',
        sort_order:   idx,
      });
    }
  }
  return rows;
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function seed() {
  console.log('\nSeed v4 — начало заливки\n');
  let total = 0;

  // 1. Lessons
  console.log('Уроки:');
  total += await upsertBatched('lessons', buildLessons(), 'lessons');

  // 2. Techniques
  console.log('\nТехники:');
  const techniques   = buildTechniques();
  const techInserted = await upsertBatched('techniques', techniques, 'techniques');
  total += techInserted;

  if (techInserted === 0) {
    console.error('\nТехники не залиты — прерываем (videos и mistakes требуют FK)');
    process.exit(1);
  }

  const validTechIds = new Set(techniques.map(t => t.id));

  // 3. Videos (только после успешного upsert techniques)
  console.log('\nВидео:');
  const videos = buildTechniqueVideos(validTechIds);
  total += await upsertBatched('technique_videos', videos, 'technique_videos');

  // 4. Mistakes — DELETE + INSERT (идемпотентно)
  console.log('\nОшибки техник:');
  const mistakes = buildTechniqueMistakes(validTechIds);

  if (!mistakes.length) {
    console.log('  -  mistakes: нет данных');
  } else {
    const techIdsList = [...validTechIds];
    const { error: delErr } = await supabase
      .from('technique_mistakes')
      .delete()
      .in('technique_id', techIdsList);

    if (delErr) {
      console.error('  X  DELETE technique_mistakes:', delErr.message);
    } else {
      // Insert батчами
      const BATCH = 50;
      let mInserted = 0;
      let mFailed = false;
      for (let i = 0; i < mistakes.length; i += BATCH) {
        const { error: insErr } = await supabase
          .from('technique_mistakes')
          .insert(mistakes.slice(i, i + BATCH));
        if (insErr) {
          console.error('  X  INSERT technique_mistakes:', insErr.message);
          mFailed = true;
          break;
        }
        mInserted += mistakes.slice(i, i + BATCH).length;
      }
      if (!mFailed) {
        console.log(`  v  technique_mistakes: ${mInserted} записей`);
        total += mInserted;
      }
    }
  }

  console.log(`\nГотово. Всего залито: ${total}\n`);
}

seed().catch(err => {
  console.error('\nОшибка:', err.message);
  process.exit(1);
});
