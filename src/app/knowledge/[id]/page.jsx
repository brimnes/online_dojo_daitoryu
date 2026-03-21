'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { C } from '@/lib/utils';

const KinescopePlayer = ({ videoId }) => (
  <div style={{ position: 'relative', paddingBottom: '56.25%', background: '#000', marginBottom: 24 }}>
    <iframe
      src={`https://kinescope.io/embed/${videoId}`}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
      allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
      allowFullScreen
    />
  </div>
);

export default function KnowledgeItemPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [item,    setItem]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound,setNotFound]= useState(false);

  useEffect(() => {
    (async () => {
      // Auth guard
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }

      if (!id) { setNotFound(true); setLoading(false); return; }

      const { data, error } = await supabase
        .from('knowledge_items')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error || !data) { setNotFound(true); }
      else { setItem(data); }
      setLoading(false);
    })();
  }, [id, router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf8f4', color: '#999', fontSize: 13 }}>
      Загрузка…
    </div>
  );

  if (notFound) return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#faf8f4', gap: 12 }}>
      <div style={{ fontSize: 13, color: '#999' }}>Материал не найден</div>
      <button onClick={() => router.push('/knowledge')} style={{ fontSize: 12, color: '#8B6914', background: 'none', border: 'none', cursor: 'pointer' }}>← К базе знаний</button>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#faf8f4', fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px' }}>
        {/* Nav */}
        <button onClick={() => router.push('/knowledge')}
          style={{ background: 'none', border: 'none', color: '#8B6914', fontSize: 12, cursor: 'pointer', padding: 0, marginBottom: 24 }}>
          ← База знаний
        </button>

        {/* Title */}
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>
          {item.title}
        </h1>
        {item.subtitle && (
          <div style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>{item.subtitle}</div>
        )}

        {/* Video */}
        {item.video_id && item.video_provider === 'kinescope' && (
          <KinescopePlayer videoId={item.video_id} />
        )}

        {/* Content */}
        {item.content && (
          <div style={{
            fontSize: 14, lineHeight: 1.8, color: '#333',
            background: '#fff', border: '1px solid #e8e0d0',
            padding: '24px', whiteSpace: 'pre-wrap',
          }}>
            {item.content}
          </div>
        )}
      </div>
    </div>
  );
}
