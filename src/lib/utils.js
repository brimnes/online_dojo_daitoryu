export const LEVEL_ORDER = ['6kyu','5kyu','4kyu','3kyu','2kyu','1kyu','1dan','2dan','3dan'];

export function levelIndex(id) {
  return LEVEL_ORDER.indexOf(id);
}

export function hasLevel(userLevel, requiredLevel) {
  return levelIndex(userLevel) >= levelIndex(requiredLevel);
}

export const C = {
  bg:         '#f5f3ee',
  white:      '#fff',
  border:     '#e8e0d0',
  gold:       '#8B6914',
  dark:       '#1a1a1a',
  muted:      '#aaa',
  light:      '#faf6ee',
  goldBorder: '#e8dcc8',
};
