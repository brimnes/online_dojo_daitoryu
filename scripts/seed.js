import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseKey) { console.error('Нет env переменных'); process.exit(1); }
const supabase = createClient(supabaseUrl, supabaseKey);
const { MONTHS, MONTH_LESSONS } = await import('../src/data/months.js');
const { KYU_DATA, TECHNIQUE_CONTENT, TECHNIQUE_VIDEOS } = await import('../src/data/techniques.js');
function uniqByName(rows) { const m = new Map(); for (const r of rows) if (!m.has(r.id)) m.set(r.id, r); return [...m.values()]; }
async function ups(table, rows) {
  if (!rows.length) { console.log('  - ' + table + ': нет данных'); return 0; }
  const SZ = 50; let n = 0;
  for (let i = 0; i < rows.length; i += SZ) {
    const { error } = await supabase.from(table).upsert(rows.slice(i, i+SZ), { onConflict: 'id' });
    if (error) { console.error('  X ' + table + ':', error.message); return n; }
    n += rows.slice(i, i+SZ).length;
  }
  console.log('  v ' + table + ': ' + n); return n;
}
const lessons = [];
for (const mo of MONTHS) for (const [i,l] of (MONTH_LESSONS[mo.id]||[]).entries())
  lessons.push({ id:l.id, month_id:mo.id, num:l.num??i+1, title:l.title||'', subtitle:l.subtitle||'', duration:l.duration||'', video_url:l.videoUrl||'', text:l.text||'' });
const techMap = new Map(); let so = 0;
for (const kyu of KYU_DATA) for (const sec of kyu.sections) for (const t of sec.techniques) {
  if (techMap.has(t.name)) continue;
  const c = TECHNIQUE_CONTENT[t.name] || {};
  techMap.set(t.name, { id:t.name, name_ru:t.nameRu||t.name, kyu:kyu.id, section:sec.name, section_ru:sec.nameRu||sec.name, description:c.description||'', principles:c.principles||[], sensei_quote:c.senseiQuote||'', sort_order:so++ });
}
const techniques = [...techMap.values()];
const validIds = new Set(techniques.map(t=>t.id));
const videos = [];
for (const [tn, vs] of Object.entries(TECHNIQUE_VIDEOS)) {
  if (!validIds.has(tn)) continue;
  vs.forEach((v,i) => videos.push({ id:v.id, technique_id:tn, title:v.title||'', duration:v.duration||'', category:v.category||'overview', video_url:v.videoUrl||'', sort_order:i }));
}
const uniqVideos = uniqByName(videos);
const mistakes = [];
for (const [tn, c] of Object.entries(TECHNIQUE_CONTENT)) {
  if (!validIds.has(tn)) continue;
  (c.mistakes||[]).forEach((m,i) => mistakes.push({ technique_id:tn, title:m.title||'', description:m.desc||'', sort_order:i }));
}
console.log('Lessons:', lessons.length, '| Techniques:', techniques.length, '| Videos:', uniqVideos.length, '| Mistakes:', mistakes.length);
let total = 0;
console.log('\nLessons:'); total += await ups('lessons', uniqByName(lessons));
console.log('Techniques:'); total += await ups('techniques', techniques);
if (techniques.length > 0) {
  console.log('Videos:'); total += await ups('technique_videos', uniqVideos);
  console.log('Mistakes (delete+insert):');
  const { error: de } = await supabase.from('technique_mistakes').delete().in('technique_id', [...validIds]);
  if (de) { console.error('  X delete:', de.message); }
  else {
    const SZ = 50; let mn = 0;
    for (let i = 0; i < mistakes.length; i += SZ) {
      const { error: ie } = await supabase.from('technique_mistakes').insert(mistakes.slice(i, i+SZ));
      if (ie) { console.error('  X insert mistakes:', ie.message); break; }
      mn += mistakes.slice(i, i+SZ).length;
    }
    console.log('  v technique_mistakes:', mn); total += mn;
  }
}
console.log('\nГотово. Залито:', total);
