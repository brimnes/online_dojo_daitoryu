'use client';

import { useState, useEffect } from 'react';

/**
 * KinescopePlayer
 *
 * Props:
 *   videoId     — Kinescope video ID (from lessons.video_id)
 *   videoStatus — 'uploading' | 'processing' | 'ready' | 'error' | 'none' | null
 *   viewerId    — текущий user.id
 *   posterUrl   — thumbnail URL (optional, из Kinescope webhook)
 *   title       — for placeholder display
 *   duration    — for placeholder display
 *
 * UX:
 *   - Если есть posterUrl: показываем постер + кнопка play → клик → iframe с autoplay.
 *     Нет чёрного экрана — переход мгновенный.
 *   - Если posterUrl нет: рендерим iframe сразу + скрываем через overlay пока он грузится,
 *     убираем overlay по событию onLoad.
 */
export default function KinescopePlayer({ videoId, videoStatus, viewerId, posterUrl, title, duration }) {
  const [liveStatus, setLiveStatus] = useState(videoStatus);
  const [activated,  setActivated]  = useState(false);  // пользователь нажал play
  const [iframeReady, setIframeReady] = useState(false); // iframe сообщил onLoad

  // Sync if parent updates the prop
  useEffect(() => { setLiveStatus(videoStatus); }, [videoStatus]);

  // Auto-poll when processing/uploading
  useEffect(() => {
    if (!videoId) return;
    if (liveStatus !== 'processing' && liveStatus !== 'uploading') return;

    const INTERVAL = 8000;
    let active = true;

    const check = async () => {
      try {
        const res = await fetch(`/api/kinescope/video-status?videoId=${encodeURIComponent(videoId)}`);
        if (!res.ok) return;
        const { status } = await res.json();
        if (active && status && status !== liveStatus) setLiveStatus(status);
      } catch {}
    };

    const timer = setInterval(check, INTERVAL);
    return () => { active = false; clearInterval(timer); };
  }, [videoId, liveStatus]);

  // ── Not-ready states ─────────────────────────────────────────
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

  // ── Ready ────────────────────────────────────────────────────
  const params = new URLSearchParams();
  if (viewerId) params.set('viewer_id', viewerId);
  params.set('playsinline', '1');
  if (activated) params.set('autoplay', '1');

  const embedSrc = `https://kinescope.io/embed/${videoId}?${params.toString()}`;

  // Если есть постер — показываем его пока не нажали play
  if (posterUrl && !activated) {
    return (
      <div
        onClick={() => setActivated(true)}
        style={{
          position: 'relative', width: '100%', paddingTop: '56.25%',
          cursor: 'pointer', background: '#111', overflow: 'hidden',
        }}
      >
        {/* Постер */}
        <img
          src={posterUrl}
          alt={title || ''}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
          }}
        />
        {/* Затемнение + кнопка play */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <PlayButton />
        </div>
      </div>
    );
  }

  // Iframe (сразу или после нажатия play)
  return (
    <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#111' }}>
      <iframe
        src={embedSrc}
        title={title || 'Видео'}
        allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
        allowFullScreen
        webkit-playsinline="true"
        playsInline
        onLoad={() => setIframeReady(true)}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          border: 'none',
        }}
      />
      {/* Overlay пока iframe не загрузился (нет постера) */}
      {!iframeReady && !posterUrl && (
        <div style={{
          position: 'absolute', inset: 0,
          background: '#111',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 14, transition: 'opacity 0.3s',
          pointerEvents: 'none',
        }}>
          <LoadingRing />
        </div>
      )}
    </div>
  );
}

// ── Вспомогательные компоненты ────────────────────────────────

function PlayButton() {
  return (
    <div style={{
      width: 68, height: 68, borderRadius: '50%',
      background: 'rgba(255,255,255,0.15)',
      backdropFilter: 'blur(6px)',
      border: '2px solid rgba(255,255,255,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'transform 0.15s, background 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; e.currentTarget.style.transform = 'scale(1.08)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}
    >
      <span style={{ color: '#fff', fontSize: 24, marginLeft: 4 }}>▶</span>
    </div>
  );
}

function LoadingRing() {
  return (
    <>
      <div style={{
        width: 40, height: 40,
        border: '2px solid rgba(255,255,255,0.1)',
        borderTopColor: 'rgba(200,168,74,0.75)',
        borderRadius: '50%',
        animation: 'kp-spin 0.9s linear infinite',
      }} />
      <style>{`@keyframes kp-spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

function VideoPlaceholder({ title, duration, label, spinner, error, polling }) {
  return (
    <div style={{ width: '100%', paddingTop: '56.25%', background: '#111', position: 'relative' }}>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 12, padding: 16,
      }}>
        {spinner && <LoadingRing />}
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
        {error && <span style={{ color: '#b04030', fontSize: 20 }}>✕</span>}
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center' }}>{label}</div>
        {polling && (
          <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center' }}>
            Проверяем каждые 8 сек. · обычно 2–5 мин.
          </div>
        )}
        {title && <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 12, textAlign: 'center' }}>{title}</div>}
      </div>
    </div>
  );
}
