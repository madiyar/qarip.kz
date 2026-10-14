/**
 * Content loader for the font catalog.
 *
 * Every font is a folder: `public/fonts/<slug>/font.json` (what an editor fills in
 * the CMS: name, designers, license… and the list of uploaded files) next to the font
 * files themselves. Everything technical is derived here, at build time:
 *
 *  - the font files are the uploaded ones or, when none were uploaded, those inside the ZIP;
 *  - style name, weight, italic, variable axes, glyph count, supported alphabets and
 *    languages (src/data/languages.json) are read from each font binary;
 *  - a compressed WOFF2 copy for previews goes to `public/fonts-web/<slug>/`;
 *  - the list of files inside the uploaded ZIP archive is read for the font page;
 *    a ZIP is built from the font files only when no archive was uploaded;
 *  - download counts come from the live site (`/api/downloads`, a Netlify Function).
 *
 * `public/fonts-web/` is generated output and is not committed.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Loader, LoaderContext } from 'astro/loaders';
import opentype from 'opentype.js';
import { unzipSync, zipSync } from 'fflate';
import LANGUAGES from '../data/languages.json';

const FONT_EXT = /\.(ttf|otf|woff2?)$/i;
/** One file per style from an archive: source formats before web ones. */
const FORMAT_RANK: Record<string, number> = { ttf: 0, otf: 1, woff2: 2, woff: 3 };
/** Above this many static styles in an archive with variable fonts, only the variable ones are shown
 *  (Google Fonts ZIPs of optical-size families hold 80+ statics; the variable files cover them). */
const MAX_STATIC_FROM_ZIP = 40;

const WEIGHT_WORDS: [RegExp, number][] = [
  [/hairline|thin/i, 100],
  [/extra[- ]?light|ultra[- ]?light/i, 200],
  [/light/i, 300],
  [/semi[- ]?bold|demi[- ]?bold/i, 600],
  [/extra[- ]?bold|ultra[- ]?bold/i, 800],
  [/extra[- ]?black|ultra[- ]?black|heavy|black/i, 900],
  [/bold/i, 700],
  [/medium/i, 500],
];

/** Words that describe weight or slope; whatever is left of a style name is its sub-family (Narrow, Caption, Tilt…). */
const WEIGHT_OR_SLOPE = /^(thin|hairline|extra|ultra|light|extralight|ultralight|regular|normal|book|roman|medium|semi|demi|semibold|demibold|bold|extrabold|ultrabold|black|extrablack|ultrablack|heavy|italic|oblique)$/i;
const REGULAR_NAME = /^(regular|normal|book|roman|plain)$/i;
/** Marks of a variable font file in its name ("Golos Text VF") — not a style. */
const VARIABLE_MARK = /^(vf|var|variable|variablefont)$/i;

const ALPHABETS: Record<string, string> = {
  latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  cyrillic: 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя',
  kazakh: 'ӘәҒғҚқҢңӨөҰұҮүҺһІі',
  'kazakh-latin': 'ÄäĞğİıÑñÖöŞşŪūÜü',
};

/** Hyperglot orthographies as "iso-Script" + the characters they need (scripts/languages.py). */
const ORTHOGRAPHIES = LANGUAGES.map((l) => ({ key: `${l.id}-${l.script}`, chars: [...l.chars] }));

/** A variation axis of a variable font (fvar). */
export interface Axis {
  tag: string;
  name: string;
  min: number;
  max: number;
  default: number;
}

