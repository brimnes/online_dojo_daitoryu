'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * KinescopePlayer
 *
 * Props:
 *   videoId     — Kinescope video ID (from lessons.video_id)
 *   videoStatus — 'uploading' | 'processing' | 'ready' | 'error' | 'none' | null
 *   posterUrl   — optional thumbnail URL
 *   title       — for placeholder display
 *   duration    — for placeholder display
 *
 * The Kinescope Authorization Backend will call /api/kinescope/auth
 * and receive the viewer's Supabase user ID via the `viewer_id` param.
 */
export default function KinescopePlayer({ videoId, videoStatus, posterUrl, title, duration }) {
  const [viewerId, setViewerId] = useState(null);

  // Get current Supabase user ID to pass as viewer_id to Kinescope
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setViewerId(user.id);
    });
  }, []);

  // Not ready states
  if (!videoId || !videoStatus || videoStatus === 'none') {
    return <VideoPlaceholder title={title} duration={duration} label="Видео не загружено" />;
  }

  if (videoStatus === 'uploading') {
    return <VideoPlaceholder title={title} duration={duration} label="Загрузка…" spinner />;
  }

  if (videoStatus === 'processing') {
    return <VideoPlaceholder title={title} duration={duration} label="Видео обрабатывается" spinner />;
  }

  if (videoStatus === 'error') {
    return <VideoPlaceholder title={title} duration={duration} label="Ошибка обработки видео" error />;
  }

  // videoStatus === 'ready'
  // Build Kinescope embed URL
  // viewer_id is passed so Authorization Backend knows who is watching
  const params = new URLSearchParams();
  if (viewerId) params.set('viewer_id', viewerId);
  // playsinline=1 for WebView (iOS)
  params.set('playsinline', '1');

  const embedSrc = `https://kinescope.io/embed/${videoId}?${params.toString()}`;

  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#111' }}>
      <iframe
        src={embedSrc}
        title={title || 'Видео'}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        // WebView compatibility
        webkit-playsinline="true"
        playsInline
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          border: 'none',
        }}
      />
    </div>
  );
}

function VideoPlaceholder({ title, duration, label, spinner, error }) {
  return (
    <div style={{
      width: '100%',
      paddingTop: '56.25%',
      background: '#111',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: 16,
      }}>
        {spinner && (
          <div style={{
            width: 36, height: 36,
            border: '2px solid rgba(255,255,255,0.15)',
            borderTopColor: 'rgba(200,168,74,0.7)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
        )}
        {!spinner && !error && (
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: '1.5px solid rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 18 }}>▶</span>
          </div>
        )}
        {error && (
          <span style={{ color: '#b04030', fontSize: 20 }}>✕</span>
        )}
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>{label}</div>
        {title && (
          <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center' }}>{title}</div>
        )}
        {duration && (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>{duration}</div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
