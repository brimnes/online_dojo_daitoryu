'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

const C = {
  bg:      '#f5f3ee',
  green:   '#4d6a4a',
  greenBg: '#f0faf4',
  greenBorder: '#b8e0c8',
  gold:    '#8B6914',
  muted:   '#888',
  ink:     '#1a1a1a',
  red:     '#8a2a20',
  redBg:   '#fff8f7',
  border:  '#d0c8b8',
};

const POLL_INTERVAL_MS = 3000;  // пауза между проверками
const MAX_ATTEMPTS     = 10;    // максимум попыток (30 сек)

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const type = searchParams.get('type');
  const ref  = searchParams.get('ref');

  const [phase,   setPhase]   = useState('checking'); // checking | succeeded | timeout | error
  const [attempt, setAttempt] = useState(0);
  const [errMsg,  setErrMsg]  = useState('');
  const timerRef = useRef(null);

  useEffect(() => {
    // Читаем provider_payment_id из sessionStorage
    let pid = null;
    try { pid = sessionStorage.getItem('yk_pending_pid'); } catch {}

    if (!pid) {
      // pid нет — возможно, открыли success вручную или старый редирект
      // Просто ждём 4 сек и редиректим на главную (webhook мог сработать)
      timerRef.current = setTimeout(() => { window.location.href = '/'; }, 4000);
      return;
    }

    let attempts = 0;

    const check = async () => {
      attempts++;
      setAttempt(attempts);

      try {
        const res = await fetch('/api/yookassa/verify-payment', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ provider_payment_id: pid }),
        });

        const data = await res.json();

        if (data.status === 'succeeded') {
          try { sessionStorage.removeItem('yk_pending_pid'); } catch {}
          setPhase('succeeded');
          // Небольшая задержка, чтобы пользователь увидел "✓ Оплата прошла", потом редирект
          timerRef.current = setTimeout(() => { window.location.href = '/'; }, 2500);
          return;
        }

        if (data.status === 'cancelled') {
          try { sessionStorage.removeItem('yk_pending_pid'); } catch {}
          setPhase('error');
          setErrMsg('Платёж был отменён.');
          return;
        }

        // Ещё pending — продолжаем опрашивать
        if (attempts >= MAX_ATTEMPTS) {
          setPhase('timeout');
          return;
        }

        timerRef.current = setTimeout(check, POLL_INTERVAL_MS);

      } catch (e) {
        if (attempts >= MAX_ATTEMPTS) {
          setPhase('timeout');
        } else {
          timerRef.current = setTimeout(check, POLL_INTERVAL_MS);
        }
      }
    };

    // Небольшая начальная задержка — даём YooKassa время обработать
    timerRef.current = setTimeout(check, 1500);

    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const label = type === 'section'
    ? 'доступ к базе техник'
    : ref
      ? `доступ к урокам — ${ref}`
      : 'доступ к урокам';

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: C.bg, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ textAlign: 'center', maxWidth: 420, padding: '0 24px' }}>

        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: phase === 'succeeded' ? C.greenBg : phase === 'error' ? C.redBg : '#f5f3ee',
          border: `1px solid ${phase === 'succeeded' ? C.greenBorder : phase === 'error' ? '#e8c0b8' : C.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px', fontSize: 28,
          transition: 'all 0.3s',
        }}>
          {phase === 'succeeded' && '✓'}
          {phase === 'error'     && '✕'}
          {phase === 'timeout'   && '⏱'}
          {phase === 'checking'  && <SpinnerIcon />}
        </div>

        {/* Title */}
        <div style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: 28, fontWeight: 600, color: C.ink, marginBottom: 10,
        }}>
          {phase === 'succeeded' && 'Оплата прошла!'}
          {phase === 'checking'  && 'Проверяем платёж…'}
          {phase === 'timeout'   && 'Платёж обрабатывается'}
          {phase === 'error'     && 'Ошибка платежа'}
        </div>

        {/* Description */}
        <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.8, marginBottom: 24 }}>
          {phase === 'succeeded' && (
            <>Вы получили {label}.<br/>Перенаправляем вас в кабинет…</>
          )}
          {phase === 'checking' && (
            <>Подождите — получаем подтверждение от платёжной системы.<br/>
            <span style={{ fontSize: 11, opacity: 0.7 }}>Попытка {attempt} из {MAX_ATTEMPTS}</span></>
          )}
          {phase === 'timeout' && (
            <>Платёж принят, но подтверждение ещё не получено.<br/>
            Доступ откроется автоматически в течение нескольких минут.<br/>
            Вы можете вернуться в кабинет прямо сейчас.</>
          )}
          {phase === 'error' && (
            <>{errMsg || 'Что-то пошло не так.'} Попробуйте ещё раз или обратитесь в поддержку.</>
          )}
        </p>

        {/* Action buttons */}
        {(phase === 'timeout' || phase === 'error') && (
          <button
            onClick={() => { window.location.href = '/'; }}
            style={{
              padding: '12px 28px',
              background: C.gold, color: '#fff', border: 'none',
              fontFamily: "-apple-system, sans-serif",
              fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em',
            }}>
            Перейти в кабинет
          </button>
        )}

        {phase === 'succeeded' && (
          <div style={{ fontSize: 12, color: C.muted }}>
            Если не перенаправило —{' '}
            <button onClick={() => { window.location.href = '/'; }}
              style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: 12 }}>
              нажмите здесь
            </button>
          </div>
        )}

        {phase === 'checking' && (
          <div style={{ fontSize: 11, color: C.muted }}>
            Не закрывайте страницу
          </div>
        )}

      </div>
    </div>
  );
}

function SpinnerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle cx="12" cy="12" r="9" fill="none" stroke="#c8a978" strokeWidth="2" strokeDasharray="28 56" strokeLinecap="round"/>
    </svg>
  );
}
