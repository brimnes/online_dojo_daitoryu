'use client';

import { useState, useMemo } from 'react';
import { C } from '@/lib/utils';
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
    <div className="fade" style={{ padding: isMobile ? '16px' : '32px 40px', maxWidth: 800, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 16 : 24, fontSize: 12 }}>
        <button
          onClick={nav.dashboard}
          style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: '4px 0', minHeight: 44, display: 'flex', alignItems: 'center' }}>
          ← На главную
        </button>
      </div>

      {/* Header */}
      <div style={{ marginBottom: 28, paddingBottom: 20, borderBottom: `2px solid ${C.border}` }}>
        <h1 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 22 : 28, color: '#c8a84a', marginBottom: 6 }}>
          База знаний
        </h1>
        <p style={{ fontSize: 13, color: C.muted }}>Бесплатные материалы для всех учеников</p>
      </div>

      {/* Search */}
      {!loading && items.length > 0 && (
        <div style={{ marginBottom: 16, position: 'relative' }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Поиск по материалам…"
            style={{
              width: '100%',
              padding: '10px 36px 10px 14px',
              border: `1px solid ${C.border}`,
              background: C.white,
              fontSize: 13,
              color: C.dark,
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{
                position: 'absolute', right: 10, top: '50%',
                transform: 'translateY(-50%)',
                background: 'none', border: 'none',
                color: C.muted, cursor: 'pointer', fontSize: 16, lineHeight: 1,
              }}>
              ✕
            </button>
          )}
        </div>
      )}

      {/* Content */}
      {loading && <div style={{ color: C.muted, fontSize: 13 }}>Загрузка…</div>}

      {!loading && items.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>
          Материалы скоро появятся
        </div>
      )}

      {!loading && query && filtered.length === 0 && (
        <div style={{ padding: '32px 20px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>
          Ничего не найдено
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {filtered.map(item => (
          <div
            key={item.id}
            onClick={() => nav.knowledgeItem(item.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 16, padding: isMobile ? '14px 12px' : '18px 16px', background: C.white, border: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.background = '#faf6ee'}
            onMouseLeave={e => e.currentTarget.style.background = C.white}>
            {item.video_id ? (
              <div style={{ width: isMobile ? 52 : 68, height: isMobile ? 36 : 48, background: '#faf6ee', border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, color: C.gold }}>▶</div>
            ) : (
              <div style={{ width: isMobile ? 52 : 68, height: isMobile ? 36 : 48, background: '#f5f5f5', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18, color: '#ccc' }}>📄</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 15 : 17, fontWeight: 600, color: C.dark, marginBottom: 2 }}>{item.title}</div>
              {item.subtitle && <div style={{ fontSize: 11, color: C.muted }}>{item.subtitle}</div>}
            </div>
            <span style={{ color: '#ccc', fontSize: 14, flexShrink: 0 }}>→</span>
          </div>
        ))}
      </div>
    </div>
  );
}
