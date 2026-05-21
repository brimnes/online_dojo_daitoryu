'use client';

import { useState, useEffect } from 'react';
import { C, F } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import KinescopePlayer from '@/components/KinescopePlayer';
import { MobileBottomNav } from '@/components/BottomNav';

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
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: C.muted, fontFamily: F.mono, fontSize: 10,
      letterSpacing: '0.2em', textTransform: 'uppercase',
    }}>
      Загрузка
    </div>
  );

  if (notFound) return (
    <div style={{
      padding: '80px 32px', textAlign: 'center', display: 'flex',
      flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 18, color: C.muted }}>
        Материал не найден
      </div>
      <button
        onClick={nav.knowledge}
        style={{
          fontFamily: F.mono, fontSize: 10, letterSpacing: '0.2em',
          color: C.accent, background: 'none', border: 'none',
          cursor: 'pointer', textTransform: 'uppercase',
        }}>
        ← К архиву
      </button>
    </div>
  );

  return (
    <div className="fade" style={{ minHeight: '100vh', background: C.bg }}>

      {/* ── Mobile sticky header — минимальный, без дубля title ── */}
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
            fontFamily: F.mono, fontSize: 10, letterSpacing: '0.18em',
            color: C.muted, flex: 1, textTransform: 'uppercase',
          }}>
            Архив
          </span>
        </header>
      )}

      <div className={isMobile ? 'page-has-bottom-nav' : ''} style={{
        padding: isMobile ? '32px 20px 32px' : '56px 40px 80px',
        maxWidth: 760, margin: '0 auto',
      }}>

        {/* Desktop breadcrumb — mono, тонкий */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
            <button
              onClick={nav.knowledge}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: F.mono, fontSize: 10, letterSpacing: '0.18em',
                color: C.muted, textTransform: 'uppercase', padding: 0,
              }}>
              ← Архив
            </button>
          </div>
        )}

        {/* ── Title block ── */}
        <div style={{ marginBottom: isMobile ? 32 : 48 }}>
          <h1 style={{
            fontFamily: F.serif,
            fontSize: isMobile ? 36 : 56,
            fontWeight: 300,
            letterSpacing: '0.005em',
            color: C.ink,
            lineHeight: 1.05,
            margin: 0,
          }}>
            {item.title}
          </h1>
          {item.subtitle && (
            <div style={{
              fontFamily: F.serif, fontStyle: 'italic', fontWeight: 300,
              fontSize: isMobile ? 16 : 18, color: C.muted,
              marginTop: 16, lineHeight: 1.5,
            }}>
              {item.subtitle}
            </div>
          )}
        </div>

        {/* Video */}
        {item.video_id && item.video_provider === 'kinescope' && (
          <div style={{ marginBottom: isMobile ? 32 : 48 }}>
            <KinescopePlayer
              videoId={item.video_id}
              videoStatus={item.video_status || 'ready'}
              viewerId={viewerId}
              title={item.title}
            />
          </div>
        )}

        {/* Content — читаемый serif, без рамок */}
        {item.content && (
          <div style={{
            fontFamily: F.serif,
            fontSize: isMobile ? 18 : 19,
            fontWeight: 400,
            lineHeight: 1.75,
            color: C.ink2,
            whiteSpace: 'pre-wrap',
          }}>
            {item.content}
          </div>
        )}

        {/* Back link */}
        {!isMobile && (
          <div style={{
            marginTop: 64, paddingTop: 28,
            borderTop: `1px solid ${C.border}`,
          }}>
            <button
              onClick={nav.back}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: F.mono, fontSize: 10, letterSpacing: '0.18em',
                color: C.muted, textTransform: 'uppercase', padding: 0,
              }}>
              ← Назад к архиву
            </button>
          </div>
        )}
      </div>
      {isMobile && <MobileBottomNav nav={nav} active="knowledge" />}
    </div>
  );
}
