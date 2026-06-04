'use client';

import { useState } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { useMonths, useLessons, useUserAccessRows } from '@/lib/db';
import { hasMonthAccess } from '@/lib/access';
import Sidebar from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/BottomNav';

export default function MonthPage({ nav, monthId, watched, toggleWatched, user = {}, onLogout }) {
  const isMobile = useIsMobile();
  const { months, loading: monthsLoading } = useMonths();
  const { lessons } = useLessons(monthId);
  const { rows: userAccess, loading: accessLoading } = useUserAccessRows();

  const month       = months.find(m => m.id === monthId);
  const canView     = hasMonthAccess(userAccess, monthId);

  const safelessons  = lessons ?? [];
  const watchedCount = safelessons.filter(l => watched[l.id]).length;
  const progress     = safelessons.length ? Math.round((watchedCount / safelessons.length) * 100) : 0;

  // First unwatched lesson = "current"
  const currentLessonId = safelessons.find(l => !watched[l.id])?.id;

  // Month number from sort_order → "03"
  const monthNum = month?.sort_order ? String(month.sort_order).padStart(2, '0') : '––';

  // Subtitle for breadcrumb: first sentence of description
  const monthSub = (month?.description || '').split('.')[0]?.trim() || '';

  // ── Hidden month gate (янв–май скрыты из UI) ─────────────────────
  // Если месяц не вернулся из API (не в списке) и загрузка завершена — показать 404-экран
  if (!monthsLoading && !month) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center', background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 18, color: C.accent }}>Месяц недоступен</div>
        <div style={{ fontSize: 13, color: C.muted, maxWidth: 320 }}>Этот раздел временно недоступен.</div>
        <button onClick={nav.dashboard}
          style={{ marginTop: 8, padding: '10px 24px', background: C.ink, color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}>
          ← Вернуться на главную
        </button>
      </div>
    );
  }

  // ── Access gate ──────────────────────────────────────────────────
  if (!accessLoading && !canView) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center', background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontSize: 36 }}>🔒</div>
        <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 18, color: C.accent }}>Нет доступа к этому месяцу</div>
        <div style={{ fontSize: 13, color: C.muted, maxWidth: 320 }}>Приобретите доступ к разделу «{month?.label}» в личном кабинете.</div>
        <button onClick={nav.dashboard}
          style={{ marginTop: 8, padding: '10px 24px', background: C.ink, color: '#fff', border: 'none', fontSize: 13, cursor: 'pointer' }}>
          ← Вернуться на главную
        </button>
      </div>
    );
  }

  return (
    <div className="fade" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar (desktop only) ── */}
      {!isMobile && (
        <Sidebar activeTab="months" onTabClick={() => nav.dashboard()} user={user} onLogout={onLogout} />
      )}

      {/* ── Page content ── */}
      <div style={{ flex: 1, background: C.bg, minHeight: '100vh', paddingLeft: isMobile ? 0 : 260, minWidth: 0, overflowX: isMobile ? 'hidden' : 'visible' }}>

      {/* ── Mobile sticky header ── */}
      {isMobile && (
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: C.accent, padding: '0 4px', display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44 }}>‹</button>
          <span style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 15, letterSpacing: '0.12em', color: C.ink,
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            textTransform: 'uppercase',
          }}>
            {month?.label}{monthSub ? ` · ${monthSub.toUpperCase()}` : ''}
          </span>
        </header>
      )}

      {/* ── Desktop breadcrumb bar ── */}
      {!isMobile && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          padding: '20px 48px', borderBottom: `1px solid ${C.border}`, background: C.surface,
        }}>
          <button onClick={nav.back} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
            fontSize: 11, color: C.accent, letterSpacing: '0.1em',
            padding: '4px 0', minHeight: 44, display: 'flex', alignItems: 'center',
          }}>← МЕСЯЦЫ 2026</button>
          <span style={{ color: C.border }}>/</span>
          <span style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 13, color: C.ink, letterSpacing: '0.18em', fontWeight: 600,
          }}>
            {month?.label?.toUpperCase()}{monthSub ? ` · ${monthSub.toUpperCase()}` : ''}
          </span>
          <span style={{
            marginLeft: 'auto',
            fontFamily: "'Noto Serif JP', var(--font-noto), serif",
            fontSize: 13, color: C.muted, letterSpacing: '0.18em',
          }}>{month?.kanji}月</span>
        </div>
      )}

      <div className={isMobile ? 'page-has-bottom-nav' : ''} style={{ padding: isMobile ? '20px 18px 24px' : '48px 48px 60px', overflowX: isMobile ? 'hidden' : 'visible' }}>

        {/* ── Hero ── */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? 14 : 32, marginBottom: isMobile ? 12 : 24 }}>

          {/* Left block: kanji watermark + eyebrow + title + subtitle */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? 14 : 32, flex: 1, minWidth: 0, overflow: 'hidden' }}>
            {/* Large kanji watermark */}
            <span style={{
              fontFamily: "'Noto Serif JP', var(--font-noto), serif",
              fontSize: isMobile ? 72 : 160,
              lineHeight: 0.85,
              color: C.accent, opacity: isMobile ? 0.2 : 0.18,
              flexShrink: 0, userSelect: 'none', pointerEvents: 'none',
            }}>{month?.kanji}</span>

            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Eyebrow */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 10 : 12 }}>
                <span style={{
                  fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                  fontSize: 11, color: C.accent, letterSpacing: '0.06em', fontWeight: 600,
                }}>{monthNum} / 12</span>
                <span style={{ width: 1, height: 10, background: C.border, display: 'inline-block', flexShrink: 0 }} />
                <span style={{
                  fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                  fontSize: 11, color: C.muted, letterSpacing: '0.18em', textTransform: 'uppercase',
                }}>Учебный модуль{!isMobile ? ' · 2026' : ''}</span>
              </div>

              {/* Title */}
              <div style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: isMobile ? 48 : 64,
                letterSpacing: '0.04em', color: C.ink,
                lineHeight: 1, fontWeight: 400, marginTop: isMobile ? 8 : 12,
              }}>{month?.label}</div>

              {/* Subtitle — desktop only; mobile shows it separately below */}
              {!isMobile && (
                <div style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: 20,
                  color: C.muted, marginTop: 8,
                  maxWidth: 540, lineHeight: 1.55,
                }}>{month?.description}</div>
              )}
            </div>
          </div>

          {/* Right: progress box (desktop only) */}
          {!isMobile && (
            <div style={{ minWidth: 240, padding: '16px 20px', background: C.surface, border: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                fontSize: 11, color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 6,
              }}>прогресс месяца</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
                <span style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: 36, color: C.ink, letterSpacing: '0.04em',
                }}>{watchedCount}</span>
                <span style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: 18, color: C.muted,
                }}>из {safelessons.length}</span>
              </div>
              <div style={{ height: 2, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: C.accent, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          )}
        </div>

        {/* Mobile: subtitle + progress card */}
        {isMobile && (
          <>
            <div style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: 18, color: C.muted,
              marginBottom: 16, lineHeight: 1.55,
            }}>{month?.description}</div>
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '14px 16px', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{
                  fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                  fontSize: 11, color: C.muted, letterSpacing: '0.18em', textTransform: 'uppercase',
                }}>прогресс</span>
                <span style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: 18, color: C.accent, letterSpacing: '0.04em',
                }}>{watchedCount} / {safelessons.length}</span>
              </div>
              <div style={{ height: 2, background: C.border, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: C.accent, transition: 'width 0.4s ease' }} />
              </div>
            </div>
          </>
        )}

        {/* SumiStroke divider (desktop) */}
        {!isMobile && (
          <div style={{ margin: '0 0 36px' }}>
            <svg width="100%" height="20" viewBox="0 0 800 20" preserveAspectRatio="none">
              <defs>
                <linearGradient id="sumi-mp" x1="0" x2="1">
                  <stop offset="0%"   stopColor={C.ink2} stopOpacity="0"   />
                  <stop offset="5%"   stopColor={C.ink2} stopOpacity="0.4" />
                  <stop offset="60%"  stopColor={C.ink2} stopOpacity="0.8" />
                  <stop offset="95%"  stopColor={C.ink2} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={C.ink2} stopOpacity="0"   />
                </linearGradient>
              </defs>
              <path d="M8 14 C 80 4, 280 18, 440 10 S 720 16, 792 8"
                stroke="url(#sumi-mp)" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.3" />
            </svg>
          </div>
        )}

        {/* ── Lessons grid (desktop 3-col) / list (mobile) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
          gap: 1,
          background: C.border,
          minWidth: 0, overflow: 'hidden',
        }}>
          {safelessons.map((lesson) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              isMobile={isMobile}
              watched={!!watched[lesson.id]}
              isCurrent={lesson.id === currentLessonId}
              onOpen={() => nav.lesson(monthId, lesson.id)}
              onToggleWatched={e => { e.stopPropagation(); toggleWatched(lesson.id); }}
            />
          ))}
        </div>
      </div>
      </div>{/* end flex:1 content */}
      {isMobile && <MobileBottomNav nav={nav} active="months" isAdmin={user?.role === 'admin'} />}
    </div>
  );
}

