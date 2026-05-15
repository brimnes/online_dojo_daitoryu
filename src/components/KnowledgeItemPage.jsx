'use client';

import { useState, useEffect } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import KinescopePlayer from '@/components/KinescopePlayer';

export default function KnowledgeItemPage({ nav, itemId, viewerId }) {
  const isMobile = useIsMobile();
  const [item,     setItem]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!itemId) { setNotFound(true); setLoading(false); return; }
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/knowledge/${itemId}`);
        if (!res.ok) { setNotFound(true); }
        else { setItem(await res.json()); }
      } catch {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [itemId]);

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 13 }}>
      Загрузка…
    </div>
  );

  if (notFound) return (
    <div style={{ padding: '60px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ fontSize: 13, color: C.muted }}>Материал не найден</div>
      <button onClick={nav.knowledge} style={{ fontSize: 12, color: C.gold, background: 'none', border: 'none', cursor: 'pointer' }}>
        ← К базе знаний
      </button>
    </div>
  );

  return (
    <div className="fade" style={{ minHeight: '100vh', background: C.bg }}>

      {/* ── Мобильный sticky хедер ── */}
      {isMobile && (
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
          background: '#fff', borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: C.gold, padding: '0 4px', display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44 }}>‹</button>
          <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 15, fontWeight: 600, color: '#1a1a1a', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.title}
          </span>
        </header>
      )}

      <div style={{ padding: isMobile ? '16px 16px 40px' : '32px 40px', maxWidth: 800, margin: '0 auto' }}>

        {/* Десктопный breadcrumb */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13 }}>
            <button onClick={nav.dashboard} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: '4px 0', minHeight: 44 }}>← Главная</button>
            <span style={{ color: '#ddd' }}>/</span>
            <button onClick={nav.back} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: '4px 0', minHeight: 44 }}>База знаний</button>
            <span style={{ color: '#ddd' }}>/</span>
            <span style={{ color: C.dark }}>{item.title}</span>
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 26, color: '#9e2f1f', marginBottom: 6 }}>
          {item.title}
        </h1>
        {item.subtitle && (
          <div style={{ fontSize: isMobile ? 14 : 13, color: C.muted, marginBottom: 24 }}>{item.subtitle}</div>
        )}

        {/* Video */}
        {item.video_id && item.video_provider === 'kinescope' && (
          <div style={{ marginBottom: 28 }}>
            <KinescopePlayer
              videoId={item.video_id}
              videoStatus={item.video_status || 'ready'}
              viewerId={viewerId}
              title={item.title}
            />
          </div>
        )}

        {/* Content */}
        {item.content && (
          <div style={{
            fontSize: isMobile ? 17 : 14, lineHeight: isMobile ? 1.9 : 1.85, color: '#444',
            background: C.white, border: `1px solid ${C.border}`,
            padding: isMobile ? '20px 16px' : '28px 30px',
            whiteSpace: 'pre-wrap',
            fontFamily: "'Cormorant Garamond', serif",
          }}>
            {item.content}
          </div>
        )}

        {/* Back button */}
        {!isMobile && (
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
            <button
              onClick={nav.back}
              style={{ background: 'none', border: 'none', color: C.gold, fontSize: 14, cursor: 'pointer', padding: 0, minHeight: 44 }}>
              ← Назад к базе знаний
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
