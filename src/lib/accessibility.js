'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'dojo_a11y_prefs';

const AccessibilityContext = createContext(null);

export function AccessibilityProvider({ children }) {
  const [fontScale, setFontScale] = useState(1);
  const [highContrast, setHighContrast] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const prefs = JSON.parse(raw);
        if (typeof prefs.fontScale === 'number') setFontScale(prefs.fontScale);
        if (typeof prefs.highContrast === 'boolean') setHighContrast(prefs.highContrast);
      }
    } catch {}
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ fontScale, highContrast }));
    } catch {}
  }, [fontScale, highContrast, mounted]);

  const toggleHighContrast = () => setHighContrast((v) => !v);

  return (
    <AccessibilityContext.Provider value={{ fontScale, highContrast, setFontScale, toggleHighContrast }}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  return (
    useContext(AccessibilityContext) ?? {
      fontScale: 1,
      highContrast: false,
      setFontScale: () => {},
      toggleHighContrast: () => {},
    }
  );
}
