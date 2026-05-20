# Phase 0 / Phase 1 — Миграция Supabase → PostgreSQL + собственный Auth

> **Правило фаз:** Код не переписывается по разделам, а заменяется слой за слоем.
> Каждый шаг завершается работающим приложением — не сломанным промежуточным состоянием.
> Фронтенд, бизнес-логика, Kinescope, YooKassa — не трогаем до конца Phase 2.

---

## Phase 0 — Фиксация схемы и подготовка инфраструктуры

### 0.1 Полный список таблиц

| Таблица | Тип ID | Критичность | Комментарий |
|---|---|---|---|
| `users` *(= auth.users + profiles)* | UUID | 🔴 КРИТИЧНАЯ | Новая. Объединяет две таблицы Supabase |
| `user_access` | serial INT | 🔴 КРИТИЧНАЯ | Источник правды для платного доступа |
| `payments` | UUID | 🔴 КРИТИЧНАЯ | Журнал YooKassa, нужен для идемпотентности |
| `products` | UUID | 🔴 КРИТИЧНАЯ | Каталог продуктов, используется в оплате |
| `months` | TEXT ('jan'..'dec') | 🟡 ВАЖНАЯ | Статика, 12 строк |
| `lessons` | TEXT ('jan-1'..) | 🟡 ВАЖНАЯ | Контент уроков + video_id для Kinescope |
| `techniques` | TEXT ('Ippondori'..) | 🟡 ВАЖНАЯ | Техники Иккаджо |
| `technique_videos` | TEXT ('ip-v1'..) | 🟡 ВАЖНАЯ | Видео техник, video_id для Kinescope webhook |
| `technique_mistakes` | serial INT | 🟢 ОБЫЧНАЯ | FK → techniques |
| `exams` | serial INT | 🟡 ВАЖНАЯ | Заявки на аттестацию |
| `lesson_progress` | serial INT | 🟢 ОБЫЧНАЯ | Прогресс просмотра |
| `comments` | serial INT | 🟢 ОБЫЧНАЯ | Комментарии к урокам |
| `knowledge_items` | serial INT | 🟢 ОБЫЧНАЯ | ⚠️ DDL нет в миграциях — уточнить схему |

### 0.2 Связи между таблицами

```
users
  ├── user_access     (user_access.user_id → users.id)
  ├── payments        (payments.user_id → users.id)
  ├── exams           (exams.user_id → users.id)
  │   └── exams       (exams.teacher_id → users.id)  [nullable]
  ├── lesson_progress (lesson_progress.user_id → users.id)
  └── comments        (comments.user_id → users.id)

months
  └── lessons         (lessons.month_id → months.id)
        ├── lesson_progress (lesson_progress.lesson_id → lessons.id)
        └── comments        (comments.lesson_id → lessons.id)

techniques
  ├── technique_mistakes (technique_mistakes.technique_id → techniques.id)
  └── technique_videos   (technique_videos.technique_id → techniques.id)

products  [нет FK из других таблиц — связь через payments.product_id только логическая]
knowledge_items  [нет внешних связей]
```

### 0.3 Индексы (критичные для производительности)

```sql
-- Из 003_kinescope.sql — нужны для kinescope/webhook
CREATE INDEX idx_lessons_video_id      ON lessons (video_id);
CREATE INDEX idx_tech_videos_video_id  ON technique_videos (video_id);

-- Уникальные ограничения (из 001_schema.sql, 004_payments.sql)
UNIQUE (user_access.user_id, user_access.type, user_access.reference)
UNIQUE (payments.provider_payment_id)
UNIQUE (products.type, products.reference)
UNIQUE (users.email)
UNIQUE (lesson_progress.user_id, lesson_progress.lesson_id)
```

### 0.4 Триггеры Supabase — что нужно убрать и перенести в код

| Триггер | Таблица | Что делает | Куда переносим |
|---|---|---|---|
| `on_auth_user_created` | `auth.users` | Автосоздаёт строку в `profiles` | `/api/auth/register` — явный `prisma.user.create()` |
| `on_exam_approved` | `exams` | При `status='approved'` → обновляет `profiles.level` | `/api/admin/exams/approve` — явный `prisma.user.update({ data: { level } })` |

### 0.5 Экспорт данных из Supabase

