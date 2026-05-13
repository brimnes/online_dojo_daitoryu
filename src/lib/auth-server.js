/**
 * src/lib/auth-server.js
 *
 * Серверный auth-слой: хеширование паролей, JWT, middleware.
 * Используется только в App Router API routes (Node.js runtime).
 *
 * Cookie: 'dojo_token' — httpOnly, SameSite=Lax, Secure в production.
 * JWT payload: { userId, email, role }
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';
import { prisma } from './prisma.js';

const COOKIE_NAME  = 'dojo_token';
const JWT_SECRET   = process.env.JWT_SECRET;
const JWT_EXPIRES  = process.env.JWT_EXPIRES_IN || '30d';

// ─── Пароли ───────────────────────────────────────────────────────────────────

/** Хешируем пароль перед сохранением в БД */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

/** Сравниваем plain-пароль с хешем из БД */
export async function verifyPassword(plain, hash) {
  if (!hash || hash === 'RESET_REQUIRED') return false;
  return bcrypt.compare(plain, hash);
}

// ─── JWT ──────────────────────────────────────────────────────────────────────

/** Создаём JWT с минимальным payload */
export function createToken(user) {
  if (!JWT_SECRET) throw new Error('JWT_SECRET не задан в .env');
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

/** Проверяем и декодируем JWT. Возвращает payload или null при ошибке. */
export function verifyToken(token) {
  if (!JWT_SECRET) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ─── Cookie ───────────────────────────────────────────────────────────────────

/** Устанавливаем httpOnly cookie с токеном */
export function setAuthCookie(response, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure:   isProduction,
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 30, // 30 дней
    path:     '/',
  });
}

/** Очищаем cookie при логауте */
export function clearAuthCookie(response) {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    maxAge:   0,
    path:     '/',
  });
}

// ─── Получение текущего пользователя из запроса ───────────────────────────────

/**
 * Достаём JWT payload из cookie запроса.
 * Возвращает { userId, email, role } или null.
 */
export function getTokenPayload(request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return null;
  return verifyToken(decodeURIComponent(match[1]));
}

/**
 * Загружаем полный профиль пользователя из БД по токену.
 * Возвращает объект User из Prisma или null.
 */
export async function getUserFromRequest(request) {
  const payload = getTokenPayload(request);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true, email: true, name: true, role: true,
      level: true, status: true, selfLevel: true,
      senseiName: true, experience: true, joinedAt: true,
    },
  });

  // Если пользователь деактивирован — считаем неавторизованным
  if (!user || user.status === 'inactive') return null;
  return user;
}

// ─── Middleware-хелперы ───────────────────────────────────────────────────────

/**
 * Обёртка для защищённых роутов.
 * Использование:
 *   const { user, error } = await requireAuth(request);
 *   if (error) return error;
 */
export async function requireAuth(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }
  return { user, error: null };
}

/**
 * Обёртка для admin-only роутов.
 * Использование:
 *   const { user, error } = await requireAdmin(request);
 *   if (error) return error;
 */
export async function requireAdmin(request) {
  const { user, error } = await requireAuth(request);
  if (error) return { user: null, error };

  if (user.role !== 'admin') {
    return {
      user: null,
      error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }),
    };
  }
  return { user, error: null };
}
