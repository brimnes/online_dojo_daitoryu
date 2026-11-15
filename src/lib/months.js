/**
 * Месяцы по годам.
 * Месяцы 2026 исторически без года в id ('jan'…'dec') — на них завязаны покупки.
 * Следующие годы: '2027-jan'…'2027-dec', год хранится в months.year.
 */

export const FIRST_YEAR = 2026;

export const monthYear = (m) => m?.year ?? FIRST_YEAR;

/** Годы, в которых есть месяцы, по возрастанию */
export function monthYears(months) {
  return [...new Set((months ?? []).map(monthYear))].sort((a, b) => a - b);
}

/** По умолчанию — текущий год, если он есть; иначе ближайший прошедший; иначе первый */
export function defaultMonthYear(years) {
  if (!years.length) return FIRST_YEAR;
  const now = new Date().getFullYear();
  if (years.includes(now)) return now;
  const past = years.filter(y => y < now);
  return past.length ? past[past.length - 1] : years[0];
}

/** «Январь 2027» */
export const monthTitle = (m) => (m ? `${m.label} ${monthYear(m)}` : '');

// Выбранный ученик/админом год — чтобы «← Месяцы» возвращал на ту же вкладку
const YEAR_KEY = 'months_year';
export function loadMonthYear() {
  try { const y = Number(sessionStorage.getItem(YEAR_KEY)); return y || null; } catch { return null; }
}
export function saveMonthYear(y) {
  try { sessionStorage.setItem(YEAR_KEY, String(y)); } catch {}
}

export const MONTH_KEYS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const MONTH_NAMES = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

/** id месяца → { year, key }: 'jan' → 2026/jan, '2027-jan' → 2027/jan; не месяц → null */
export function parseMonthId(id) {
  const m = /^(?:(\d{4})-)?([a-z]{3})$/.exec(id || '');
  if (!m || !MONTH_KEYS.includes(m[2])) return null;
  return { year: m[1] ? Number(m[1]) : FIRST_YEAR, key: m[2] };
}

/** id месяца → «Январь 2027» (без запроса к БД); не месяц → null */
export function monthRefLabel(id) {
  const p = parseMonthId(id);
  return p ? `${MONTH_NAMES[MONTH_KEYS.indexOf(p.key)]} ${p.year}` : null;
}

/** id месяца по году и ключу: 2026 → 'jan', 2027 → '2027-jan' */
export const monthIdFor = (year, key) => (year === FIRST_YEAR ? key : `${year}-${key}`);
