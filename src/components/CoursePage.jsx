'use client';

import { useState } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { useCourse } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/BottomNav';
import RichText from '@/components/RichText';
import CoursePurchaseModal from '@/components/CoursePurchaseModal';

const MONO  = "var(--font-mono), 'JetBrains Mono', monospace";
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', serif";
const KANJI = "'Noto Serif JP', var(--font-noto), serif";

// ── Страница тематического курса: описание, стоимость, покупка, программа ──
// Повторяет логику Иккаджо: программа → страница раздела с видео.
export default function CoursePage({ nav, courseId, user = {}, onLogout }) {
  const isMobile = useIsMobile();
  const { course, loading, notFound } = useCourse(courseId);
  const [buyOpen, setBuyOpen] = useState(false);

  const isStaff   = user?.role === 'admin' || user?.role === 'teacher';
  const canWatch  = !!course && (course.has_access || isStaff);
  const product   = course?.product;
  const canBuy    = !!course && !course.has_access && product?.is_active && !course.is_coming_soon;

  return (
    <div className="fade" style={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && (
        <Sidebar activeTab="database" onTabClick={id => nav.dashboard(id)} onHome={() => nav.dashboard('months')} user={user} onLogout={onLogout} />
      )}

      <div style={{ flex: 1, background: C.bg, minHeight: '100vh', paddingLeft: isMobile ? 0 : 260 }}>

        {/* ── Mobile sticky header ── */}
        {isMobile && (
          <header style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
            background: C.surface, borderBottom: `1px solid ${C.border}`,
            position: 'sticky', top: 0, zIndex: 50,
          }}>
            <button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: C.accent, padding: '0 4px', display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44 }}>‹</button>
            <span style={{ fontFamily: SERIF, fontSize: 15, letterSpacing: '0.12em', color: C.ink, flex: 1, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {course?.title || 'Курсы'}
            </span>
          </header>
        )}

        {/* ── Desktop breadcrumb ── */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '20px 48px', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
            <button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: C.accent, textTransform: 'uppercase', padding: 0 }}>← КУРСЫ</button>
            <span style={{ color: C.border }}>/</span>
            <span style={{ fontFamily: SERIF, fontSize: 13, letterSpacing: '0.18em', color: C.ink, fontWeight: 600, textTransform: 'uppercase' }}>{course?.title || ''}</span>
          </div>
        )}

        <div className={isMobile ? 'page-has-bottom-nav' : ''} style={{ padding: isMobile ? '20px 18px 24px' : '48px 48px 60px', maxWidth: 1000 }}>

          {loading && (
            <div style={{ padding: '80px 0', textAlign: 'center', fontFamily: MONO, fontSize: 11, color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase' }}>Загрузка</div>
          )}

          {!loading && notFound && (
            <div style={{ padding: '80px 0', textAlign: 'center' }}>
              <div style={{ fontFamily: SERIF, fontSize: 18, color: C.muted, marginBottom: 16 }}>Курс не найден</div>
              <button onClick={() => nav.dashboard('database')} style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: C.accent, background: 'none', border: 'none', cursor: 'pointer', textTransform: 'uppercase' }}>← К курсам</button>
            </div>
          )}

          {!loading && course && (
            <>
              {/* ── Hero ── */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? 14 : 32, marginBottom: isMobile ? 18 : 28 }}>
                <div style={{ fontFamily: KANJI, fontSize: isMobile ? 64 : 140, lineHeight: 0.85, color: C.accent, opacity: 0.18, flexShrink: 0 }}>{course.kanji || '技'}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: MONO, fontSize: 11, letterSpacing: '0.24em', color: C.muted, textTransform: 'uppercase', marginBottom: isMobile ? 8 : 14 }}>
                    <span style={{ color: C.accent, fontWeight: 600 }}>03</span>
                    <span>·</span>
                    <span>КУРСЫ · ТЕМАТИЧЕСКИЙ КУРС</span>
                  </div>
                  <h1 style={{ margin: 0, fontFamily: SERIF, fontSize: isMobile ? 32 : 60, letterSpacing: '0.04em', color: C.ink, fontWeight: 500, lineHeight: 0.95, textTransform: 'uppercase' }}>{course.title}</h1>
                  {course.subtitle && (
                    <div style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 20, color: C.muted, marginTop: isMobile ? 8 : 12, maxWidth: 560, lineHeight: 1.5 }}>{course.subtitle}</div>
                  )}
                </div>
              </div>

              {!isMobile && (
                <div style={{ margin: '0 0 32px', opacity: 0.3 }}>
                  <svg viewBox="0 0 800 12" width="100%" height="12" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                    <path d="M0 6 Q200 2.5 400 6.5 Q600 10 800 5" stroke={C.ink2} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
                  </svg>
                </div>
              )}

              {course.image_url && (
                <div style={{ position: 'relative', marginBottom: isMobile ? 20 : 32, border: `1px solid ${C.border}`, background: '#0f0d0a', overflow: 'hidden' }}>
                  <img src={course.image_url} alt={course.title} style={{ display: 'block', width: '100%', aspectRatio: isMobile ? '16 / 9' : '21 / 8', objectFit: 'cover' }} />
                  {!course.has_access && (
                    <div style={{ position: 'absolute', top: 12, right: 12, padding: '5px 10px', background: C.surface, border: `1px solid ${C.border}`, fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.ink2 }}>🔒 К покупке</div>
                  )}
                </div>
              )}

              {!course.is_published && isStaff && (
                <div style={{ padding: '10px 14px', marginBottom: 20, background: C.surface, border: `1px solid ${C.goldBorder}`, fontSize: 13, color: C.gold }}>
                  ↳ Курс не опубликован — ученики его не видят.
                </div>
              )}

              <div style={{ display: isMobile ? 'flex' : 'grid', flexDirection: 'column', gridTemplateColumns: '1fr 280px', gap: isMobile ? 20 : 36, alignItems: 'start', marginBottom: isMobile ? 28 : 44 }}>
                {/* Описание */}
                <div style={{ minWidth: 0 }}>
                  {course.description
                    ? <RichText content={course.description} breaks />
                    : <div style={{ fontFamily: SERIF, fontSize: 16, color: C.muted }}>Описание курса скоро появится.</div>}
                </div>

                {/* Стоимость / доступ */}
                <aside style={{ background: course.has_access ? '#0f0d0a' : C.surface, backgroundImage: course.has_access ? 'linear-gradient(155deg, #18130d 0%, #0f0c08 60%, #0a0805 100%)' : 'none', border: `1px solid ${course.has_access ? 'rgba(184,146,58,0.18)' : C.border}`, borderTop: `1px solid ${course.has_access ? C.accent : C.border}`, padding: '22px 20px' }}>
                  {course.has_access ? (
                    <>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 10px', color: C.goldLight, border: '1px solid rgba(184,146,58,0.45)', fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 600 }}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.goldLight }} />
                        Куплен
                      </div>
                      <div style={{ fontFamily: SERIF, fontSize: 15, color: '#c2b59c', marginTop: 14, lineHeight: 1.5 }}>Постоянный доступ ко всем материалам курса.</div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>Стоимость</div>
                      <div style={{ fontFamily: SERIF, fontSize: 36, color: C.ink, fontWeight: 400, lineHeight: 1 }}>
                        {product ? `${product.price.toLocaleString('ru-RU')} ₽` : '—'}
                      </div>
                      <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, letterSpacing: '0.12em', marginTop: 8, marginBottom: 18 }}>РАЗОВАЯ ОПЛАТА · ПОСТОЯННЫЙ ДОСТУП</div>
                      <button
                        onClick={() => setBuyOpen(true)} disabled={!canBuy}
                        style={{ width: '100%', minHeight: 48, padding: '13px', background: !canBuy ? C.muted : C.ink, color: '#ede5d3', border: 'none', cursor: !canBuy ? 'default' : 'pointer', fontFamily: MONO, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                        {canBuy ? 'Купить курс' : course.is_coming_soon ? 'В разработке' : 'Продажа скоро'}
                      </button>
                    </>
                  )}
                </aside>
              </div>

              {/* ── Программа курса ── */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? 10 : 16, padding: '8px 0', borderBottom: `1px solid ${C.border}`, marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: KANJI, fontSize: isMobile ? 22 : 28, color: canWatch ? C.accent : C.muted, lineHeight: 1, letterSpacing: '0.1em' }}>目次</span>
                <span style={{ fontFamily: SERIF, fontSize: isMobile ? 16 : 22, color: canWatch ? C.ink : C.muted, fontWeight: 500, letterSpacing: '0.05em' }}>Программа курса</span>
                <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: isMobile ? 9 : 10, color: C.muted, letterSpacing: '0.12em' }}>{course.videos.length} {pluralSections(course.videos.length).toUpperCase()}</span>
                {!canWatch && <span style={{ fontSize: 13 }}>🔒</span>}
              </div>

              {course.videos.length === 0 && (
                <div style={{ fontFamily: SERIF, fontSize: 15, color: C.muted }}>Материалы готовятся к публикации.</div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 1, background: C.border }}>
                {course.videos.map((v, i) => (
                  <SectionCard
                    key={v.id} section={v} index={i} isMobile={isMobile} locked={!canWatch}
                    duration={v.duration}
                    onClick={canWatch ? () => nav.courseSection(course.id, v.id) : undefined}
                  />
                ))}
              </div>
              {!canWatch && course.videos.length > 0 && (
                <div style={{ marginTop: 12, fontFamily: MONO, fontSize: 11, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  Разделы откроются после покупки курса
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isMobile && <MobileBottomNav nav={nav} active="database" isAdmin={user?.role === 'admin'} />}

      {buyOpen && course && (
        <CoursePurchaseModal course={course} onClose={() => setBuyOpen(false)} isMobile={isMobile} />
      )}
    </div>
  );
}

// ── Карточка раздела программы (как TechCard в Иккаджо) ───────────
function SectionCard({ section, index, isMobile, locked, duration, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => !isMobile && !locked && setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: isMobile ? '14px 14px' : '16px 18px',
        background: hover ? C.surface2 : C.surface,
        cursor: locked ? 'default' : 'pointer', transition: 'background 0.1s',
        minHeight: isMobile ? 56 : 'auto',
      }}>
      <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, letterSpacing: '0.06em', minWidth: 22, flexShrink: 0 }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: MONO, fontSize: 15, fontWeight: 500, color: locked ? C.ink2 : C.ink, letterSpacing: '0.01em' }}>{section.title}</div>
        {section.subtitle && (
          <div style={{ fontFamily: SERIF, fontSize: 15, color: C.muted, marginTop: 1, letterSpacing: '0.03em' }}>{section.subtitle}</div>
        )}
      </div>
      {duration && <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, letterSpacing: '0.06em', flexShrink: 0 }}>{duration}</span>}
      {locked
        ? <span style={{ fontSize: 13, flexShrink: 0 }}>🔒</span>
        : <span style={{ color: hover ? C.accent : C.muted, fontSize: 15, transition: 'color 0.15s', flexShrink: 0 }}>→</span>}
    </div>
  );
}

export function pluralSections(n) {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return 'раздел';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'раздела';
  return 'разделов';
}
