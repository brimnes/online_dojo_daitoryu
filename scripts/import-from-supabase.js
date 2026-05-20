/**
 * scripts/import-from-supabase.js
 *
 * Импортирует данные из Supabase → новая PostgreSQL (Timeweb) через Prisma.
 *
 * Запуск:
 *   node scripts/import-from-supabase.js
 *
 * Требования:
 *   - DATABASE_URL в .env (уже настроен)
 *   - Prisma schema актуальна (prisma db push уже выполнен)
 *
 * Порядок вставки соблюдает FK-зависимости.
 * Пароли: Supabase не отдаёт хеши → users создаются с password_hash='RESET_REQUIRED'
 *         При первом входе покажем форму смены пароля.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SUPABASE_URL = 'https://vpacuyltarbmfanayfby.supabase.co';
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwYWN1eWx0YXJibWZhbmF5ZmJ5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk0NTE1MSwiZXhwIjoyMDg3NTIxMTUxfQ.jlgHPoLRs4nFN7Ni9GZnOMX9cONvZwRwzFqDeJKy8Oc';

const HEADERS = {
  'apikey': SERVICE_KEY,
  'Authorization': `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchTable(table) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=10000`,
    { headers: HEADERS }
  );
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error(`${table}: ${JSON.stringify(data)}`);
  return data;
}

function log(msg) {
  console.log(`  ${msg}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🚀 Начинаем импорт данных из Supabase → Timeweb PostgreSQL\n');

  // ── 1. Профили → users ──────────────────────────────────────────────────────
  console.log('📥 [1/10] users (из profiles)...');
  const profiles = await fetchTable('profiles');

  let usersOk = 0, usersSkip = 0;
  for (const p of profiles) {
    try {
      await prisma.user.upsert({
        where: { id: p.id },
        create: {
          id:           p.id,
          email:        p.email,
          passwordHash: 'RESET_REQUIRED',  // пользователи сбросят пароль при первом входе
          name:         p.name         || '',
          level:        p.level        || '6kyu',
          role:         p.role         || 'student',
          status:       p.status       || 'active',
          selfLevel:    p.self_level   || 'none',
          senseiName:   p.sensei_name  || '',
          experience:   p.experience   || '',
          joinedAt:     p.joined_at    ? new Date(p.joined_at)  : new Date(),
          updatedAt:    p.updated_at   ? new Date(p.updated_at) : new Date(),
        },
        update: {
          email:      p.email,
          name:       p.name || '',
          level:      p.level || '6kyu',
          role:       p.role || 'student',
          status:     p.status || 'active',
          selfLevel:  p.self_level || 'none',
          senseiName: p.sensei_name || '',
          experience: p.experience || '',
        }
      });
      usersOk++;
    } catch (e) {
      log(`  ⚠️  user ${p.email}: ${e.message}`);
      usersSkip++;
    }
  }
  log(`✅ ${usersOk} создано, ${usersSkip} пропущено`);

  // ── 2. Months ───────────────────────────────────────────────────────────────
  console.log('📥 [2/10] months...');
  const months = await fetchTable('months');
  let ok = 0;
  for (const m of months) {
    await prisma.month.upsert({
      where: { id: m.id },
      create: {
        id:          m.id,
        label:       m.label,
        kanji:       m.kanji       || null,
        description: m.description || null,
        isOpen:      m.is_open     || false,
        sortOrder:   m.sort_order  || null,
      },
      update: {
        label:       m.label,
        kanji:       m.kanji       || null,
        description: m.description || null,
        isOpen:      m.is_open     || false,
        sortOrder:   m.sort_order  || null,
      }
    });
    ok++;
  }
  log(`✅ ${ok} месяцев`);

  // ── 3. Products ─────────────────────────────────────────────────────────────
  console.log('📥 [3/10] products...');
  const products = await fetchTable('products');
  ok = 0;
  for (const p of products) {
    await prisma.product.upsert({
      where: { id: p.id },
      create: {
        id:          p.id,
        type:        p.type,
        reference:   p.reference,
        title:       p.title,
        description: p.description || null,
        price:       p.price,
        isActive:    p.is_active   ?? true,
        sortOrder:   p.sort_order  || null,
      },
      update: {
        type:        p.type,
        reference:   p.reference,
        title:       p.title,
        description: p.description || null,
        price:       p.price,
        isActive:    p.is_active   ?? true,
        sortOrder:   p.sort_order  || null,
      }
    });
    ok++;
  }
  log(`✅ ${ok} продуктов`);

  // ── 4. Lessons ──────────────────────────────────────────────────────────────
  console.log('📥 [4/10] lessons...');
  const lessons = await fetchTable('lessons');
  ok = 0;
  for (const l of lessons) {
    await prisma.lesson.upsert({
      where: { id: l.id },
      create: {
        id:            l.id,
        monthId:       l.month_id,
        num:           l.num,
        title:         l.title,
        subtitle:      l.subtitle       || null,
        text:          l.text           || null,
        duration:      l.duration       || null,
        videoUrl:      l.video_url      || null,
        videoProvider: l.video_provider || null,
        videoId:       l.video_id       || null,
        videoStatus:   l.video_status   || 'none',
        videoPosterUrl: l.video_poster_url || null,
        videoDuration: l.video_duration || null,
        sortOrder:     l.sort_order     || null,
        createdAt:     l.created_at     ? new Date(l.created_at) : new Date(),
      },
      update: {
        monthId:       l.month_id,
        num:           l.num,
        title:         l.title,
        subtitle:      l.subtitle       || null,
        text:          l.text           || null,
        duration:      l.duration       || null,
        videoUrl:      l.video_url      || null,
        videoProvider: l.video_provider || null,
        videoId:       l.video_id       || null,
        videoStatus:   l.video_status   || 'none',
        videoPosterUrl: l.video_poster_url || null,
        videoDuration: l.video_duration || null,
      }
    });
    ok++;
  }
  log(`✅ ${ok} уроков`);

  // ── 5. Techniques ───────────────────────────────────────────────────────────
  console.log('📥 [5/10] techniques...');
  const techniques = await fetchTable('techniques');
  ok = 0;
  for (const t of techniques) {
    await prisma.technique.upsert({
      where: { id: t.id },
      create: {
        id:          t.id,
        nameRu:      t.name_ru,
        kyu:         t.kyu,
        section:     t.section,
        description: t.description  || null,
        principles:  Array.isArray(t.principles) ? t.principles : [],
        senseiQuote: t.sensei_quote || null,
        sortOrder:   t.sort_order   || null,
      },
      update: {
        nameRu:      t.name_ru,
        kyu:         t.kyu,
        section:     t.section,
        description: t.description  || null,
        principles:  Array.isArray(t.principles) ? t.principles : [],
        senseiQuote: t.sensei_quote || null,
        sortOrder:   t.sort_order   || null,
      }
    });
    ok++;
  }
  log(`✅ ${ok} техник`);

  // ── 6. Technique mistakes ────────────────────────────────────────────────────
  console.log('📥 [6/10] technique_mistakes...');
  const mistakes = await fetchTable('technique_mistakes');
  // Полная замена — удаляем старые, вставляем новые
  await prisma.techniqueMistake.deleteMany({});
  ok = 0;
  for (const m of mistakes) {
    await prisma.techniqueMistake.create({
      data: {
        id:          m.id,
        techniqueId: m.technique_id,
        title:       m.title,
        description: m.description || null,
        sortOrder:   m.sort_order  || null,
      }
    });
    ok++;
  }
  log(`✅ ${ok} ошибок`);

  // ── 7. Technique videos ──────────────────────────────────────────────────────
  console.log('📥 [7/10] technique_videos...');
  const techVideos = await fetchTable('technique_videos');
  await prisma.techniqueVideo.deleteMany({});
  ok = 0;
  for (const v of techVideos) {
    await prisma.techniqueVideo.create({
      data: {
        id:            v.id,
        techniqueId:   v.technique_id,
        category:      v.category,
        title:         v.title,
        duration:      v.duration       || null,
        videoUrl:      v.video_url      || null,
        videoProvider: v.video_provider || null,
        videoId:       v.video_id       || null,
        videoStatus:   v.video_status   || 'none',
        videoPosterUrl: v.video_poster_url || null,
        sortOrder:     v.sort_order     || null,
      }
    });
    ok++;
  }
  log(`✅ ${ok} видео техник`);

  // ── 8. User access ───────────────────────────────────────────────────────────
  console.log('📥 [8/10] user_access...');
  const access = await fetchTable('user_access');
  ok = 0; let skip = 0;
  for (const a of access) {
    try {
      await prisma.userAccess.upsert({
        where: {
          userId_type_reference: {
            userId:    a.user_id,
            type:      a.type,
            reference: a.reference,
          }
        },
        create: {
          userId:    a.user_id,
          type:      a.type,
          reference: a.reference,
          paidAt:    a.paid_at ? new Date(a.paid_at) : new Date(),
          amount:    a.amount  || null,
        },
        update: {
          paidAt:  a.paid_at ? new Date(a.paid_at) : new Date(),
          amount:  a.amount  || null,
        }
      });
      ok++;
    } catch (e) {
      log(`  ⚠️  access ${a.user_id} ${a.type}:${a.reference}: ${e.message}`);
      skip++;
    }
  }
  log(`✅ ${ok} доступов, ${skip} пропущено`);

  // ── 9. Payments ──────────────────────────────────────────────────────────────
  console.log('📥 [9/10] payments...');
  const payments = await fetchTable('payments');
  ok = 0; skip = 0;
  for (const p of payments) {
    try {
      await prisma.payment.upsert({
        where: { id: p.id },
        create: {
          id:                p.id,
          userId:            p.user_id,
          productId:         p.product_id,
          productTitle:      p.product_title     || null,
          productType:       p.product_type      || null,
          productReference:  p.product_reference || null,
          amount:            p.amount            || null,
          currency:          p.currency          || 'RUB',
          status:            p.status            || 'pending',
          paymentProvider:   p.payment_provider  || null,
          providerPaymentId: p.provider_payment_id || null,
          paidAt:            p.paid_at           ? new Date(p.paid_at) : null,
          rawPayload:        p.raw_payload        || null,
          createdAt:         p.created_at        ? new Date(p.created_at) : new Date(),
        },
        update: {
          status:  p.status || 'pending',
          paidAt:  p.paid_at ? new Date(p.paid_at) : null,
        }
      });
      ok++;
    } catch (e) {
      log(`  ⚠️  payment ${p.id}: ${e.message}`);
      skip++;
    }
  }
  log(`✅ ${ok} платежей, ${skip} пропущено`);

  // ── 10. Knowledge items ──────────────────────────────────────────────────────
  console.log('📥 [10/10] knowledge_items...');
  const knowledge = await fetchTable('knowledge_items');
  ok = 0;
  for (const k of knowledge) {
    await prisma.knowledgeItem.upsert({
      where: { id: k.id },
      create: {
        id:            k.id,
        title:         k.title,
        subtitle:      k.subtitle      || '',
        content:       k.content       || '',
        sortOrder:     k.sort_order    || 0,
        isPublished:   k.is_published  || false,
        videoProvider: k.video_provider || null,
        videoId:       k.video_id      || null,
        videoStatus:   k.video_status  || 'none',
        createdAt:     k.created_at    ? new Date(k.created_at) : new Date(),
      },
      update: {
        title:         k.title,
        subtitle:      k.subtitle      || '',
        content:       k.content       || '',
        sortOrder:     k.sort_order    || 0,
        isPublished:   k.is_published  || false,
        videoProvider: k.video_provider || null,
        videoId:       k.video_id      || null,
        videoStatus:   k.video_status  || 'none',
      }
    });
    ok++;
  }
  log(`✅ ${ok} статей базы знаний`);

  // ── Итог ─────────────────────────────────────────────────────────────────────
  console.log('\n✅ Импорт завершён!\n');
  console.log('Проверка количества строк в новой БД:');
  const counts = await Promise.all([
    prisma.user.count(),
    prisma.month.count(),
    prisma.lesson.count(),
    prisma.technique.count(),
    prisma.techniqueMistake.count(),
    prisma.techniqueVideo.count(),
    prisma.userAccess.count(),
    prisma.payment.count(),
    prisma.product.count(),
    prisma.knowledgeItem.count(),
  ]);
  const names = ['users','months','lessons','techniques','technique_mistakes',
                 'technique_videos','user_access','payments','products','knowledge_items'];
  counts.forEach((c, i) => console.log(`  ${names[i]}: ${c}`));

  console.log('\n⚠️  Важно: все пользователи созданы с password_hash="RESET_REQUIRED"');
  console.log('   При первом входе нужно показать форму смены пароля.\n');
}

main()
  .catch(e => { console.error('❌ Ошибка:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
