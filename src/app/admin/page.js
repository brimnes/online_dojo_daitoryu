'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(null); // null=loading, true=ok, false=denied

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user?.role === 'admin') {
          setAllowed(true);
        } else {
          router.replace('/');
        }
      })
      .catch(() => router.replace('/'));
  }, [router]);

  if (!allowed) return null; // тихо ждём — не показываем ничего во время проверки

  return <AdminPanel onExit={() => router.push('/')} />;
}
