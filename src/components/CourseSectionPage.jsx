'use client';

import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { useCourse } from '@/lib/db';
import Sidebar from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/BottomNav';
import KinescopePlayer from '@/components/KinescopePlayer';
import RichText from '@/components/RichText';

const MONO  = "var(--font-mono), 'JetBrains Mono', monospace";
const SERIF = "var(--font-cormorant), 'Cormorant Garamond', serif";
const KANJI = "'Noto Serif JP', var(--font-noto), serif";

// ── Страница раздела курса — аналог страницы техники Иккаджо ──────
export default function CourseSectionPage({ nav, courseId, sectionId, user = {}, onLogout }) {
  const isMobile = useIsMobile();
  const { course, loading, notFound } = useCourse(courseId);

  const isStaff  = user?.role === 'admin' || user?.role === 'teacher';
  const canWatch = !!course && (course.has_access || isStaff);
  const sections = course?.videos ?? [];
  const idx      = Math.max(0, sections.findIndex(s => s.id === sectionId));
  const section  = sections[idx];
  const prev     = sections[idx - 1];
  const next     = sections[idx + 1];
  const total    = sections.length;
  const kanji    = course?.kanji || '技';

  // Переход между разделами не копит историю — «назад» ведёт на страницу курса
  const goSection = (s) => { nav.setCourseSection(s.id); window.scrollTo?.({ top: 0 }); };
  const toCourse  = () => nav.back();

  const sidebar = !isMobile && (
    <Sidebar activeTab="database" onTabClick={id => nav.dashboard(id)} onHome={() => nav.dashboard('months')} user={user} onLogout={onLogout} />
  );

  if (loading || notFound || !section || !canWatch) {
    const msg = loading ? 'Загрузка' : (notFound || !section) ? 'Раздел не найден' : 'Нет доступа к курсу';
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {sidebar}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: isMobile ? '60px 32px' : '60px 32px 60px 292px', background: C.bg, textAlign: 'center' }}>
          {!loading && !canWatch && course && <div style={{ fontSize: 36 }}>🔒</div>}
          <div style={{ fontFamily: loading ? MONO : SERIF, fontSize: loading ? 11 : 18, letterSpacing: loading ? '0.2em' : 0, textTransform: loading ? 'uppercase' : 'none', color: loading ? C.muted : C.accent }}>{msg}</div>
          {!loading && !canWatch && course && (
            <div style={{ fontSize: 13, color: C.muted, maxWidth: 320 }}>Приобретите курс «{course.title}», чтобы смотреть разделы.</div>
          )}
          {!loading && (
            <button onClick={toCourse} style={{ marginTop: 8, padding: '10px 24px', background: C.ink, color: C.onAccent, border: 'none', fontSize: 13, cursor: 'pointer' }}>← К курсу</button>
          )}
        </div>
        {isMobile && <MobileBottomNav nav={nav} active="database" isAdmin={user?.role === 'admin'} />}
      </div>
    );
  }

  // ── Плеер ─────────────────────────────────────────────────────
  const player = section.video_id ? (
    <KinescopePlayer
      key={section.id}
      videoId={section.video_id} videoStatus={section.video_status || 'ready'}
      viewerId={user.id} posterUrl={section.video_poster_url}
      title={section.title} duration={section.duration}
    />
  ) : (
    <div style={{ background: '#0f0d0a', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', fontFamily: KANJI, fontSize: isMobile ? 120 : 220, color: '#fff', opacity: 0.04, lineHeight: 0.85, pointerEvents: 'none' }}>{kanji}</div>
      <div style={{ fontFamily: MONO, fontSize: 11, color: '#7a6c52', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Видео скоро появится</div>
    </div>
  );

  // ── Видео с ошибками (есть не во всех разделах) ───────────────
  const errorsVideo = section.errors_video_id ? (
    <div style={{ marginTop: isMobile ? 12 : 20, background: C.surface, border: `1px solid ${C.border}` }}>
      <div style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: KANJI, fontSize: 13, color: C.accent }}>誤</span>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase' }}>Разбор ошибок</span>
      </div>
      <KinescopePlayer
        key={section.id + ':errors'}
        videoId={section.errors_video_id} videoStatus={section.errors_video_status || 'ready'}
        viewerId={user.id}
        title={`${section.title} — ошибки`}
      />
    </div>
  ) : null;

  // ── Оглавление: все разделы, переход к любому ─────────────────
  const toc = (
    <div style={{ border: `1px solid ${C.border}`, borderTop: (isMobile || section.errors_video_id) ? `1px solid ${C.border}` : 'none', background: C.surface }}>
      <div style={{ padding: '11px 14px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: KANJI, fontSize: 13, color: C.muted }}>目次</span>
        <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase' }}>Оглавление курса</span>
        <span style={{ marginLeft: 'auto', fontFamily: MONO, fontSize: 11, color: C.muted }}>{total}</span>
      </div>
      {sections.map((s, i) => {
        const active = s.id === section.id;
        const tc = s.duration || '';
        return (
          <div key={s.id} onClick={() => !active && goSection(s)}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: active ? C.light : C.surface, cursor: active ? 'default' : 'pointer', borderBottom: i < total - 1 ? `1px solid ${C.border}` : 'none' }}
            onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.light; }}
            onMouseLeave={e => { if (!active) e.currentTarget.style.background = C.surface; }}>
            <div style={{ width: 32, height: 32, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? C.accent : C.ink }}>
              <span style={{ color: '#fff', fontFamily: MONO, fontSize: 11 }}>{String(i + 1).padStart(2, '0')}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: C.ink, fontWeight: active ? 600 : 400 }}>{s.title}</div>
              {s.subtitle && <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, marginTop: 2 }}>{s.subtitle}</div>}
            </div>
            {active && (
              <span style={{ fontFamily: MONO, fontSize: 11, background: C.accent, color: '#fff', padding: '2px 6px', letterSpacing: '0.1em', flexShrink: 0 }}>ИГРАЕТ</span>
            )}
            {tc && <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, flexShrink: 0 }}>{tc}</div>}
          </div>
        );
      })}
    </div>
  );

  // ── Прогресс + назад / вперёд ─────────────────────────────────
  const progressPct = total > 0 ? Math.round((idx + 1) / total * 100) : 0;
  const navCard = (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: isMobile ? '16px' : '20px' }}>
      <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: 12, display: 'flex', justifyContent: 'space-between' }}>
        <span>Раздел курса</span>
        <span style={{ fontFamily: KANJI, fontSize: 15 }}>{kanji}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: SERIF, fontSize: isMobile ? 36 : 48, color: C.ink, lineHeight: 1 }}>{idx + 1}</span>
        <span style={{ fontFamily: SERIF, fontSize: isMobile ? 18 : 24, color: C.muted }}>/ {total}</span>
      </div>
      <div style={{ width: '100%', height: 2, background: C.bg2, marginBottom: 16 }}>
        <div style={{ height: 2, width: `${progressPct}%`, background: C.accent }} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => prev && goSection(prev)} disabled={!prev}
          style={{ flex: 1, minHeight: 44, padding: '10px 8px', background: 'transparent', color: prev ? C.ink : C.muted, border: `1px solid ${prev ? C.ink2 : C.border}`, cursor: prev ? 'pointer' : 'default', opacity: prev ? 1 : 0.5, fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          ← Назад
        </button>
        <button onClick={() => next && goSection(next)} disabled={!next}
          style={{ flex: 1, minHeight: 44, padding: '10px 8px', background: next ? C.ink : 'transparent', color: next ? C.onAccent : C.muted, border: `1px solid ${next ? C.ink : C.border}`, cursor: next ? 'pointer' : 'default', opacity: next ? 1 : 0.5, fontFamily: MONO, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Далее →
        </button>
      </div>
      {next && (
        <div style={{ marginTop: 10, fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Далее: {next.title}{next.subtitle ? ` — ${next.subtitle}` : ''}</div>
      )}
    </div>
  );

  const description = section.description ? (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: isMobile ? '18px 16px' : '22px 24px', marginTop: isMobile ? 12 : 20 }}>
      <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: C.gold, fontFamily: KANJI, fontSize: 13 }}>道</span>Содержание раздела
      </div>
      <RichText content={section.description} breaks />
    </div>
  ) : null;

  const num = String(idx + 1).padStart(2, '0');

  // ── MOBILE ────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="fade page-has-bottom-nav" style={{ background: C.bg, minHeight: '100vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '12px 16px', background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 20 }}>
          <button onClick={toCourse} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', fontFamily: SERIF, fontSize: 13, letterSpacing: '0.08em', minHeight: 44, padding: '0 8px 0 0', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            ‹ {course.title}
          </button>
        </div>

        <div style={{ padding: '20px 16px 18px', background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -8, top: -8, fontFamily: KANJI, fontSize: 160, color: C.accent, opacity: 0.06, lineHeight: 0.85, pointerEvents: 'none', userSelect: 'none' }}>{kanji}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', border: `1px solid ${C.border}`, background: C.bg, marginBottom: 14, fontFamily: MONO, fontSize: 11, letterSpacing: '0.16em', color: C.muted, textTransform: 'uppercase' }}>
            Раздел {num} / {total}
          </div>
          <h1 style={{ fontFamily: SERIF, fontSize: 44, color: C.accent, lineHeight: 0.9, letterSpacing: '0.03em', margin: '0 0 8px', textTransform: 'uppercase', fontWeight: 400, position: 'relative' }}>{section.title}</h1>
          {section.subtitle && <div style={{ fontFamily: SERIF, fontSize: 18, color: C.ink2, position: 'relative' }}>{section.subtitle}</div>}
        </div>

        <div style={{ padding: '16px 16px 0' }}>
          {player}
          {errorsVideo}
          <div style={{ marginTop: 12 }}>{navCard}</div>
          <div style={{ marginTop: 12 }}>{toc}</div>
          {description}
        </div>

        <MobileBottomNav nav={nav} active="database" isAdmin={user?.role === 'admin'} />
      </div>
    );
  }

  // ── DESKTOP ───────────────────────────────────────────────────
  return (
    <div className="fade" style={{ display: 'flex', minHeight: '100vh' }}>
      {sidebar}
      <div style={{ flex: 1, background: C.bg, minHeight: '100vh', paddingLeft: 260 }}>

        {/* Sticky breadcrumb bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 36px', background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'sticky', top: 0, zIndex: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            <button onClick={() => nav.dashboard('database')} style={{ background: 'none', border: 'none', color: C.accent, cursor: 'pointer', padding: 0, fontFamily: SERIF, fontSize: 11, letterSpacing: '0.12em' }}>← КУРСЫ</button>
            <span style={{ color: C.hairline2 }}>/</span>
            <button onClick={toCourse} style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', padding: 0, fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{course.title}</button>
            <span style={{ color: C.hairline2 }}>/</span>
            <span style={{ color: C.ink, fontFamily: SERIF, fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{num} · {section.title}</span>
          </div>
          <div style={{ fontFamily: KANJI, fontSize: 13, color: C.muted, letterSpacing: '0.22em' }}>{kanji}</div>
        </div>

        {/* Hero */}
        <div style={{ padding: '36px 36px 30px', background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -20, top: -30, fontFamily: KANJI, fontSize: 360, color: C.accent, opacity: 0.055, lineHeight: 0.85, pointerEvents: 'none', userSelect: 'none' }}>{kanji}</div>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 16px', border: `1px solid ${C.border}`, background: C.bg, marginBottom: 22 }}>
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase' }}>Раздел {num} / {total}</span>
              <span style={{ width: 20, height: 1, background: C.border }} />
              <span style={{ fontFamily: MONO, fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase' }}>{course.title}</span>
            </div>
            <h1 style={{ fontFamily: SERIF, fontSize: 76, color: C.accent, lineHeight: 0.88, letterSpacing: '0.03em', margin: '0 0 14px', textTransform: 'uppercase', fontWeight: 400 }}>{section.title}</h1>
            {section.subtitle && <div style={{ fontFamily: SERIF, fontSize: 24, color: C.ink2, letterSpacing: '0.02em' }}>{section.subtitle}</div>}
          </div>
        </div>

        {/* Две колонки: плеер + оглавление | навигация */}
        <div style={{ padding: '0 36px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', alignItems: 'start' }}>
            <div style={{ paddingRight: 24, paddingTop: 24 }}>
              {player}
              {errorsVideo}
              <div style={{ marginTop: errorsVideo ? 20 : 0 }}>{toc}</div>
            </div>
            <div style={{ paddingTop: 24, position: 'sticky', top: 60 }}>
              {navCard}
            </div>
          </div>
          {description}
        </div>
      </div>
    </div>
  );
}
