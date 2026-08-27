import { marioTheme } from './mario.js';
import { darkFantasyTheme } from './darkFantasy.js';

export const themes = Object.freeze({
  mario: marioTheme,
  'dark-fantasy': darkFantasyTheme
});

export function getTheme(id = 'dark-fantasy') {
  return themes[id] || darkFantasyTheme;
}

export function resolveThemeId() {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('theme');
    if (fromUrl && themes[fromUrl]) return fromUrl;
    const stored = localStorage.getItem('chessThemeV1');
    if (stored && themes[stored]) return stored;
  } catch {}
  return 'dark-fantasy';
}

export const activeTheme = getTheme(resolveThemeId());

export function saveTheme(id) {
  if (!themes[id]) return false;
  try { localStorage.setItem('chessThemeV1', id); } catch {}
  return true;
}
