'use client';

import { useState, useEffect } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { useMonths, useLessons } from '@/lib/db';
import KinescopePlayer from '@/components/KinescopePlayer';


export default function LessonPage({ nav, monthId, lessonId, watched, toggleWatched, comments, addComment, viewerId }) {
  const isMobile = useIsMobile();
  const { months } = useMonths();
  const { lessons, reload } = useLessons(monthId);

  // Перезагружаем при каждом открытии — чтобы видеть правки из AdminPanel
  useEffect(() => { reload?.(); }, [monthId]);

  const month        = months.find(m => m.id === monthId);
  const lessonIndex  = lessons.findIndex(l => l.id === lessonId);
  const lesson       = lessons[lessonIndex];
  const isWatched    = !!watched[lessonId];
  const lessonComments = comments[lessonId] || [];

  const [commentText, setCommentText] = useState('');

  const prevLesson = lessonIndex > 0                  ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  if (!lesson) return null;

  // ── Мобильный хедер (общий шаблон) ──────────────────────────────
  const MobileHeader = ({ title, onBack }) => (
    <header style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
      background: '#0a0807',
      borderBottom: '1px solid #1f1a16',
      position: 'sticky', top: 0, zIndex: 50,
    }}>
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 22, color: '#b8923a', padding: '0 4px',
          display: 'flex', alignItems: 'center',
          minWidth: 36, minHeight: 44,
        }}
      >‹</button>
      <span style={{
        fontFamily: "var(--font-arkhip), system-ui, sans-serif",
        fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ede5d3', flex: 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{title}</span>
    </header>
  );

  return (
    <div className="fade" style={{ minHeight: '100vh', background: '#f0ebe0' }}>

      {/* ── Мобильный хедер ── */}
      {isMobile && (
        <MobileHeader
          title={`Урок ${lesson.num}. ${lesson.title}`}
          onBack={nav.back}
        />
      )}

      <div style={{ padding: isMobile ? '0 0 40px' : '32px 40px', maxWidth: 1000, margin: '0 auto' }}>

        {/* Десктопный breadcrumb */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
            <button onClick={nav.dashboard} style={{ background: 'none', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, letterSpacing: '0.1em', color: '#9a8860', cursor: 'pointer', padding: '4px 0', minHeight: 44 }}>← Месяцы</button>
            <span style={{ color: '#d2c7b0' }}>/</span>
            <button onClick={nav.back} style={{ background: 'none', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, letterSpacing: '0.1em', color: '#9a8860', cursor: 'pointer', padding: '4px 0', minHeight: 44 }}>{month?.label}</button>
            <span style={{ color: '#d2c7b0' }}>/</span>
            <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#6f6452', letterSpacing: '0.06em' }}>Урок {lesson.num}</span>
          </div>
        )}

        {/* Заголовок урока */}
        <div style={{ marginBottom: isMobile ? 0 : 28, padding: isMobile ? '16px 16px 0' : 0 }}>
          {/* Метаданные */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 11 : 9, letterSpacing: '0.22em', color: '#b0a080', fontWeight: 600 }}>
              {String(lesson.num).padStart(2, '0')}
            </span>
            <span style={{ color: '#d2c7b0', fontSize: 9 }}>·</span>
            <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 11 : 9, color: '#9a8860', letterSpacing: '0.1em' }}>{lesson.duration}</span>
            <span style={{ color: '#d2c7b0', fontSize: 9 }}>·</span>
            <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 11 : 9, color: '#9a8860', letterSpacing: '0.1em' }}>{month?.label} 2026</span>
          </div>

          {/* Название + кнопка «Просмотрено» */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: isMobile ? 'wrap' : 'nowrap', marginBottom: isMobile ? 14 : 0 }}>
            <div>
              <h1 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 22 : 30, letterSpacing: '0.02em', color: '#15120e', marginBottom: 8, lineHeight: 1.15 }}>
                {lesson.title}
              </h1>
              <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 14 : 15, color: '#7a6e5a' }}>{lesson.subtitle}</div>
            </div>
            <button
              onClick={() => toggleWatched(lessonId)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '11px 18px',
                background: isWatched ? '#3a8a5a' : 'transparent',
                border: `1px solid ${isWatched ? '#3a8a5a' : C.border}`,
                color: isWatched ? '#fff' : C.muted,
                fontSize: isMobile ? 14 : 12,
                cursor: 'pointer', transition: 'all 0.2s',
                flexShrink: 0, whiteSpace: 'nowrap',
                minHeight: 44,
                width: isMobile ? '100%' : 'auto',
              }}>
              {isWatched ? '✓ Просмотрено' : 'Отметить просмотренным'}
            </button>
          </div>
        </div>

        {/* Видеоплеер */}
        <div style={{ position: 'relative' }}>
          <KinescopePlayer
            videoId={lesson.video_id}
            videoStatus={lesson.video_status}
            viewerId={viewerId}
            posterUrl={lesson.video_poster_url}
            title={lesson.title}
            duration={lesson.duration}
          />
          {isWatched && (
            <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(58,138,90,0.85)', padding: '3px 10px', fontSize: 10, color: '#fff', letterSpacing: 0.5 }}>
              ПРОСМОТРЕНО
            </div>
          )}
        </div>

        {/* Контент: описание + сайдбар */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 280px',
          gap: isMobile ? 0 : 24,
          marginBottom: isMobile ? 0 : 24,
          marginTop: isMobile ? 0 : 24,
        }}>
          {/* Описание */}
          <div style={{ background: '#fff', border: isMobile ? 'none' : `1px solid ${C.border}`, borderTop: `1px solid ${C.border}`, padding: isMobile ? '20px 16px' : '28px 30px' }}>
            <div style={{ fontSize: isMobile ? 11 : 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>О УРОКЕ</div>
            <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 17 : 17, color: '#444', lineHeight: 1.9 }}>{lesson.text}</p>
          </div>

          {/* Сайдбар */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: isMobile ? 0 : 12 }}>
            {/* Урок в программе */}
            <div style={{
              background: '#fff', border: `1px solid ${C.border}`,
              borderTop: isMobile ? 'none' : `1px solid ${C.border}`,
              borderLeft: isMobile ? 'none' : `1px solid ${C.border}`,
              padding: isMobile ? '16px' : '20px',
              flex: isMobile ? 1 : 'none',
            }}>
              <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>ПРОГРАММА</div>
              <div style={{ fontSize: isMobile ? 14 : 13, color: C.dark, marginBottom: 3 }}>{month?.label} 2026</div>
              <div style={{ fontSize: isMobile ? 13 : 12, color: C.muted, marginBottom: 10 }}>{lesson.num} из {lessons.length}</div>
              <div style={{ height: 2, background: '#e8e0d0', borderRadius: 2 }}>
                <div style={{ height: '100%', width: `${lessons.length ? (lesson.num / lessons.length) * 100 : 0}%`, background: C.gold }} />
              </div>
            </div>

            {/* Сэнсэй */}
            {!isMobile && (
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, padding: '20px' }}>
                <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>СЭНСЭЙ</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: C.light, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: C.gold, flexShrink: 0 }}>К</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: C.dark }}>Сэнсэй Копин</div>
                    <div style={{ fontSize: 11, color: C.muted }}>Дайто-рю Айкидзюдзюцу</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Навигация по урокам (Пред/След) */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2,
          marginBottom: isMobile ? 0 : 28,
          marginTop: isMobile ? 0 : 0,
        }}>
          {prevLesson ? (
            <div
              onClick={() => nav.lesson(monthId, prevLesson.id)}
              style={{ background: '#fff', border: `1px solid ${C.border}`, borderTop: 'none', padding: isMobile ? '14px 16px' : '16px 20px', cursor: 'pointer' }}
              onMouseEnter={e => !isMobile && (e.currentTarget.style.background = C.light)}
              onMouseLeave={e => !isMobile && (e.currentTarget.style.background = '#fff')}>
              <div style={{ fontSize: isMobile ? 11 : 10, color: C.muted, marginBottom: 4, letterSpacing: 0.5 }}>← ПРЕДЫДУЩИЙ</div>
              <div style={{ fontSize: isMobile ? 14 : 14, color: C.dark, fontWeight: 500 }}>{prevLesson.title}</div>
            </div>
          ) : <div />}
          {nextLesson ? (
            <div
              onClick={() => nav.lesson(monthId, nextLesson.id)}
              style={{ background: '#fff', border: `1px solid ${C.border}`, borderTop: 'none', borderLeft: 'none', padding: isMobile ? '14px 16px' : '16px 20px', cursor: 'pointer', textAlign: 'right' }}
              onMouseEnter={e => !isMobile && (e.currentTarget.style.background = C.light)}
              onMouseLeave={e => !isMobile && (e.currentTarget.style.background = '#fff')}>
              <div style={{ fontSize: isMobile ? 11 : 10, color: C.muted, marginBottom: 4, letterSpacing: 0.5 }}>СЛЕДУЮЩИЙ →</div>
              <div style={{ fontSize: isMobile ? 14 : 14, color: C.dark, fontWeight: 500 }}>{nextLesson.title}</div>
            </div>
          ) : <div />}
        </div>

        {/* Комментарии */}
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderTop: 'none', padding: isMobile ? '20px 16px' : '28px 30px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 17 : 18, color: '#c8a84a' }}>Обсуждение</div>
            <span style={{ fontSize: isMobile ? 12 : 11, color: C.muted }}>{lessonComments.length} комментариев</span>
          </div>

          {/* Форма ввода */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.light, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.gold, flexShrink: 0 }}>У</div>
            <div style={{ flex: 1 }}>
              <textarea
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Задайте вопрос или оставьте заметку к уроку…"
                rows={3}
                style={{ width: '100%', border: `1px solid ${C.border}`, padding: '12px 14px', fontSize: isMobile ? 15 : 13, color: C.dark, background: '#fafaf8', resize: 'vertical', outline: 'none', lineHeight: 1.6, fontFamily: "var(--font-jost), 'Jost', sans-serif" }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  onClick={() => { addComment(lessonId, commentText); setCommentText(''); }}
                  disabled={!commentText.trim()}
                  style={{ padding: '9px 22px', background: commentText.trim() ? C.dark : '#e0e0e0', color: commentText.trim() ? '#fff' : '#bbb', border: 'none', fontSize: isMobile ? 14 : 12, cursor: commentText.trim() ? 'pointer' : 'default', transition: 'all 0.15s', minHeight: 40 }}>
                  Отправить
                </button>
              </div>
            </div>
          </div>

          {/* Список комментариев */}
          {lessonComments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: '#bbb', fontSize: isMobile ? 14 : 13 }}>
              Комментариев пока нет. Будьте первым!
            </div>
          ) : (
            <div>
              {lessonComments.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', gap: 14, padding: '16px 0', borderTop: i > 0 ? '1px solid #f5f2ec' : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: c.role === 'sensei' ? C.light : '#f0f0ee', border: `1px solid ${c.role === 'sensei' ? C.goldBorder : '#e0e0e0'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: c.role === 'sensei' ? C.gold : '#888', flexShrink: 0 }}>
                    {c.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: isMobile ? 14 : 13, fontWeight: 600, color: C.dark }}>{c.author}</span>
                      {c.role === 'sensei' && (
                        <span style={{ fontSize: 9, color: C.gold, background: C.light, border: `1px solid ${C.goldBorder}`, padding: '1px 7px', letterSpacing: 1, textTransform: 'uppercase' }}>Сэнсэй</span>
                      )}
                      <span style={{ fontSize: isMobile ? 12 : 11, color: '#ccc' }}>{c.date}</span>
                    </div>
                    <div style={{ fontSize: isMobile ? 15 : 13, color: '#444', lineHeight: 1.75 }}>{c.text}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
