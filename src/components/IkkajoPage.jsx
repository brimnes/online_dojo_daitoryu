'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useIsMobile } from '@/lib/mobile';
import { BELT, KYU_DATA, FLAT_INDEX } from '@/data/techniques';
import { useTechniques, useUserAccessRows, hasIkkajoSectionAccess } from '@/lib/db';
import { IKKAJO_SECTION_KEYS as IKKAJO_SECTIONS } from '@/lib/ikkajoSections';

// Kanji for each section (sections have no kanji in data)
const SECTION_KANJI = {
  tachiai:       '立合',
  idori:         '居取',
  ushirodori:    '後取',
  hanzahandachi: '半座半立',
};

export default function IkkajoPage({ nav }) {
  const isMobile = useIsMobile();
  const [activeKyu, setActiveKyu] = useState('6kyu');
  const cur = KYU_DATA.find(k => k.id === activeKyu);
  const { videos } = useTechniques();
  const { rows: userAccess, loading: accessLoading } = useUserAccessRows();

  const videoCountByTech = useMemo(() => {
    const map = {};
    videos.forEach(v => { map[v.technique_id] = (map[v.technique_id] || 0) + 1; });
    return map;
  }, [videos]);

  return (
    <div className="fade" style={{ minHeight: '100vh', background: '#f0ebe0' }}>

      {/* ── Мобильный sticky хедер ── */}
      {isMobile && (
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
          background: '#0a0807', borderBottom: '1px solid #1f1a16',
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#b8923a', padding: '0 4px', display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44 }}>‹</button>
          <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ede5d3', flex: 1 }}>Иккаджо</span>
        </header>
      )}

      <div style={{ padding: isMobile ? '16px 16px 40px' : '32px 40px', maxWidth: 1100, margin: '0 auto' }}>

        {/* Десктопный breadcrumb */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32, fontSize: 11, flexWrap: 'wrap' }}>
            <button onClick={nav.back} style={{ background: 'none', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, letterSpacing: '0.1em', color: '#9a8860', cursor: 'pointer', padding: '4px 0', minHeight: 44, display: 'flex', alignItems: 'center' }}>← База техник</button>
            <span style={{ color: '#d2c7b0' }}>/</span>
            <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#6f6452', letterSpacing: '0.06em' }}>Иккаджо</span>
          </div>
        )}

        {/* Hero-секция */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 14 : 32, marginBottom: isMobile ? 24 : 36, paddingBottom: isMobile ? 20 : 32, borderBottom: '1px solid #d2c7b0', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: isMobile ? 64 : 100, color: '#d8cdb8', lineHeight: 1, flexShrink: 0, marginTop: -4, fontWeight: 300 }}>一</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 9, color: '#9a8860', letterSpacing: '0.28em', textTransform: 'uppercase', marginBottom: 10 }}>База техник · Раздел первый</div>
            <h1 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 28 : 38, letterSpacing: '0.03em', color: '#15120e', marginBottom: 10, lineHeight: 1.1 }}>Иккаджо</h1>
            <p style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 15 : 16, color: '#6f6452', lineHeight: 1.75, maxWidth: 520, marginBottom: isMobile ? 0 : 8 }}>Программа ученических степеней от 6 кю до 1 кю.</p>
          </div>
          {!isMobile && (
            <div style={{ width: 280, flexShrink: 0 }}>
              <SearchBar
                userAccess={userAccess}
                accessLoading={accessLoading}
                onSelect={({ kyu, section, tech }) => nav.technique(kyu, section, tech)}
              />
            </div>
          )}
        </div>

        {/* Мобильный поиск */}
        {isMobile && (
          <div style={{ marginBottom: 20 }}>
            <SearchBar
              userAccess={userAccess}
              accessLoading={accessLoading}
              onSelect={({ kyu, section, tech }) => nav.technique(kyu, section, tech)}
            />
          </div>
        )}

        {/* Вкладки Кю */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 24, background: '#d2c7b0', padding: 2, flexWrap: 'wrap' }}>
          {KYU_DATA.map(k => {
            const active = activeKyu === k.id;
            const b = BELT[k.belt] || {};
            return (
              <button key={k.id} onClick={() => setActiveKyu(k.id)}
                style={{
                  flex: 1, minWidth: isMobile ? 60 : 70,
                  padding: isMobile ? '11px 4px' : '9px 6px',
                  background: active ? '#13110e' : '#faf5e8', border: 'none',
                  fontFamily: "var(--font-jost), 'Jost', sans-serif",
                  fontSize: isMobile ? 12 : 11,
                  letterSpacing: '0.06em',
                  color: active ? '#ede5d3' : '#9a8860',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  cursor: 'pointer', transition: 'all 0.15s',
                  minHeight: 44,
                }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? 'rgba(255,255,255,0.6)' : b.color, border: `2px solid ${active ? 'rgba(255,255,255,0.3)' : b.border}`, flexShrink: 0 }} />
                {!isMobile && <span style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 10 }}>{k.kanji}</span>}
                {k.label}
              </button>
            );
          })}
        </div>

        <div key={activeKyu} className="fade">
          {cur?.note && (
            <div style={{ padding: '10px 14px', background: '#faf5e8', border: '1px solid #d2c7b0', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 13 : 11, color: '#9a8860', marginBottom: 16, letterSpacing: '0.04em' }}>↳ {cur.note}</div>
          )}
          {cur?.sections.map(sec => {
            const sectionKey = sec.id?.toLowerCase();
            const isIkkajoSection = IKKAJO_SECTIONS.includes(sectionKey);
            const canAccess = !accessLoading && (!isIkkajoSection || hasIkkajoSectionAccess(userAccess, sectionKey));
            const secKanji = SECTION_KANJI[sectionKey] || '';
            return (
              <div key={sec.id} style={{ marginBottom: isMobile ? 24 : 36 }}>

                {/* Section header */}
                <div style={{ paddingBottom: isMobile ? 10 : 12, borderBottom: '2px solid #d2c7b0', marginBottom: 2 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: isMobile ? 8 : 12 }}>
                      {!canAccess && <span style={{ fontSize: 11, color: '#b0a080', flexShrink: 0 }}>🔒</span>}
                      {secKanji && (
                        <span style={{ fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: isMobile ? 22 : 28, color: canAccess ? '#b8923a' : '#c8b99a', lineHeight: 1, flexShrink: 0 }}>{secKanji}</span>
                      )}
                      <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 17 : 20, color: canAccess ? '#15120e' : '#b0a080', letterSpacing: '0.04em' }}>{sec.nameRu}</span>
                      <span style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 13 : 14, color: '#9a8860' }}>{sec.name}</span>
                    </div>
                    <span style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 12 : 13, color: '#9a8860' }}>{sec.subtitle}</span>
                  </div>
                </div>

                {canAccess ? (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 1, background: '#d2c7b0' }}>
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
                  <div style={{ position: 'relative', padding: isMobile ? '28px 20px 24px' : '36px 40px', background: '#faf8f4', border: '1px dashed #d2c7b0', textAlign: 'center', overflow: 'hidden' }}>
                    {/* kanji watermark */}
                    {secKanji && (
                      <div style={{ position: 'absolute', right: 16, bottom: -12, fontFamily: "var(--font-noto), 'Noto Serif JP', serif", fontSize: 80, color: '#b8923a', opacity: 0.07, pointerEvents: 'none', lineHeight: 1, userSelect: 'none' }}>{secKanji}</div>
                    )}
                    <div style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 13 : 12, letterSpacing: '0.12em', color: '#9a8860', marginBottom: 6, textTransform: 'uppercase' }}>Раздел недоступен</div>
                    <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 15 : 14, color: '#b0a080', marginBottom: 18 }}>«{sec.nameRu}» · 3 000 ₽</div>
                    <button style={{ padding: isMobile ? '12px 28px' : '10px 28px', background: '#15120e', color: '#ede5d3', border: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', cursor: 'pointer', minHeight: 44 }}>
                      Приобрести доступ
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function TechCard({ tech, index, videoCount, onClick, isMobile }) {
  const [hover, setHover] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => !isMobile && setHover(true)}
      onMouseLeave={() => !isMobile && setHover(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: isMobile ? '16px 14px' : '14px 15px',
        background: hover ? '#f0ebe0' : '#faf8f4',
        cursor: 'pointer', transition: 'background 0.1s',
        minHeight: isMobile ? 56 : 'auto',
      }}>
      <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 13 : 11, color: '#c8b99a', minWidth: 22, fontWeight: 600, flexShrink: 0, letterSpacing: '0.1em' }}>
        {String(index + 1).padStart(2, '0')}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 15 : 13, fontWeight: 500, color: '#15120e' }}>{tech.nameRu}</div>
        <div style={{ fontFamily: "var(--font-cormorant), serif", fontStyle: 'italic', fontSize: isMobile ? 13 : 12, color: '#9a8860', marginTop: 2 }}>{tech.name}</div>
        {videoCount > 0 && (
          <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: isMobile ? 11 : 10, color: '#b8923a', marginTop: 3, letterSpacing: '0.06em' }}>{videoCount} видео</div>
        )}
      </div>
      <span style={{ color: hover ? '#b73828' : '#d2c7b0', fontSize: 14, transition: 'color 0.15s' }}>→</span>
    </div>
  );
}