```bash
# Подключение: Supabase Dashboard → Settings → Database → Connection string
# URI вида: postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# 1. Экспорт только нужных таблиц (без схемы auth)
pg_dump \
  "postgresql://postgres:[pass]@db.[ref].supabase.co:5432/postgres" \
  --no-owner --no-acl \
  -t profiles \
  -t months \
  -t lessons \
  -t techniques \
  -t technique_mistakes \
  -t technique_videos \
  -t user_access \
  -t payments \
  -t products \
  -t exams \
  -t lesson_progress \
  -t comments \
  -t knowledge_items \
  > supabase_export.sql

# 2. Отдельно: email + id из auth.users (нужен для слияния с profiles)
# Supabase Dashboard → Authentication → Users → Export (CSV)
# Или через SQL Editor:
# SELECT id, email FROM auth.users;
# → сохранить как auth_users.csv

# 3. Проверка количества строк перед импортом
psql "..." -c "
  SELECT 'profiles'        AS tbl, COUNT(*) FROM profiles        UNION ALL
  SELECT 'user_access',           COUNT(*) FROM user_access       UNION ALL
  SELECT 'payments',              COUNT(*) FROM payments          UNION ALL
  SELECT 'lessons',               COUNT(*) FROM lessons;
"
```

---

## Phase 1 — Новая база + Prisma + Auth слой

### 1.1 Установка зависимостей

```bash
npm install prisma @prisma/client
npm install bcryptjs jsonwebtoken
npm install --save-dev @types/bcryptjs @types/jsonwebtoken

# Инициализация Prisma
npx prisma init --datasource-provider postgresql
# → создаст prisma/schema.prisma и .env с DATABASE_URL
```

Перенести `migration/schema.prisma` в `prisma/schema.prisma`.

Переменные окружения в `.env.local`:
```bash
DATABASE_URL="postgresql://[user]:[pass]@[host]:5432/[db]"
JWT_SECRET="[случайная строка 64+ символа]"
JWT_EXPIRES_IN="7d"
```

### 1.2 Создание таблиц в новой БД

```bash
# После настройки DATABASE_URL
npx prisma db push         # создаёт таблицы по schema.prisma
# ИЛИ (рекомендуется для production)
npx prisma migrate dev --name init
```

### 1.3 Импорт данных

```bash
# Шаг 1: создать таблицу users из profiles + emails
# Скрипт: scripts/import-users.js (написать отдельно)
# Логика:
#   1. Читать auth_users.csv (id, email)
#   2. JOIN с profiles по id
#   3. INSERT в users с password_hash = '' (пустой — принудительный сброс пароля)
#   4. Или: password_hash = bcrypt('временный_пароль')

# Шаг 2: импортировать остальные таблицы
psql "$DATABASE_URL" < supabase_export.sql

# Шаг 3: проверка
npx prisma studio  # визуальный браузер данных
```

> ⚠️ **По поводу паролей.** Supabase хранит пароли в `auth.users` и не даёт к ним доступа
> (это намеренная политика безопасности). Варианты:
> - **Вариант А (рекомендуется):** При первом входе после миграции → forced password reset.
>   Отправить всем пользователям email со ссылкой на смену пароля.
> - **Вариант Б:** Временный пароль. Захешировать bcrypt'ом, пользователи меняют при входе.
> - **Вариант В:** Плавная миграция. Держать Supabase Auth параллельно для существующих
>   пользователей, новых регистрировать в своей БД. Объединить через middleware.

---

## Auth-слой — полная карта замены

### Новый файл: `src/lib/auth-server.js`

```js
// src/lib/auth-server.js
// ТОЛЬКО серверный код — не импортировать в 'use client' компоненты

import bcrypt      from 'bcryptjs';
import jwt         from 'jsonwebtoken';

const JWT_SECRET     = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Хеширование пароля при регистрации
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

// Проверка пароля при входе
export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

// Создание JWT-токена
// payload: { userId, email, role }
export function createToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Валидация токена → возвращает payload или null
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Извлечение токена из запроса (Authorization header или cookie)
export function getTokenFromRequest(req) {
  // 1. Authorization: Bearer <token>
  const auth = req.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);

  // 2. httpOnly cookie 'session'
  const cookie = req.headers.get('cookie') || '';
  const match  = cookie.match(/(?:^|;\s*)session=([^;]+)/);
  return match ? match[1] : null;
}

// Получить текущего пользователя из запроса → { userId, email, role } или null
// Не ходит в БД — только декодирует JWT
export function getUserFromRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

// Хелпер для API-routes: бросает 401/403 если не авторизован
// Использование: const user = requireAuth(req); if (user instanceof Response) return user;
export function requireAuth(req) {
  const user = getUserFromRequest(req);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return user;
}

export function requireAdmin(req) {
  const user = getUserFromRequest(req);
  if (!user)              return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
  return user;
}
```

