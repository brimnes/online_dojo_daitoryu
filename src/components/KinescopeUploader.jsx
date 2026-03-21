'use client';

/**
 * KinescopeUploader — TUS resumable upload flow
 *
 * 1. User picks file
 * 2. Component calls /api/kinescope/upload-url  (JSON, no file)
 *    → gets { videoId, uploadUrl }
 * 3. tus-js-client uploads file DIRECTLY to Kinescope TUS endpoint
 *    - resumable (findPreviousUploads / resumeFromPreviousUpload)
 *    - retryDelays, chunkSize
 *    - metadata: ASCII-only (no cyrillic in headers)
 * 4. onSuccess → update Supabase video_status via callback
 */

import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const C = {
  gold: '#8B6914', goldBorder: '#e8dcc8', goldBg: '#faf6ee',
  dark: '#1a1a1a', muted: '#999', border: '#e8e0d0', white: '#fff',
  green: '#2d7a4a', greenBg: '#f0faf4', greenBorder: '#b8e0c8',
  red: '#a03030', redBg: '#fff8f7', redBorder: '#e8c0c0',
};

// ASCII-safe filename for tus metadata (no cyrillic in HTTP headers)
function toAsciiFn(str) {
  const TRANSLIT = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'j',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
    х:'h',ц:'ts',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return (str || 'video')
    .toLowerCase()
    .split('')
    .map(c => TRANSLIT[c] ?? (/[a-z0-9._-]/.test(c) ? c : '-'))
    .join('')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    || 'video';
}

/**
 * Props:
 *   lessonId          — string (mutually exclusive with techniqueVideoId)
 *   techniqueVideoId  — string
 *   currentVideoId    — existing Kinescope video_id
 *   currentStatus     — existing video_status
 *   onComplete        — callback({ videoId, status })
 */
