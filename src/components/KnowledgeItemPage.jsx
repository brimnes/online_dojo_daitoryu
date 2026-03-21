'use client';

import { useState, useEffect } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { supabase } from '@/lib/supabase';
import KinescopePlayer from '@/components/KinescopePlayer';

export default function KnowledgeItemPage({ nav, itemId }) {
  const isMobile = useIsMobile();
  const [item,     setItem]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!itemId) { setNotFound(true); setLoading(false); return; }
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('id', itemId)
        .eq('is_published', true)
        .single();

      if (error || !data) setNotFound(true);
      else setItem(data);
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
    <div className="fade" style={{ padding: isMobile ? '16px' : '32px 40px', maxWidth: 800, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: isMobile ? 16 : 24, fontSize: 12 }}>
        <button onClick={nav.dashboard} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: 0 }}>← Главная</button>
        <span style={{ color: '#ddd' }}>/</span>
        <button onClick={nav.knowledge} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: 0 }}>База знаний</button>
        <span style={{ color: '#ddd' }}>/</span>
        <span style={{ color: C.dark }}>{item.title}</span>
      </div>

      {/* Title */}
      <h1 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 20 : 26, color: '#c8a84a', marginBottom: 6 }}>
        {item.title}
      </h1>
      {item.subtitle && (
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>{item.subtitle}</div>
      )}

      {/* Video */}
      {item.video_id && item.video_provider === 'kinescope' && (
        <div style={{ marginBottom: 28 }}>
          <KinescopePlayer
            videoId={item.video_id}
            videoStatus={item.video_status || 'ready'}
            title={item.title}
          />
        </div>
      )}

      {/* Content */}
      {item.content && (
        <div style={{
          fontSize: 14, lineHeight: 1.85, color: '#444',
          background: C.white, border: `1px solid ${C.border}`,
          padding: isMobile ? '16px' : '28px 30px',
          whiteSpace: 'pre-wrap',
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          {item.content}
        </div>
      )}

      {/* Back button */}
      <div style={{ marginTop: 32, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
        <button
          onClick={nav.knowledge}
          style={{ background: 'none', border: 'none', color: C.gold, fontSize: 13, cursor: 'pointer', padding: 0 }}>
          ← Назад к базе знаний
        </button>
      </div>
    </div>
  );
}
