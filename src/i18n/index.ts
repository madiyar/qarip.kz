import en from './en.json';
import ru from './ru.json';

export type Lang = 'kk' | 'ru' | 'en';
/** Order used by language switchers. Kazakh is the default and has no URL prefix. */
export const LANGS: Lang[] = ['kk', 'ru', 'en'];
export const LOCALE_TAG: Record<Lang, string> = { kk: 'kk-KZ', ru: 'ru', en: 'en' };
export const LANG_LABEL: Record<Lang, string> = { kk: 'Қазақша', ru: 'Русский', en: 'English' };

const dict: Record<Lang, Record<string, string>> = { kk: {}, ru, en };
const PREFIX = /^\/(en|ru)(?=\/|$)/;

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

/** Prefixes a site path with the locale ("/fonts" → "/ru/fonts"). */
export function localePath(lang: Lang, path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = withSlash(path.startsWith('/') ? path : `/${path}`);
  return lang === 'kk' ? clean : `/${lang}${clean}`;
}

/**
 * Pages are served with a trailing slash (the host redirects "/fonts" to "/fonts/"),
 * so links and canonical URLs use that form: "/fonts?our=1" → "/fonts/?our=1".
 */
export function withSlash(path: string): string {
  const [, base, rest = ''] = path.match(/^([^?#]*)(.*)$/)!;
  return base.endsWith('/') || /\.[a-z0-9]+$/i.test(base) ? path : `${base}/${rest}`;
}

/** Path without the locale prefix ("/ru/fonts" → "/fonts"). */
export function barePath(pathname: string): string {
  return pathname.replace(PREFIX, '') || '/';
}

/** Returns the same page in another locale. */
export function switchLocale(pathname: string, target: Lang): string {
  return localePath(target, barePath(pathname));
}

export function langFromPath(pathname: string): Lang {
  return (pathname.match(PREFIX)?.[1] as Lang | undefined) ?? 'kk';
}

export function formatDate(lang: Lang, date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString(LOCALE_TAG[lang], { year: 'numeric', month: 'long', day: 'numeric' });
}

/** Picks a value written per language, falling back to Kazakh. */
export function pick<V>(lang: Lang, values: Partial<Record<Lang, V>> & { kk: V }): V {
  return values[lang] ?? values.kk;
}
