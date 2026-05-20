'use client';

import { useState, useEffect } from 'react';

/**
 * KinescopePlayer
 *
 * Props:
 *   videoId     — Kinescope video ID (from lessons.video_id)
 *   videoStatus — 'uploading' | 'processing' | 'ready' | 'error' | 'none' | null
 *   viewerId    — текущий user.id (передаётся пропом из App/компонента, не фетчится)
 *   posterUrl   — optional thumbnail URL
 *   title       — for placeholder display
 *   duration    — for placeholder display
 *
 * Polling: если videoStatus === 'processing' или 'uploading', компонент
 * автоматически проверяет статус в БД каждые 8 секунд и переключается
 * на плеер как только видео становится 'ready'.
 */
export default function KinescopePlayer({ videoId, videoStatus, viewerId, posterUrl, title, duration }) {
  const [liveStatus, setLiveStatus] = useState(videoStatus);

  // Sync if parent updates the prop
  useEffect(() => { setLiveStatus(videoStatus); }, [videoStatus]);

  // Auto-poll when processing/uploading
  useEffect(() => {
    if (!videoId) return;
    if (liveStatus !== 'processing' && liveStatus !== 'uploading') return;

    const INTERVAL = 8000; // 8s
    let active = true;

    const check = async () => {
      try {
        const res = await fetch(`/api/kinescope/video-status?videoId=${encodeURIComponent(videoId)}`);
        if (!res.ok) return;
        const { status } = await res.json();
        if (active && status && status !== liveStatus) {
          setLiveStatus(status);
        }
      } catch {
        // network error — ignore, retry next tick
      }
    };

    const timer = setInterval(check, INTERVAL);
    return () => { active = false; clearInterval(timer); };
  }, [videoId, liveStatus]);

  // Not ready states
  if (!videoId || !liveStatus || liveStatus === 'none') {
    return <VideoPlaceholder title={title} duration={duration} label="Видео не загружено" />;
  }

  if (liveStatus === 'uploading') {
    return <VideoPlaceholder title={title} duration={duration} label="Загрузка…" spinner />;
  }

  if (liveStatus === 'processing') {
    return <VideoPlaceholder title={title} duration={duration} label="Видео обрабатывается…" spinner polling />;
  }

  if (liveStatus === 'error') {
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

function VideoPlaceholder({ title, duration, label, spinner, error, polling }) {
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
        {polling && (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center' }}>
            Проверяем каждые 8 сек. · обычно 2–5 мин.
          </div>
        )}
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
