'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState(null); // null=loading/denied, user object=ok

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.user?.role === 'admin') {
          setAdmin(data.user);
        } else {
          router.replace('/');
        }
      })
      .catch(() => router.replace('/'));
  }, [router]);

  if (!admin) return null; // тихо ждём — не показываем ничего во время проверки

  return <AdminPanel onExit={() => router.push('/')} user={admin} />;
}
