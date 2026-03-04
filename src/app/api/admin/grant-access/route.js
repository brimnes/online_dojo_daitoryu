/**
 * POST /api/admin/grant-access
 * Тело: { user_id, type: 'month'|'section', reference: 'jan'|...|'ikkajo', revoke?: true }
 * Только для admin. Ручная выдача или отзыв доступа.
 */

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req) {
  // 1. Авторизация — читаем JWT из Authorization header
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey || !serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // Проверяем что caller — admin
  const anonClient = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user }, error: authError } = await anonClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await anonClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // 2. Читаем тело
  const { user_id, type, reference, revoke } = await req.json();
  if (!user_id || !type || !reference) {
    return NextResponse.json({ error: 'user_id, type, reference required' }, { status: 400 });
  }

  // 3. Используем service role для записи
  const serviceClient = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  });

  if (revoke) {
    // Отзыв доступа
    const { error } = await serviceClient
      .from('user_access')
      .delete()
      .eq('user_id', user_id)
      .eq('type', type)
      .eq('reference', reference);

    if (error) {
      console.error('grant-access revoke error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, action: 'revoked' });
  }

  // Выдача доступа через RPC
  const { error } = await serviceClient.rpc('grant_access', {
    p_user_id:   user_id,
    p_type:      type,
    p_reference: reference,
    p_amount:    0, // ручная выдача — сумма 0
  });

  if (error) {
    console.error('grant-access error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, action: 'granted' });
}
