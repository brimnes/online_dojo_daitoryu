/**
 * src/lib/access.js
 * Pure helper functions for checking user_access rows.
 * No hooks, no side effects — safe to import anywhere.
 *
 * userAccessRows = array of { type, reference } from user_access table
 */

// Единственный источник правды для section keys — ikkajoSections.js
export { IKKAJO_SECTION_KEYS as IKKAJO_SECTIONS, IKKAJO_SECTION_LABELS } from '@/lib/ikkajoSections';
import { IKKAJO_SECTION_KEYS } from '@/lib/ikkajoSections';

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
