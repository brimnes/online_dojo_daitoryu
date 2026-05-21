'use client';

import { useState, useMemo } from 'react';
import { C, F } from '@/lib/utils';
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

      {/* ── Mobile sticky header — минимальный, только back + breadcrumb mono ── */}
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
            fontSize: 10, letterSpacing: '0.18em', color: C.muted,
            flex: 1, textTransform: 'uppercase', fontWeight: 400,
          }}>Архив · 智</span>
        </header>
      )}

      <div className={isMobile ? 'page-has-bottom-nav' : ''} style={{
        padding: isMobile ? '0' : '56px 40px 80px',
        maxWidth: isMobile ? 'none' : 880, margin: '0 auto',
      }}>

        {/* ── Desktop breadcrumb — тонкий, mono ── */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <button
              onClick={nav.dashboard}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: F.mono, fontSize: 10, letterSpacing: '0.18em',
                color: C.muted, textTransform: 'uppercase', padding: 0,
              }}>
              ← На главную
            </button>
          </div>
        )}

        {/* ── Hero — один заголовок, крупный, воздушный ── */}
        <div style={{
          padding: isMobile ? '40px 20px 28px' : '0 0 48px',
          borderBottom: `1px solid ${C.border}`,
          marginBottom: isMobile ? 0 : 40,
        }}>
          <div style={{
            fontFamily: F.mono, fontSize: 10, letterSpacing: '0.22em',
            color: C.muted, textTransform: 'uppercase', marginBottom: isMobile ? 16 : 20,
          }}>
            01 · Архив
          </div>
          <h1 style={{
            fontFamily: F.serif,
            fontSize: isMobile ? 48 : 72,
            fontWeight: 300,
            letterSpacing: '0.01em',
            color: C.ink,
            lineHeight: 0.95,
            margin: 0,
          }}>
            База знаний
          </h1>
          <p style={{
            fontFamily: F.serif,
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: isMobile ? 16 : 18,
            color: C.muted,
            marginTop: isMobile ? 18 : 22,
            marginBottom: 0,
            maxWidth: 520,
            lineHeight: 1.55,
          }}>
            Открытые материалы для всех учеников
          </p>
        </div>

        {/* ── Search ── */}
        {!loading && items.length > 0 && (
          <div style={{
            padding: isMobile ? '20px 20px 12px' : '0 0 28px',
            position: 'relative',
          }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск…"
              style={{
                width: '100%',
                padding: isMobile ? '12px 40px 12px 0' : '12px 36px 12px 0',
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
                  position: 'absolute', right: isMobile ? 26 : 6, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: C.muted, cursor: 'pointer', fontSize: 14, lineHeight: 1,
                  fontFamily: F.mono,
                }}>
                ✕
              </button>
            )}
          </div>
        )}

        {/* ── States ── */}
        {loading && (
          <div style={{
            padding: isMobile ? '48px 20px' : '48px 0', textAlign: 'center',
            color: C.muted, fontFamily: F.mono, fontSize: 10,
            letterSpacing: '0.2em', textTransform: 'uppercase',
          }}>
            Загрузка
          </div>
        )}

        {!loading && items.length === 0 && (
          <div style={{
            padding: isMobile ? '72px 20px' : '64px 0', textAlign: 'center',
            color: C.muted, fontFamily: F.serif, fontStyle: 'italic', fontSize: 16,
          }}>
            Материалы скоро появятся
          </div>
        )}

        {!loading && query && filtered.length === 0 && (
          <div style={{
            padding: isMobile ? '60px 20px' : '48px 0', textAlign: 'center',
            color: C.muted, fontFamily: F.serif, fontStyle: 'italic', fontSize: 15,
          }}>
            Ничего не найдено
          </div>
        )}

        {/* ── Items list — editorial, разделённый hairlines ── */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filtered.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => nav.knowledgeItem(item.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 24,
                padding: isMobile ? '20px 20px' : '24px 0',
                minHeight: isMobile ? 76 : 'auto',
                background: 'transparent',
                borderTop: idx === 0 ? 'none' : `1px solid ${C.border}`,
                cursor: 'pointer', transition: 'opacity 0.18s',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={e => !isMobile && (e.currentTarget.style.opacity = 0.65)}
              onMouseLeave={e => !isMobile && (e.currentTarget.style.opacity = 1)}>

              {/* Index number — mono */}
              <div style={{
                fontFamily: F.mono, fontSize: 10, letterSpacing: '0.15em',
                color: C.muted, minWidth: isMobile ? 28 : 36,
                textTransform: 'uppercase',
              }}>
                {String(idx + 1).padStart(2, '0')}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: F.serif,
                  fontSize: isMobile ? 20 : 22,
                  fontWeight: 400,
                  color: C.ink,
                  lineHeight: 1.2,
                  letterSpacing: '0.005em',
                }}>{item.title}</div>
                {item.subtitle && (
                  <div style={{
                    fontFamily: F.serif, fontStyle: 'italic', fontWeight: 300,
                    fontSize: isMobile ? 14 : 14,
                    color: C.muted, lineHeight: 1.4, marginTop: 4,
                  }}>{item.subtitle}</div>
                )}
              </div>

              {/* Type tag — mono */}
              {item.video_id && (
                <span style={{
                  fontFamily: F.mono, fontSize: 9, letterSpacing: '0.2em',
                  color: C.muted, textTransform: 'uppercase',
                  flexShrink: 0,
                }}>
                  Видео
                </span>
              )}

              {/* Arrow */}
              <span style={{
                color: C.muted, fontSize: 16,
                flexShrink: 0, opacity: 0.45,
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
