/**
 * src/lib/access.js
 * Pure helper functions for checking user_access rows.
 * No hooks, no side effects — safe to import anywhere.
 */

import { IKKAJO_SECTION_KEYS } from '@/lib/ikkajoSections';

// Реэкспорт для обратной совместимости — компоненты импортируют отсюда
export { IKKAJO_SECTION_KEYS as IKKAJO_SECTIONS } from '@/lib/ikkajoSections';

// IKKAJO_SECTION_LABELS определён здесь напрямую — не зависит от версии ikkajoSections.js
export const IKKAJO_SECTION_LABELS = {
  tachiai:        'Тачиай',
  idori:          'Идори',
  ushirodori:     'Усиродори',
  hanzahandachi:  'Хандза-хандати',
};

/** Доступ к конкретному месяцу */
export function hasMonthAccess(userAccessRows, monthId) {
  return (userAccessRows || []).some(
    a => a.type === 'month' && a.reference === monthId
  );
}

/** Доступ ко всему Ikkajo (type=section, reference=ikkajo) */
export function hasIkkajoFullAccess(userAccessRows) {
  return (userAccessRows || []).some(
    a => a.type === 'section' && a.reference === 'ikkajo'
  );
}

/**
 * Доступ к конкретному подразделу.
 * Полный доступ (reference=ikkajo) перекрывает всё.
 * Неизвестный ключ → false (locked).
 */
export function hasIkkajoSectionAccess(userAccessRows, section) {
  if (!section || !IKKAJO_SECTION_KEYS.includes(section)) return false;
  if (hasIkkajoFullAccess(userAccessRows)) return true;
  return (userAccessRows || []).some(
    a => a.type === 'section' && a.reference === section
  );
}

/** Список доступных подразделов */
export function getAccessibleIkkajoSections(userAccessRows) {
  if (hasIkkajoFullAccess(userAccessRows)) return IKKAJO_SECTION_KEYS;
  return IKKAJO_SECTION_KEYS.filter(s => hasIkkajoSectionAccess(userAccessRows, s));
}
