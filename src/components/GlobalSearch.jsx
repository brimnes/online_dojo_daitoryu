'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { C } from '@/lib/utils';
import { BELT, FLAT_INDEX } from '@/data/techniques';
import { hasIkkajoSectionAccess, hasMonthAccess } from '@/lib/db';
import { IKKAJO_SECTION_KEYS as IKKAJO_SECTIONS } from '@/lib/ikkajoSections';
import { useIsMobile } from '@/lib/mobile';

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ flexShrink: 0, opacity: 0.55 }}>
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

function Badge({ label }) {
  return (
    <span style={{
      fontSize: 9, letterSpacing: '0.1em', color: C.muted,
      fontFamily: "var(--font-mono), monospace", flexShrink: 0, textTransform: 'uppercase',
    }}>{label}</span>
  );
}

// months и knowledgeItems — опциональные пропсы.
// Если не переданы → поиск только по техникам (режим IkkajoPage).
// Если переданы → платформенный поиск (режим Dashboard).
export default function GlobalSearch({
  onSelect,
  userAccess    = [],
  accessLoading = false,
  placeholder   = 'Поиск техники…',
  maxWidth      = 320,
  months        = [],
  knowledgeItems = [],
}) {
  const [q, setQ]             = useState('');
  const [open, setOpen]       = useState(false);
  const [dropTop, setDropTop] = useState(0);
  const ref                   = useRef(null);
  const isMobile              = useIsMobile();

  // На мобайле дропдаун fixed — вычисляем top от нижнего края контейнера
  useEffect(() => {
    if (isMobile && open && ref.current) {
      const r = ref.current.getBoundingClientRect();
      setDropTop(r.bottom + 4);
    }
  }, [isMobile, open]);

  const platformWide = months.length > 0 || knowledgeItems.length > 0;

  const results = useMemo(() => {
    if (q.trim().length < 2) return [];
    const lq = q.toLowerCase();
    const out = [];

    // ── Техники ──────────────────────────────────────────────────
    const techLimit = platformWide ? 6 : 20;
    const techs = FLAT_INDEX.filter(({ tech, section }) =>
      tech.name.toLowerCase().includes(lq) ||
      tech.nameRu.toLowerCase().includes(lq) ||
      section.nameRu.toLowerCase().includes(lq)
    ).slice(0, techLimit);

    for (const { kyu, section, tech } of techs) {
      const sk     = section.id?.toLowerCase();
      const locked = !accessLoading && IKKAJO_SECTIONS.includes(sk) && !hasIkkajoSectionAccess(userAccess, sk);
      out.push({ type: 'technique', kyu, section, tech, locked });
    }

    // ── Месяцы + Уроки ───────────────────────────────────────────
    for (const month of months) {
      const monthLocked = !accessLoading && !hasMonthAccess(userAccess, month.id) && !month.is_open;

      if (month.label?.toLowerCase().includes(lq)) {
        out.push({ type: 'month', month, locked: monthLocked });
      }

      for (const lesson of (month.lessons ?? [])) {
        if (
          lesson.title?.toLowerCase().includes(lq) ||
          lesson.subtitle?.toLowerCase().includes(lq)
        ) {
          out.push({ type: 'lesson', month, lesson, locked: monthLocked });
        }
      }
    }

    // ── Статьи базы знаний ────────────────────────────────────────
    for (const item of knowledgeItems) {
      if (
        item.title?.toLowerCase().includes(lq) ||
        item.subtitle?.toLowerCase().includes(lq)
      ) {
        out.push({ type: 'knowledge', item, locked: false });
      }
    }

    return out;
  }, [q, userAccess, accessLoading, months, knowledgeItems, platformWide]);

  useEffect(() => {
    const fn = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleSelect = (result) => {
    if (result.locked) return;
    onSelect(result);
    setQ('');
    setOpen(false);
  };

  const rowBase = {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', borderBottom: `1px solid ${C.hairline2}`,
  };

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%', maxWidth }}>

      {/* ── Input ────────────────────────────────────────────────── */}
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

      {/* ── Dropdown ─────────────────────────────────────────────── */}
      {open && q.length >= 2 && (
        <div style={isMobile ? {
          position: 'fixed', top: dropTop, left: 8, right: 8,
          background: C.surface, border: `1px solid ${C.border}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', zIndex: 400,
          maxHeight: `calc(100dvh - ${dropTop}px - 88px - env(safe-area-inset-bottom, 0px))`,
          overflowY: 'auto', borderRadius: 2,
          // скрываем скроллбар — iOS и так не показывает, Firefox/Android скроем явно
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        } : {
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: C.surface, border: `1px solid ${C.border}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)', zIndex: 300,
          maxHeight: '70vh', overflowY: 'auto',
        }}>
          {results.length === 0
            ? <div style={{ padding: '12px 16px', fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif", color: C.muted, fontSize: 15 }}>
                Ничего не найдено
              </div>
            : results.map((r, i) => {

                // ── Техника ────────────────────────────────────────
                if (r.type === 'technique') {
                  const { kyu, section, tech, locked } = r;
                  const b = BELT[kyu.belt] || {};
                  return (
                    <div key={i} onClick={() => handleSelect(r)}
                      style={{ ...rowBase, cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.45 : 1 }}
                      onMouseEnter={e => { if (!locked) e.currentTarget.style.background = C.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: b.color, border: `2px solid ${b.border}`, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 13, color: C.ink, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tech.nameRu}
                          <span style={{ color: C.muted, fontWeight: 400, marginLeft: 6 }}>{tech.name}</span>
                        </div>
                        <div style={{ fontFamily: "var(--font-mono), monospace", fontSize: 11, color: C.muted, letterSpacing: '0.04em' }}>
                          {kyu.label} · {section.nameRu}
                        </div>
                      </div>
                      {locked && <LockIcon />}
                      {platformWide && <Badge label="техника" />}
                    </div>
                  );
                }

                // ── Месяц ─────────────────────────────────────────
                if (r.type === 'month') {
                  const { month, locked } = r;
                  return (
                    <div key={i} onClick={() => handleSelect(r)}
                      style={{ ...rowBase, cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.45 : 1 }}
                      onMouseEnter={e => { if (!locked) e.currentTarget.style.background = C.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ fontSize: 15, lineHeight: 1, flexShrink: 0 }}>{month.kanji || '月'}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 13, color: C.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {month.label}
                        </div>
                      </div>
                      {locked && <LockIcon />}
                      <Badge label="месяц" />
                    </div>
                  );
                }

                // ── Урок ──────────────────────────────────────────
                if (r.type === 'lesson') {
                  const { month, lesson, locked } = r;
                  return (
                    <div key={i} onClick={() => handleSelect(r)}
                      style={{ ...rowBase, cursor: locked ? 'default' : 'pointer', opacity: locked ? 0.45 : 1 }}
                      onMouseEnter={e => { if (!locked) e.currentTarget.style.background = C.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ fontSize: 11, color: C.muted, fontFamily: "var(--font-mono), monospace", flexShrink: 0, minWidth: 18, textAlign: 'right' }}>
                        {lesson.num}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 13, color: C.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lesson.title}
                        </div>
                        <div style={{ fontSize: 11, color: C.muted, fontFamily: "var(--font-mono), monospace", letterSpacing: '0.04em' }}>
                          {month.label}{lesson.duration ? ` · ${lesson.duration}` : ''}
                        </div>
                      </div>
                      {locked && <LockIcon />}
                      <Badge label="урок" />
                    </div>
                  );
                }

                // ── Статья ────────────────────────────────────────
                if (r.type === 'knowledge') {
                  const { item } = r;
                  return (
                    <div key={i} onClick={() => handleSelect(r)}
                      style={{ ...rowBase, cursor: 'pointer' }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.bg; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                      <span style={{ fontSize: 12, color: C.muted, flexShrink: 0, lineHeight: 1 }}>✦</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "var(--font-mono), 'JetBrains Mono', monospace", fontSize: 13, color: C.ink, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.title}
                        </div>
                        {item.subtitle && (
                          <div style={{ fontSize: 11, color: C.muted, fontFamily: "var(--font-mono), monospace", letterSpacing: '0.04em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.subtitle}
                          </div>
                        )}
                      </div>
                      <Badge label="статья" />
                    </div>
                  );
                }

                return null;
              })
          }
        </div>
      )}
    </div>
  );
}
