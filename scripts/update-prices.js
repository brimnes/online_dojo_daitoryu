/**
 * Обновляет цены на продукты в БД.
 * Запуск: node scripts/update-prices.js
 *
 * Изменения:
 *   - Разделы Иккаджо (tachiai, idori, ushirodori, hanzahandachi): 4900 → 3000 ₽
 *   - Весь Иккаджо (ikkajo): 14900 → 9900 ₽
 *   - Месяцы (1990 ₽) — не меняются
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Обновляем цены продуктов...\n');

  // Разделы Иккаджо — 3000 ₽
  const sectionResult = await prisma.product.updateMany({
    where: {
      type:      'section',
      reference: { in: ['tachiai', 'idori', 'ushirodori', 'hanzahandachi'] },
    },
    data: { price: 3000 },
  });
  console.log(`Разделы Иккаджо: обновлено ${sectionResult.count} записей → 3 000 ₽`);

  // Весь Иккаджо — 9900 ₽
  const fullResult = await prisma.product.updateMany({
    where: { type: 'section', reference: 'ikkajo' },
    data:  { price: 9900 },
  });
  console.log(`Весь Иккаджо:    обновлено ${fullResult.count} записей → 9 900 ₽`);

  // Проверка — вывести все продукты с ценами
  console.log('\nТекущие цены:');
  const products = await prisma.product.findMany({
    where:   { isActive: true },
    select:  { type: true, reference: true, title: true, price: true },
    orderBy: { sortOrder: 'asc' },
  });
  products.forEach(p => {
    console.log(`  [${p.type}] ${p.reference.padEnd(16)} ${p.title.padEnd(20)} ${Number(p.price).toLocaleString('ru-RU')} ₽`);
  });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
