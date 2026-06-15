'use client';

import { useState, useEffect, useCallback } from 'react';
import { C, F } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import KinescopePlayer from '@/components/KinescopePlayer';
import { MobileBottomNav } from '@/components/BottomNav';
import ReactMarkdown from 'react-markdown';

export default function KnowledgeItemPage({ nav, itemId, viewerId }) {
  const isMobile = useIsMobile();
  const [item,     setItem]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  // ── Comments ──────────────────────────────────────────────
  const [apiComments,  setApiComments]  = useState(null);
  const [commentText,  setCommentText]  = useState('');
  const [submitting,   setSubmitting]   = useState(false);

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

  useEffect(() => {
    if (!itemId) return;
    fetch(`/api/knowledge-comments?item_id=${itemId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setApiComments(data); })
      .catch(() => {});
  }, [itemId]);

  const submitComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/knowledge-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, text: trimmed }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setApiComments(prev => [...(prev || []), newComment]);
        setCommentText('');
      }
    } catch {}
    setSubmitting(false);
  }, [commentText, itemId, submitting]);

  const itemComments = apiComments ?? [];

  if (loading) return (
    <div style={{
      minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: C.muted, fontFamily: F.mono, fontSize: 11,
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
      <div style={{ fontFamily: F.serif, fontSize: 18, color: C.muted }}>
        Материал не найден
      </div>
      <button
        onClick={nav.back}
        style={{
          fontFamily: F.mono, fontSize: 11, letterSpacing: '0.2em',
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
            fontSize: 24, color: C.accent, padding: '0 4px',
            display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44,
          }}>‹</button>
          <span style={{
            fontFamily: F.mono, fontSize: 11, letterSpacing: '0.18em',
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
              onClick={nav.back}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: F.mono, fontSize: 11, letterSpacing: '0.18em',
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
              fontFamily: F.serif,
              fontSize: 18, color: C.muted,
              marginTop: 16, lineHeight: 1.55,
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

        {/* Content — Markdown с поддержкой картинок */}
        {item.content && (
          <div style={{ fontFamily: F.serif, fontSize: isMobile ? 18 : 19, fontWeight: 400, lineHeight: 1.75, color: C.ink2 }}>
            <ReactMarkdown
              components={{
                p:      ({children}) => <p style={{marginBottom:'1em'}}>{children}</p>,
                h1:     ({children}) => <h1 style={{fontFamily:F.serif,fontSize:isMobile?28:36,color:C.ink,margin:'1.4em 0 0.5em',fontWeight:400}}>{children}</h1>,
                h2:     ({children}) => <h2 style={{fontFamily:F.serif,fontSize:isMobile?22:28,color:C.ink,margin:'1.2em 0 0.4em',fontWeight:400}}>{children}</h2>,
                h3:     ({children}) => <h3 style={{fontFamily:F.mono,fontSize:13,letterSpacing:'0.12em',color:C.muted,textTransform:'uppercase',margin:'1em 0 0.3em'}}>{children}</h3>,
                strong: ({children}) => <strong style={{color:C.ink,fontWeight:600}}>{children}</strong>,
                em:     ({children}) => <em style={{fontStyle:'italic'}}>{children}</em>,
                ul:     ({children}) => <ul style={{paddingLeft:24,marginBottom:'1em'}}>{children}</ul>,
                ol:     ({children}) => <ol style={{paddingLeft:24,marginBottom:'1em'}}>{children}</ol>,
                li:     ({children}) => <li style={{marginBottom:'0.3em'}}>{children}</li>,
                blockquote: ({children}) => (
                  <blockquote style={{borderLeft:`3px solid ${C.accent}`,paddingLeft:16,margin:'1em 0',color:C.muted,fontStyle:'italic'}}>
                    {children}
                  </blockquote>
                ),
                img: ({src, alt}) => (
                  <span style={{display:'block',margin:'1.5em 0'}}>
                    <img src={src} alt={alt||''} style={{maxWidth:'100%',height:'auto',display:'block'}}/>
                    {alt && <span style={{display:'block',marginTop:6,fontFamily:F.mono,fontSize:11,color:C.muted,letterSpacing:'0.08em'}}>{alt}</span>}
                  </span>
                ),
                a: ({href, children}) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" style={{color:C.accent,textDecoration:'underline'}}>
                    {children}
                  </a>
                ),
                hr: () => <hr style={{border:'none',borderTop:`1px solid ${C.border}`,margin:'2em 0'}}/>,
              }}
            >
              {item.content}
            </ReactMarkdown>
          </div>
        )}

        {/* Файловые вложения — галерея под текстом */}
        {(item.attachments || []).filter(a => a.type === 'file').length > 0 && (
          <div style={{marginTop:32}}>
            <div style={{fontFamily:F.mono,fontSize:11,letterSpacing:'0.18em',color:C.muted,textTransform:'uppercase',marginBottom:12}}>
              МАТЕРИАЛЫ
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {(item.attachments||[]).filter(a=>a.type==='file').map(att => (
                <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                  style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',border:`1px solid ${C.border}`,background:C.surface,textDecoration:'none',color:C.ink}}>
                  <span style={{fontSize:20}}>📄</span>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:F.mono,fontSize:13,color:C.ink,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{att.name}</div>
                    {att.size && <div style={{fontFamily:F.mono,fontSize:11,color:C.muted,marginTop:2}}>
                      {att.size < 1024*1024 ? Math.round(att.size/1024)+'КБ' : (att.size/1024/1024).toFixed(1)+'МБ'}
                    </div>}
                  </div>
                  <span style={{fontFamily:F.mono,fontSize:11,color:C.accent}}>↓</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ── Comments ── */}
        <div style={{ marginTop: isMobile ? 40 : 64, paddingTop: 28, borderTop: `1px solid ${C.border}` }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 16, flexWrap: 'wrap', gap: 8,
          }}>
            <div style={{
              fontFamily: F.mono, fontSize: 11,
              letterSpacing: '0.22em', color: C.muted, textTransform: 'uppercase',
            }}>
              ОБСУЖДЕНИЕ · {itemComments.length}
            </div>
            {!isMobile && (
              <span style={{
                fontFamily: F.serif, fontSize: 15, color: C.muted,
              }}>Сэнсэй отвечает в течение 24 часов</span>
            )}
          </div>

          {/* Comments list */}
          {itemComments.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, marginBottom: 14 }}>
              {itemComments.map((c, i) => (
                <div key={c.id}>
                  <div style={{
                    display: 'flex', gap: 14,
                    padding: isMobile ? '16px 16px' : '18px 20px',
                    borderBottom: (c.replies && c.replies.length > 0)
                      ? `1px solid ${C.border}`
                      : (i < itemComments.length - 1 ? `1px solid ${C.border}` : 'none'),
                    background: c.role === 'sensei' ? C.bg2 : 'transparent',
                  }}>
                    <div style={{
                      width: isMobile ? 32 : 36, height: isMobile ? 32 : 36,
                      borderRadius: '50%', flexShrink: 0,
                      background: c.role === 'sensei' ? C.accent : C.bg2,
                      color: c.role === 'sensei' ? '#fff' : C.ink2,
                      border: c.role === 'sensei' ? 'none' : `1px solid ${C.border}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: F.serif,
                      fontSize: isMobile ? 14 : 16,
                    }}>{c.avatar}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isMobile ? 4 : 6, flexWrap: 'wrap' }}>
                        <span style={{
                          fontFamily: F.mono, fontSize: isMobile ? 12 : 13,
                          color: C.ink, fontWeight: 500,
                        }}>{c.author}</span>
                        {c.role === 'sensei' && (
                          <span style={{
                            fontFamily: F.mono, fontSize: 11, color: C.accent,
                            letterSpacing: '0.18em', textTransform: 'uppercase',
                            padding: '1px 7px', border: `1px solid ${C.accent}`,
                          }}>СЭНСЭЙ</span>
                        )}
                        <span style={{
                          marginLeft: 'auto', fontFamily: F.mono,
                          fontSize: isMobile ? 9 : 10, color: C.muted,
                        }}>{c.date}</span>
                      </div>
                      <div style={{
                        fontFamily: F.mono, fontSize: 18,
                        color: C.ink2, lineHeight: 1.6,
                      }}>{c.text}</div>
                    </div>
                  </div>
                  {/* Admin replies */}
                  {c.replies && c.replies.map((r, ri) => (
                    <div key={`reply-${r.id}`} style={{
                      display: 'flex', gap: 14,
                      padding: isMobile ? '14px 16px 14px 32px' : '16px 20px 16px 36px',
                      borderBottom: (ri < c.replies.length - 1 || i < itemComments.length - 1)
                        ? `1px solid ${C.border}` : 'none',
                      background: C.bg2, borderLeft: `3px solid ${C.accent}`,
                    }}>
                      <div style={{
                        width: isMobile ? 28 : 32, height: isMobile ? 28 : 32,
                        borderRadius: '50%', flexShrink: 0,
                        background: C.accent, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: F.serif,
                        fontSize: isMobile ? 13 : 15,
                      }}>{r.avatar}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: F.mono, fontSize: 13, color: C.ink, fontWeight: 500 }}>{r.author}</span>
                          <span style={{ fontFamily: F.mono, fontSize: 11, color: C.accent, letterSpacing: '0.18em', textTransform: 'uppercase', padding: '1px 7px', border: `1px solid ${C.accent}` }}>СЭНСЭЙ</span>
                          <span style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: isMobile ? 9 : 10, color: C.muted }}>{r.date}</span>
                        </div>
                        <div style={{ fontFamily: F.mono, fontSize: 18, color: C.ink2, lineHeight: 1.6 }}>{r.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {itemComments.length === 0 && (
            <div style={{
              padding: '20px', background: C.surface, border: `1px solid ${C.border}`,
              marginBottom: 14, fontFamily: F.serif,
              fontSize: 18, color: C.muted, textAlign: 'center',
            }}>Комментариев пока нет. Будьте первым!</div>
          )}

          {/* Comment input */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              flex: 1, background: C.surface, border: `1px solid ${C.border}`,
              padding: '12px 14px',
            }}>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Задать вопрос сэнсэю или другим студентам…"
                rows={isMobile ? 2 : 1}
                style={{
                  width: '100%', border: 'none', outline: 'none',
                  background: 'transparent', resize: 'none',
                  fontFamily: F.serif,
                  fontSize: 18, color: C.ink, lineHeight: 1.6,
                }}
              />
            </div>
            <button
              onClick={submitComment}
              disabled={!commentText.trim() || submitting}
              style={{
                padding: '12px 20px',
                background: (commentText.trim() && !submitting) ? C.ink : C.border,
                color: (commentText.trim() && !submitting) ? '#fff' : C.muted,
                border: 'none',
                fontFamily: F.mono, fontSize: 13,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                cursor: (commentText.trim() && !submitting) ? 'pointer' : 'default',
                transition: 'all 0.15s', flexShrink: 0, alignSelf: 'stretch',
              }}>{submitting ? 'Отправляет…' : 'Отправить'}</button>
          </div>
        </div>

        {/* Back link (desktop) */}
        {!isMobile && (
          <div style={{ marginTop: 48 }}>
            <button
              onClick={nav.back}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: F.mono, fontSize: 11, letterSpacing: '0.18em',
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
