/**
 * src/lib/ikkajoSections.js
 *
 * ЕДИНСТВЕННЫЙ источник правды для идентификаторов секций Иккаджо.
 * Все остальные файлы импортируют отсюда — никаких захардкоженных строк.
 *
 * Canonical keys взяты из KYU_DATA (src/data/techniques.js):
 *   id:'tachiai'       ← sec.id
 *   id:'idori'         ← sec.id
 *   id:'ushirodori'    ← sec.id
 *   id:'hanzahandachi' ← sec.id  (НЕ 'handzahandati', НЕ 'handzahandachi')
 *
 * Ru-labels взяты из KYU_DATA.nameRu:
 *   'Татиай', 'Идори', 'Усиродори', 'Хандзахандати'
 */

export const IKKAJO_SECTION_CONFIG = [
  {
    key:    'tachiai',
    nameRu: 'Татиай',
    nameEn: 'Tachiai',
    label:  'Татиай',          // для UI кнопок / select
  },
  {
    key:    'idori',
    nameRu: 'Идори',
    nameEn: 'Idori',
    label:  'Идори',
  },
  {
    key:    'ushirodori',
    nameRu: 'Усиродори',
    nameEn: 'Ushirodori',
    label:  'Усиродори',
  },
  {
    key:    'hanzahandachi',
    nameRu: 'Хандзахандати',
    nameEn: 'Hanzahandachi',
    label:  'Хандза-хандати',  // для UI кнопок / select
  },
];

/** Массив canonical keys — для IKKAJO_SECTIONS в access.js и db.js */
export const IKKAJO_SECTION_KEYS = IKKAJO_SECTION_CONFIG.map(s => s.key);
// ['tachiai', 'idori', 'ushirodori', 'hanzahandachi']

/** Map: key → label (для UI) */
export const IKKAJO_SECTION_LABELS = Object.fromEntries(
  IKKAJO_SECTION_CONFIG.map(s => [s.key, s.label])
);
// { tachiai: 'Татиай', idori: 'Идори', ... }

/** Map: key → nameRu (точное название как в KYU_DATA) */
export const IKKAJO_SECTION_NAMES_RU = Object.fromEntries(
  IKKAJO_SECTION_CONFIG.map(s => [s.key, s.nameRu])
);

/**
 * Проверить что key является валидным ключом секции Ikkajo.
 * Неизвестный ключ → false → контент не рендерится.
 */
export function isValidIkkajoSection(key) {
  return IKKAJO_SECTION_KEYS.includes(key);
}

/**
 * Select-options для AdminPanel и UnlockAccess
 */
export const IKKAJO_SECTION_OPTIONS = IKKAJO_SECTION_CONFIG.map(s => ({
  value: s.key,
  label: s.label,
}));
