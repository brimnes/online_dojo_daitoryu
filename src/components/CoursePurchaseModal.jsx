'use client';

import { useState } from 'react';
import { C } from '@/lib/utils';
import RichText from '@/components/RichText';

const MONO  = "var(--font-mono),'JetBrains Mono',monospace";
const SERIF = "var(--font-cormorant),'Cormorant Garamond',serif";
const KANJI = "'Noto Serif JP', var(--font-noto), serif";

// ── Превью и покупка тематического курса — по образцу IkkajoChoiceModal ──
// course — объект из /api/courses (с product и videos).
export default function CoursePurchaseModal({ course, onClose, isMobile }) {
  const [buying, setBuying] = useState(false);
  const [error,  setError]  = useState('');
  if (!course) return null;

  const product  = course.product;
  const sections = course.videos || [];
  const canBuy   = !!product?.is_active;

  const handleBuy = async () => {
    if (!canBuy || buying) return;
    setBuying(true);
    setError('');
    try {
      const res = await fetch('/api/robokassa/create-payment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Ошибка при создании платежа'); setBuying(false); return; }
      if (data.payment_id) { try { sessionStorage.setItem('yk_pending_pid', data.payment_id); } catch {} }
      // buying не сбрасываем — кнопка заблокирована до перехода на оплату
      window.location.href = data.confirmation_url;
    } catch {
      setError('Ошибка соединения');
      setBuying(false);
    }
  };

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 400, padding: 20 }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.surface, border: `1px solid ${C.border}`,
        width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.28)',
      }}>
        {/* Обложка */}
        {course.image_url && (
          <img src={course.image_url} alt="" style={{ display: 'block', width: '100%', aspectRatio: '16 / 7', objectFit: 'cover' }} />
        )}

        {/* Header */}
        <div style={{ padding: isMobile ? '24px 20px 16px' : '32px 36px 20px', borderBottom: `1px solid ${C.border}`, position: 'relative' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: isMobile ? 16 : 24, right: isMobile ? 16 : 24, background: 'none', border: 'none', color: C.muted, fontSize: 20, cursor: 'pointer', lineHeight: 1, padding: 4, minWidth: 32, minHeight: 32 }}>✕</button>
          <div style={{ fontFamily: KANJI, fontSize: 13, color: C.accent, letterSpacing: '0.18em', marginBottom: 8 }}>{course.kanji || '技'}</div>
          <div style={{ fontFamily: SERIF, fontSize: isMobile ? 30 : 38, color: C.ink, fontWeight: 500, letterSpacing: '0.03em', lineHeight: 1, marginBottom: 10, paddingRight: 28 }}>{course.title}</div>
          {course.description
            ? <div style={{ maxWidth: 460 }}><RichText content={course.description} breaks /></div>
            : course.subtitle && <div style={{ fontFamily: SERIF, fontSize: 15, color: C.muted, lineHeight: 1.55, maxWidth: 440 }}>{course.subtitle}</div>}
        </div>

        <div style={{ padding: isMobile ? '16px 20px 20px' : '20px 36px 28px' }}>
          {/* Программа курса */}
          {sections.length > 0 && (
            <>
              <div style={{ fontFamily: MONO, fontSize: 11, color: C.muted, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12 }}>
                Программа курса · {sections.length}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: C.border, marginBottom: 24 }}>
                {sections.map((s, i) => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '12px 14px' : '13px 18px', background: C.surface }}>
                    <span style={{ fontFamily: MONO, fontSize: 11, color: C.muted, minWidth: 22, flexShrink: 0 }}>{String(i + 1).padStart(2, '0')}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: SERIF, fontSize: 17, color: C.ink, fontWeight: 500 }}>{s.title}</div>
                      {s.subtitle && <div style={{ fontFamily: MONO, fontSize: 12, color: C.muted, marginTop: 2 }}>{s.subtitle}</div>}
                    </div>
                    <span style={{ fontSize: 12, flexShrink: 0 }}>🔒</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Купить курс */}
          <div style={{ background: '#15120e', padding: isMobile ? '20px 18px' : '24px 28px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -6, fontFamily: KANJI, fontSize: 90, color: '#b8923a', opacity: 0.12, lineHeight: 1, pointerEvents: 'none', userSelect: 'none' }}>{course.kanji || '技'}</div>
            <div style={{ position: 'relative' }}>
              <div style={{ fontFamily: MONO, fontSize: 11, color: '#b8923a', letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Купить курс</div>
              <div style={{ fontFamily: SERIF, fontSize: 14, color: '#c2b59c', lineHeight: 1.6, marginBottom: 16 }}>
                Разовая оплата · постоянный доступ ко всем разделам курса
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ fontFamily: SERIF, fontSize: 28, color: '#ede5d3', fontWeight: 500 }}>
                  {product ? `${product.price.toLocaleString('ru-RU')} ₽` : '—'}
                </div>
                <button
                  onClick={handleBuy} disabled={!canBuy || buying}
                  style={{
                    padding: '12px 24px', minHeight: 44,
                    background: buying || !canBuy ? '#7a6c52' : '#b8923a', color: '#15120e',
                    border: 'none', cursor: buying || !canBuy ? 'default' : 'pointer',
                    fontFamily: MONO, fontSize: 12, fontWeight: 600,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                  }}>
                  {buying ? 'Переход к оплате…' : canBuy ? 'Купить курс' : 'Продажа скоро'}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 16, fontFamily: MONO, fontSize: 12, color: '#a03030' }}>{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}
