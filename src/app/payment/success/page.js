'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaymentSuccess() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const type         = searchParams.get('type');
  const ref          = searchParams.get('ref');

  useEffect(() => {
    // Небольшая задержка — даём webhook время записать доступ
    const timer = setTimeout(() => {
      router.push('/');
    }, 3000);
    return () => clearTimeout(timer);
  }, [router]);

  const label = type === 'section'
    ? 'доступ к базе техник'
    : `доступ к урокам ${ref || ''}`;

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#f5f3ee', fontFamily: "'Jost', sans-serif",
    }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 24px' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: '#f0faf4', border: '1px solid #b8e0c8',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 28,
        }}>✓</div>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>
          Оплата прошла!
        </div>
        <p style={{ fontSize: 13, color: '#888', lineHeight: 1.8, marginBottom: 24 }}>
          Вы получили {label}.<br />
          Перенаправляем вас в кабинет…
        </p>
        <div style={{ fontSize: 12, color: '#bbb' }}>
          Если не перенаправило автоматически —{' '}
          <button onClick={() => router.push('/')}
            style={{ background: 'none', border: 'none', color: '#8B6914', cursor: 'pointer', fontSize: 12 }}>
            нажмите здесь
          </button>
        </div>
      </div>
    </div>
  );
}
