'use client';

import { useState } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { useMonths, useLessons, useUserAccessRows } from '@/lib/db';
import { hasMonthAccess } from '@/lib/access';

export default function MonthPage({ nav, monthId, watched, toggleWatched }) {
  const isMobile = useIsMobile();
  const { months } = useMonths();
  const { lessons } = useLessons(monthId);
  const { rows: userAccess, loading: accessLoading } = useUserAccessRows();

  const month = months.find(m => m.id === monthId);

  // Access gate — защита на уровне страницы, не только кнопки
  const canView = hasMonthAccess(userAccess, monthId);
  console.log(`[MonthPage] monthId=${monthId} canView=${canView} userAccess=`, userAccess);
  const safelessons  = lessons ?? [];
  const watchedCount = safelessons.filter(l => watched[l.id]).length;
  const progress     = safelessons.length ? Math.round((watchedCount / safelessons.length) * 100) : 0;

  if (!accessLoading && !canView) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center', background: '#faf8f4', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 32 }}>🔒</div>
        <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 20, color: '#c8a84a' }}>Нет доступа к этому месяцу</div>
        <div style={{ fontSize: 13, color: '#999', maxWidth: 320 }}>Приобретите доступ к разделу «{month?.label}» в личном кабинете.</div>
        <button onClick={nav.dashboard}
          style={{ marginTop: 8, padding: '10px 24px', background: '#1a1a1a', color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}>
          ← Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="fade" style={{ minHeight: '100vh', background: '#f0ebe0' }}>

      {/* ── Мобильный sticky хедер ── */}
      {isMobile && (
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
          background: '#0a0807', borderBottom: '1px solid #1f1a16',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#b8923a', padding: '0 4px', display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44 }}>‹</button>
          <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ede5d3', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {month?.label} 2026
          </span>
          {progress === 100 && <span style={{ fontSize: 11, color: '#6d9e7a' }}>✓</span>}
        </header>
      )}

    <div style={{ padding: isMobile ? '16px 16px 40px' : '32px 40px', maxWidth: 1100, margin: '0 auto' }}>

      {/* Десктопный breadcrumb */}
      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, fontSize: 11, flexWrap: 'wrap' }}>
          <button onClick={nav.dashboard} style={{ background: 'none', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, letterSpacing: '0.1em', color: '#9a8860', cursor: 'pointer', padding: '4px 0', minHeight: 44, display: 'flex', alignItems: 'center' }}>← Месяцы</button>
          <span style={{ color: '#d2c7b0' }}>/</span>
          <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#6f6452', letterSpacing: '0.06em' }}>{month?.label} 2026</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 14 : 32, marginBottom: isMobile ? 24 : 36, paddingBottom: isMobile ? 20 : 32, borderBottom: '1px solid #d2c7b0', flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: isMobile ? 64 : 100, color: '#d8cdb8', lineHeight: 1, flexShrink: 0, marginTop: -4, fontWeight: 300 }}>{month?.kanji}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: '#9a8860', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 10 }}>Учебный модуль · 2026</div>
          <h1 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 28 : 38, letterSpacing: '0.03em', color: '#15120e', marginBottom: 10, lineHeight: 1.1 }}>{month?.label}</h1>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 15 : 16, color: '#6f6452', lineHeight: 1.75, maxWidth: 520, marginBottom: 22 }}>{month?.description || month?.desc}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, maxWidth: 340, minWidth: 180 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
                <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: '#9a8860', letterSpacing: '0.1em' }}>Прогресс</span>
                <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: progress === 100 ? '#4d6a4a' : '#b73828', fontWeight: 600, letterSpacing: '0.1em' }}>
                  {watchedCount} / {safelessons.length} уроков
                </span>
              </div>
              <div style={{ height: 2, background: '#d8cdb8' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: progress === 100 ? '#4d6a4a' : '#b73828', transition: 'width 0.4s ease' }} />
              </div>
            </div>
            {progress === 100 && (
              <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 10, color: '#4d6a4a', border: '1px solid #4d6a4a', padding: '3px 10px', letterSpacing: '0.1em' }}>✓ Месяц завершён</span>
            )}
          </div>
        </div>
      </div>

      {/* Lessons grid */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2, background: '#d2c7b0' }}>
        {safelessons.map((lesson, i) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            index={i}
            isMobile={isMobile}
            watched={!!watched[lesson.id]}
            onOpen={() => nav.lesson(monthId, lesson.id)}
            onToggleWatched={e => { e.stopPropagation(); toggleWatched(lesson.id); }}
          />
        ))}
      </div>
    </div>
    </div>
  );
}

function LessonCard({ lesson, watched, onOpen, onToggleWatched, isMobile }) {
  const [active, setActive] = useState(false);
  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => !isMobile && setActive(true)}
      onMouseLeave={() => !isMobile && setActive(false)}
      onTouchStart={() => setActive(true)}
      onTouchEnd={() => setActive(false)}
      style={{ background: watched ? '#fdfbf4' : '#faf5e8', cursor: 'pointer', transition: 'background 0.12s', padding: isMobile ? '14px' : '20px 20px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 11 : 9, letterSpacing: '0.2em', color: '#b0a080', fontWeight: 600 }}>
            {String(lesson.num).padStart(2, '0')}
          </span>
          <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 11 : 9, color: '#9a8860', background: '#e8e0cc', padding: '2px 7px', letterSpacing: '0.06em' }}>{lesson.duration}</span>
        </div>
        <button onClick={onToggleWatched}
          title={watched ? 'Снять отметку' : 'Отметить просмотренным'}
          style={{ width: 32, height: 32, border: `1.5px solid ${watched ? '#4d6a4a' : '#d2c7b0'}`, background: watched ? '#4d6a4a' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0, WebkitTapHighlightColor: 'transparent', minHeight: 44, minWidth: 44, margin: '-6px' }}>
          {watched && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
        </button>
      </div>
      {/* Thumbnail */}
      <div style={{ height: isMobile ? 90 : 118, background: active ? '#1a1612' : '#13110e', marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'background 0.15s' }}>
        <div style={{ width: 40, height: 40, border: `1.5px solid ${active ? '#b73828' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: active ? 'scale(1.08)' : 'scale(1)', transition: 'all 0.2s', background: active ? 'rgba(183,56,40,0.15)' : 'transparent' }}>
          <span style={{ color: active ? '#b73828' : 'rgba(255,255,255,0.5)', fontSize: 13, marginLeft: 3 }}>▶</span>
        </div>
        {watched && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(77,106,74,0.9)', padding: '2px 7px', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: '#fff', letterSpacing: '0.1em' }}>ПРОСМОТРЕНО</div>
        )}
        <div style={{ position: 'absolute', bottom: 8, right: 10, fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.06em' }}>{lesson.duration}</div>
      </div>
      <div style={{ marginBottom: 4 }}>
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 15 : 14, fontWeight: 500, color: '#15120e', marginBottom: 5, lineHeight: 1.35 }}>{lesson.title}</div>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 13 : 12, color: '#9a8860', marginBottom: 8 }}>{lesson.subtitle}</div>
        {!isMobile && (
          <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 12, color: '#7a6e5a', lineHeight: 1.65, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {lesson.text}
          </div>
        )}
      </div>
      <div style={{ marginTop: isMobile ? 10 : 14 }}>
        <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 12 : 11, letterSpacing: '0.1em', color: active ? '#b73828' : '#b0a080', transition: 'color 0.15s' }}>Открыть урок →</span>
      </div>
    </div>
  );
}