### Новые API-routes для auth

```
src/app/api/auth/
  register/route.js    — POST: создать пользователя, вернуть JWT
  login/route.js       — POST: проверить пароль, вернуть JWT
  logout/route.js      — POST: очистить cookie
  me/route.js          — GET:  вернуть текущего пользователя
  reset-password/route.js  — POST: сброс пароля (Phase 2)
```

**Шаблон `/api/auth/login/route.js`:**
```js
import { prisma }                   from '@/lib/prisma';
import { verifyPassword, createToken } from '@/lib/auth-server';

export async function POST(req) {
  const { email, password } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return Response.json({ error: 'Invalid credentials' }, { status: 401 });

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok)  return Response.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = createToken({ userId: user.id, email: user.email, role: user.role });

  const res = Response.json({
    user: { id: user.id, name: user.name, email: user.email,
            role: user.role, level: user.level }
  });
  // httpOnly cookie — браузер хранит, JS не видит
  res.headers.set('Set-Cookie',
    `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}`
  );
  return res;
}
```

**Шаблон `/api/auth/register/route.js`:**
```js
import { prisma }                      from '@/lib/prisma';
import { hashPassword, createToken }   from '@/lib/auth-server';

export async function POST(req) {
  const { email, password, name, selfLevel, senseiName, experience } = await req.json();

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return Response.json({ error: 'Email already registered' }, { status: 409 });

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name, selfLevel, senseiName, experience,
            role: 'student', level: '6kyu', status: 'active' }
  });

  // Аналог триггера on_auth_user_created — здесь явно, без триггера
  const token = createToken({ userId: user.id, email: user.email, role: user.role });

  const res = Response.json({
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
  res.headers.set('Set-Cookie',
    `session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 24 * 3600}`
  );
  return res;
}
```

### Как заменить `supabase.auth.getUser(token)` в каждом route

**Было (Supabase):**
```js
const anonClient = createClient(url, key, {
  global: { headers: { Authorization: `Bearer ${token}` } }
});
const { data: { user }, error } = await anonClient.auth.getUser();
if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

const { data: profile } = await anonClient
  .from('profiles').select('role').eq('id', user.id).single();
if (profile?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
```

**Стало (собственный auth):**
```js
import { requireAdmin } from '@/lib/auth-server';

const user = requireAdmin(req);        // { userId, email, role } из JWT
if (user instanceof Response) return user;  // 401 или 403 — выходим
// user.role === 'admin' гарантировано, user.userId — ID текущего пользователя
```

> ℹ️ Роль хранится прямо в JWT-токене — не нужен запрос в БД для каждой проверки.
> При смене роли (редко) — пользователь должен перелогиниться. Это приемлемо.

---

## Карта замены API route handlers

### Вспомогательный файл: `src/lib/prisma.js`

```js
// src/lib/prisma.js — singleton для Prisma Client
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

### Route 1: `/api/yookassa/create-payment/route.js`

**Что берёт из Supabase:**
1. `supabaseAdmin.auth.getUser(token)` — получить user
2. `supabaseAdmin.from('products').select('*').eq('id', productId)` — найти продукт
3. `supabaseAdmin.from('user_access').select('id').eq(...)` — проверить дубль
4. `supabaseAdmin.from('payments').insert(...)` — создать запись платежа

**Замена на Prisma:**
```js
// 1. Auth
import { requireAuth } from '@/lib/auth-server';
const user = requireAuth(req);
if (user instanceof Response) return user;
// user.userId — готово, без запроса в БД

// 2. Найти продукт
const product = await prisma.product.findFirst({
  where: { id: productId, isActive: true }
});

// 3. Проверить дубль доступа
const existing = await prisma.userAccess.findFirst({
  where: { userId: user.userId, type: product.type, reference: product.reference }
});
if (existing) return Response.json({ error: 'Access already granted' }, { status: 409 });

