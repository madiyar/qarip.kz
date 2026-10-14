import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { CategoryInfo, FontSummary } from './types';
import type { Lang } from '../i18n';
import { categoryLabel } from './seo';

export type FontEntry = CollectionEntry<'fonts'>;
export type Style = FontEntry['data']['styles'][number];

/** CSS family name used for previews of a font (or one of its styles). */
export const familyName = (slug: string, style?: string) => `qf-${slug}${style ? `-${style}` : ''}`;

export async function getFonts(): Promise<FontEntry[]> {
  return (await getCollection('fonts')).sort((a, b) => b.data.addedDate.valueOf() - a.data.addedDate.valueOf());
}

const CATEGORY_ORDER = ['sans', 'serif', 'display', 'slab', 'handwritten', 'monospace'];

/** Categories in a fixed order; `label` is the short name in `lang`. */
export async function getCategories(lang: Lang = 'kk'): Promise<CategoryInfo[]> {
  const rank = (id: string) => CATEGORY_ORDER.indexOf(id) + 1 || 99;
  return (await getCollection('categories'))
    .map((c) => ({ id: c.id, ...c.data, label: categoryLabel(lang, c.id, c.data.name) }))
    .sort((a, b) => rank(a.id) - rank(b.id));
}

/** Name of a tag or purpose in `lang`; Kazakh when there is no translation. */
export function termName(lang: Lang, term: { name: string; nameRu?: string; nameEn?: string }): string {
  return (lang === 'ru' ? term.nameRu : lang === 'en' ? term.nameEn : undefined) || term.name;
}

/** Tags or purposes as `{ id, name }` in `lang`. */
export async function getTerms(kind: 'tags' | 'purposes', lang: Lang = 'kk') {
  return (await getCollection(kind)).map((x) => ({ id: x.id, name: termName(lang, x.data) }));
}

export function primaryStyle(font: FontEntry): Style {
  return font.data.styles[font.data.primary] ?? font.data.styles[0];
}

export function isFree(font: FontEntry | FontSummary): boolean {
  const tags = 'data' in font ? font.data.tags.map((t) => t.id) : font.tags;
  return tags.includes('free');
}

/** Compact, serialisable shape passed to client islands. Category names are in `lang`. */
export async function toSummaries(fonts: FontEntry[], lang: Lang = 'kk'): Promise<FontSummary[]> {
  const [designers, categories, licenses] = await Promise.all([
    getCollection('designers'),
    getCollection('categories'),
    getCollection('licenses'),
  ]);
  const byId = <T extends { id: string }>(list: T[]) => Object.fromEntries(list.map((x) => [x.id, x]));
  const d = byId(designers);
  const c = byId(categories);
  const l = byId(licenses);
  return fonts.map((f) => {
    const p = primaryStyle(f);
    const cat = c[f.data.category.id];
    const lic = l[f.data.license.id];
    return {
      slug: f.id,
      name: f.data.name,
      designers: f.data.designers.map((x) => ({ slug: x.id, name: d[x.id]?.data.name ?? x.id })),
      category: { id: f.data.category.id, name: categoryLabel(lang, f.data.category.id, cat?.data.name ?? f.data.category.id), color: cat?.data.color ?? '#71717a' },
      tags: f.data.tags.map((t) => t.id),
      purposes: f.data.purposes.map((t) => t.id),
      quality: f.data.quality,
      our: f.data.our,
      free: f.data.tags.some((t) => t.id === 'free') || Boolean(lic?.data.commercial),
      license: lic?.data.name ?? f.data.license.id,
      downloads: f.data.downloads,
      addedDate: f.data.addedDate.toISOString().slice(0, 10),
      stylesCount: f.data.styles.length,
      variable: f.data.styles.some((s) => s.variable),
      previewText: f.data.previewText,
      zip: f.data.zip,
      scripts: f.data.scripts,
      primary: { url: p.web, weight: p.weight, italic: p.italic },
    };
  });
}

// Previews use font-display: block — a sample in a fallback font misrepresents the font and
// jumps when the real one arrives; the text stays invisible for the short time a file loads.
// (The public CSS for other sites keeps "swap".)

/** @font-face rules for the primary style of each font. */
export function primaryFaces(fonts: FontSummary[]): string {
  return fonts
    .map(
      (f) =>
        `@font-face{font-family:'${familyName(f.slug)}';src:url('${f.primary.url}');font-weight:100 900;font-style:normal;font-display:block}`,
    )
    .join('\n');
}

/** @font-face rules for every style of a font, one family per style. */
export function styleFaces(font: FontEntry): string {
  return font.data.styles
    .map(
      (s) =>
        `@font-face{font-family:'${familyName(font.id, s.slug)}';src:url('${s.web}');font-weight:100 900;font-style:normal;font-display:block}`,
    )
    .join('\n');
}

/** Public, copy-pasteable CSS for using the font on a website. */
export function publicCssBlocks(font: FontEntry, site: URL | string): string[] {
  const format = (f: string) => ({ woff2: 'woff2', woff: 'woff', otf: 'opentype', ttf: 'truetype' })[f] ?? f;
  return font.data.styles
    .map((s) => {
      const isWoff2 = s.web.endsWith('.woff2');
      const url = new URL(isWoff2 ? s.web : s.file, site).toString();
      return `@font-face {
  font-family: '${font.data.name}';
  src: url('${url}') format('${isWoff2 ? 'woff2' : format(s.format)}');
  font-weight: ${s.variable ? '100 900' : s.weight};
  font-style: ${s.italic ? 'italic' : 'normal'};
  font-display: swap;
}`;
    });
}

export function publicCss(font: FontEntry, site: URL | string): string {
  return publicCssBlocks(font, site).join('\n\n');
}

/** Fonts made (or co-made) by a designer. */
export const byDesigner = (fonts: FontEntry[], designer: string) => fonts.filter((f) => f.data.designers.some((d) => d.id === designer));

export async function similarFonts(font: FontEntry, all: FontEntry[], limit = 3): Promise<FontEntry[]> {
  const score = (f: FontEntry) =>
    (f.data.category.id === font.data.category.id ? 3 : 0) +
    (f.data.designers.some((d) => font.data.designers.some((x) => x.id === d.id)) ? 2 : 0) +
    f.data.tags.filter((t) => font.data.tags.some((x) => x.id === t.id)).length;
  return all
    .filter((f) => f.id !== font.id)
    .sort((a, b) => score(b) - score(a) || b.data.downloads - a.data.downloads)
    .slice(0, limit);
}

export async function getLicense(font: FontEntry) {
  return getEntry(font.data.license);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}
