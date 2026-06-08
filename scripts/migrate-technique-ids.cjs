/**
 * Мигрирует ID техник в формат sectionId_TechName
 * (например Uraotoshi → tachiai_Uraotoshi).
 *
 * Запуск: node scripts/migrate-technique-ids.js
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 7 новых записей для комбинаций, которых раньше не было в БД
const NEW_RECORDS = [
  { id: 'idori_Ippondori',    nameRu: 'Иппондори',   kyu: '3kyu', section: 'idori',          sortOrder: 1  },
  { id: 'idori_Kurumadaoshi', nameRu: 'Курумадаоси', kyu: '3kyu', section: 'idori',          sortOrder: 4  },
  { id: 'idori_Gyakuudedori', nameRu: 'Гьякудэдори', kyu: '3kyu', section: 'idori',          sortOrder: 2  },
  { id: 'idori_Karaminage',   nameRu: 'Караминагэ',  kyu: '3kyu', section: 'idori',          sortOrder: 7  },
  { id: 'idori_Kotegaeshi',   nameRu: 'Котэгаэси',   kyu: '3kyu', section: 'idori',          sortOrder: 8  },
  { id: 'hanzahandachi_Uraotoshi',  nameRu: 'Ураотоси',  kyu: '1kyu', section: 'hanzahandachi', sortOrder: 2 },
  { id: 'hanzahandachi_Kataotoshi', nameRu: 'Катаотоси', kyu: '1kyu', section: 'hanzahandachi', sortOrder: 4 },
];

async function migrate() {
  const techniques = await prisma.technique.findMany({ orderBy: { sortOrder: 'asc' } });

  console.log(`\nНайдено ${techniques.length} техник в БД\n`);

  for (const tech of techniques) {
    const sectionLower = tech.section.toLowerCase();
    const newId = `${sectionLower}_${tech.id}`;

    if (newId === tech.id) {
      console.log(`  ✓ ${tech.id} — уже в правильном формате`);
      continue;
    }

    // Проверяем, нет ли уже записи с новым ID
    const existing = await prisma.technique.findUnique({ where: { id: newId } });
    if (existing) {
      console.log(`  ⚠️  ${newId} уже существует, пропускаем переименование ${tech.id}`);
      continue;
    }

    console.log(`  → ${tech.id}  ⟶  ${newId}`);

    await prisma.$transaction(async (tx) => {
      // 1. Создаём новую запись с новым ID
      await tx.technique.create({
        data: {
          id:          newId,
          nameRu:      tech.nameRu,
          kyu:         tech.kyu,
          section:     sectionLower,
          description: tech.description,
          principles:  tech.principles,
          senseiQuote: tech.senseiQuote,
          sortOrder:   tech.sortOrder,
        },
      });

      // 2. Перепривязываем ошибки
      const mistakes = await tx.techniqueMistake.updateMany({
        where: { techniqueId: tech.id },
        data:  { techniqueId: newId },
      });

      // 3. Перепривязываем видео
      const videos = await tx.techniqueVideo.updateMany({
        where: { techniqueId: tech.id },
        data:  { techniqueId: newId },
      });

      console.log(`     ошибок перенесено: ${mistakes.count}, видео: ${videos.count}`);

      // 4. Удаляем старую запись (каскад не сработает — все дети уже переехали)
      await tx.technique.delete({ where: { id: tech.id } });
    });
  }

  console.log('\nСоздаём новые записи для недостающих комбинаций...\n');

  for (const rec of NEW_RECORDS) {
    const existing = await prisma.technique.findUnique({ where: { id: rec.id } });
    if (existing) {
      console.log(`  ✓ ${rec.id} уже существует`);
    } else {
      await prisma.technique.create({ data: rec });
      console.log(`  + создана: ${rec.id} (${rec.nameRu})`);
    }
  }

  const total = await prisma.technique.count();
  console.log(`\n✅ Миграция завершена. Итого в БД: ${total} техник\n`);
}

migrate()
  .catch(e => { console.error('❌ Ошибка:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
