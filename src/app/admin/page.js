'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminPanel from '@/components/AdminPanel';

export default function AdminPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(null); // null=loading, true=ok, false=denied

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role === 'admin') {
        setAllowed(true);
      } else {
        router.replace('/');
      }
    })();
  }, [router]);

  if (!allowed) return null; // тихо ждём — не показываем ничего во время проверки

  return <AdminPanel onExit={() => router.push('/')} />;
}
