import en from './en.json';

export type Lang = 'kk' | 'en';
export const LANGS: Lang[] = ['kk', 'en'];

const dict: Record<Lang, Record<string, string>> = { kk: {}, en };

/**
 * UI strings are written in Kazakh and used as keys; other languages map them.
 * Missing translations fall back to Kazakh. `{name}` placeholders are interpolated.
 */
export function translate(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  let s = dict[lang]?.[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

export type T = (key: string, vars?: Record<string, string | number>) => string;

export const useT = (lang: Lang): T => (key, vars) => translate(lang, key, vars);

/** Prefixes a site path with the locale ("/fonts" → "/en/fonts"). */
export function localePath(lang: Lang, path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = path.startsWith('/') ? path : `/${path}`;
  return lang === 'kk' ? clean : `/${lang}${clean === '/' ? '/' : clean}`;
}

/** Returns the same page in another locale. */
export function switchLocale(pathname: string, target: Lang): string {
  const bare = pathname.replace(/^\/en(?=\/|$)/, '') || '/';
  return localePath(target, bare);
}

export function langFromPath(pathname: string): Lang {
  return /^\/en(\/|$)/.test(pathname) ? 'en' : 'kk';
}

export function formatDate(lang: Lang, date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(lang === 'kk' ? 'kk-KZ' : 'en-GB', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function plural(lang: Lang, n: number, one: string, many: string): string {
  return lang === 'en' ? `${n} ${n === 1 ? one : many}` : `${n} ${translate(lang, many)}`;
}