// 4. Создать платёж
await prisma.payment.create({
  data: {
    userId: user.userId, productId: product.id,
    productTitle: product.title, productType: product.type,
    productReference: product.reference,
    amount: product.price, currency: 'RUB',
    status: 'pending', paymentProvider: 'yookassa',
    providerPaymentId: payment.id,  // id от YooKassa API
  }
});
```

**Проверка пользователя:** `requireAuth` (не admin, просто авторизован)
**Нужен service access:** нет — обычный write под текущим пользователем

---

### Route 2: `/api/yookassa/webhook/route.js`

**Что берёт из Supabase:**
1. `supabaseAdmin.from('payments').select('id,status').eq('provider_payment_id', paymentId)` — дубль-чек
2. `supabaseAdmin.from('products').select('*').eq('id', productId)` — продукт
3. `supabaseAdmin.from('payments').update({status:'succeeded',...}).eq(...)` — обновить
4. `supabaseAdmin.from('payments').insert(...)` — или создать
5. `supabaseAdmin.from('user_access').upsert(...)` — выдать доступ

**Замена на Prisma:**
```js
// 1. Дубль-чек
const existing = await prisma.payment.findFirst({
  where: { providerPaymentId: paymentId }
});
if (existing?.status === 'succeeded') return Response.json({ ok: true });

// 2. Продукт
const product = await prisma.product.findUnique({ where: { id: productId } });

// 3+4. Обновить или создать платёж
if (existing) {
  await prisma.payment.update({
    where: { providerPaymentId: paymentId },
    data: { status: 'succeeded', paidAt: new Date(), rawPayload: body }
  });
} else {
  await prisma.payment.create({ data: { ...fields, status: 'succeeded' } });
}

// 5. Выдать доступ (аналог RPC grant_access)
await prisma.userAccess.upsert({
  where: { userId_type_reference: { userId, type: accessType, reference: product.reference } },
  create: { userId, type: accessType, reference: product.reference,
             amount: product.price, paidAt: new Date() },
  update: { amount: product.price, paidAt: new Date() }
});
```

**Проверка пользователя:** нет (webhook от YooKassa, валидация Basic Auth)
**Нужен service access:** да (пишет без user JWT) → используем prisma напрямую (server-only)

---

### Route 3: `/api/kinescope/webhook/route.js`

**Что берёт из Supabase:**
1. `supabaseAdmin.from('lessons').update({video_status}).eq('video_id', videoId)` 
2. `supabaseAdmin.from('technique_videos').update({video_status}).eq('video_id', videoId)`

**Замена на Prisma:**
```js
await prisma.lesson.updateMany({
  where: { videoId },
  data: { videoStatus: video_status, ...(video_status === 'ready' && {
    videoDuration: String(duration), videoPosterUrl: poster
  }) }
});

await prisma.techniqueVideo.updateMany({
  where: { videoId },
  data: { videoStatus: video_status, ...(video_status === 'ready' && {
    duration: String(duration)
  }) }
});
```

**Проверка пользователя:** нет (webhook от Kinescope, проверяется X-Kinescope-Signature)
**Нужен service access:** да → prisma напрямую

---

### Route 4: `/api/kinescope/upload-url/route.js`

**Что берёт из Supabase:**
1. `supabaseAdmin.auth.getUser(token)` — кто вызывает
2. `supabaseAdmin.from('profiles').select('role').eq('id', user.id)` — проверка admin
3. `supabaseAdmin.from('lessons').update({video_id, video_status:'uploading'}).eq('id', lessonId)`
4. `supabaseAdmin.from('technique_videos').update({...}).eq('id', techniqueVideoId)`

**Замена на Prisma:**
```js
// 1+2. Auth — роль уже в токене
const user = requireAdmin(req);
if (user instanceof Response) return user;

