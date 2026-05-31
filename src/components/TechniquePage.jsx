'use client';

import { useState, useEffect } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { BELT, VIDEO_CATS } from '@/data/techniques';
import KinescopePlayer from '@/components/KinescopePlayer';
import { useTechniques, useUserAccessRows } from '@/lib/db';
import { hasIkkajoSectionAccess } from '@/lib/access';
import { IKKAJO_SECTION_KEYS as IKKAJO_SECTIONS } from '@/lib/ikkajoSections';
import Sidebar from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/BottomNav';

const SECTION_KANJI = {
  tachiai: '立合', idori: '居取', ushirodori: '後取',
  hanzahandachi: '半座半立', suwari: '座業', tantodori: '刀捕', tsugedori: '杖捕',
};

const KYU_KANJI = {
  '6kyu': '六級', '5kyu': '五級', '4kyu': '四級',
  '3kyu': '三級', '2kyu': '二級', '1kyu': '一級',
  '1dan': '初段', '2dan': '二段', '3dan': '三段',
};

export default function TechniquePage({ kyu, section, tech, onBack, nav, viewerId, user = {}, onLogout }) {
  const isMobile = useIsMobile();
  const belt = BELT[kyu.belt] || { color: '#ccc', border: '#aaa', label: '' };
  const [cat, setCat] = useState('overview');
  const [vid, setVid] = useState(null);

  const { getTechContent, loading } = useTechniques();
  const { rows: userAccess, loading: accessLoading } = useUserAccessRows();

  // Access gate
  const sectionKey = section?.id?.toLowerCase();
  const isIkkajoSection = IKKAJO_SECTIONS.includes(sectionKey);
  const canAccess = !accessLoading && (!isIkkajoSection || hasIkkajoSectionAccess(userAccess, sectionKey));
  console.log(`[TechniquePage] section=${sectionKey} isIkkajo=${isIkkajoSection} canAccess=${canAccess} loading=${accessLoading} rows=`, userAccess);

  const content = loading
    ? { description: '', principles: [], senseiQuote: '', mistakes: [], videos: {} }
    : getTechContent(tech.name);

  const byC         = content.videos || {};
  const availableCats = VIDEO_CATS.filter(c => (byC[c.id] || []).length > 0);
  const curV        = byC[cat] || [];
  const curCat      = VIDEO_CATS.find(c => c.id === cat);

  // Auto-select first available category + video when content loads or cat becomes empty
  useEffect(() => {
    if (availableCats.length > 0 && (byC[cat] || []).length === 0) {
      setCat(availableCats[0].id);
      setVid(null);
      return;
    }
    if (vid === null && curV.length > 0) {
      const firstReady = curV.find(v => v.video_status === 'ready') ?? curV[0];
      setVid(firstReady);
    }
  }, [content]); // eslint-disable-line react-hooks/exhaustive-deps

  // Computed helpers
  const sectionKanji = SECTION_KANJI[sectionKey] || '';
  const kyuKanji     = KYU_KANJI[kyu.id] || kyu.kanji || '';

  const techIndex  = (section.techniques || []).findIndex(t => t.name === tech.name);
  const techNum    = techIndex >= 0 ? techIndex + 1 : 1;
  const totalTechs = (section.techniques || []).length;
  const progressPct = totalTechs > 0 ? Math.round((techNum - 1) / totalTechs * 100) : 0;

  // Estimate total watch time from all videos
  const allVids = Object.values(byC).flat();
  const totalMins = allVids.reduce((sum, v) => {
    const [m, s] = (v.duration || '0:00').split(':').map(Number);
    return sum + m + Math.round((s || 0) / 60);
  }, 0) || 8;

  // Related techniques = section siblings excluding current, up to 4
  const related = (section.techniques || [])
    .filter(t => t.name !== tech.name)
    .slice(0, 4);

  // ── Access gate ──────────────────────────────────────────────────
  if (!accessLoading && !canAccess) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        {!isMobile && <Sidebar activeTab="database" onTabClick={onBack} user={user} onLogout={onLogout} />}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '60px 32px', background: C.bg, textAlign: 'center' }}>
          <div style={{ fontSize: 36 }}>🔒</div>
          <div style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 18, color: C.accent }}>Нет доступа к разделу</div>
          <div style={{ fontSize: 13, color: C.muted, maxWidth: 320 }}>Приобретите доступ к разделу «{section?.nameRu}» чтобы просматривать техники.</div>
          <button onClick={onBack} style={{ marginTop: 8, padding: '10px 24px', background: C.ink, color: C.onAccent, border: 'none', fontSize: 13, cursor: 'pointer' }}>
            ← Назад к Иккаджо
          </button>
        </div>
      </div>
    );
  }

  // ── Video tabs + list block (shared desktop/mobile) ──────────────
  const VideoBlock = () => {
    if (availableCats.length === 0) return null;
    return (
    <>
      <div style={{ display: 'flex', background: C.surface, border: `1px solid ${C.border}`, overflowX: 'auto', borderTop: 'none' }}>
        {availableCats.map(c => (
          <button key={c.id} onClick={() => { setCat(c.id); setVid(null); }}
            style={{
              padding: '10px 14px', background: 'none', border: 'none',
              borderBottom: `2px solid ${cat === c.id ? c.color : 'transparent'}`,
              color: cat === c.id ? c.color : C.muted,
              fontSize: 11, display: 'flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap', cursor: 'pointer', fontWeight: cat === c.id ? 600 : 400,
              marginBottom: -1, fontFamily: "var(--font-mono), monospace",
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
            <span style={{ fontSize: 11 }}>{c.icon}</span>{c.label}
            <span style={{
              marginLeft: 3, fontSize: 11, background: C.bg2,
              padding: '1px 5px', color: C.muted, borderRadius: 2,
              fontFamily: "var(--font-mono), monospace",
            }}>{(byC[c.id] || []).length}</span>
          </button>
        ))}
      </div>
      <div style={{ border: `1px solid ${C.border}`, borderTop: 'none' }}>
        {curV.map((v, i) => {
              const active = vid?.id === v.id;
              return (
                <div key={v.id} onClick={() => setVid(v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 14px',
                    background: active ? C.light : C.surface,
                    cursor: 'pointer',
                    borderBottom: i < curV.length - 1 ? `1px solid ${C.border}` : 'none',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = C.light; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = C.surface; }}>
                  <div style={{
                    width: 32, height: 32, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: active ? curCat.color : C.ink,
                  }}>
                    <span style={{ color: '#fff', fontSize: 11 }}>▶</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: C.ink, fontWeight: active ? 600 : 400 }}>{v.title}</div>
                    <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, marginTop: 2 }}>
                      Сэнсэй Копин · {v.duration}
                    </div>
                  </div>
                  {active && (
                    <span style={{
                      fontFamily: "var(--font-mono), monospace", fontSize: 11,
                      background: C.accent, color: '#fff', padding: '2px 6px',
                      letterSpacing: '0.1em', flexShrink: 0,
                    }}>ИГРАЕТ</span>
                  )}
                  <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, flexShrink: 0 }}>{v.duration}</div>
                </div>
              );
            })}
      </div>
    </>
    );
  };

  // ── MOBILE ───────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="fade page-has-bottom-nav" style={{ background: C.bg, minHeight: '100vh', position: 'relative' }}>
        {/* Mobile top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '12px 16px', background: C.surface, borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <button onClick={onBack} style={{
            background: 'none', border: 'none', color: C.accent, cursor: 'pointer',
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 13, letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 4,
            minHeight: 44, padding: '0 8px 0 0',
          }}>
            ‹ ИППОНДОРИ
          </button>
          <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13, color: C.muted }}>{kyuKanji}</span>
        </div>

        {/* Hero */}
        <div style={{ padding: '20px 16px 18px', background: C.surface, borderBottom: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden' }}>
          {/* watermark */}
          <div style={{
            position: 'absolute', right: -8, top: -8,
            fontFamily: "'Noto Serif JP', var(--font-noto), serif",
            fontSize: 160, color: C.accent, opacity: 0.06, lineHeight: 0.85,
            pointerEvents: 'none', userSelect: 'none',
          }}>{kyu.kanji}</div>

          {/* mini breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 12, fontSize: 11, flexWrap: 'wrap' }}>
            <span style={{ color: C.accent, fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", letterSpacing: '0.1em', fontSize: 11 }}>ИККАДЖО</span>
            <span style={{ color: C.hairline2 }}>/</span>
            <span style={{ color: C.muted, fontFamily: "var(--font-mono), monospace", letterSpacing: '0.08em' }}>{kyu.label.toUpperCase()}</span>
            <span style={{ color: C.hairline2 }}>/</span>
            <span style={{ color: C.muted, fontFamily: "var(--font-mono), monospace", letterSpacing: '0.08em' }}>{section.nameRu.toUpperCase()}</span>
          </div>

          {/* belt badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px',
            border: `1px solid ${C.border}`, background: C.bg, marginBottom: 14,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: belt.color, border: `1.5px solid ${belt.border}`, display: 'inline-block', flexShrink: 0 }} />
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.16em', color: C.muted, textTransform: 'uppercase' }}>{belt.label.toUpperCase()}</span>
          </div>

          {/* title */}
          <h1 style={{
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 52, color: C.accent, lineHeight: 0.88, letterSpacing: '0.03em',
            marginBottom: 10, textTransform: 'uppercase', fontWeight: 400,
            position: 'relative', zIndex: 1,
          }}>{tech.nameRu}</h1>

          {content.description && (
            <p style={{ fontSize: 18, color: C.ink2, lineHeight: 1.7, marginBottom: 12 }}>{content.description}</p>
          )}

          {/* tags */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 6 }}>
            {[section.nameRu, kyu.label, `ТЕХНИКА ${techNum} / ${totalTechs}`].map(tag => (
              <span key={tag} style={{
                fontFamily: "var(--font-mono), monospace", fontSize: 11,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                color: C.muted, border: `1px solid ${C.border}`, padding: '3px 8px', background: C.bg,
              }}>{tag}</span>
            ))}
          </div>
        </div>

        {/* Player + video tabs — only when there are videos */}
        {availableCats.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          {vid ? (
            <div style={{ position: 'relative', marginBottom: 0 }}>
              <KinescopePlayer videoId={vid.video_id} videoStatus={vid.video_status} viewerId={viewerId} title={vid.title} duration={vid.duration} />
              <button onClick={() => setVid(null)} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            </div>
          ) : (
            <div style={{ background: '#0f0d0a', aspectRatio: '16/9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 120, color: '#fff', opacity: 0.04, lineHeight: 0.85, pointerEvents: 'none' }}>{sectionKanji}</div>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ color: '#fff', fontSize: 15, marginLeft: 3 }}>▶</span>
              </div>
              <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: '#555', letterSpacing: '0.18em', textTransform: 'uppercase' }}>KINESCOPE</div>
            </div>
          )}
          {vid && (
            <div style={{ padding: '10px 0', borderBottom: `1px solid ${C.border}`, marginBottom: 0 }}>
              <div style={{ fontSize: 13, color: C.ink, fontWeight: 500 }}>{vid.title}</div>
              <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, marginTop: 2 }}>00:00 / {vid.duration}</div>
            </div>
          )}
          <VideoBlock />
        </div>
        )}

        {/* Progress (mobile) */}
        <div style={{ margin: '16px 16px 0', background: C.surface, border: `1px solid ${C.border}`, padding: '16px' }}>
          <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>ПРОГРЕСС РАЗДЕЛА</span>
            <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13, color: C.muted }}>{sectionKanji}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 36, color: C.ink, fontWeight: 400, lineHeight: 1 }}>{techNum}</span>
            <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 18, color: C.muted }}>/ {totalTechs}</span>
            <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.accent, marginLeft: 6 }}>{progressPct}%</span>
          </div>
          <div style={{ width: '100%', height: 2, background: C.bg2 }}>
            <div style={{ height: 2, width: `${progressPct}%`, background: C.accent }} />
          </div>
        </div>

        {/* Principles */}
        {content.principles?.length > 0 && (
          <div style={{ margin: '12px 16px 0', background: C.surface, border: `1px solid ${C.border}`, padding: '18px 16px' }}>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: C.gold, fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13 }}>道</span>КЛЮЧЕВЫЕ ПРИНЦИПЫ
            </div>
            {content.principles.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, minWidth: 20, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</div>
                <div style={{ fontSize: 18, color: C.ink2, lineHeight: 1.7 }}>{p}</div>
              </div>
            ))}
          </div>
        )}

        {/* Mistakes */}
        {content.mistakes?.length > 0 && (
          <div style={{ margin: '12px 16px 0', background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, padding: '18px 16px' }}>
            <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: C.accent, fontSize: 11 }}>✕</span>ТИПИЧНЫЕ ОШИБКИ
            </div>
            {content.mistakes.map((m, i) => (
              <div key={i} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: C.accent, marginBottom: 3 }}>{m.title}</div>
                <div style={{ fontSize: 18, color: C.muted, lineHeight: 1.65 }}>{m.description || m.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Sensei quote */}
        {content.senseiQuote && (
          <div style={{ margin: '12px 16px 0', background: C.surface, border: `1px solid ${C.border}`, padding: '18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: C.light, border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.gold, flexShrink: 0 }}>К</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Сэнсэй Копин</div>
                <div style={{ fontSize: 15, color: C.muted }}>Комментарий к технике</div>
              </div>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.ink2, lineHeight: 1.85, borderLeft: `2px solid ${C.goldBorder}`, paddingLeft: 14 }}>
              «{content.senseiQuote}»
            </div>
          </div>
        )}
        <MobileBottomNav nav={nav || { dashboard: onBack }} active="database" isAdmin={user?.role === 'admin'} />
      </div>
    );
  }

  // ── DESKTOP ──────────────────────────────────────────────────────
  return (
    <div className="fade" style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar activeTab="database" onTabClick={onBack} user={user} onLogout={onLogout} />

      <div style={{ flex: 1, background: C.bg, minHeight: '100vh', overflow: 'auto', paddingLeft: 260 }}>

        {/* Sticky breadcrumb bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '13px 36px', background: C.surface, borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
            <button onClick={onBack} style={{
              background: 'none', border: 'none', color: C.accent, cursor: 'pointer', padding: 0,
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: 11, letterSpacing: '0.12em',
            }}>← ИККАДЖО</button>
            <span style={{ color: C.hairline2 }}>/</span>
            <span style={{ color: C.muted, fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.1em' }}>{kyu.label.toUpperCase()}</span>
            <span style={{ color: C.hairline2 }}>/</span>
            <span style={{ color: C.muted, fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.1em' }}>{section.nameRu.toUpperCase()}</span>
            <span style={{ color: C.hairline2 }}>/</span>
            <span style={{ color: C.ink, fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 11, letterSpacing: '0.1em' }}>{tech.nameRu.toUpperCase()}</span>
          </div>
          <div style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13, color: C.muted, letterSpacing: '0.22em' }}>
            一教 · {sectionKanji}
          </div>
        </div>

        {/* Hero section */}
        <div style={{
          padding: '36px 36px 30px', background: C.surface,
          borderBottom: `1px solid ${C.border}`, position: 'relative', overflow: 'hidden',
        }}>
          {/* Large watermark kanji */}
          <div style={{
            position: 'absolute', right: -20, top: -30,
            fontFamily: "'Noto Serif JP', var(--font-noto), serif",
            fontSize: 360, color: C.accent, opacity: 0.055,
            lineHeight: 0.85, pointerEvents: 'none', userSelect: 'none', zIndex: 0,
          }}>{kyu.kanji}</div>

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Belt badge */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '6px 16px', border: `1px solid ${C.border}`, background: C.bg, marginBottom: 22,
            }}>
              <span style={{ width: 9, height: 9, borderRadius: '50%', background: belt.color, border: `1.5px solid ${belt.border}`, display: 'inline-block', flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase' }}>{belt.label.toUpperCase()}</span>
              <span style={{ width: 20, height: 1, background: C.border, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13, color: C.muted }}>{kyuKanji}</span>
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.16em', color: C.muted, textTransform: 'uppercase' }}>{kyu.label.toUpperCase()}</span>
              <span style={{ width: 20, height: 1, background: C.border, flexShrink: 0 }} />
              <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase' }}>{section.nameRu.toUpperCase()}</span>
            </div>

            {/* Big title */}
            <h1 style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: 76, color: C.accent, lineHeight: 0.88, letterSpacing: '0.03em',
              marginBottom: 14, textTransform: 'uppercase', fontWeight: 400,
            }}>{tech.nameRu}</h1>

            {/* Description */}
            {content.description && (
              <p style={{ fontSize: 18, color: C.ink2, lineHeight: 1.75, maxWidth: 640, marginBottom: 20 }}>{content.description}</p>
            )}

            {/* Tags row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {[
                section.nameRu,
                section.subtitle || section.name,
                `КОНТРОЛЬ`,
                `ТЕХНИКА ${techNum} / ${totalTechs}`,
                `~ ${totalMins} МИНУТ`,
              ].filter(Boolean).map(tag => (
                <span key={tag} style={{
                  fontFamily: "var(--font-mono), monospace", fontSize: 11,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: C.muted, border: `1px solid ${C.border}`,
                  padding: '4px 10px', background: C.bg,
                }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Two-column main content */}
        <div style={{ padding: '0 36px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: availableCats.length > 0 ? '1fr 300px' : '300px', gap: 0, alignItems: 'start' }}>

            {/* ── Left: player + video tabs + list — only when there are videos ── */}
            {availableCats.length > 0 && (
            <div style={{ paddingRight: 24, paddingTop: 24 }}>
              {/* Player */}
              {vid ? (
                <div style={{ position: 'relative', marginBottom: 0 }}>
                  <KinescopePlayer
                    videoId={vid.video_id} videoStatus={vid.video_status}
                    viewerId={viewerId} title={vid.title} duration={vid.duration}
                  />
                  <button onClick={() => setVid(null)} style={{
                    position: 'absolute', top: 12, right: 12,
                    background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff',
                    width: 30, height: 30, borderRadius: '50%', cursor: 'pointer', fontSize: 15,
                  }}>✕</button>
                </div>
              ) : (
                <div style={{
                  background: '#0f0d0a', aspectRatio: '16/9',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  gap: 12, position: 'relative', overflow: 'hidden',
                }}>
                  <div style={{
                    position: 'absolute',
                    fontFamily: "'Noto Serif JP', var(--font-noto), serif",
                    fontSize: 220, color: '#fff', opacity: 0.04,
                    lineHeight: 0.85, pointerEvents: 'none',
                  }}>{sectionKanji}</div>
                  <div style={{
                    width: 60, height: 60, borderRadius: '50%', background: C.accent,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  }}>
                    <span style={{ color: '#fff', fontSize: 18, marginLeft: 5 }}>▶</span>
                  </div>
                  <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: '#555', letterSpacing: '0.2em', textTransform: 'uppercase' }}>KINESCOPE</div>
                </div>
              )}
              <VideoBlock />
            </div>
            )}

            {/* ── Right: progress + related ── */}
            <div style={{ paddingTop: 24 }}>
              {/* Progress card */}
              <div style={{
                background: C.surface, border: `1px solid ${C.border}`,
                padding: '20px 20px', marginBottom: 16,
              }}>
                <div style={{
                  fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.2em',
                  color: C.muted, textTransform: 'uppercase', marginBottom: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span>ПРОГРЕСС РАЗДЕЛА</span>
                  <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 15, color: C.muted }}>{sectionKanji}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 48, color: C.ink, fontWeight: 400, lineHeight: 1 }}>{techNum}</span>
                  <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontSize: 24, color: C.muted }}>/ {totalTechs}</span>
                  <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.accent, marginLeft: 8, letterSpacing: '0.1em' }}>{progressPct}%</span>
                </div>
                <div style={{ width: '100%', height: 2, background: C.bg2, marginBottom: 14 }}>
                  <div style={{ height: 2, width: `${progressPct}%`, background: C.accent }} />
                </div>
                <p style={{ fontSize: 15, color: C.muted, lineHeight: 1.7, margin: 0 }}>
                  Раздел {section.nameRu}. Завершите все {totalTechs} техник, чтобы перейти к следующему уровню.
                </p>
              </div>

              {/* Related techniques */}
              {related.length > 0 && (
                <div style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                  <div style={{
                    padding: '13px 18px', borderBottom: `1px solid ${C.border}`,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                    <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 15, color: C.muted }}>関</span>
                    <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, letterSpacing: '0.2em', color: C.muted, textTransform: 'uppercase' }}>СВЯЗАННЫЕ ТЕХНИКИ</span>
                  </div>
                  {related.map((t, i) => {
                    const idx = (section.techniques || []).findIndex(st => st.name === t.name) + 1;
                    return (
                      <div key={t.name} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px',
                        borderBottom: i < related.length - 1 ? `1px solid ${C.border}` : 'none',
                        background: C.surface,
                      }}>
                        <span style={{
                          fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted,
                          minWidth: 20, letterSpacing: '0.1em',
                        }}>{String(idx).padStart(2, '0')}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 15, color: C.ink, fontWeight: 500 }}>{t.nameRu}</div>
                        </div>
                        <span style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.1em', flexShrink: 0 }}>{kyu.label.toUpperCase()}</span>
                        <span style={{ color: C.muted, fontSize: 13, flexShrink: 0 }}>→</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Principles */}
          {content.principles?.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '22px 24px', marginTop: 20, marginBottom: 12 }}>
              <div style={{
                fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted,
                letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ color: C.gold, fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 13 }}>道</span>
                КЛЮЧЕВЫЕ ПРИНЦИПЫ
              </div>
              {content.principles.map((p, i) => (
                <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                  <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, minWidth: 22, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</div>
                  <div style={{ fontSize: 18, color: C.ink2, lineHeight: 1.7 }}>{p}</div>
                </div>
              ))}
            </div>
          )}

          {/* Mistakes */}
          {content.mistakes?.length > 0 && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderLeft: `3px solid ${C.accent}`, padding: '22px 24px', marginBottom: 12 }}>
              <div style={{
                fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted,
                letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 18,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <span style={{ color: C.accent, fontSize: 11 }}>✕</span>ТИПИЧНЫЕ ОШИБКИ
              </div>
              {content.mistakes.map((m, i) => (
                <div key={i} style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 18, fontWeight: 600, color: C.accent, marginBottom: 4 }}>{m.title}</div>
                  <div style={{ fontSize: 18, color: C.muted, lineHeight: 1.65 }}>{m.description || m.desc}</div>
                </div>
              ))}
            </div>
          )}

          {/* Sensei quote */}
          {content.senseiQuote && (
            <div style={{ background: C.surface, border: `1px solid ${C.border}`, padding: '22px 24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', background: C.light,
                  border: `1px solid ${C.goldBorder}`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 15, color: C.gold,
                }}>К</div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: C.ink }}>Сэнсэй Копин</div>
                  <div style={{ fontSize: 13, color: C.muted }}>Комментарий к технике</div>
                </div>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: C.ink2, lineHeight: 1.85, borderLeft: `2px solid ${C.goldBorder}`, paddingLeft: 16 }}>
                «{content.senseiQuote}»
              </div>
            </div>
          )}
        </div>

      </div>{/* end flex:1 */}
    </div>
  );
}
