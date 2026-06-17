'use client';

import { useState, useEffect } from 'react';

/**
 * Returns true if window.innerWidth <= 768px.
 * Safe for SSR (returns false on server).
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Mobile: narrow viewport OR landscape phone (short height, medium width)
      setIsMobile(w <= 768 || (h < 500 && w <= 1024));
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return isMobile;
}

/**
 * Register the PWA service worker.
 * Call once at app root.
 */
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((err) => console.warn('SW registration failed:', err));
    });
  }
}
