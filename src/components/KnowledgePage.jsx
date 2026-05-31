'use client';

import { useState, useMemo } from 'react';
import { C, F } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { useKnowledge } from '@/lib/db';
import { MobileBottomNav } from '@/components/BottomNav';

// Tag filters — values match KnowledgeItem.tag in DB
const TAGS = [
  { id: null,       label: 'Все' },
  { id: 'история',  label: 'История' },
  { id: 'принципы', label: 'Принципы' },
  { id: 'этикет',   label: 'Этикет' },
  { id: 'теория',   label: 'Теория' },
  { id: 'словарь',  label: 'Словарь' },
  { id: 'школа',    label: 'Школа' },
];

export default function KnowledgePage({ nav }) {
  const isMobile = useIsMobile();
  const { items, loading } = useKnowledge();
  const [query,     setQuery]     = useState('');
  const [activeTag, setActiveTag] = useState(null);

  // Tags that actually have items (always show "Все")
  const availableTags = useMemo(() => {
    const used = new Set(items.map(i => i.tag));
    return TAGS.filter(t => t.id === null || used.has(t.id));
  }, [items]);

  const filtered = useMemo(() => {
    let result = items;
    if (activeTag !== null) {
      result = result.filter(item => item.tag === activeTag);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(item =>
        item.title?.toLowerCase().includes(q) ||
        item.subtitle?.toLowerCase().includes(q) ||
        item.content?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, query, activeTag]);

  const showChips = !loading && items.length > 0 && availableTags.length > 1;
  const showSearch = !loading && items.length > 0;

  return (
    <div className={`fade${isMobile ? ' knowledge-page' : ''}`} style={{ minHeight: '100vh', background: C.bg }}>

      {/* ── Mobile sticky header ── */}
      {isMobile && (
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
          background: C.bg, borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button onClick={nav.back} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 22, color: C.accent, padding: '0 4px',
            display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44,
          }}>‹</button>
          <span style={{
            fontFamily: F.mono,
            fontSize: 11, letterSpacing: '0.18em', color: C.muted,
            flex: 1, textTransform: 'uppercase', fontWeight: 400,
          }}>Архив · 智</span>
        </header>
      )}

      {/* ── Main scroll container ── */}
      <div
        className={isMobile ? 'page-has-bottom-nav' : ''}
        style={{
          padding: isMobile ? '0' : '56px 40px 80px',
          maxWidth: isMobile ? 'none' : 880,
          margin: '0 auto',
        }}>

        {/* Desktop breadcrumb */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <button
              onClick={nav.dashboard}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: F.mono, fontSize: 11, letterSpacing: '0.18em',
                color: C.muted, textTransform: 'uppercase', padding: 0,
              }}>
              ← На главную
            </button>
          </div>
        )}

        {/* ── Hero ── */}
        <div style={{
          padding: isMobile ? '24px 20px 20px' : '0 0 48px',
          borderBottom: `1px solid ${C.border}`,
          marginBottom: isMobile ? 0 : 40,
        }}>
          <div style={{
            fontFamily: F.mono, fontSize: 11, letterSpacing: '0.22em',
            color: C.muted, textTransform: 'uppercase',
            marginBottom: isMobile ? 10 : 20,
          }}>
            01 · Архив
          </div>
          <h1 style={{
            fontFamily: F.serif,
            fontSize: isMobile ? 38 : 72,
            fontWeight: 300,
            letterSpacing: '0.01em',
            color: C.ink,
            lineHeight: 1,
            margin: 0,
          }}>
            База знаний
          </h1>
          <p style={{
            fontFamily: F.serif,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: isMobile ? 14 : 18,
            color: C.muted,
            marginTop: isMobile ? 10 : 22,
            marginBottom: 0,
            maxWidth: 520,
            lineHeight: 1.5,
          }}>
            Открытые материалы для всех учеников
          </p>
        </div>

        {/* ── Search ── */}
        {showSearch && (
          <div style={{
            padding: isMobile ? '16px 20px 0' : '0 0 4px',
            position: 'relative',
          }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск…"
              style={{
                width: '100%',
                padding: '12px 36px 12px 0',
                border: 'none',
                borderBottom: `1px solid ${C.border}`,
                background: 'transparent',
                fontFamily: F.serif,
                fontSize: isMobile ? 16 : 17,
                fontStyle: 'italic',
                color: C.ink,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute', right: isMobile ? 20 : 6,
                  top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: C.muted, cursor: 'pointer', fontSize: 14, lineHeight: 1,
                  fontFamily: F.mono, minHeight: 44, display: 'flex', alignItems: 'center',
                }}>
                ✕
              </button>
            )}
          </div>
        )}

        {/* ── Category filter chips ── */}
        {showChips && (
          <div style={{ position: 'relative' }}>
            {/* Chips scrollable row — hidden scrollbar via .chips-scroll class */}
            <div
              className="chips-scroll"
              style={{
                display: 'flex',
                gap: 8,
                padding: isMobile ? '14px 20px 16px' : '20px 0 24px',
                overflowX: isMobile ? 'auto' : 'visible',
                flexWrap: isMobile ? 'nowrap' : 'wrap',
                // scrollbar hidden via CSS class below
              }}>
              {availableTags.map(tag => {
                const isActive = activeTag === tag.id;
                return (
                  <button
                    key={String(tag.id)}
                    onClick={() => setActiveTag(tag.id)}
                    style={{
                      flexShrink: 0,
                      padding: '6px 14px',
                      minHeight: 34,
                      border: `1px solid ${isActive ? C.ink : C.border}`,
                      background: isActive ? C.ink : 'transparent',
                      color: isActive ? C.bg : C.muted,
                      fontFamily: F.mono,
                      fontSize: 11,
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}>
                    {tag.label}
                  </button>
                );
              })}
              {/* Spacer so last chip isn't flush with the fade */}
              {isMobile && <div style={{ flexShrink: 0, width: 8 }} />}
            </div>

            {/* Right-edge scroll hint — only on mobile */}
            {isMobile && (
              <div style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 36,
                background: `linear-gradient(to right, transparent, ${C.bg})`,
                pointerEvents: 'none',
              }} />
            )}
          </div>
        )}

        {/* ── Loading state ── */}
        {loading && (
          <div style={{
            padding: isMobile ? '56px 20px' : '48px 0', textAlign: 'center',
            color: C.muted, fontFamily: F.mono, fontSize: 11,
            letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            Загрузка
          </div>
        )}

        {/* ── Empty: no items in DB ── */}
        {!loading && items.length === 0 && (
          <div style={{
            padding: isMobile ? '52px 20px 40px' : '64px 0',
            textAlign: 'center',
            color: C.muted, fontFamily: F.serif, fontStyle: 'italic',
            fontSize: 16, lineHeight: 1.6,
          }}>
            Материалы скоро появятся
          </div>
        )}

        {/* ── Empty: filter/search produced no results ── */}
        {!loading && items.length > 0 && filtered.length === 0 && (
          <div style={{
            padding: isMobile ? '44px 20px 40px' : '48px 0',
            textAlign: 'center',
            color: C.muted, fontFamily: F.serif, fontStyle: 'italic',
            fontSize: 15, lineHeight: 1.6,
          }}>
            {query ? 'Ничего не найдено' : 'В этой категории пока нет материалов'}
          </div>
        )}

        {/* ── Items list ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => nav.knowledgeItem(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 24,
                padding: isMobile ? '18px 20px' : '24px 0',
                minHeight: isMobile ? 68 : 'auto',
                background: 'transparent',
                borderTop: `1px solid ${C.border}`,
                cursor: 'pointer', transition: 'opacity 0.18s',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => !isMobile && (e.currentTarget.style.opacity = '0.65')}
              onMouseLeave={e => !isMobile && (e.currentTarget.style.opacity = '1')}>

              {/* Index number */}
              <div style={{
                fontFamily: F.mono, fontSize: 11, letterSpacing: '0.15em',
                color: C.muted, minWidth: isMobile ? 24 : 36,
                textTransform: 'uppercase', flexShrink: 0,
              }}>
                {String(idx + 1).padStart(2, '0')}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: F.serif,
                  fontSize: isMobile ? 18 : 22,
                  fontWeight: 400,
                  color: C.ink,
                  lineHeight: 1.25,
                  letterSpacing: '0.005em',
                }}>{item.title}</div>
                {item.subtitle && (
                  <div style={{
                    fontFamily: F.serif, fontStyle: 'italic', fontWeight: 300,
                    fontSize: 13,
                    color: C.muted, lineHeight: 1.4, marginTop: 3,
                  }}>{item.subtitle}</div>
                )}
              </div>

              {/* Tag label — desktop only */}
              {item.tag && !isMobile && (
                <span style={{
                  fontFamily: F.mono, fontSize: 11, letterSpacing: '0.2em',
                  color: C.muted, textTransform: 'uppercase', flexShrink: 0,
                }}>
                  {item.tag}
                </span>
              )}

              {/* Video badge */}
              {item.video_id && (
                <span style={{
                  fontFamily: F.mono, fontSize: 11, letterSpacing: '0.2em',
                  color: C.muted, textTransform: 'uppercase', flexShrink: 0,
                }}>
                  Видео
                </span>
              )}

              {/* Arrow */}
              <span style={{
                color: C.muted, fontSize: 16, flexShrink: 0, opacity: 0.45,
                fontFamily: F.mono,
              }}>→</span>
            </div>
          ))}
        </div>

      </div>

      {isMobile && <MobileBottomNav nav={nav} active="knowledge" />}
    </div>
  );
}
