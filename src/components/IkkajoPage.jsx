'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { C } from '@/lib/utils';
import { BELT, KYU_DATA, FLAT_INDEX, TECHNIQUE_VIDEOS } from '@/data/techniques';

export default function IkkajoPage({ nav }) {
  const [activeKyu, setActiveKyu] = useState('6kyu');
  const cur = KYU_DATA.find(k => k.id === activeKyu);

  return (
    <div className="fade" style={{ padding: '32px 36px' }}>
      {/* Хлебные крошки */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 12 }}>
        <button onClick={nav.dashboard} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', padding: 0 }}>← База техник</button>
        <span style={{ color: '#ddd' }}>/</span>
        <span style={{ color: C.dark }}>Иккаджо</span>
      </div>

      {/* Шапка */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 24, paddingBottom: 20, borderBottom: `2px solid ${C.border}`, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 72, color: '#ece7de', lineHeight: 1, flexShrink: 0 }}>一</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 9, color: '#b0a080', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>База техник · Раздел первый</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 600, color: C.dark, marginBottom: 6 }}>Иккаджо</h1>
          <p style={{ fontSize: 13, color: '#888', lineHeight: 1.6, maxWidth: 440 }}>Программа ученических степеней от 6 кю до 1 кю.</p>
        </div>
        <div style={{ width: 260, flexShrink: 0 }}>
          <SearchBar onSelect={({ kyu, section, tech }) => nav.technique(kyu, section, tech)} />
        </div>
      </div>

      {/* Табы кю */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: '#e8e0d0', padding: 2, flexWrap: 'wrap' }}>
        {KYU_DATA.map(k => {
          const active = activeKyu === k.id;
          const b = BELT[k.belt] || {};
          return (
            <button key={k.id} onClick={() => setActiveKyu(k.id)}
              style={{ flex: 1, minWidth: 70, padding: '9px 6px', background: active ? '#1a1a1a' : '#fff', border: 'none', fontSize: 11, color: active ? '#fff' : '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', transition: 'all 0.15s' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? '#fff' : b.color, border: `2px solid ${active ? 'rgba(255,255,255,0.4)' : b.border}`, flexShrink: 0 }} />
              <span style={{ fontFamily: "'Noto Serif JP', serif", fontSize: 10 }}>{k.kanji}</span>
              {k.label}
            </button>
          );
        })}
      </div>

      {/* Техники */}
      <div key={activeKyu} className="fade">
        {cur?.note && (
          <div style={{ padding: '10px 14px', background: C.light, border: `1px solid ${C.goldBorder}`, fontSize: 12, color: C.gold, marginBottom: 16 }}>↳ {cur.note}</div>
        )}
        {cur?.sections.map(sec => (
          <div key={sec.id} style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0 8px', borderBottom: `1px solid ${C.border}`, marginBottom: 2 }}>
              <div>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: C.dark, marginRight: 8 }}>{sec.nameRu}</span>
                <span style={{ fontSize: 11, color: '#bbb' }}>{sec.name}</span>
              </div>
              <span style={{ fontSize: 11, color: C.muted }}>{sec.subtitle}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 1, background: '#e8e0d0' }}>
              {sec.techniques.map((tech, i) => (
                <TechCard key={tech.id} tech={tech} index={i} onClick={() => nav.technique(cur, sec, tech)} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TechCard({ tech, index, onClick }) {
  const [hover, setHover] = useState(false);
  const vlen = (TECHNIQUE_VIDEOS[tech.name] || []).length;
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px', background: hover ? '#faf8f4' : '#fff', cursor: 'pointer', transition: 'background 0.1s' }}>
      <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, color: '#ddd', minWidth: 20, fontWeight: 600, flexShrink: 0 }}>
        {String(index + 1).padStart(2, '0')}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: C.dark }}>{tech.nameRu}</div>
        <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{tech.name}</div>
        <div style={{ fontSize: 10, color: '#c8a84a', marginTop: 3 }}>{vlen} видео</div>
      </div>
      <span style={{ color: hover ? C.gold : '#ccc', fontSize: 15, transition: 'color 0.15s' }}>→</span>
    </div>
  );
}

function SearchBar({ onSelect }) {
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
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: `1px solid ${C.border}`, padding: '0 12px', height: 40 }}>
        <span style={{ color: '#ccc', fontSize: 16 }}>⌕</span>
        <input value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Поиск техники…"
          style={{ flex: 1, border: 'none', outline: 'none', fontSize: 13, background: 'transparent', color: C.dark }} />
        {q && <button onClick={() => { setQ(''); setOpen(false); }} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}>✕</button>}
      </div>
      {open && q.length >= 2 && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: `1px solid ${C.border}`, boxShadow: '0 4px 20px rgba(0,0,0,0.08)', zIndex: 200, maxHeight: 300, overflowY: 'auto' }}>
          {results.length === 0
            ? <div style={{ padding: '12px 16px', color: '#bbb', fontSize: 13 }}>Ничего не найдено</div>
            : results.map(({ kyu, section, tech }) => {
                const b = BELT[kyu.belt] || {};
                return (
                  <div key={`${kyu.id}-${tech.id}`}
                    onClick={() => { onSelect({ kyu, section, tech }); setQ(''); setOpen(false); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', cursor: 'pointer', borderBottom: '1px solid #f5f2ec' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.light}
                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, border: `2px solid ${b.border}`, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: C.dark, fontWeight: 500 }}>{tech.nameRu} <span style={{ color: '#bbb', fontWeight: 400, fontSize: 11 }}>{tech.name}</span></div>
                      <div style={{ fontSize: 11, color: C.muted }}>{kyu.label} · {section.nameRu}</div>
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
