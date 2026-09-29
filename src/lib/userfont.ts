import { detectFormat, toSfnt, type FontFormat } from './sfnt';

export interface LoadedFont {
  id: string;
  fileName: string;
  format: FontFormat;
  size: number;
  /** Original bytes as uploaded. */
  original: ArrayBuffer;
  /** Decoded TTF/OTF bytes. */
  sfnt: ArrayBuffer;
  /** CSS font-family registered for this file. */
  family: string;
  name: string;
  style: string;
  weight: number;
  italic: boolean;
  glyphs: number;
  scripts: string[];
  /** Kazakh letters absent from the font. */
  missingKazakh: string[];
  features: string[];
  axes: { tag: string; min: number; max: number; default: number; name: string }[];
}

const ALPHABETS: Record<string, string> = {
  latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  cyrillic: 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя',
  kazakh: 'ӘәҒғҚқҢңӨөҰұҮүҺһІі',
  'kazakh-latin': 'ÄäĞğİıÑñÖöŞşŪūÜü',
};

export const KAZAKH_LETTERS = ALPHABETS.kazakh;

let counter = 0;

/** Reads a user file, decodes WOFF/WOFF2, registers it with FontFace and inspects it. */
export async function loadFontFile(file: File | { name: string; buffer: ArrayBuffer }): Promise<LoadedFont> {
  const original = 'buffer' in file ? file.buffer : await file.arrayBuffer();
  const format = detectFormat(original);
  if (format === 'unknown') throw new Error('unsupported');
  const sfnt = await toSfnt(original);
  const opentype = (await import('opentype.js')).default;
  const font = opentype.parse(sfnt);
  const names = font.names.windows ?? font.names.macintosh ?? ({} as Record<string, Record<string, string>>);
  const pick = (k: string) => names[k]?.en ?? Object.values(names[k] ?? {})[0];
  const family = `qu-${++counter}-${Date.now().toString(36)}`;
  const face = new FontFace(family, sfnt.slice(0));
  await face.load();
  document.fonts.add(face);
  const os2 = font.tables.os2 ?? {};
  const gsub = font.tables.gsub?.features ?? [];
  const gpos = font.tables.gpos?.features ?? [];
  const features = [...new Set([...gsub, ...gpos].map((f: { tag: string }) => f.tag))].sort();
  const axes = (font.tables.fvar?.axes ?? []).map((a: { tag: string; minValue: number; maxValue: number; defaultValue: number; name?: Record<string, string> }) => ({
    tag: a.tag,
    min: a.minValue,
    max: a.maxValue,
    default: a.defaultValue,
    name: a.name?.en ?? a.tag,
  }));
  return {
    id: family,
    fileName: file.name,
    format,
    size: original.byteLength,
    original,
    sfnt,
    family,
    name: pick('preferredFamily') || pick('fontFamily') || file.name,
    style: pick('preferredSubfamily') || pick('fontSubfamily') || 'Regular',
    weight: os2.usWeightClass || 400,
    italic: Boolean((os2.fsSelection ?? 0) & 1),
    glyphs: font.numGlyphs,
    scripts: Object.entries(ALPHABETS)
      .filter(([, chars]) => [...chars].every((c) => font.charToGlyphIndex(c) > 0))
      .map(([k]) => k),
    missingKazakh: [...ALPHABETS.kazakh].filter((c) => font.charToGlyphIndex(c) === 0),
    features,
    axes,
  };
}

/** Loads a catalog font (by URL) the same way as an uploaded one. */
export async function loadFontUrl(url: string, name?: string): Promise<LoadedFont> {
  const buffer = await (await fetch(url)).arrayBuffer();
  return loadFontFile({ name: name ?? url.split('/').pop()!, buffer });
}

export const FEATURE_NAMES: Record<string, string> = {
  aalt: 'Access All Alternates',
  calt: 'Contextual Alternates',
  case: 'Case-Sensitive Forms',
  ccmp: 'Glyph Composition',
  c2sc: 'Small Capitals From Capitals',
  dlig: 'Discretionary Ligatures',
  dnom: 'Denominators',
  frac: 'Fractions',
  kern: 'Kerning',
  liga: 'Standard Ligatures',
  lnum: 'Lining Figures',
  locl: 'Localized Forms',
  mark: 'Mark Positioning',
  mkmk: 'Mark to Mark',
  numr: 'Numerators',
  onum: 'Oldstyle Figures',
  ordn: 'Ordinals',
  pnum: 'Proportional Figures',
  salt: 'Stylistic Alternates',
  sinf: 'Scientific Inferiors',
  smcp: 'Small Capitals',
  subs: 'Subscript',
  sups: 'Superscript',
  swsh: 'Swash',
  tnum: 'Tabular Figures',
  zero: 'Slashed Zero',
};
export const featureName = (tag: string) => FEATURE_NAMES[tag] ?? (/^ss\d\d$/.test(tag) ? `Stylistic Set ${Number(tag.slice(2))}` : /^cv\d\d$/.test(tag) ? `Character Variant ${Number(tag.slice(2))}` : tag);
