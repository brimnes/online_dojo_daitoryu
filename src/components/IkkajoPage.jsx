'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { BELT } from '@/data/techniques';
import { useIkkajoData, useUserAccessRows, hasIkkajoSectionAccess } from '@/lib/db';
import { IKKAJO_SECTION_KEYS as IKKAJO_SECTIONS } from '@/lib/ikkajoSections';
import Sidebar from '@/components/Sidebar';
import { MobileBottomNav } from '@/components/BottomNav';

// Kanji glyphs for section IDs (not stored in data)
const SECTION_KANJI = {
  tachiai:       '立合',
  idori:         '居取',
  ushirodori:    '後取',
  hanzahandachi: '半座半立',
  hanmihandachi: '半身半立',
  suwariwaza:    '座技',
  torifune:      '鳥船',
};

export default function IkkajoPage({ nav, user = {}, onLogout }) {
  const isMobile = useIsMobile();
  const [activeKyu, setActiveKyu] = useState('6kyu');
  const { kyuData, flatIndex, loading: techLoading } = useIkkajoData();
  const cur = kyuData.find(k => k.id === activeKyu);
  const { rows: userAccess, loading: accessLoading } = useUserAccessRows();

  const videoCountByTech = useMemo(() => {
    const map = {};
    videos.forEach(v => { map[v.technique_id] = (map[v.technique_id] || 0) + 1; });
    return map;
  }, [videos]);

  const totalTechs = flatIndex.length;

  return (
    <div className="fade" style={{ display: 'flex', minHeight: '100vh' }}>

      {/* ── Sidebar (desktop only) ── */}
      {!isMobile && (
        <Sidebar activeTab="database" onTabClick={() => nav.dashboard()} user={user} onLogout={onLogout} />
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
            <button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: C.accent, padding: '0 4px', display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44 }}>‹</button>
            <span style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: 14, letterSpacing: '0.12em', color: C.ink, flex: 1, textTransform: 'uppercase',
            }}>Иккаджо</span>
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
              fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: '0.1em', color: C.accent,
              textTransform: 'uppercase', padding: 0,
            }}>← БАЗА ТЕХНИК</button>
            <span style={{ color: C.border }}>/</span>
            <span style={{
              fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
              fontSize: 12, letterSpacing: '0.18em', color: C.ink, fontWeight: 600,
            }}>ИККАДЖО</span>
            <div style={{ marginLeft: 'auto' }}>
              <SearchBar
                userAccess={userAccess}
                accessLoading={accessLoading}
                flatIndex={flatIndex}
                onSelect={({ kyu, section, tech }) => nav.technique(kyu, section, tech)}
              />
            </div>
          </div>
        )}

        <div className={isMobile ? 'page-has-bottom-nav' : ''} style={{ padding: isMobile ? '20px 18px 24px' : '48px 48px 60px' }}>

          {/* ── Hero ── */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: isMobile ? 14 : 32, marginBottom: isMobile ? 16 : 28 }}>
            {/* 一 kanji watermark */}
            <div style={{
              fontFamily: "'Noto Serif JP', var(--font-noto), serif",
              fontSize: isMobile ? 64 : 140, lineHeight: 0.85,
              color: C.accent, opacity: 0.18, flexShrink: 0,
            }}>一</div>

            <div style={{ flex: 1 }}>
              {/* Eyebrow */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                fontSize: 9, letterSpacing: '0.24em', color: C.muted,
                textTransform: 'uppercase', marginBottom: isMobile ? 8 : 14,
              }}>
                <span style={{ color: C.accent, fontWeight: 600 }}>03</span>
                <span>·</span>
                <span>БАЗА ТЕХНИК · РАЗДЕЛ ПЕРВЫЙ</span>
              </div>

              {/* Title */}
              <div style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontSize: isMobile ? 32 : 64, letterSpacing: '0.04em',
                color: C.ink, fontWeight: 500, lineHeight: 0.92,
              }}>ИККАДЖО</div>

              {/* Description */}
              <div style={{
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontStyle: 'italic', fontSize: isMobile ? 14 : 18,
                color: C.muted, marginTop: isMobile ? 8 : 10, maxWidth: 540, lineHeight: 1.5,
              }}>
                Программа ученических степеней от 6 кю до 1 кю.{!isMobile && ' Семь разделов, сто восемнадцать техник.'}
              </div>
            </div>

            {/* 進度 counter — desktop only */}
            {!isMobile && (
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontFamily: "'Noto Serif JP', var(--font-noto), serif",
                  fontSize: 11, color: C.muted, letterSpacing: '0.2em', marginBottom: 6,
                }}>進度</div>
                <div style={{
                  fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                  fontSize: 32, color: C.ink, letterSpacing: '0.04em',
                }}>–– / {totalTechs}</div>
              </div>
            )}
          </div>

          {/* Sumi brush stroke divider — desktop only */}
          {!isMobile && (
            <div style={{ margin: '0 0 36px', opacity: 0.3 }}>
              <svg viewBox="0 0 800 12" width="100%" height="12" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                <path d="M0 6 Q200 2.5 400 6.5 Q600 10 800 5" stroke={C.ink2} strokeWidth="1.2" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
          )}

          {/* Mobile search */}
          {isMobile && (
            <div style={{ marginBottom: 16 }}>
              <SearchBar
                userAccess={userAccess}
                accessLoading={accessLoading}
                flatIndex={flatIndex}
                onSelect={({ kyu, section, tech }) => nav.technique(kyu, section, tech)}
              />
            </div>
          )}

          {/* ── Kyu tabs ── */}
          <div style={{
            display: 'flex', gap: isMobile ? 0 : 8,
            marginBottom: isMobile ? 24 : 36,
            padding: '4px',
            background: C.surface, border: `1px solid ${C.border}`,
            overflowX: isMobile ? 'auto' : 'visible',
          }}>
            {kyuData.map(k => {
              const active = activeKyu === k.id;
              const b = BELT[k.belt] || {};
              return (
                <button key={k.id} onClick={() => setActiveKyu(k.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: isMobile ? 6 : 10,
                    padding: isMobile ? '10px 14px' : '14px 8px',
                    flex: isMobile ? '0 0 auto' : 1,
                    background: active ? C.ink : 'transparent',
                    border: 'none',
                    color: active ? '#ede5d3' : C.muted,
                    cursor: 'pointer', transition: 'all 0.15s',
                    minHeight: 44, flexShrink: 0,
                  }}>
                  <span style={{
                    width: active ? 10 : 8, height: active ? 10 : 8,
                    borderRadius: '50%',
                    background: active ? 'rgba(255,255,255,0.3)' : b.color,
                    border: `2px solid ${active ? 'rgba(255,255,255,0.3)' : b.border}`,
                    flexShrink: 0, transition: 'all 0.15s',
                  }} />
                  {!isMobile && (
                    <span style={{ fontFamily: "'Noto Serif JP', var(--font-noto), serif", fontSize: 12, opacity: 0.8 }}>{k.kanji}</span>
                  )}
                  <span style={{
                    fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                    fontSize: isMobile ? 11 : 12, letterSpacing: '0.16em', fontWeight: 500,
                  }}>{k.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── Sections ── */}
          <div key={activeKyu} className="fade" style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 24 : 32 }}>
            {cur?.note && (
              <div style={{ padding: '10px 14px', background: C.surface, border: `1px solid ${C.goldBorder}`, fontSize: isMobile ? 13 : 12, color: C.gold }}>↳ {cur.note}</div>
            )}
            {cur?.sections.map(sec => {
              const sectionKey = sec.id?.toLowerCase();
              const sectionKanji = SECTION_KANJI[sectionKey] || '';
              const isIkkajoSection = IKKAJO_SECTIONS.includes(sectionKey);
              const canAccess = !accessLoading && (!isIkkajoSection || hasIkkajoSectionAccess(userAccess, sectionKey));
              console.log(`[IkkajoPage] sec=${sectionKey} isIkkajoSection=${isIkkajoSection} canAccess=${canAccess} loading=${accessLoading} ua=`, userAccess);
              return (
                <div key={sec.id}>

                  {/* Section header */}
                  <div style={{
                    display: 'flex', alignItems: 'baseline', gap: isMobile ? 10 : 16,
                    padding: '8px 0', borderBottom: `1px solid ${C.border}`, marginBottom: 12,
                    flexWrap: 'wrap',
                  }}>
                    {sectionKanji && (
                      <span style={{
                        fontFamily: "'Noto Serif JP', var(--font-noto), serif",
                        fontSize: isMobile ? 22 : 28,
                        color: canAccess ? C.accent : C.muted,
                        lineHeight: 1, letterSpacing: '0.1em',
                      }}>{sectionKanji}</span>
                    )}
                    <span style={{
                      fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                      fontSize: isMobile ? 16 : 22,
                      color: canAccess ? C.ink : C.muted,
                      letterSpacing: '0.05em', fontWeight: 500,
                    }}>{sec.nameRu}</span>
                    <span style={{
                      fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                      fontStyle: 'italic', fontSize: isMobile ? 12 : 14, color: C.muted,
                    }}>{sec.name}</span>
                    <span style={{
                      marginLeft: 'auto',
                      fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                      fontSize: isMobile ? 9 : 10, color: C.muted, letterSpacing: '0.12em',
                    }}>{sec.subtitle}</span>
                    {!canAccess && <span style={{ fontSize: 12 }}>🔒</span>}
                  </div>

                  {canAccess ? (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
                      gap: 1, background: C.border,
                    }}>
                      {sec.techniques.map((tech, i) => (
                        <TechCard
                          key={tech.id}
                          tech={tech}
                          index={i}
                          isMobile={isMobile}
                          videoCount={videoCountByTech[tech.name] || 0}
                          onClick={() => nav.technique(cur, sec, tech)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div style={{
                      background: C.bg2, border: `1px solid ${C.border}`,
                      padding: isMobile ? '24px 18px' : '32px 24px', textAlign: 'center',
                    }}>
                      {sectionKanji && (
                        <div style={{
                          fontFamily: "'Noto Serif JP', var(--font-noto), serif",
                          fontSize: 40, color: C.muted, opacity: 0.5, marginBottom: 10,
                        }}>{sectionKanji}</div>
                      )}
                      <div style={{
                        fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                        fontStyle: 'italic', fontSize: isMobile ? 15 : 16, color: C.ink2, marginBottom: 6,
                      }}>Раздел недоступен</div>
                      <div style={{
                        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                        fontSize: 10, color: C.muted, letterSpacing: '0.1em', textTransform: 'uppercase',
                      }}>Приобретите доступ к разделу «{sec.nameRu}»</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {isMobile && <MobileBottomNav nav={nav} active="database" isAdmin={user?.role === 'admin'} />}
    </div>
  );
}

// ── Technique card ────────────────────────────────────────────────
function TechCard({ tech, index, videoCount, onClick, isMobile }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => !isMobile && setHover(true)}
      onMouseLeave={() => !isMobile && setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: isMobile ? '14px 14px' : '16px 18px',
        background: hover ? C.surface2 : C.surface,
        cursor: 'pointer', transition: 'background 0.1s',
        minHeight: isMobile ? 56 : 'auto',
      }}>
      {/* Number */}
      <span style={{
        fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
        fontSize: 11, color: C.muted, letterSpacing: '0.06em',
        minWidth: 22, flexShrink: 0,
      }}>
        {String(index + 1).padStart(2, '0')}
      </span>
      {/* Name + romanization */}
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          fontSize: 15, fontWeight: 500, color: C.ink, letterSpacing: '0.01em',
        }}>{tech.nameRu}</div>
        <div style={{
          fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
          fontStyle: 'italic', fontSize: 12, color: C.muted, marginTop: 1,
        }}>
          {isMobile && videoCount > 0
            ? `${tech.name} · ${videoCount} видео`
            : tech.name
          }
        </div>
      </div>
      {/* Video count — desktop */}
      {!isMobile && videoCount > 0 && (
        <span style={{
          fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
          fontSize: 10, color: C.accent, letterSpacing: '0.06em', flexShrink: 0,
        }}>{videoCount} видео</span>
      )}
      {/* Arrow */}
      <span style={{
        color: hover ? C.accent : C.muted,
        fontSize: 14, transition: 'color 0.15s', flexShrink: 0,
      }}>→</span>
    </div>
  );
}

// ── Search bar ────────────────────────────────────────────────────
function SearchBar({ onSelect, userAccess = [], accessLoading = false, flatIndex = [] }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const lq = q.toLowerCase();
    return flatIndex.filter(({ tech, section }) =>
      tech.name.toLowerCase().includes(lq) ||
      tech.nameRu.toLowerCase().includes(lq) ||
      section.nameRu.toLowerCase().includes(lq)
    ).slice(0, 7);
  }, [q]);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: C.bg, border: `1px solid ${C.border}`,
        padding: '8px 14px', height: 44,
      }}>
        <span style={{ color: C.muted, fontSize: 14 }}>⌕</span>
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск техники, кю или раздела…"
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontStyle: 'italic', fontSize: 13, color: C.ink,
          }}
        />
        {q && (
          <button onClick={() => { setQ(''); setOpen(false); }}
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14 }}>
            ✕
          </button>
        )}
      </div>
      {open && q.length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: C.surface, border: `1px solid ${C.border}`,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', zIndex: 200,
          maxHeight: 300, overflowY: 'auto',
        }}>
          {results.length === 0
            ? <div style={{
                padding: '12px 16px',
                fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
                fontStyle: 'italic', color: C.muted, fontSize: 14,
              }}>Ничего не найдено</div>
            : results.map(({ kyu, section, tech }) => {
                const b = BELT[kyu.belt] || {};
                return (
                  <div key={`${kyu.id}-${tech.id}`}
                    onClick={() => {
                      const sk = section.id?.toLowerCase();
                      const blocked = !accessLoading && IKKAJO_SECTIONS.includes(sk) && !hasIkkajoSectionAccess(userAccess, sk);
                      if (blocked) { alert(`Раздел «${section.nameRu}» недоступен`); return; }
                      onSelect({ kyu, section, tech }); setQ(''); setOpen(false);
                    }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${C.hairline2}` }}
                    onMouseEnter={e => e.currentTarget.style.background = C.bg}
                    onMouseLeave={e => e.currentTarget.style.background = C.surface}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, border: `2px solid ${b.border}`, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 14, color: C.ink, fontWeight: 500 }}>
                        {tech.nameRu}{' '}
                        <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", fontStyle: 'italic', color: C.muted, fontWeight: 400, fontSize: 12 }}>{tech.name}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 11, color: C.muted, letterSpacing: '0.04em' }}>
                        {kyu.label} · {section.nameRu}
                      </div>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}
    </div>
  );
}
