'use client';

import { useEffect, useRef, useState } from 'react';
import { AccessibilityProvider, useAccessibility } from '@/lib/accessibility';
import { useIsMobile } from '@/lib/mobile';
import { C, F } from '@/lib/utils';

const SCALE_OPTIONS = [
  { value: 1,    label: '100%' },
  { value: 1.15, label: '115%' },
  { value: 1.3,  label: '130%' },
];

function AccessibilityToggleButton() {
  const isMobile = useIsMobile();
  const { fontScale, highContrast, setFontScale, toggleHighContrast } = useAccessibility();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', fn);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', fn);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const bottom = isMobile ? 'calc(96px + 12px + env(safe-area-inset-bottom, 0px))' : 24;

  return (
    <div ref={ref} style={{ position: 'fixed', right: isMobile ? 16 : 24, bottom, zIndex: 250 }}>
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 10px)',
            right: 0,
            zIndex: 260,
            width: 230,
            background: C.surface2,
            border: `1px solid ${C.border}`,
            borderRadius: 12,
            boxShadow: C.shadowDeep,
            padding: 16,
          }}
        >
          <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
            Размер текста
          </div>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {SCALE_OPTIONS.map((opt) => {
              const active = fontScale === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setFontScale(opt.value)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    fontFamily: F.mono,
                    fontSize: 12,
                    cursor: 'pointer',
                    borderRadius: 8,
                    border: `1px solid ${active ? C.accent : C.border}`,
                    background: active ? C.accent : 'transparent',
                    color: active ? C.onAccent : C.ink2,
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.muted, marginBottom: 8 }}>
            Высокий контраст
          </div>
          <button
            onClick={toggleHighContrast}
            aria-pressed={highContrast}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '8px 4px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontFamily: F.mono,
              fontSize: 13,
              color: C.ink2,
            }}
          >
            <span
              style={{
                position: 'relative',
                width: 36,
                height: 20,
                borderRadius: 999,
                background: highContrast ? C.accent : C.border,
                transition: 'background 0.15s ease',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  left: highContrast ? 18 : 2,
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.15s ease',
                }}
              />
            </span>
            {highContrast ? 'Включён' : 'Выключен'}
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Настройки доступности"
        aria-expanded={open}
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: C.surface2,
          border: `1px solid ${C.goldBorder}`,
          boxShadow: C.shadow,
          fontFamily: F.serif,
          fontSize: 18,
          fontWeight: 600,
          color: C.ink2,
          cursor: 'pointer',
        }}
      >
        Aa
      </button>
    </div>
  );
}

export default function AccessibilityRoot({ children }) {
  return (
    <AccessibilityProvider>
      {children}
      <AccessibilityToggleButton />
    </AccessibilityProvider>
  );
}