// 3. Обновить lesson
if (lessonId) {
  await prisma.lesson.update({
    where: { id: lessonId },
    data: { videoId, videoProvider: 'kinescope', videoStatus: 'uploading' }
  });
}
// 4. Обновить technique_video
if (techniqueVideoId) {
  await prisma.techniqueVideo.update({
    where: { id: techniqueVideoId },
    data: { videoId, videoProvider: 'kinescope', videoStatus: 'uploading' }
  });
}
```

**Проверка пользователя:** `requireAdmin`
**Нужен service access:** нет (обычное обновление под admin JWT)

---

### Route 5: `/api/kinescope/auth/route.js`

**Что берёт из Supabase:**
1. `supabaseAdmin.from('lessons').select('id,month_id').eq('video_id', video_id)` — найти урок
2. `supabaseAdmin.from('technique_videos').select('id,technique_id').eq('video_id', video_id)`
3. `supabaseAdmin.from('profiles').select('role,level').eq('id', viewer_id)` — роль зрителя
4. `supabaseAdmin.from('months').select('is_open').eq('id', lesson.month_id)` — открыт ли месяц
5. `supabaseAdmin.from('user_access').select('id').eq('user_id', viewer_id).eq(...)` — есть доступ?
6. `supabaseAdmin.from('techniques').select('section').eq('id', techVideo.technique_id)`

**Замена на Prisma:**
```js
// 1+2. Найти видео
const [lesson, techVideo] = await Promise.all([
  prisma.lesson.findFirst({ where: { videoId: video_id }, select: { id: true, monthId: true } }),
  prisma.techniqueVideo.findFirst({ where: { videoId: video_id }, select: { id: true, techniqueId: true } })
]);

// 3. Роль зрителя
const viewer = await prisma.user.findUnique({
  where: { id: viewer_id }, select: { role: true, level: true }
});
if (viewer?.role === 'admin' || viewer?.role === 'teacher') return Response.json({ allow: true });

// 4+5. Проверка доступа к уроку
if (lesson) {
  const month = await prisma.month.findUnique({ where: { id: lesson.monthId }, select: { isOpen: true } });
  if (month?.isOpen) return Response.json({ allow: true });

  const access = await prisma.userAccess.findFirst({
    where: { userId: viewer_id, type: 'month', reference: lesson.monthId }
  });
  return Response.json(access ? { allow: true } : { error: 'No access' }, { status: access ? 200 : 403 });
}

// 6. Проверка доступа к технике
if (techVideo) {
  const access = await prisma.userAccess.findFirst({
    where: { userId: viewer_id, type: 'section', reference: 'ikkajo' }
  });
  return Response.json(access ? { allow: true } : { error: 'No access' }, { status: access ? 200 : 403 });
}
```

> ⚠️ **viewer_id после миграции.** Сейчас Kinescope получает `viewer_id` = Supabase UUID.
> После миграции UUID пользователей сохраняются (мы не меняем их), поэтому этот route
> будет работать без изменений при условии правильного экспорта данных.
> Настройка viewer_id в плеере — в Phase 2 (когда трогаем фронтенд).

**Проверка пользователя:** нет (запрос от Kinescope, проверяется X-Kinescope-Auth)

---

### Route 6: `/api/admin/grant-access/route.js`

**Что берёт из Supabase:**
1. `anonClient.auth.getUser()` — кто вызывает
2. `anonClient.from('profiles').select('role').eq('id', user.id)` — проверка admin
3. `serviceClient.rpc('grant_access', {p_user_id, p_type, p_reference, p_amount: 0})` — выдача
4. `serviceClient.from('user_access').delete().eq(...)` — отзыв

**Замена на Prisma:**
```js
// 1+2. Auth (роль в токене)
const user = requireAdmin(req);
if (user instanceof Response) return user;

if (revoke) {
  // 4. Отзыв
  await prisma.userAccess.deleteMany({
    where: { userId: user_id, type, reference }
  });
  return Response.json({ ok: true, action: 'revoked' });
}

// 3. Выдача (аналог RPC grant_access — обычный upsert)
await prisma.userAccess.upsert({
  where: { userId_type_reference: { userId: user_id, type, reference } },
  create: { userId: user_id, type, reference, amount: 0, paidAt: new Date() },
  update: { amount: 0, paidAt: new Date() }
});
return Response.json({ ok: true, action: 'granted' });
```

**Проверка пользователя:** `requireAdmin`
**Нужен service access:** нет — admin JWT достаточно

---

### Route 7: `/api/admin/user-access/route.js`

**Что берёт из Supabase:**
1. `anonClient.auth.getUser()` — кто вызывает
2. `anonClient.from('profiles').select('role')` — проверка admin
3. `serviceClient.from('user_access').select('type,reference,amount,paid_at').eq('user_id', targetUserId)` — данные

**Замена на Prisma:**
```js
const user = requireAdmin(req);
if (user instanceof Response) return user;