interface FileMeta {
  /** Full font name, e.g. "PT Sans Narrow Bold". */
  full: string;
  /** Typographic family, e.g. "PT Sans Narrow". */
  family: string;
  /** Typographic sub-family, e.g. "Bold". */
  subfamily: string;
  weight: number;
  /** usWidthClass: 5 is normal, lower is condensed, higher is expanded. */
  width: number;
  italic: boolean;
  variable: boolean;
  axes: Axis[];
  glyphs: number;
  scripts: string[];
  /** Languages the file supports, as "iso-Script" (Hyperglot data, src/data/languages.json). */
  languages: string[];
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toArrayBuffer = (b: Uint8Array) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;
const words = (s: string) => s.trim().split(/\s+/).filter(Boolean);
const hash = (data: Uint8Array | string) => createHash('sha1').update(data).digest('hex').slice(0, 10);

/** Reads metadata straight from a font binary (TTF, OTF, WOFF or WOFF2). */
async function inspect(buf: Buffer, ext: string): Promise<FileMeta> {
  let data = toArrayBuffer(buf);
  if (ext === 'woff2') {
    const decompress = (await import('woff2-encoder/decompress')).default;
    data = toArrayBuffer(await decompress(buf));
  }
  const font = opentype.parse(data);
  const names = font.names.windows ?? font.names.macintosh ?? {};
  const pick = (k: string): string | undefined => {
    const v = names[k]?.en ?? (Object.values(names[k] ?? {})[0] as string | undefined);
    return v?.trim() || undefined;
  };
  const family = pick('preferredFamily') || pick('fontFamily') || '';
  const subfamily = pick('preferredSubfamily') || pick('fontSubfamily') || 'Regular';
  const os2 = font.tables.os2 ?? {};
  const has = (c: string) => font.charToGlyphIndex(c) > 0;
  type FvarAxis = { tag: string; name?: Record<string, string>; minValue: number; maxValue: number; defaultValue: number };
  return {
    full: pick('fullName') || `${family} ${subfamily}`.trim(),
    family,
    subfamily,
    weight: os2.usWeightClass || 400,
    width: os2.usWidthClass || 5,
    italic: Boolean((os2.fsSelection ?? 0) & 1) || /italic|oblique/i.test(subfamily),
    variable: Boolean(font.tables.fvar),
    axes: ((font.tables.fvar?.axes ?? []) as FvarAxis[]).map((a) => ({
      tag: a.tag,
      name: a.name?.en ?? Object.values(a.name ?? {})[0] ?? a.tag,
      min: a.minValue,
      max: a.maxValue,
      default: a.defaultValue,
    })),
    glyphs: font.numGlyphs,
    scripts: Object.entries(ALPHABETS)
      .filter(([, chars]) => [...chars].every(has))
      .map(([k]) => k),
    // As the Hyperglot checker: a language counts in a script when one of its orthographies is complete.
    languages: [...new Set(ORTHOGRAPHIES.filter((o) => o.chars.every(has)).map((o) => o.key))],
  };
}

/** "PT Sans Narrow Bold" without "PT Sans" → "Narrow Bold" (whole words, any case); null when it is not a prefix. */
function stripPrefix(full: string, base: string): string | null {
  const f = words(full);
  const b = words(base);
  if (!b.length || b.length > f.length || b.some((w, i) => w.toLowerCase() !== f[i].toLowerCase())) return null;
  return f.slice(b.length).join(' ');
}

/** Longest run of leading words shared by all names. */
function commonPrefix(list: string[]): string {
  const split = list.map(words);
  const out: string[] = [];
  for (let i = 0; split.every((w) => i < w.length && w[i].toLowerCase() === split[0][i].toLowerCase()); i++) out.push(split[0][i]);
  return out.join(' ');
}

/**
 * Style names as a reader expects them: what the full name adds to the family name.
 * Fonts often store "Narrow" or "Condensed" in the family and only "Regular"/"Bold" in
 * the sub-family, so the sub-family alone would turn PT Sans Narrow into a second "Regular".
 */
function styleNames(metas: FileMeta[], fontName: string): string[] {
  let base = fontName;
  if (!metas.every((m) => stripPrefix(m.full, fontName) !== null)) {
    base = commonPrefix([...metas.map((m) => m.full), ...metas.map((m) => m.family)]);
  }
  return metas.map((m) => {
    const rest = words(stripPrefix(m.full, base) ?? m.full).filter((w) => !VARIABLE_MARK.test(w));
    return rest.join(' ') || m.subfamily;
  });
}

/** Weight from the OS/2 table; style names fix fonts that report 400 for every style or odd values like 250. */
function resolveWeight(weight: number, name: string): number {
  const fromName = WEIGHT_WORDS.find(([re]) => re.test(name))?.[1];
  if (fromName && ((weight === 400 && !REGULAR_NAME.test(name)) || weight % 100 !== 0)) weight = fromName;
  return Math.min(900, Math.max(100, Math.round(weight / 100) * 100));
}

/** Sub-family of a style name: "Narrow Bold" → "narrow", "Bold Italic" → "". */
const groupOf = (name: string) =>
  words(name)
    .filter((w) => !WEIGHT_OR_SLOPE.test(w))
    .join(' ')
    .toLowerCase();

export interface ZipEntry {
  name: string;
  size: number;
}

/** Files inside a ZIP archive (read from its directory, nothing is unpacked). */
function zipEntries(buf: Uint8Array): ZipEntry[] {
  const out: ZipEntry[] = [];
  unzipSync(buf, {
    filter: (f) => {
      if (!f.name.endsWith('/') && !/(^|\/)(__MACOSX\/|\.DS_Store$|Thumbs\.db$)/.test(f.name)) out.push({ name: f.name, size: f.originalSize });
      return false;
    },
  });
  // Drop a top-level folder shared by every file ("Literata/static/…" → "static/…").
  const root = out.length > 1 || out[0]?.name.includes('/') ? out[0].name.split('/')[0] + '/' : '';
  if (root && out.every((e) => e.name.startsWith(root))) for (const e of out) e.name = e.name.slice(root.length);
  return out.sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));
}