// ── Lesson Card ───────────────────────────────────────────────────
function LessonCard({ lesson, watched, isCurrent, onOpen, onToggleWatched, isMobile }) {
  const [hover, setHover] = useState(false);

  // Kanji for video thumbnail: first 2 chars of subtitle before " · "
  const thumbKanji = (lesson.subtitle || '').split(' · ')[0]?.slice(0, 2) || '';

  // ── Mobile: horizontal row layout ────────────────────────────────
  if (isMobile) {
    return (
      <div
        onClick={onOpen}
        style={{
          background: C.surface, padding: '14px 14px',
          display: 'flex', gap: 12, alignItems: 'center', minHeight: 88,
          borderLeft: isCurrent ? `2px solid ${C.accent}` : '2px solid transparent',
          cursor: 'pointer', minWidth: 0, overflow: 'hidden',
        }}>
        {/* Number */}
        <span style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontSize: 24, letterSpacing: '0.04em', minWidth: 30,
          color: isCurrent ? C.accent : watched ? C.muted : C.ink2,
        }}>{String(lesson.num).padStart(2, '0')}</span>

        {/* Thumbnail */}
        <div style={{
          width: 90, height: 56, background: '#111', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {thumbKanji && (
            <span style={{
              position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: "'Noto Serif JP', var(--font-noto), serif",
              fontSize: 36, color: C.accent, opacity: 0.2, userSelect: 'none',
            }}>{thumbKanji}</span>
          )}
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1,
          }}>
            <span style={{ color: '#fff', fontSize: 11, marginLeft: 1 }}>▶</span>
          </div>
          {watched && (
            <div style={{ position: 'absolute', top: 4, right: 4, background: `${C.success}CC`, borderRadius: '50%', width: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: '#fff', fontSize: 11 }}>✓</span>
            </div>
          )}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 13, fontWeight: 500, color: C.ink, lineHeight: 1.35 }}>{lesson.title}</div>
          <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 17, color: C.accent, marginTop: 3, lineHeight: 1.3 }}>{lesson.subtitle}</div>
        </div>

        {/* Check circle */}
        <button
          onClick={onToggleWatched}
          style={{
            width: 36, height: 36, minWidth: 36, borderRadius: '50%', flexShrink: 0,
            border: `1px solid ${watched ? C.success : C.border}`,
            background: watched ? C.success : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s',
            WebkitTapHighlightColor: 'transparent',
          }}>
          {watched && <span style={{ color: '#fff', fontSize: 11 }}>✓</span>}
        </button>
      </div>
    );
  }

  // ── Desktop: full card layout ─────────────────────────────────────
  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: C.surface, padding: '20px 22px 18px',
        position: 'relative', cursor: 'pointer',
        borderTop: isCurrent ? `2px solid ${C.accent}` : 'none',
        marginTop: isCurrent ? -1 : 0,
        transition: 'background 0.12s',
      }}>

      {/* Header: number + duration + check circle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 24, letterSpacing: '0.04em',
            color: watched ? C.muted : isCurrent ? C.accent : C.ink2,
          }}>{String(lesson.num).padStart(2, '0')}</span>
        </div>
        <button
          onClick={onToggleWatched}
          title={watched ? 'Снять отметку' : 'Отметить просмотренным'}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            border: `1px solid ${watched ? C.success : C.border}`,
            background: watched ? C.success : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.15s', flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}>
          {watched && <span style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}>✓</span>}
        </button>
      </div>

      {/* Video thumbnail */}
      <div style={{
        height: 130, background: hover ? '#1a1a1a' : '#111',
        marginBottom: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden', transition: 'background 0.15s',
      }}>
        {/* Kanji watermark */}
        {thumbKanji && (
          <span style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Noto Serif JP', var(--font-noto), serif",
            fontSize: 80, color: C.accent, opacity: 0.18,
            userSelect: 'none', pointerEvents: 'none',
          }}>{thumbKanji}</span>
        )}
        {/* Play button */}
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.1)',
          border: '1.5px solid rgba(255,255,255,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: hover ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.15s',
          position: 'relative', zIndex: 1,
        }}>
          <span style={{ color: '#fff', fontSize: 13, marginLeft: 2 }}>▶</span>
        </div>
        {/* Watched badge */}
        {watched && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(77,106,74,0.85)', padding: '2px 6px', zIndex: 1 }}>
            <span style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, color: '#fff', letterSpacing: '0.08em' }}>ПРОСМОТРЕНО</span>
          </div>
        )}
        {/* Duration */}
      </div>

      {/* Meta */}
      <div style={{ marginTop: 14 }}>
        <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 15, fontWeight: 500, color: C.ink, lineHeight: 1.4, marginBottom: 4 }}>{lesson.title}</div>
        <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 18, color: C.accent }}>{lesson.subtitle}</div>
      </div>

      {/* CTA */}
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.hairline2}` }}>
        <span style={{
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase',
          color: isCurrent ? C.accent : hover ? C.accent : C.muted,
          transition: 'color 0.15s',
        }}>
          {isCurrent ? 'Продолжить →' : watched ? '↻ Пересмотреть' : 'Открыть урок →'}
        </span>
      </div>
    </div>
  );
}
