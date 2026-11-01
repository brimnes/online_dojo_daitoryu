'use client';

import { useState, useEffect, useCallback } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import Sidebar from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/BottomNav';
import KinescopePlayer from '@/components/KinescopePlayer';
import RichText from '@/components/RichText';

const MONO  = "var(--font-mono), 'JetBrains Mono', monospace";
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', serif";
const KANJI = "'Noto Serif JP', var(--font-noto), serif";

// ── Страница тематического курса: описание, стоимость, покупка, фильмы ──
export default function CoursePage({ nav, courseId, user = {}, onLogout }) {
  const isMobile = useIsMobile();
  const [course,   setCourse]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [buying,   setBuying]   = useState(false);
  const [buyError, setBuyError] = useState('');

  const load = useCallback(async () => {
    if (!courseId) { setNotFound(true); setLoading(false); return; }
    try {
      const res = await fetch(`/api/courses/${courseId}`);
      if (!res.ok) setNotFound(true);
      else { setCourse(await res.json()); setNotFound(false); }
    } catch {
      setNotFound(true);
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  // Возврат со страницы оплаты — перечитываем доступ
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [load]);

  const handleBuy = async () => {
    const product = course?.product;
    if (!product || buying) return;
    setBuying(true);
    setBuyError('');
    try {
      const res  = await fetch('/api/robokassa/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });
      const data = await res.json();
      if (!res.ok) { setBuyError(data.error || 'Ошибка при создании платежа'); setBuying(false); return; }
      if (data.payment_id) { try { sessionStorage.setItem('yk_pending_pid', data.payment_id); } catch {} }
      // buying не сбрасываем — кнопка заблокирована до перехода на оплату
      window.location.href = data.confirmation_url;
    } catch { setBuyError('Ошибка соединения'); setBuying(false); }
  };

  const isStaff   = user?.role === 'admin' || user?.role === 'teacher';
  const canWatch  = !!course && (course.has_access || isStaff);
  const product   = course?.product;
  const canBuy    = !!course && !course.has_access && product?.is_active;

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
                        onClick={handleBuy} disabled={!canBuy || buying}
                        style={{ width: '100%', minHeight: 48, padding: '13px', background: buying || !canBuy ? C.muted : C.ink, color: '#ede5d3', border: 'none', cursor: buying || !canBuy ? 'default' : 'pointer', fontFamily: MONO, fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                        {buying ? 'Переход к оплате…' : canBuy ? 'Купить курс' : 'Продажа скоро'}
                      </button>
                      {buyError && <div style={{ fontFamily: MONO, fontSize: 11, color: '#a03030', marginTop: 8 }}>{buyError}</div>}
                    </>
                  )}
                </aside>
              </div>

              {/* ── Фильмы курса ── */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, padding: '8px 0', borderBottom: `1px solid ${C.border}`, marginBottom: 16 }}>
                <span style={{ fontFamily: KANJI, fontSize: isMobile ? 20 : 24, color: canWatch ? C.accent : C.muted, lineHeight: 1 }}>映</span>
                <span style={{ fontFamily: SERIF, fontSize: isMobile ? 18 : 22, color: canWatch ? C.ink : C.muted, fontWeight: 500, letterSpacing: '0.05em' }}>Материалы курса</span>
                <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 10, color: C.muted, letterSpacing: '0.12em' }}>{course.videos.length} ВИДЕО</span>
                {!canWatch && <span style={{ fontSize: 13 }}>🔒</span>}
              </div>

              {course.videos.length === 0 && (
                <div style={{ fontFamily: SERIF, fontSize: 15, color: C.muted }}>Материалы готовятся к публикации.</div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: canWatch ? (isMobile ? 28 : 40) : 1, background: canWatch ? 'transparent' : C.border }}>
                {course.videos.map((v, i) => canWatch ? (
                  <section key={v.id}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
                      <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{String(i + 1).padStart(2, '0')}</span>
                      <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: isMobile ? 20 : 24, color: C.ink, fontWeight: 500 }}>{v.title}</h3>
                      {v.duration && <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: C.muted }}>{v.duration}</span>}
                    </div>
                    {v.video_id ? (
                      <KinescopePlayer videoId={v.video_id} videoStatus={v.video_status || 'ready'} viewerId={user.id} posterUrl={v.video_poster_url} title={v.title} duration={v.duration} />
                    ) : (
                      <div style={{ padding: '32px 20px', background: C.bg2, border: `1px solid ${C.border}`, textAlign: 'center', fontFamily: MONO, fontSize: 11, color: C.muted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Видео скоро появится</div>
                    )}
                    {v.description && <div style={{ marginTop: 14 }}><RichText content={v.description} breaks /></div>}
                  </section>
                ) : (
                  <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '14px' : '16px 18px', background: C.surface }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, minWidth: 22 }}>{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ flex: 1, fontFamily: MONO, fontSize: 15, color: C.ink2 }}>{v.title}</span>
                    {v.duration && <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted }}>{v.duration}</span>}
                    <span style={{ fontSize: 13 }}>🔒</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {isMobile && <MobileBottomNav nav={nav} active="database" isAdmin={user?.role === 'admin'} />}
    </div>
  );
}
