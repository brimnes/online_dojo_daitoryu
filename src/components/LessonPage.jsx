'use client';

import { useState, useEffect } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { useMonths, useLessons } from '@/lib/db';
import KinescopePlayer from '@/components/KinescopePlayer';
import Sidebar from '@/components/Sidebar';

export default function LessonPage({
  nav, monthId, lessonId,
  watched, toggleWatched,
  comments, addComment,
  viewerId,
  user = {}, onLogout,
}) {
  const isMobile = useIsMobile();
  const { months } = useMonths();
  const { lessons, reload } = useLessons(monthId);

  useEffect(() => { reload?.(); }, [monthId]); // eslint-disable-line

  const month       = months.find(m => m.id === monthId);
  const lessonIndex = lessons.findIndex(l => l.id === lessonId);
  const lesson      = lessons[lessonIndex];
  const isWatched   = !!watched[lessonId];
  const lessonComments = comments[lessonId] || [];

  const [commentText, setCommentText] = useState('');

  const prevLesson = lessonIndex > 0                  ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  if (!lesson) return null;

  // Breadcrumb helpers
  const monthLabel  = month?.label?.toUpperCase() || '';
  const lessonNum   = String(lesson.num).padStart(2, '0');
  const totalLessons = lessons.length;
  // Kanji for "第5課"
  const KANJI_NUMS = ['一','二','三','四','五','六','七','八','九','十'];
  const numKanji = lesson.num <= 10 ? KANJI_NUMS[lesson.num - 1] : lesson.num;

  return (
    <div className="fade" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Dark sidebar (desktop only) ── */}
      {!isMobile && (
        <Sidebar activeTab="months" onTabClick={() => nav.dashboard()} user={user} onLogout={onLogout} />
      )}

      {/* ── Page content ── */}
      <div style={{ flex: 1, background: C.bg, minHeight: '100vh' }}>

        {/* ── Mobile sticky header ── */}
        {isMobile && (
          <header style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
            background: C.surface, borderBottom: `1px solid ${C.border}`,
            position: 'sticky', top: 0, zIndex: 50,
          }}>
            <button onClick={nav.back} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 24, color: C.accent, padding: '0 4px',
              display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44,
            }}>‹</button>
            <span style={{
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: '0.12em', color: C.ink, flex: 1,
              textTransform: 'uppercase',
            }}>УРОК {lessonNum} / {totalLessons}</span>
            <button style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: C.muted, minWidth: 36, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⋯</button>
          </header>
        )}

        {/* ── Desktop breadcrumb ── */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '20px 48px', borderBottom: `1px solid ${C.border}`, background: C.surface,
          }}>
            <button onClick={nav.back} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "var(--font-jost), 'Jost', sans-serif",
              fontSize: 11, letterSpacing: '0.1em', color: C.accent,
              textTransform: 'uppercase', padding: 0,
            }}>← {monthLabel} 2026</button>
            <span style={{ color: C.border }}>/</span>
            <span style={{
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              fontSize: 10, color: C.muted, letterSpacing: '0.12em',
            }}>УРОК {lessonNum} / {totalLessons}</span>
            <span style={{
              marginLeft: 'auto',
              fontFamily: "'Noto Serif JP', var(--font-noto), serif",
              fontSize: 12, color: C.muted, letterSpacing: '0.18em',
            }}>{month?.kanji} · 第{numKanji}課</span>
          </div>
        )}

        {/* ── Two-column grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
          gap: 0,
          minHeight: isMobile ? 'auto' : 'calc(100vh - 65px)',
        }}>

          {/* ── LEFT: player + content ── */}
          <div style={{ padding: isMobile ? '0 0 60px' : '36px 48px' }}>

            {/* Hero: Eyebrow + Title + Subtitle */}
            <div style={{ padding: isMobile ? '20px 18px 0' : 0, marginBottom: isMobile ? 16 : 24 }}>
              {/* Eyebrow */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                fontSize: 9, letterSpacing: '0.24em', color: C.muted,
                textTransform: 'uppercase', marginBottom: isMobile ? 8 : 12,
              }}>
                <span style={{ color: C.accent, fontWeight: 600 }}>{lessonNum}</span>
                <span>·</span>
                <span>УРОК · {monthLabel} 2026</span>
              </div>

              {/* Title */}
              <div style={{
                fontFamily: "var(--font-cormorant-sc), var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: isMobile ? 22 : 36, letterSpacing: '0.04em',
                color: C.ink, fontWeight: 500, lineHeight: 1.05,
                marginBottom: isMobile ? 6 : 8,
              }}>{lesson.title?.toUpperCase()}</div>

              {/* Subtitle */}
              {lesson.subtitle && (
                <div style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontStyle: 'italic', fontSize: isMobile ? 14 : 16,
                  color: C.muted,
                }}>{lesson.subtitle}</div>
              )}
            </div>

            {/* ── Video player ── */}
            <KinescopePlayer
              videoId={lesson.video_id}
              videoStatus={lesson.video_status}
              viewerId={viewerId}
              posterUrl={lesson.video_poster_url}
              title={lesson.title}
              duration={lesson.duration}
            />

            {/* ── Meta strip below player ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: isMobile ? '12px 18px' : '14px 0',
              borderBottom: `1px solid ${C.border}`,
              flexWrap: 'wrap', gap: 10,
              background: isMobile ? C.surface : 'transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24 }}>
                {lesson.duration && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.accent, flexShrink: 0 }} />
                    <span style={{
                      fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                      fontSize: 10, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase',
                    }}>{lesson.duration} · 1080P</span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Конспект / download */}
                <button style={{
                  background: 'none', border: `1px solid ${C.border}`,
                  padding: '9px 16px',
                  fontFamily: "var(--font-jost), 'Jost', sans-serif",
                  fontSize: 11, letterSpacing: '0.1em', color: C.muted,
                  cursor: 'pointer', textTransform: 'uppercase',
                }}>↓ Конспект</button>
                {/* Watched button */}
                <button
                  onClick={() => toggleWatched(lessonId)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 18px',
                    background: isWatched ? C.ink : C.ink,
                    border: `1px solid ${isWatched ? C.ink : C.ink}`,
                    color: '#fff',
                    fontFamily: "var(--font-jost), 'Jost', sans-serif",
                    fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase',
                    cursor: 'pointer', transition: 'all 0.2s',
                    opacity: isWatched ? 0.7 : 1,
                    width: isMobile ? '100%' : 'auto',
                  }}>
                  {isWatched ? '✓ ПРОСМОТРЕНО' : '✓ ОТМЕТИТЬ ПРОСМОТРЕННЫМ'}
                </button>
              </div>
            </div>

            {/* ── Content area ── */}
            <div style={{ paddingTop: isMobile ? 0 : 28 }}>

              {/* Description */}
              {lesson.text && (
                <div style={{ padding: isMobile ? '20px 18px' : 0, marginBottom: isMobile ? 0 : 32 }}>
                  <div style={{
                    fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                    fontSize: 9, letterSpacing: '0.22em', color: C.muted,
                    textTransform: 'uppercase', marginBottom: 14,
                  }}>ОПИСАНИЕ</div>
                  <p style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                    fontSize: isMobile ? 17 : 19, lineHeight: 1.75,
                    color: C.ink2, margin: 0,
                    borderLeft: `2px solid ${C.accent}`, paddingLeft: 22,
                  }}>{lesson.text}</p>
                </div>
              )}

              {/* ── Comments ── */}
              <div style={{ padding: isMobile ? '20px 18px' : 0, marginTop: isMobile ? 0 : 40 }}>
                <div style={{
                  display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
                  marginBottom: 16, flexWrap: 'wrap', gap: 8,
                }}>
                  <div style={{
                    fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                    fontSize: 9, letterSpacing: '0.22em', color: C.muted, textTransform: 'uppercase',
                  }}>
                    ОБСУЖДЕНИЕ · {lessonComments.length}
                  </div>
                  {!isMobile && (
                    <span style={{
                      fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                      fontStyle: 'italic', fontSize: 12, color: C.muted,
                    }}>Сэнсэй отвечает в течение 24 часов</span>
                  )}
                </div>

                {/* Comments list */}
                {lessonComments.length > 0 && (
                  <div style={{ background: C.surface, border: `1px solid ${C.border}`, marginBottom: 14 }}>
                    {lessonComments.map((c, i) => (
                      <div key={c.id} style={{
                        display: 'flex', gap: 14, padding: isMobile ? '16px 16px' : '18px 20px',
                        borderBottom: i < lessonComments.length - 1 ? `1px solid ${C.hairline2}` : 'none',
                        background: c.role === 'sensei' ? C.bg2 : 'transparent',
                      }}>
                        <div style={{
                          width: isMobile ? 32 : 36, height: isMobile ? 32 : 36,
                          borderRadius: '50%', flexShrink: 0,
                          background: c.role === 'sensei' ? C.accent : C.bg2,
                          color: c.role === 'sensei' ? '#fff' : C.ink2,
                          border: c.role === 'sensei' ? 'none' : `1px solid ${C.border}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                          fontStyle: 'italic', fontSize: isMobile ? 14 : 16,
                        }}>{c.avatar}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: isMobile ? 4 : 6, flexWrap: 'wrap' }}>
                            <span style={{
                              fontFamily: "var(--font-jost), 'Jost', sans-serif",
                              fontSize: isMobile ? 12 : 13, color: C.ink, fontWeight: 500,
                            }}>{c.author}</span>
                            {c.role === 'sensei' && (
                              <span style={{
                                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                                fontSize: 9, color: C.accent, letterSpacing: '0.18em',
                                textTransform: 'uppercase', padding: '1px 7px',
                                border: `1px solid ${C.accent}`,
                              }}>СЭНСЭЙ</span>
                            )}
                            <span style={{
                              marginLeft: 'auto',
                              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                              fontSize: isMobile ? 9 : 10, color: C.muted,
                            }}>{c.date}</span>
                          </div>
                          <div style={{
                            fontFamily: "var(--font-jost), 'Jost', sans-serif",
                            fontSize: isMobile ? 13 : 14, color: C.ink2, lineHeight: 1.55,
                          }}>{c.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {lessonComments.length === 0 && (
                  <div style={{
                    padding: '20px', background: C.surface, border: `1px solid ${C.border}`,
                    marginBottom: 14,
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                    fontStyle: 'italic', fontSize: 14, color: C.muted, textAlign: 'center',
                  }}>Комментариев пока нет. Будьте первым!</div>
                )}

                {/* Comment input */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{
                    flex: 1, background: C.surface, border: `1px solid ${C.border}`,
                    padding: '12px 14px', position: 'relative',
                  }}>
                    <textarea
                      value={commentText}
                      onChange={e => setCommentText(e.target.value)}
                      placeholder="Задать вопрос сэнсэю или другим студентам…"
                      rows={isMobile ? 2 : 1}
                      style={{
                        width: '100%', border: 'none', outline: 'none',
                        background: 'transparent', resize: 'none',
                        fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                        fontStyle: 'italic', fontSize: 14, color: C.ink, lineHeight: 1.5,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => { if (commentText.trim()) { addComment(lessonId, commentText); setCommentText(''); } }}
                    disabled={!commentText.trim()}
                    style={{
                      padding: '12px 20px', background: commentText.trim() ? C.ink : C.border,
                      color: commentText.trim() ? '#fff' : C.muted,
                      border: 'none',
                      fontFamily: "var(--font-jost), 'Jost', sans-serif",
                      fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase',
                      cursor: commentText.trim() ? 'pointer' : 'default',
                      transition: 'all 0.15s', flexShrink: 0,
                      alignSelf: 'stretch',
                    }}>Отправить</button>
                </div>
              </div>

              {/* Mobile prev/next navigation */}
              {isMobile && (prevLesson || nextLesson) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, margin: '0 18px', background: C.border }}>
                  {prevLesson ? (
                    <div onClick={() => nav.lesson(monthId, prevLesson.id)}
                      style={{ background: C.surface, padding: '14px 14px', cursor: 'pointer' }}>
                      <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>← ПРЕДЫДУЩИЙ</div>
                      <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 13, color: C.ink, fontWeight: 500, lineHeight: 1.3 }}>{prevLesson.title}</div>
                    </div>
                  ) : <div style={{ background: C.surface }} />}
                  {nextLesson ? (
                    <div onClick={() => nav.lesson(monthId, nextLesson.id)}
                      style={{ background: C.surface, padding: '14px 14px', cursor: 'pointer', textAlign: 'right' }}>
                      <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 9, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>СЛЕДУЮЩИЙ →</div>
                      <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 13, color: C.ink, fontWeight: 500, lineHeight: 1.3 }}>{nextLesson.title}</div>
                    </div>
                  ) : <div style={{ background: C.surface }} />}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: lessons list (desktop only) ── */}
          {!isMobile && (
            <aside style={{
              borderLeft: `1px solid ${C.border}`,
              padding: '36px 28px',
              background: C.surface,
              position: 'sticky', top: 0,
              height: 'calc(100vh - 65px)',
              overflowY: 'auto',
            }}>
              <div style={{
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                fontSize: 9, letterSpacing: '0.22em', color: C.muted,
                textTransform: 'uppercase', marginBottom: 16,
              }}>УРОКИ · {monthLabel}</div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {lessons.map((l, i) => {
                  const isCur  = l.id === lessonId;
                  const isDone = !!watched[l.id] && !isCur;
                  return (
                    <div
                      key={l.id}
                      onClick={() => nav.lesson(monthId, l.id)}
                      style={{
                        display: 'flex', gap: 12, padding: '12px 0',
                        borderBottom: i < lessons.length - 1 ? `1px solid ${C.hairline2}` : 'none',
                        cursor: 'pointer',
                        marginLeft: isCur ? -16 : 0, paddingLeft: isCur ? 16 : 0,
                        borderLeft: `2px solid ${isCur ? C.accent : 'transparent'}`,
                        background: isCur ? `linear-gradient(90deg, ${C.bg2}, transparent)` : 'transparent',
                        transition: 'background 0.1s',
                      }}
                      onMouseEnter={e => !isCur && (e.currentTarget.style.background = C.bg2)}
                      onMouseLeave={e => !isCur && (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Number / checkmark */}
                      <span style={{
                        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                        fontSize: 11, minWidth: 22, flexShrink: 0,
                        color: isDone ? '#4a8a5a' : isCur ? C.accent : C.muted,
                        letterSpacing: '0.04em',
                      }}>
                        {isDone ? '✓' : String(l.num || i + 1).padStart(2, '0')}
                      </span>
                      {/* Title + duration */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontFamily: "var(--font-jost), 'Jost', sans-serif",
                          fontSize: 13, color: isCur ? C.ink : C.ink2,
                          fontWeight: isCur ? 600 : 400, lineHeight: 1.35,
                          overflow: 'hidden', textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>{l.title}</div>
                        {l.duration && (
                          <div style={{
                            fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                            fontSize: 10, color: C.muted, letterSpacing: '0.06em', marginTop: 2,
                          }}>{l.duration}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
