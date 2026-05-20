import { Suspense } from 'react';
import PaymentSuccessContent from './PaymentSuccessContent';

export default function Page() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f3ee', color: '#999', fontSize: 13 }}>Загрузка…</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
