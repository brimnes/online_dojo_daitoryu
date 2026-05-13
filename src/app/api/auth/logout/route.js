/**
 * POST /api/auth/logout
 *
 * Очищает cookie 'dojo_token'.
 * Response: { ok: true }
 */

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth-server.js';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}
