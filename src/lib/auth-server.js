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
 * Достаём JWT payload из cookie запроса (NextRequest).
 * Использует request.cookies.get() — Next.js App Router API,
 * надёжнее чем ручной разбор заголовка Cookie.
 * Возвращает { userId, email, role } или null.
 */
export function getTokenPayload(request) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/**
 * Поля пользователя, которые возвращаем из БД.
 * Единственное место — не дублировать список полей.
 */
const USER_SELECT = {
  id: true, email: true, name: true, role: true,
  level: true, status: true, selfLevel: true,
  senseiName: true, experience: true, avatarUrl: true, joinedAt: true,
};

/**
 * Загружаем полный профиль по JWT-токену (строка).
 * Используется в Server Components (page.js через cookies() из next/headers).
 * Возвращает объект User (JSON-serializable) или null.
 */
export async function getUserFromToken(token) {
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where:  { id: payload.userId },
    select: USER_SELECT,
  });

  if (!user || user.status === 'inactive') return null;

  // Преобразуем Date → ISO-строку для безопасной передачи в Client Component
  return {
    ...user,
    joinedAt: user.joinedAt ? user.joinedAt.toISOString() : null,
  };
}

/**
 * Загружаем полный профиль пользователя из БД по токену.
 * Используется в API routes.
 * Возвращает объект User из Prisma или null.
 */
export async function getUserFromRequest(request) {
  const payload = getTokenPayload(request);
  if (!payload?.userId) return null;

  const user = await prisma.user.findUnique({
    where:  { id: payload.userId },
    select: USER_SELECT,
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