function SearchBar({ onSelect, userAccess = [], accessLoading = false }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const lq = q.toLowerCase();
    return FLAT_INDEX.filter(({ tech, section }) =>
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
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#faf8f4', border: '1px solid #d2c7b0', padding: '0 12px', height: 44 }}>
        <span style={{ color: '#b0a080', fontSize: 14 }}>⌕</span>
        <input value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск техники…"
          style={{ flex: 1, border: 'none', outline: 'none', fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 13, background: 'transparent', color: '#15120e' }} />
        {q && <button onClick={() => { setQ(''); setOpen(false); }} style={{ background: 'none', border: 'none', color: '#b0a080', cursor: 'pointer', fontSize: 13 }}>✕</button>}
      </div>
      {open && q.length >= 2 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#faf8f4', border: '1px solid #d2c7b0', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', zIndex: 200, maxHeight: 300, overflowY: 'auto' }}>
          {results.length === 0
            ? <div style={{ padding: '12px 16px', fontFamily: "var(--font-jost), 'Jost', sans-serif", color: '#b0a080', fontSize: 13 }}>Ничего не найдено</div>
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
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #e8e0cc' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0ebe0'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: b.color, border: `2px solid ${b.border}`, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 13, color: '#15120e', fontWeight: 500 }}>{tech.nameRu} <span style={{ color: '#b0a080', fontWeight: 400, fontSize: 11 }}>{tech.name}</span></div>
                      <div style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 11, color: '#9a8860', letterSpacing: '0.04em' }}>{kyu.label} · {section.nameRu}</div>
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
