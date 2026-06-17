'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { C } from '@/lib/utils';
import { BELT } from '@/data/techniques';
import { FLAT_INDEX } from '@/data/techniques';
import { hasIkkajoSectionAccess } from '@/lib/db';
import { IKKAJO_SECTION_KEYS as IKKAJO_SECTIONS } from '@/lib/ikkajoSections';

export default function GlobalSearch({ onSelect, userAccess = [], accessLoading = false, placeholder = 'Поиск техники…', maxWidth = 320 }) {
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
    ).slice(0, 8);
  }, [q]);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: C.bg, border: `1px solid ${C.border}`,
        padding: '7px 12px', height: 38,
      }}>
        <span style={{ color: C.muted, fontSize: 14, flexShrink: 0 }}>⌕</span>
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif",
            fontSize: 15, color: C.ink, minWidth: 0,
          }}
        />
        {q && (
          <button onClick={() => { setQ(''); setOpen(false); }}
            style={{ background: 'none', border: 'none', color: C.muted, cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: 0 }}>
            ✕
          </button>
        )}
      </div>

      {open && q.length >= 2 && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: C.surface, border: `1px solid ${C.border}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 300,
          maxHeight: 320, overflowY: 'auto',
        }}>
          {results.length === 0
            ? <div style={{ padding: '12px 16px', fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: C.muted, fontSize: 15 }}>
                Ничего не найдено
              </div>
            : results.map(({ kyu, section, tech }) => {
                const b   = BELT[kyu.belt] || {};
                const sk  = section.id?.toLowerCase();
                const blocked = !accessLoading && IKKAJO_SECTIONS.includes(sk) && !hasIkkajoSectionAccess(userAccess, sk);
                return (
                  <div key={`${kyu.id}-${tech.id}`}
                    onClick={() => {
                      if (blocked) { alert(`Раздел «${section.nameRu}» ещё не открыт`); return; }
                      onSelect({ kyu, section, tech });
                      setQ(''); setOpen(false);
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '11px 16px', cursor: blocked ? 'default' : 'pointer',
                      borderBottom: `1px solid ${C.hairline2}`,
                      opacity: blocked ? 0.45 : 1,
                    }}
                    onMouseEnter={e => { if (!blocked) e.currentTarget.style.background = C.bg; }}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: b.color, border: `2px solid ${b.border}`, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 13, color: C.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {tech.nameRu}
                        <span style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: C.muted, fontWeight: 400, fontSize: 13, marginLeft: 6 }}>{tech.name}</span>
                      </div>
                      <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.04em' }}>
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