export default function KinescopeUploader({
  lessonId,
  techniqueVideoId,
  currentVideoId,
  currentStatus,
  onComplete,
}) {
  const [phase, setPhase]       = useState('idle');  // idle|uploading|done|error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef  = useRef(null);
  const tusRef   = useRef(null);  // tus.Upload instance (for abort/resume)

  const getToken = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }, []);

  // ── core upload ──────────────────────────────────────────────────────────
  const startUpload = useCallback(async (file) => {
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      setErrorMsg('Выберите видеофайл');
      setPhase('error');
      return;
    }

    setPhase('uploading');
    setProgress(0);
    setErrorMsg('');

    try {
      const token = await getToken();
      if (!token) throw new Error('Не авторизован');

      // ── Step 1: get TUS endpoint from our backend ──────────────
      const initRes = await fetch('/api/kinescope/upload-url', {
        method:  'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          lessonId,
          techniqueVideoId,
          title:    file.name.replace(/\.[^/.]+$/, ''), // strip extension
          filename: file.name,
          filesize: file.size,
        }),
      });

      if (!initRes.ok) {
        const j = await initRes.json().catch(() => ({}));
        throw new Error(j.error || `Server error ${initRes.status}`);
      }

      const { videoId, uploadUrl } = await initRes.json();

      // ── Step 2: TUS upload directly to Kinescope ──────────────
      const tus = await import('tus-js-client');

      await new Promise((resolve, reject) => {
        const upload = new tus.Upload(file, {
          uploadUrl,                              // TUS endpoint from Kinescope
          chunkSize:   10 * 1024 * 1024,          // 10 MB chunks
          retryDelays: [0, 3000, 5000, 10000, 20000],
          metadata: {
            // IMPORTANT: only ASCII — no cyrillic in TUS headers/metadata
            filename: toAsciiFn(file.name),
            filetype: file.type,
          },
          onProgress(bytesUploaded, bytesTotal) {
            setProgress(Math.round((bytesUploaded / bytesTotal) * 100));
          },
          onSuccess() {
            resolve(videoId);
          },
          onError(err) {
            reject(err);
          },
        });

        tusRef.current = upload;

        // uploadUrl mode: a specific TUS endpoint from Kinescope, not a server base URL.
        // findPreviousUploads() / resumeFromPreviousUpload() require `endpoint` (base URL)
        // and are incompatible with `uploadUrl` — they trigger a HEAD request that
        // Kinescope rejects with 400 and the error:
        //   "unable to resume upload (new upload cannot be created without an endpoint)"
        // Solution: start directly, no resume attempt.
        upload.start();
      });

      setPhase('done');
      setProgress(100);
      // Supabase video_status will be updated to 'ready' via webhook.
      // Here we report 'processing' — enough for the UI to reflect progress.
      onComplete?.({ videoId, status: 'processing' });

    } catch (err) {
      if (err?.message?.includes('abort')) {
        setPhase('idle');
        setProgress(0);
      } else {
        console.error('[KinescopeUploader]', err);
        setPhase('error');
        setErrorMsg(err.message || 'Ошибка загрузки');
      }
    }
  }, [lessonId, techniqueVideoId, getToken, onComplete]);

  const handleFile   = useCallback((f) => { if (f) startUpload(f); }, [startUpload]);
  const handleDrop   = useCallback((e) => {
    e.preventDefault(); setDragOver(false);
    handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);
  const handleCancel = useCallback(() => {
    tusRef.current?.abort();
    setPhase('idle');
    setProgress(0);
  }, []);
  const handleRetry  = useCallback(() => {
    setPhase('idle'); setErrorMsg(''); setProgress(0);
  }, []);

  // ── guard: record must exist in DB before upload is allowed ─────────────
  const hasValidId = !!(lessonId || techniqueVideoId);
  if (!hasValidId) {
    return (
      <div style={{
        padding: '12px 14px',
        background: '#faf6ee',
        border: '1px solid #e8dcc8',
        fontSize: 12,
        color: '#999',
      }}>
        Сначала сохраните запись, затем загрузите видео
      </div>
    );
  }

  // ── status badge ─────────────────────────────────────────────────────────
  const StatusBadge = () => {
    if (!currentVideoId) return null;
    const cfg = {
      uploading:  { label: 'Загружается…',   color: C.gold,  bg: C.goldBg  },
      processing: { label: 'Обрабатывается', color: C.gold,  bg: C.goldBg  },
      ready:      { label: '✓ Готово',        color: C.green, bg: C.greenBg },
      error:      { label: '✕ Ошибка',        color: C.red,   bg: C.redBg   },
      none:       { label: 'Не загружено',    color: C.muted, bg: '#f5f5f5' },
    }[currentStatus || 'none'] ?? { label: currentStatus, color: C.muted, bg: '#f5f5f5' };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: cfg.color, background: cfg.bg,
          border: `1px solid ${cfg.color}33`, padding: '2px 8px' }}>
          {cfg.label}
        </span>
        <span style={{ fontSize: 10, color: C.muted, fontFamily: 'monospace' }}>
          {currentVideoId.slice(0, 8)}…
        </span>
      </div>
    );
  };

  // ── idle ──────────────────────────────────────────────────────────────────
  if (phase === 'idle') return (
    <div>
      <StatusBadge />
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onClick={() => fileRef.current?.click()}
        style={{
          border: `2px dashed ${dragOver ? C.gold : C.border}`,
          background: dragOver ? C.goldBg : C.white,
          padding: '18px 14px', textAlign: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <div style={{ fontSize: 20, marginBottom: 6 }}>↑</div>
        <div style={{ fontSize: 12, color: C.dark, marginBottom: 2 }}>
          {currentVideoId ? 'Заменить видео' : 'Загрузить видео в Kinescope'}
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>
          Перетащите или нажмите · MP4, MOV · любой размер
        </div>
        <input ref={fileRef} type="file" accept="video/*"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files?.[0])} />
      </div>
    </div>
  );

  // ── uploading ─────────────────────────────────────────────────────────────
  if (phase === 'uploading') return (
    <div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>
        Загружается напрямую в Kinescope… {progress}%
      </div>
      <div style={{ height: 4, background: '#e8e0d0', borderRadius: 2,
        marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: C.gold,
          transition: 'width 0.3s ease', borderRadius: 2 }} />
      </div>
      <button onClick={handleCancel}
        style={{ fontSize: 11, color: C.muted, background: 'none',
          border: `1px solid ${C.border}`, padding: '4px 12px', cursor: 'pointer' }}>
        Отмена
      </button>
    </div>
  );

  // ── done ──────────────────────────────────────────────────────────────────
  if (phase === 'done') return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', background: C.greenBg, border: `1px solid ${C.greenBorder}` }}>
      <span style={{ color: C.green, fontSize: 14 }}>✓</span>
      <div>
        <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Файл загружен</div>
        <div style={{ fontSize: 11, color: C.muted }}>Kinescope обрабатывает — 2–5 минут</div>
      </div>
      <button onClick={handleRetry}
        style={{ marginLeft: 'auto', fontSize: 11, color: C.muted,
          background: 'none', border: `1px solid ${C.border}`,
          padding: '4px 10px', cursor: 'pointer' }}>
        Заменить
      </button>
    </div>
  );

  // ── error ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '10px 14px', background: C.redBg,
      border: `1px solid ${C.redBorder}` }}>
      <div style={{ fontSize: 12, color: C.red, marginBottom: 6 }}>
        Ошибка: {errorMsg}
      </div>
      <button onClick={handleRetry}
        style={{ fontSize: 11, color: C.dark, background: C.white,
          border: `1px solid ${C.border}`, padding: '5px 12px', cursor: 'pointer' }}>
        Попробовать снова
      </button>
    </div>
  );
}