const rows = await prisma.userAccess.findMany({
  where: { userId: targetUserId },
  select: { type: true, reference: true, amount: true, paidAt: true },
  orderBy: { paidAt: 'desc' }
});
return Response.json(rows);
```

**Проверка пользователя:** `requireAdmin`

---

### Route 8: `/api/payments/webhook/route.js` (старый роут)

**Что берёт из Supabase:**
1. `supabase.rpc('grant_access', {p_user_id, p_type, p_reference, p_amount})` — выдача доступа

**Замена на Prisma:**
```js
// Аналогично Route 2
await prisma.userAccess.upsert({
  where: { userId_type_reference: { userId: user_id, type, reference } },
  create: { userId: user_id, type, reference, amount, paidAt: new Date() },
  update: { amount, paidAt: new Date() }
});
```

> ⚠️ Этот файл — дублирует функциональность `/api/yookassa/webhook`.
> После миграции стоит оставить только один webhook-роут.

---

### Файлы фронтенда с прямым вызовом Supabase (Phase 2 — не трогаем сейчас)

Эти файлы используют `supabase.auth.getUser()` напрямую.
Отмечены для Phase 2, когда будем переключать фронтенд.

| Файл | Что делает | Замена (Phase 2) |
|---|---|---|
| `src/components/AuthPage.jsx` | `signIn`, `signUp`, `getUser` | `fetch('/api/auth/login')`, `fetch('/api/auth/register')` |
| `src/components/Dashboard.jsx` | `getSession` → Bearer token для YooKassa | Читать token из cookie или `/api/auth/me` |
| `src/app/admin/page.js` | `getUser` + `from('profiles').select('role')` | `fetch('/api/auth/me')` → роль из ответа |
| `src/app/knowledge/[id]/page.jsx` | `getUser` + `from('knowledge_items')` | `fetch('/api/auth/me')` + `fetch('/api/knowledge/[id]')` |
| `src/components/KnowledgeItemPage.jsx` | `from('knowledge_items')` | Через хук `useKnowledge` из db.js (уже есть) |
| `src/lib/db.js` — все хуки | `supabase.from()` для всех таблиц | `fetch('/api/[table]')` по одному хуку |

---

## Резюме Phase 0 / Phase 1

```
Phase 0 (подготовка, ~1 день):
  [x] Зафиксирована схема — 13 таблиц, связи, индексы
  [x] Prisma schema написана (migration/schema.prisma)
  [ ] Экспорт данных из Supabase (pg_dump + auth CSV)
  [ ] Поднять PostgreSQL в РФ
  [ ] Импорт данных, проверка строк

Phase 1 (новые слои, не трогая фронтенд, ~3-4 дня):
  [ ] npm install prisma bcryptjs jsonwebtoken
  [ ] src/lib/prisma.js (singleton)
  [ ] src/lib/auth-server.js (hashPassword, createToken, verifyToken, requireAuth, requireAdmin)
  [ ] POST /api/auth/register
  [ ] POST /api/auth/login
  [ ] POST /api/auth/logout
  [ ] GET  /api/auth/me
  [ ] Переписать /api/yookassa/create-payment (auth + prisma)
  [ ] Переписать /api/yookassa/webhook (prisma)
  [ ] Переписать /api/kinescope/webhook (prisma)
  [ ] Переписать /api/kinescope/upload-url (auth + prisma)
  [ ] Переписать /api/kinescope/auth (prisma)
  [ ] Переписать /api/admin/grant-access (auth + prisma)
  [ ] Переписать /api/admin/user-access (auth + prisma)
  [ ] Тест: регистрация → вход → оплата (YooKassa test mode) → доступ открылся
  [ ] Тест: upload видео → Kinescope webhook → статус = ready

  Фронтенд НЕ трогаем. AuthPage всё ещё работает через Supabase.
  API routes уже работают на новой БД.

Phase 2 (фронтенд, отдельный этап):
  [ ] Переключить AuthPage.jsx с supabase.auth на fetch('/api/auth/...')
  [ ] Переключить хуки db.js с supabase.from() на fetch('/api/...')
  [ ] Убрать src/lib/supabase.js и @supabase/supabase-js
```
