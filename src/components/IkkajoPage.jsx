'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { C } from '@/lib/utils';
import { useIsMobile } from '@/lib/mobile';
import { BELT, KYU_DATA, FLAT_INDEX } from '@/data/techniques';
import { useTechniques, useUserAccessRows, hasIkkajoSectionAccess } from '@/lib/db';
import { IKKAJO_SECTION_KEYS as IKKAJO_SECTIONS } from '@/lib/ikkajoSections';

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
    <div className="fade" style={{ minHeight: '100vh', background: C.bg }}>

      {/* ── Мобильный sticky хедер ── */}
      {isMobile && (
        <header style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: `max(12px, env(safe-area-inset-top)) 16px 12px`,
          background: '#fff', borderBottom: `1px solid ${C.border}`,
          position: 'sticky', top: 0, zIndex: 50,
        }}>
          <button onClick={nav.back} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: C.gold, padding: '0 4px', display: 'flex', alignItems: 'center', minWidth: 36, minHeight: 44 }}>‹</button>
          <span style={{ fontFamily: "var(--font-jost), 'Jost', sans-serif", fontSize: 15, fontWeight: 600, color: '#1a1a1a', flex: 1 }}>Иккаджо</span>
        </header>
      )}

      <div style={{ padding: isMobile ? '16px 16px 40px' : '32px 36px' }}>

        {/* Десктопный breadcrumb */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13 }}>
            <button onClick={nav.back} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: '4px 0', minHeight: 44 }}>← База техник</button>
            <span style={{ color: '#ddd' }}>/</span>
            <span style={{ color: C.dark }}>Иккаджо</span>
          </div>
        )}

        {/* Hero-секция */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: isMobile ? 14 : 20, marginBottom: 24, paddingBottom: isMobile ? 16 : 20, borderBottom: `2px solid ${C.border}`, flexWrap: 'wrap' }}>
          <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: isMobile ? 52 : 72, color: '#ece7de', lineHeight: 1, flexShrink: 0 }}>一</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: isMobile ? 11 : 9, color: '#b0a080', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>База техник · Раздел первый</div>
            <h1 style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 24 : 26, color: '#c8a84a', marginBottom: 6 }}>Иккаджо</h1>
            <p style={{ fontSize: isMobile ? 14 : 13, color: '#888', lineHeight: 1.65, maxWidth: 440 }}>Программа ученических степеней от 6 кю до 1 кю.</p>
          </div>
          {!isMobile && (
            <div style={{ width: 260, flexShrink: 0 }}>
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
          <div style={{ marginBottom: 16 }}>
            <SearchBar
              userAccess={userAccess}
              accessLoading={accessLoading}
              onSelect={({ kyu, section, tech }) => nav.technique(kyu, section, tech)}
            />
          </div>
        )}

        {/* Вкладки Кю */}
        <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#e8e0d0', padding: 2, flexWrap: 'wrap' }}>
          {KYU_DATA.map(k => {
            const active = activeKyu === k.id;
            const b = BELT[k.belt] || {};
            return (
              <button key={k.id} onClick={() => setActiveKyu(k.id)}
                style={{
                  flex: 1, minWidth: isMobile ? 60 : 70,
                  padding: isMobile ? '11px 4px' : '9px 6px',
                  background: active ? '#1a1a1a' : '#fff', border: 'none',
                  fontSize: isMobile ? 12 : 11,
                  color: active ? '#fff' : '#888',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                  cursor: 'pointer', transition: 'all 0.15s',
                  minHeight: 44,
                }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? '#fff' : b.color, border: `2px solid ${active ? 'rgba(255,255,255,0.4)' : b.border}`, flexShrink: 0 }} />
                {!isMobile && <span style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 10 }}>{k.kanji}</span>}
                {k.label}
              </button>
            );
          })}
        </div>

        <div key={activeKyu} className="fade">
          {cur?.note && (
            <div style={{ padding: '10px 14px', background: C.light, border: `1px solid ${C.goldBorder}`, fontSize: isMobile ? 13 : 12, color: C.gold, marginBottom: 16 }}>↳ {cur.note}</div>
          )}
          {cur?.sections.map(sec => {
            const sectionKey = sec.id?.toLowerCase();
            const isIkkajoSection = IKKAJO_SECTIONS.includes(sectionKey);
            const canAccess = !accessLoading && (!isIkkajoSection || hasIkkajoSectionAccess(userAccess, sectionKey));
            console.log(`[IkkajoPage] sec=${sectionKey} isIkkajoSection=${isIkkajoSection} canAccess=${canAccess} loading=${accessLoading} ua=`, userAccess);
            return (
              <div key={sec.id} style={{ marginBottom: isMobile ? 20 : 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '10px 0 10px' : '10px 0 8px', borderBottom: `1px solid ${C.border}`, marginBottom: 2, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {!canAccess && <span style={{ fontSize: 14 }}>🔒</span>}
                    <span style={{ fontFamily: "var(--font-arkhip), system-ui, sans-serif", fontSize: isMobile ? 17 : 16, color: canAccess ? '#c8a84a' : C.muted, marginRight: 8 }}>{sec.nameRu}</span>
                    <span style={{ fontSize: isMobile ? 12 : 11, color: '#bbb' }}>{sec.name}</span>
                  </div>
                  <span style={{ fontSize: isMobile ? 12 : 11, color: C.muted }}>{sec.subtitle}</span>
                </div>
                {canAccess ? (
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(240px, 1fr))', gap: 1, background: '#e8e0d0' }}>
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
                  <div style={{ padding: isMobile ? '20px 16px' : '24px 16px', background: '#faf8f4', border: '1px solid #e8e0d0', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>🔒</div>
                    <div style={{ fontSize: isMobile ? 14 : 13, color: C.muted, marginBottom: 4 }}>Раздел недоступен</div>
                    <div style={{ fontSize: isMobile ? 12 : 11, color: '#bbb' }}>Приобретите доступ к разделу «{sec.nameRu}»</div>
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
        background: hover ? '#faf8f4' : '#fff',
        cursor: 'pointer', transition: 'background 0.1s',
        minHeight: isMobile ? 56 : 'auto',
      }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 14 : 12, color: '#ddd', minWidth: 22, fontWeight: 600, flexShrink: 0 }}>
        {String(index + 1).padStart(2, '0')}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: isMobile ? 15 : 14, fontWeight: 500, color: C.dark }}>{tech.nameRu}</div>
        <div style={{ fontSize: isMobile ? 12 : 11, color: C.muted, marginTop: 2 }}>{tech.name}</div>
        {videoCount > 0 && (
          <div style={{ fontSize: isMobile ? 12 : 10, color: '#c8a84a', marginTop: 3 }}>{videoCount} видео</div>
        )}
      </div>
      <span style={{ color: hover ? C.gold : '#ccc', fontSize: 16, transition: 'color 0.15s' }}>→</span>
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${C.border}`, padding: '0 12px', height: 44 }}>
        <span style={{ color: '#ccc', fontSize: 16 }}>⌕</span>
        <input value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск техники…"
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, background: 'transparent', color: C.dark, fontFamily: "var(--font-jost), 'Jost', sans-serif" }} />
        {q && <button onClick={() => { setQ(''); setOpen(false); }} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14 }}>✕</button>}
      </div>
      {open && q.length >= 2 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: `1px solid ${C.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', zIndex: 200, maxHeight: 300, overflowY: 'auto' }}>
          {results.length === 0
            ? <div style={{ padding: '12px 16px', color: '#bbb', fontSize: 14 }}>Ничего не найдено</div>
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
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid #f5f2ec' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.light}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, border: `2px solid ${b.border}`, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: C.dark, fontWeight: 500 }}>{tech.nameRu} <span style={{ color: '#bbb', fontWeight: 400, fontSize: 12 }}>{tech.name}</span></div>
                      <div style={{ fontSize: 12, color: C.muted }}>{kyu.label} · {section.nameRu}</div>
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
