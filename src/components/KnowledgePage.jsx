'use client';

import { useState, useMemo } from 'react';
import { useIsMobile } from '@/lib/mobile';
import { useKnowledge } from '@/lib/db';

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
    <div className="fade" style={{ minHeight: '100vh', background: '#f0ebe0' }}>

      {/* Мобильный sticky хедер */}
      {isMobile && (
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
          background: '#0a0807', borderBottom: '1px solid #1f1a16',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button onClick={nav.dashboard} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#b8923a', padding: '0 4px', display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44 }}>‹</button>
          <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ede5d3', flex: 1 }}>База знаний</span>
        </header>
      )}

      <div style={{ padding: isMobile ? '16px 16px 40px' : '32px 40px', maxWidth: 800, margin: '0 auto' }}>

        {/* Десктопный breadcrumb */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, fontSize: 11 }}>
            <button onClick={nav.dashboard} style={{ background: 'none', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, letterSpacing: '0.1em', color: '#9a8860', cursor: 'pointer', padding: '4px 0', minHeight: 44, display: 'flex', alignItems: 'center' }}>← На главную</button>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: isMobile ? 24 : 32, paddingBottom: isMobile ? 20 : 28, borderBottom: '1px solid #d2c7b0' }}>
          <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: '#9a8860', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 10 }}>Свободный доступ</div>
          <h1 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 28 : 38, letterSpacing: '0.03em', color: '#15120e', marginBottom: 8, lineHeight: 1.1 }}>
            База знаний
          </h1>
          <p style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 15 : 16, color: '#6f6452', lineHeight: 1.75 }}>Бесплатные материалы для всех учеников</p>
        </div>

        {/* Search */}
        {!loading && items.length > 0 && (
          <div style={{ marginBottom: 20, position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск по материалам…"
              style={{
                width: '100%',
                padding: '10px 36px 10px 14px',
                border: '1px solid #d2c7b0',
                background: '#faf8f4',
                fontFamily: "var(--font-jost), 'Jost', sans-serif",
                fontSize: 13,
                color: '#15120e',
                outline: 'none',
                boxSizing: 'border-box',
                letterSpacing: '0.04em',
              }}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: '#b0a080', cursor: 'pointer', fontSize: 14, lineHeight: 1,
                }}>
                ✕
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {loading && <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", color: '#9a8860', fontSize: 13, letterSpacing: '0.06em' }}>Загрузка…</div>}

        {!loading && items.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', color: '#b0a080', fontSize: 16 }}>
            Материалы скоро появятся
          </div>
        )}

        {!loading && query && filtered.length === 0 && (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', color: '#b0a080', fontSize: 15 }}>
            Ничего не найдено
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: '#d2c7b0' }}>
          {filtered.map(item => (
            <div
              key={item.id}
              onClick={() => nav.knowledgeItem(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: isMobile ? '14px 12px' : '18px 16px', background: '#faf8f4', cursor: 'pointer', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#f0ebe0'}
              onMouseLeave={e => e.currentTarget.style.background = '#faf8f4'}>
              {item.video_id ? (
                <div style={{ width: isMobile ? 52 : 68, height: isMobile ? 36 : 48, background: '#13110e', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, color: '#b8923a' }}>▶</div>
              ) : (
                <div style={{ width: isMobile ? 52 : 68, height: isMobile ? 36 : 48, background: '#e8e0cc', border: '1px solid #d2c7b0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, color: '#b0a080' }}>📄</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-cormorant), serif", fontSize: isMobile ? 16 : 18, fontWeight: 600, color: '#15120e', marginBottom: 2, lineHeight: 1.3 }}>{item.title}</div>
                {item.subtitle && <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#9a8860', letterSpacing: '0.06em' }}>{item.subtitle}</div>}
              </div>
              <span style={{ color: '#b0a080', fontSize: 14, flexShrink: 0, transition: 'color 0.15s' }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
