/**
 * src/lib/adapters.js
 *
 * Серверные адаптеры — читают данные из Supabase и возвращают
 * структуру, ИДЕНТИЧНУЮ тому что раньше давали mock-данные.
 *
 * Можно вызывать:
 *   - из Server Components (Next.js 14 App Router)
 *   - из API-route handlers
 *   - из клиентских хуков через обёртку useServerData()
 *
 * НЕ содержат 'use client' — чистые async-функции.
 */

import { createClient } from '@supabase/supabase-js';

// Создаём клиент с anon key (не service role!) — RLS применяется
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// ─────────────────────────────────────────────────────────────
// getMonthsWithLessons()
//
// Возвращает:
// [
//   {
//     id: 'jan', label: 'Январь', kanji: '一', is_open: true,
//     sort_order: 1, description: '...',
//     lessons: [
//       { id: 'jan-1', month_id: 'jan', num: 1, title: '...', subtitle: '...',
//         text: '...', duration: '18:40', video_url: '' }
//     ]
//   },
//   ...
// ]
// ─────────────────────────────────────────────────────────────
export async function getMonthsWithLessons() {
  const sb = getSupabase();
  if (!sb) return FALLBACK_MONTHS_WITH_LESSONS;

  const [{ data: months }, { data: lessons }] = await Promise.all([
    sb.from('months').select('*').order('sort_order'),
    sb.from('lessons').select('*').order('month_id, num'),
  ]);

  const monthList = months || [];
  const lessonList = lessons || [];

  return monthList.map(m => ({
    ...m,
    lessons: lessonList.filter(l => l.month_id === m.id),
  }));
}

// ─────────────────────────────────────────────────────────────
// getIkkajoStructure()
//
// Возвращает Map: techName → { description, principles, sensei_quote, videos, mistakes }
// Используется в TechniquePage и IkkajoPage для получения контента.
//
// Структура kyu/sections/техники остаётся в KYU_DATA (статика),
// этот адаптер только добавляет контент к технике по имени.
// ─────────────────────────────────────────────────────────────
export async function getIkkajoStructure() {
  const sb = getSupabase();
  if (!sb) return { techMap: new Map(), videoCount: {} };

  const [{ data: techs }, { data: videos }, { data: mistakes }] = await Promise.all([
    sb.from('techniques').select('*').order('sort_order'),
    sb.from('technique_videos').select('*').order('sort_order'),
    sb.from('technique_mistakes').select('*').order('sort_order'),
  ]);

  const techList    = techs    || [];
  const videoList   = videos   || [];
  const mistakeList = mistakes || [];

  // techMap: techId → content object
  const techMap = new Map();
  techList.forEach(t => {
    const techVideos = videoList.filter(v => v.technique_id === t.id);
    const techMistakes = mistakeList.filter(m => m.technique_id === t.id);
    techMap.set(t.id, {
      id:          t.id,
      name_ru:     t.name_ru || '',
      kyu:         t.kyu     || '',
      section:     t.section || '',
      description: t.description   || '',
      principles:  Array.isArray(t.principles) ? t.principles : [],
      senseiQuote: t.sensei_quote   || '',
      mistakes:    techMistakes,
      videos: {
        overview:   techVideos.filter(v => v.category === 'overview'),
        details:    techVideos.filter(v => v.category === 'details'),
        mistakes:   techVideos.filter(v => v.category === 'mistakes'),
        variations: techVideos.filter(v => v.category === 'variations'),
      },
    });
  });

  // videoCount: techId → total video count (для счётчика в IkkajoPage)
  const videoCount = {};
  videoList.forEach(v => {
    videoCount[v.technique_id] = (videoCount[v.technique_id] || 0) + 1;
  });

  return { techMap, videoCount };
}

// ─────────────────────────────────────────────────────────────
// FALLBACK — если Supabase недоступен (local dev без .env)
// ─────────────────────────────────────────────────────────────
const FALLBACK_MONTHS_WITH_LESSONS = [
  { id:'jan', label:'Январь',   kanji:'一', is_open:true,  sort_order:1,  description:'Основы дистанции и базовые захваты.',        lessons:[] },
  { id:'feb', label:'Февраль',  kanji:'二', is_open:true,  sort_order:2,  description:'Укэми — техника падений.',                   lessons:[] },
  { id:'mar', label:'Март',     kanji:'三', is_open:true,  sort_order:3,  description:'Кихон — базовая техника.',                   lessons:[] },
  { id:'apr', label:'Апрель',   kanji:'四', is_open:false, sort_order:4,  description:'Ирими — вход.',                             lessons:[] },
  { id:'may', label:'Май',      kanji:'五', is_open:false, sort_order:5,  description:'Тэнкан — разворот.',                        lessons:[] },
  { id:'jun', label:'Июнь',     kanji:'六', is_open:false, sort_order:6,  description:'Атэми — вспомогательные удары.',            lessons:[] },
  { id:'jul', label:'Июль',     kanji:'七', is_open:false, sort_order:7,  description:'Работа с дзё.',                             lessons:[] },
  { id:'aug', label:'Август',   kanji:'八', is_open:false, sort_order:8,  description:'Работа с вооружённым партнёром.',           lessons:[] },
  { id:'sep', label:'Сентябрь', kanji:'九', is_open:false, sort_order:9,  description:'Подготовка к аттестации.',                  lessons:[] },
  { id:'oct', label:'Октябрь',  kanji:'十', is_open:false, sort_order:10, description:'Оё — прикладные техники.',                  lessons:[] },
  { id:'nov', label:'Ноябрь',  kanji:'十一',is_open:false, sort_order:11, description:'Рандори — свободная практика.',             lessons:[] },
  { id:'dec', label:'Декабрь', kanji:'十二',is_open:false, sort_order:12, description:'Итоги года.',                               lessons:[] },
];
