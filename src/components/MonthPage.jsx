'use client';

import { useState } from 'react';
import { C } from '@/lib/utils';
import { MONTHS, MONTH_LESSONS } from '@/data/months';

export default function MonthPage({ nav, monthId, watched, toggleWatched }) {
  const month   = MONTHS.find(m => m.id === monthId);
  const lessons = MONTH_LESSONS[monthId] || [];
  const watchedCount = lessons.filter(l => watched[l.id]).length;
  const progress     = lessons.length ? Math.round((watchedCount / lessons.length) * 100) : 0;

  return (
    <div className="fade" style={{ padding: '32px 40px', maxWidth: 1100, margin: '0 auto' }}>
      {/* Хлебные крошки */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, fontSize: 12 }}>
        <button onClick={nav.dashboard} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: 0 }}>← Месяцы</button>
        <span style={{ color: '#ddd' }}>/</span>
        <span style={{ color: C.dark }}>{month?.label} 2026</span>
      </div>

      {/* Шапка */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28, marginBottom: 32, paddingBottom: 28, borderBottom: `2px solid ${C.border}` }}>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 88, color: '#ece7de', lineHeight: 1, flexShrink: 0, marginTop: -8 }}>{month?.kanji}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: '#b0a080', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Учебный модуль · 2026</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, fontWeight: 600, color: C.dark, marginBottom: 8 }}>{month?.label}</h1>
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.7, maxWidth: 500, marginBottom: 20 }}>{month?.desc}</p>

          {/* Прогресс-бар */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ flex: 1, maxWidth: 320 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.muted }}>Прогресс</span>
                <span style={{ fontSize: 11, color: progress === 100 ? '#3a8a5a' : C.gold, fontWeight: 600 }}>
                  {watchedCount} из {lessons.length} уроков
                </span>
              </div>
              <div style={{ height: 3, background: '#e8e0d0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#3a8a5a' : C.gold, transition: 'width 0.4s ease', borderRadius: 2 }} />
              </div>
            </div>
            {progress === 100 && (
              <span style={{ fontSize: 11, color: '#3a8a5a', background: '#f0faf4', border: '1px solid #b8e0c8', padding: '3px 10px' }}>✓ Месяц завершён</span>
            )}
          </div>
        </div>
      </div>

      {/* Сетка уроков */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2, background: C.border }}>
        {lessons.map((lesson, i) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            index={i}
            watched={!!watched[lesson.id]}
            onOpen={() => nav.lesson(monthId, lesson.id)}
            onToggleWatched={e => { e.stopPropagation(); toggleWatched(lesson.id); }}
          />
        ))}
      </div>
    </div>
  );
}

function LessonCard({ lesson, watched, onOpen, onToggleWatched }) {
  const [hover, setHover] = useState(false);

  return (
    <div onClick={onOpen}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ background: watched ? '#fdfcf8' : '#fff', cursor: 'pointer', transition: 'background 0.12s', padding: '20px 20px 16px' }}>

      {/* Номер + чекбокс */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: '#ddd', fontWeight: 600, minWidth: 22 }}>
            {String(lesson.num).padStart(2, '0')}
          </span>
          <span style={{ fontSize: 10, color: C.muted, background: '#f0ede8', padding: '2px 7px', letterSpacing: 0.5 }}>{lesson.duration}</span>
        </div>
        <button onClick={onToggleWatched}
          title={watched ? 'Снять отметку' : 'Отметить просмотренным'}
          style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${watched ? '#3a8a5a' : C.border}`, background: watched ? '#3a8a5a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0 }}>
          {watched && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
        </button>
      </div>

      {/* Превью видео */}
      <div style={{ height: 120, background: hover ? '#1a1a1a' : '#111', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'background 0.15s' }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: hover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.15s' }}>
          <span style={{ color: '#fff', fontSize: 12, marginLeft: 2 }}>▶</span>
        </div>
        {watched && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(58,138,90,0.85)', padding: '2px 7px', fontSize: 9, color: '#fff', letterSpacing: 0.5 }}>ПРОСМОТРЕНО</div>
        )}
        <div style={{ position: 'absolute', bottom: 8, right: 10, fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>{lesson.duration}</div>
      </div>

      {/* Текст */}
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: C.dark, marginBottom: 4, lineHeight: 1.3 }}>{lesson.title}</div>
        <div style={{ fontSize: 11, color: C.gold, letterSpacing: 0.3, marginBottom: 8 }}>{lesson.subtitle}</div>
        <div style={{ fontSize: 12, color: '#888', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {lesson.text}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <span style={{ fontSize: 11, color: hover ? C.gold : C.muted, transition: 'color 0.15s' }}>Открыть урок →</span>
      </div>
    </div>
  );
}
