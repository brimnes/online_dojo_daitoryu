'use client';

import { useState, useEffect } from 'react';
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
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "var(--font-jost), 'Jost', sans-serif", color: '#9a8860', fontSize: 13, letterSpacing: '0.06em' }}>
      Загрузка…
    </div>
  );

  if (notFound) return (
    <div style={{ padding: '60px 32px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: 16, color: '#9a8860' }}>Материал не найден</div>
      <button onClick={nav.knowledge} style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 12, color: '#9a8860', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.08em' }}>
        ← К базе знаний
      </button>
    </div>
  );

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
            {item.title}
          </span>
        </header>
      )}

      <div style={{ padding: isMobile ? '16px 16px 40px' : '32px 40px', maxWidth: 800, margin: '0 auto' }}>

        {/* Десктопный breadcrumb */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, fontSize: 11, flexWrap: 'wrap' }}>
            <button onClick={nav.dashboard} style={{ background: 'none', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, letterSpacing: '0.1em', color: '#9a8860', cursor: 'pointer', padding: '4px 0', minHeight: 44, display: 'flex', alignItems: 'center' }}>← Главная</button>
            <span style={{ color: '#d2c7b0' }}>/</span>
            <button onClick={nav.back} style={{ background: 'none', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, letterSpacing: '0.1em', color: '#9a8860', cursor: 'pointer', padding: '4px 0', minHeight: 44, display: 'flex', alignItems: 'center' }}>База знаний</button>
            <span style={{ color: '#d2c7b0' }}>/</span>
            <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#6f6452', letterSpacing: '0.06em' }}>{item.title}</span>
          </div>
        )}

        {/* Title */}
        <h1 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 24 : 32, letterSpacing: '0.03em', color: '#15120e', marginBottom: 8, lineHeight: 1.1 }}>
          {item.title}
        </h1>
        {item.subtitle && (
          <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 16 : 17, color: '#6f6452', marginBottom: 28, lineHeight: 1.6 }}>{item.subtitle}</div>
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
            fontSize: isMobile ? 17 : 15, lineHeight: isMobile ? 1.9 : 1.85, color: '#3d3228',
            background: '#faf8f4', border: '1px solid #d2c7b0',
            padding: isMobile ? '20px 16px' : '28px 30px',
            whiteSpace: 'pre-wrap',
            fontFamily: "var(--font-cormorant), serif",
          }}>
            {item.content}
          </div>
        )}

        {/* Back button */}
        {!isMobile && (
          <div style={{ marginTop: 32, paddingTop: 20, borderTop: '1px solid #d2c7b0' }}>
            <button
              onClick={nav.back}
              style={{ background: 'none', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 12, letterSpacing: '0.1em', color: '#9a8860', cursor: 'pointer', padding: 0, minHeight: 44, display: 'flex', alignItems: 'center' }}>
              ← Назад к базе знаний
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
