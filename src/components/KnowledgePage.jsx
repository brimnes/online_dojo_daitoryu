'use client';

import { useState, useMemo } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { useKnowledge } from '@/lib/db';
import { MobileBottomNav } from '@/components/BottomNav';

export default function KnowledgePage({ nav }) {
  const isMobile = useIsMobile();
  const { items, loading } = useKnowledge();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.trim().toLowerCase();
    return items.filter(item =>
      item.title?.toLowerCase().includes(q) ||
      item.subtitle?.toLowerCase().includes(q) ||
      item.content?.toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div className="fade" style={{ minHeight: '100vh', background: C.bg }}>

      {/* ── Mobile sticky header ── */}
      {isMobile && (
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
          background: C.surface, borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button onClick={nav.back} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 24, color: C.accent, padding: '0 4px',
            display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44,
          }}>‹</button>
          <span style={{
            fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 14, letterSpacing: '0.12em', color: C.ink,
            flex: 1, textTransform: 'uppercase',
          }}>База знаний</span>
          <span style={{
            fontFamily: "'Noto Serif JP', var(--font-noto), serif",
            fontSize: 18, color: C.accent, opacity: 0.5,
          }}>智</span>
        </header>
      )}

      <div className={isMobile ? 'page-has-bottom-nav' : ''} style={{ padding: isMobile ? '0' : '32px 40px', maxWidth: isMobile ? 'none' : 800, margin: '0 auto' }}>

        {/* ── Desktop header ── */}
        {!isMobile && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 12 }}>
              <button
                onClick={nav.dashboard}
                style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: '4px 0', minHeight: 44, display: 'flex', alignItems: 'center' }}>
                ← На главную
              </button>
            </div>
            <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `2px solid ${C.border}` }}>
              <h1 style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 28, color: '#9e2f1f', marginBottom: 6 }}>
                База знаний
              </h1>
              <p style={{ fontSize: 13, color: C.muted }}>Бесплатные материалы для всех учеников</p>
            </div>
          </>
        )}

        {/* ── Mobile subtitle strip ── */}
        {isMobile && (
          <div style={{ padding: '14px 16px 10px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
            <p style={{ fontSize: 13, color: C.muted, fontFamily: "var(--font-jost), 'Jost', sans-serif" }}>
              Бесплатные материалы для всех учеников
            </p>
          </div>
        )}

        {/* ── Search ── */}
        {!loading && items.length > 0 && (
          <div style={{ padding: isMobile ? '12px 16px' : '0 0 16px', position: 'relative', background: isMobile ? C.bg : 'transparent' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по материалам…"
              style={{
                width: '100%',
                padding: isMobile ? '13px 40px 13px 14px' : '10px 36px 10px 14px',
                border: `1px solid ${C.border}`,
                background: C.surface,
                fontSize: isMobile ? 15 : 13,
                color: C.ink,
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute', right: isMobile ? 26 : 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: C.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1,
                }}>
                ✕
              </button>
            )}
          </div>
        )}

        {/* ── States ── */}
        {loading && (
          <div style={{ padding: isMobile ? '40px 16px' : '40px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>
            Загрузка…
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{ padding: isMobile ? '60px 16px' : '40px 20px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>
            Материалы скоро появятся
          </div>
        )}

        {!loading && query && filtered.length === 0 && (
          <div style={{ padding: isMobile ? '60px 16px' : '32px 20px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>
            Ничего не найдено
          </div>
        )}

        {/* ── Items list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 0 : 2 }}>
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => nav.knowledgeItem(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 16,
                padding: isMobile ? '16px 16px' : '18px 16px',
                minHeight: isMobile ? 72 : 'auto',
                background: C.surface,
                borderBottom: isMobile ? `1px solid ${C.border}` : undefined,
                border: isMobile ? undefined : `1px solid ${C.border}`,
                cursor: 'pointer', transition: 'background 0.12s',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => !isMobile && (e.currentTarget.style.background = '#faf6ee')}
              onMouseLeave={e => !isMobile && (e.currentTarget.style.background = C.surface)}>

              {/* Icon: kanji or play indicator */}
              <div style={{
                width: isMobile ? 44 : 68, height: isMobile ? 44 : 48,
                background: item.video_id ? '#faf6ee' : C.bg,
                border: `1px solid ${item.video_id ? C.goldBorder : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                fontFamily: "'Noto Serif JP', var(--font-noto), serif",
                fontSize: isMobile ? 20 : 18,
                color: item.video_id ? C.gold : C.muted,
              }}>
                {item.video_id ? '映' : '智'}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: isMobile ? 17 : 17,
                  fontWeight: 600, color: C.ink,
                  marginBottom: 3, lineHeight: 1.25,
                }}>{item.title}</div>
                {item.subtitle && (
                  <div style={{
                    fontFamily: "var(--font-jost), 'Jost', sans-serif",
                    fontSize: isMobile ? 12 : 11,
                    color: C.muted, lineHeight: 1.3,
                  }}>{item.subtitle}</div>
                )}
              </div>

              {/* Arrow */}
              <span style={{
                color: C.accent, fontSize: isMobile ? 18 : 14,
                flexShrink: 0, opacity: 0.5,
              }}>›</span>
            </div>
          ))}
        </div>

      </div>
      {isMobile && <MobileBottomNav nav={nav} active="knowledge" />}
    </div>
  );
}
