'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useKnowledge } from '@/lib/db';
import { C } from '@/lib/utils';

const KinescopePlayer = ({ videoId }) => (
  <iframe
    src={`https://kinescope.io/embed/${videoId}`}
    width="100%" height="56%" style={{ border: 'none', display: 'block', aspectRatio: '16/9' }}
    allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
    allowFullScreen
  />
);

export default function KnowledgePage() {
  const router = useRouter();
  const { items, loading } = useKnowledge();

  // Auth guard — любой авторизованный пользователь имеет доступ
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.replace('/');
    })();
  }, [router]);

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 32, paddingBottom: 20, borderBottom: '2px solid #e8e0d0' }}>
          <button
            onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', color: '#8B6914', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
            ← На главную
          </button>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>
            База знаний
          </h1>
          <p style={{ fontSize: 13, color: '#999' }}>Бесплатные материалы для всех учеников</p>
        </div>

        {/* Content */}
        {loading && <div style={{ color: '#999', fontSize: 13 }}>Загрузка…</div>}

        {!loading && items.length === 0 && (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#bbb', fontSize: 13 }}>
            Материалы скоро появятся
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {items.map(item => (
            <a key={item.id} href={`/knowledge/${item.id}`}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 16px', background: '#fff', border: '1px solid #e8e0d0', textDecoration: 'none', color: 'inherit', transition: 'background 0.12s' }}
              onMouseEnter={e => e.currentTarget.style.background = '#faf6ee'}
              onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
              {item.video_id ? (
                <div style={{ width: 72, height: 50, background: '#faf6ee', border: '1px solid #e8dcc8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20, color: '#8B6914' }}>▶</div>
              ) : (
                <div style={{ width: 72, height: 50, background: '#f5f5f5', border: '1px solid #e8e0d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 20, color: '#ccc' }}>📄</div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 }}>{item.title}</div>
                {item.subtitle && <div style={{ fontSize: 12, color: '#999' }}>{item.subtitle}</div>}
              </div>
              <span style={{ color: '#ccc', fontSize: 14, flexShrink: 0 }}>→</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