const mtime = (file: string) => fs.stat(file).then((s) => s.mtimeMs, () => 0);

/** File names as stored by the CMS: a bare name, or a path whose last segment is the name. */
const baseName = (value: unknown) => decodeURIComponent(String(value ?? '').split('/').pop() ?? '');
const asList = (v: unknown): string[] => (Array.isArray(v) ? v : v ? [v] : []).map(String).filter(Boolean);

interface Ctx {
  dir: string;
  /** Generated files: public/fonts-web/<slug>. */
  outDir: string;
  slug: string;
  downloads: Record<string, number>;
  warn: (m: string) => void;
}

/** Turns one `font.json` plus its files into a full catalog entry. Returns null when there is nothing to show yet. */
async function processFont({ dir, outDir, slug, downloads, warn }: Ctx, raw: Record<string, any>) {
  const fontName = String(raw.name ?? slug);
  const files = [...new Set(asList(raw.files).map(baseName).filter((f) => FONT_EXT.test(f)))];
  const read: (FileMeta & { fileName: string; ext: string; buf: Buffer; srcTime: number; fromZip?: boolean })[] = [];

  for (const fileName of files) {
    const src = path.join(dir, fileName);
    let buf: Buffer;
    try {
      buf = await fs.readFile(src);
    } catch {
      warn(`${slug}: file "${fileName}" is listed but missing — skipped`);
      continue;
    }
    const ext = path.extname(fileName).slice(1).toLowerCase();
    try {
      read.push({ ...(await inspect(buf, ext)), fileName, ext, buf, srcTime: await mtime(src) });
    } catch (e) {
      warn(`${slug}: cannot read "${fileName}" as a font (${(e as Error).message}) — skipped`);
    }
  }

  // No font files uploaded: the styles come from inside the ZIP.
  const archive = baseName(raw.archive);
  const archivePath = path.join(dir, archive);
  const archiveBuf = archive ? await fs.readFile(archivePath).catch(() => null) : null;
  if (!files.length && archiveBuf?.length) {
    let inZip: Record<string, Uint8Array> = {};
    try {
      inZip = unzipSync(archiveBuf, { filter: (f) => FONT_EXT.test(f.name) && !/(^|\/)(__MACOSX\/|\._)/.test(f.name) });
    } catch (e) {
      warn(`${slug}: cannot open archive "${archive}" (${(e as Error).message})`);
    }
    const srcTime = await mtime(archivePath);
    const found: typeof read = [];
    for (const [fileName, data] of Object.entries(inZip)) {
      const buf = Buffer.from(data.buffer, data.byteOffset, data.byteLength);
      const ext = path.extname(fileName).slice(1).toLowerCase();
      try {
        found.push({ ...(await inspect(buf, ext)), fileName, ext, buf, srcTime, fromZip: true });
      } catch (e) {
        warn(`${slug}: cannot read "${fileName}" in the archive as a font (${(e as Error).message}) — skipped`);
      }
    }
    // The same style in several formats (OTF + WOFF2, TTF/ and OTF/ folders) counts once.
    const byStyle = new Map<string, (typeof found)[number]>();
    found.sort((a, b) => FORMAT_RANK[a.ext] - FORMAT_RANK[b.ext] || a.fileName.localeCompare(b.fileName));
    for (const m of found) {
      const key = `${m.full.toLowerCase()}|${m.italic}|${m.variable}`;
      if (!byStyle.has(key)) byStyle.set(key, m);
    }
    let picked = [...byStyle.values()];
    const statics = picked.filter((m) => !m.variable).length;
    if (statics > MAX_STATIC_FROM_ZIP && picked.some((m) => m.variable)) {
      warn(`${slug}: the archive has ${statics} static styles — only its variable fonts are shown (upload font files to pick others)`);
      picked = picked.filter((m) => m.variable);
    }
    read.push(...picked);
  }

  if (!read.length) {
    warn(`${slug}: no usable font files — the font is hidden until a ZIP with fonts (or font files) is uploaded`);
    return null;
  }

  const names = styleNames(read, fontName);
  const styles: {
    name: string; slug: string; file: string; web: string; format: string; size: number; weight: number; width: number;
    italic: boolean; variable: boolean; axes?: Axis[]; glyphs: number; scripts: string[]; languages: string[]; fileName: string;
  }[] = [];
  for (const [i, m] of read.entries()) {
    const name = names[i];
    // Generated names: the file's path without the extension ("static/Font-Bold" → "static-font-bold").
    const stem = slugify(m.fileName.replace(/\.[^./]+$/, '')) || 'font';
    let file = `/fonts/${slug}/${encodeURIComponent(m.fileName)}`;
    if (m.fromZip) {
      // A font taken from the archive gets its own copy (the Glyphs and Info tabs read it); the hash in the
      // name keeps the long-cached /fonts-web/ copies fresh.
      const copyName = `${stem}.${hash(m.buf)}.${m.ext}`;
      const out = path.join(outDir, copyName);
      if (!(await mtime(out))) {
        await fs.mkdir(outDir, { recursive: true });
        await fs.writeFile(out, m.buf);
      }
      file = `/fonts-web/${slug}/${copyName}`;
    }
    // Preview file: TTF/OTF are compressed to WOFF2; the version query busts browser caches when the file changes.
    let web = file;
    if (m.ext === 'ttf' || m.ext === 'otf') {
      const webName = `${stem}.woff2`;
      const out = path.join(outDir, webName);
      try {
        if ((await mtime(out)) < m.srcTime) {
          const { compress } = await import('woff2-encoder');
          await fs.mkdir(outDir, { recursive: true });
          await fs.writeFile(out, await compress(m.buf));
        }
        web = `/fonts-web/${slug}/${webName}?v=${hash(m.buf)}`;
      } catch (e) {
        warn(`${slug}: WOFF2 compression failed for "${m.fileName}" (${(e as Error).message}) — the original file is used for previews`);
      }
    }
    let styleSlug = slugify(name + (m.variable ? '-variable' : '')) || 'regular';
    if (styles.some((s) => s.slug === styleSlug)) styleSlug = `${styleSlug}-${styles.length + 1}`;
    styles.push({
      name,
      slug: styleSlug,
      file,
      web,
      format: m.ext,
      size: m.buf.length,
      weight: resolveWeight(m.weight, name),
      width: m.width,
      italic: m.italic,
      variable: m.variable,
      ...(m.variable && m.axes.length ? { axes: m.axes } : {}),
      glyphs: m.glyphs,
      scripts: m.scripts,
      languages: m.languages,
      fileName: m.fileName,
    });
  }

  // Order: static before variable, the main sub-family first (then narrower/wider ones), upright before italic, light to heavy.
  const groupRank = (s: (typeof styles)[number]) => (groupOf(s.name) ? 1 + Math.abs(s.width - 5) : 0);
  styles.sort(
    (a, b) =>
      Number(a.variable) - Number(b.variable) ||
      groupRank(a) - groupRank(b) ||
      groupOf(a.name).localeCompare(groupOf(b.name)) ||
      Number(a.italic) - Number(b.italic) ||
      a.weight - b.weight,
  );

  // Archive: the uploaded one, or a ZIP of all files built here.
  let zip: string;
  let zipName: string;
  let zipSize: number;
  let zipFiles: ZipEntry[];
  if (archiveBuf?.length) {
    zip = `/fonts/${slug}/${encodeURIComponent(archive)}`;
    zipName = archive;
    zipSize = archiveBuf.length;
    try {
      zipFiles = zipEntries(archiveBuf);
    } catch (e) {
      warn(`${slug}: cannot read archive "${archive}" (${(e as Error).message})`);
      zipFiles = [];
    }
  } else {
    warn(archive ? `${slug}: archive "${archive}" is missing — building one from the font files` : `${slug}: no ZIP archive uploaded — building one from the font files`);
    zipName = `${slug}.zip`;
    const out = path.join(outDir, zipName);
    const newest = Math.max(...read.map((m) => m.srcTime));
    if ((await mtime(out)) < newest) {
      const entries: Record<string, Uint8Array> = {};
      for (const m of read) entries[`${fontName}/${m.fileName}`] = m.buf;
      await fs.mkdir(outDir, { recursive: true });
      await fs.writeFile(out, zipSync(entries, { level: 9 }));
    }
    const buf = await fs.readFile(out);
    zip = `/fonts-web/${slug}/${zipName}?v=${hash(buf)}`;
    zipSize = buf.length;
    zipFiles = read.map((m) => ({ name: m.fileName, size: m.buf.length }));
  }

  // Style shown in lists: the one the editor named, else the most "regular" one —
  // upright, static, weight 400, normal width, named Regular — else the first.
  const wanted = words(String(raw.primaryStyle ?? '')).join(' ').toLowerCase();
  const byName = wanted ? styles.findIndex((s) => s.name.toLowerCase() === wanted || s.slug === slugify(wanted)) : -1;
  if (wanted && byName < 0) warn(`${slug}: primary style "${raw.primaryStyle}" not found — using the regular style`);
  const rank = (s: (typeof styles)[number]) =>
    (s.variable ? 16 : 0) + (s.italic ? 8 : 0) + (s.weight !== 400 ? 4 : 0) + (s.width !== 5 ? 2 : 0) + (REGULAR_NAME.test(s.name) ? 0 : 1);
  const regular = styles.reduce((best, s, i) => (rank(s) < rank(styles[best]) ? i : best), 0);
  const primary = byName >= 0 ? byName : regular;

  // Legacy single `designer` and fields that are no longer used.
  const { files: _files, archive: _archive, primaryStyle: _primary, designer, featured: _featured, downloads: _downloads, ...editorial } = raw;
  return {
    ...editorial,
    designers: raw.designers?.length ? asList(raw.designers) : asList(designer),
    downloads: downloads[slug] ?? 0,
    primary,
    scripts: [...new Set(styles.flatMap((s) => s.scripts))],
    // Counted on the primary style: the file one would check in Hyperglot.
    languages: styles[primary].languages,
    zip,
    zipName,
    zipSize,
    zipFiles,
    // Variable styles are told apart from the static ones by name: "Regular" → "VariableRegular".
    styles: styles.map(({ fileName: _f, width: _w, languages: _l, ...s }) => (s.variable ? { ...s, name: `Variable${s.name.replace(/\s+/g, '')}` } : s)),
  };
}

