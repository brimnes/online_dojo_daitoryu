'use client';

import { useState } from 'react';
import { C } from '@/lib/utils';
import { USER } from '@/data/users';
import { MONTHS, MONTH_LESSONS } from '@/data/months';

export default function LessonPage({ nav, monthId, lessonId, watched, toggleWatched, comments, addComment }) {
  const month       = MONTHS.find(m => m.id === monthId);
  const lessons     = MONTH_LESSONS[monthId] || [];
  const lessonIndex = lessons.findIndex(l => l.id === lessonId);
  const lesson      = lessons[lessonIndex];
  const isWatched   = !!watched[lessonId];
  const lessonComments = comments[lessonId] || [];

  const [commentText, setCommentText] = useState('');
  const [playing, setPlaying]         = useState(false);

  const prevLesson = lessonIndex > 0               ? lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < lessons.length - 1 ? lessons[lessonIndex + 1] : null;

  if (!lesson) return null;

  return (
    <div className="fade" style={{ padding: '32px 40px', maxWidth: 1000, margin: '0 auto' }}>

      {/* Хлебные крошки */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, fontSize: 12, flexWrap: 'wrap' }}>
        <button onClick={nav.dashboard} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: 0 }}>← Месяцы</button>
        <span style={{ color: '#ddd' }}>/</span>
        <button onClick={() => nav.month(monthId)} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: 0 }}>{month?.label}</button>
        <span style={{ color: '#ddd' }}>/</span>
        <span style={{ color: C.dark }}>Урок {lesson.num}. {lesson.title}</span>
      </div>

      {/* Заголовок */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: '#ccc', fontWeight: 600 }}>Урок {String(lesson.num).padStart(2, '0')}</span>
          <span style={{ color: '#ddd', fontSize: 11 }}>·</span>
          <span style={{ fontSize: 11, color: C.muted }}>{lesson.duration}</span>
          <span style={{ color: '#ddd', fontSize: 11 }}>·</span>
          <span style={{ fontSize: 11, color: C.muted }}>{month?.label} 2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, color: C.dark, marginBottom: 6 }}>{lesson.title}</h1>
            <div style={{ fontSize: 13, color: C.gold, letterSpacing: 0.3 }}>{lesson.subtitle}</div>
          </div>
          <button onClick={() => toggleWatched(lessonId)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: isWatched ? '#3a8a5a' : 'transparent', border: `1px solid ${isWatched ? '#3a8a5a' : C.border}`, color: isWatched ? '#fff' : C.muted, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0, whiteSpace: 'nowrap' }}>
            {isWatched ? '✓ Просмотрено' : 'Отметить просмотренным'}
          </button>
        </div>
      </div>

      {/* Видеоплеер */}
      <div onClick={() => setPlaying(!playing)}
        style={{ height: 420, background: '#111', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
        {playing ? (
          <>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>⏸</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Воспроизведение…</div>
          </>
        ) : (
          <>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <span style={{ color: '#fff', fontSize: 22, marginLeft: 3 }}>▶</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, textAlign: 'center' }}>{lesson.title}</div>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 6 }}>{lesson.duration}</div>
          </>
        )}
        <div style={{ position: 'absolute', bottom: 14, right: 16, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Нажмите для воспроизведения</div>
        {isWatched && (
          <div style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(58,138,90,0.85)', padding: '3px 10px', fontSize: 10, color: '#fff', letterSpacing: 0.5 }}>ПРОСМОТРЕНО</div>
        )}
      </div>

      {/* Полоска прогресса */}
      <div style={{ height: 3, background: '#1a1a1a', marginBottom: 28 }}>
        <div style={{ height: '100%', width: playing ? '35%' : '0%', background: C.gold, transition: 'width 2s linear' }} />
      </div>

      {/* Основной контент */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24, marginBottom: 24 }}>

        {/* Текст урока */}
        <div style={{ background: '#fff', border: `1px solid ${C.border}`, padding: '28px 30px' }}>
          <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 }}>О УРОКЕ</div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, color: '#444', lineHeight: 1.85 }}>{lesson.text}</p>
        </div>

        {/* Боковая панель */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#fff', border: `1px solid ${C.border}`, padding: '20px' }}>
            <div style={{ fontSize: 9, color: C.muted, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>УРОК В ПРОГРАММЕ</div>
            <div style={{ fontSize: 13, color: C.dark, marginBottom: 4 }}>{month?.label} 2026</div>
            <div style={{ fontSize: 12, color: C.muted, marginBottom: 12 }}>{lesson.num} из {lessons.length} уроков</div>
            <div style={{ height: 2, background: '#e8e0d0', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${(lesson.num / lessons.length) * 100}%`, background: C.gold }} />
            </div>
          </div>
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
        </div>
      </div>

      {/* Навигация между уроками */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, marginBottom: 28 }}>
        {prevLesson ? (
          <div onClick={() => nav.lesson(monthId, prevLesson.id)}
            style={{ background: '#fff', border: `1px solid ${C.border}`, padding: '16px 20px', cursor: 'pointer' }}
            onMouseEnter={e => e.currentTarget.style.background = C.light}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: 0.5 }}>← ПРЕДЫДУЩИЙ</div>
            <div style={{ fontSize: 14, color: C.dark, fontWeight: 500 }}>{prevLesson.title}</div>
          </div>
        ) : <div />}
        {nextLesson ? (
          <div onClick={() => nav.lesson(monthId, nextLesson.id)}
            style={{ background: '#fff', border: `1px solid ${C.border}`, padding: '16px 20px', cursor: 'pointer', textAlign: 'right' }}
            onMouseEnter={e => e.currentTarget.style.background = C.light}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
            <div style={{ fontSize: 10, color: C.muted, marginBottom: 6, letterSpacing: 0.5 }}>СЛЕДУЮЩИЙ →</div>
            <div style={{ fontSize: 14, color: C.dark, fontWeight: 500 }}>{nextLesson.title}</div>
          </div>
        ) : <div />}
      </div>

      {/* Комментарии */}
      <div style={{ background: '#fff', border: `1px solid ${C.border}`, padding: '28px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 24, paddingBottom: 16, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, color: C.dark }}>Обсуждение</div>
          <span style={{ fontSize: 11, color: C.muted }}>{lessonComments.length} комментариев · видят все ученики и сэнсэй</span>
        </div>

        {/* Форма */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: C.light, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.gold, flexShrink: 0 }}>
            {USER.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="Задайте вопрос или оставьте заметку к уроку…"
              rows={3}
              style={{ width: '100%', border: `1px solid ${C.border}`, padding: '12px 14px', fontSize: 13, color: C.dark, background: '#fafaf8', resize: 'vertical', outline: 'none', lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
              <button
                onClick={() => { addComment(lessonId, commentText); setCommentText(''); }}
                disabled={!commentText.trim()}
                style={{ padding: '8px 20px', background: commentText.trim() ? C.dark : '#e0e0e0', color: commentText.trim() ? '#fff' : '#bbb', border: 'none', fontSize: 12, cursor: commentText.trim() ? 'pointer' : 'default', transition: 'all 0.15s' }}>
                Отправить
              </button>
            </div>
          </div>
        </div>

        {/* Список комментариев */}
        {lessonComments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#bbb', fontSize: 13 }}>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.dark }}>{c.author}</span>
                    {c.role === 'sensei' && (
                      <span style={{ fontSize: 9, color: C.gold, background: C.light, border: `1px solid ${C.goldBorder}`, padding: '1px 7px', letterSpacing: 1, textTransform: 'uppercase' }}>Сэнсэй</span>
                    )}
                    <span style={{ fontSize: 11, color: '#ccc' }}>{c.date}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#444', lineHeight: 1.7 }}>{c.text}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