/** Download counts from the live site; the build keeps going (with zeros) when it is unreachable. */
async function fetchDownloads(site: string | undefined, logger: LoaderContext['logger']): Promise<Record<string, number>> {
  if (!site || process.env.DOWNLOADS_OFFLINE) return {};
  const url = new URL('/api/downloads', site);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(5000), headers: { accept: 'application/json' } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(data).filter(([, n]) => Number.isFinite(n)).map(([k, n]) => [k, Number(n)]));
  } catch (e) {
    logger.warn(`download counts are not available from ${url} (${(e as Error).message}) — showing 0`);
    return {};
  }
}

export function fontLoader({ base = 'public/fonts', out = 'public/fonts-web' }: { base?: string; out?: string } = {}): Loader {
  return {
    name: 'qarip-fonts',
    async load(context: LoaderContext) {
      const { store, parseData, generateDigest, logger, watcher, config } = context;
      const root = path.resolve(base);
      const outRoot = path.resolve(out);
      const downloads = await fetchDownloads(config.site, logger);

      const sync = async () => {
        const seen = new Set<string>();
        const dirs = await fs.readdir(root, { withFileTypes: true }).catch(() => []);
        for (const entry of dirs) {
          if (!entry.isDirectory()) continue;
          const slug = entry.name;
          const file = path.join(root, slug, 'font.json');
          let raw: Record<string, any>;
          try {
            raw = JSON.parse(await fs.readFile(file, 'utf8'));
          } catch (e) {
            if ((e as NodeJS.ErrnoException).code !== 'ENOENT') logger.warn(`${slug}: font.json is not valid JSON — skipped`);
            continue;
          }
          try {
            const data = await processFont({ dir: path.join(root, slug), outDir: path.join(outRoot, slug), slug, downloads, warn: (m) => logger.warn(m) }, raw);
            if (!data) continue;
            const parsed = await parseData({ id: slug, data, filePath: file });
            store.set({ id: slug, data: parsed, digest: generateDigest(data), filePath: path.relative(process.cwd(), file) });
            seen.add(slug);
          } catch (e) {
            // A half-filled entry (e.g. no designer yet) or a broken file must not take the whole site down.
            logger.warn(`${slug}: ${(e as Error).message.split('\n').slice(0, 4).join(' ')} — skipped`);
          }
        }
        for (const id of store.keys()) if (!seen.has(id)) store.delete(id);
        logger.info(`${seen.size} fonts loaded`);
      };

      await sync();

      if (watcher) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const onChange = (changed: string) => {
          const rel = path.relative(root, changed);
          if (rel.startsWith('..')) return;
          clearTimeout(timer);
          timer = setTimeout(() => sync().catch((e) => logger.error(String(e))), 200);
        };
        watcher.add(root);
        watcher.on('add', onChange).on('change', onChange).on('unlink', onChange);
      }
    },
  };
}
