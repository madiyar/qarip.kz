/**
 * Content loader for the font catalog.
 *
 * Every font is a folder: `public/fonts/<slug>/font.json` (what an editor fills in
 * the CMS: name, designer, license… and the list of uploaded files) next to the font
 * files themselves. Everything technical is derived here, at build time:
 *
 *  - style name, weight, italic, variable, glyph count and supported alphabets are
 *    read from each font binary;
 *  - a compressed WOFF2 copy for previews goes to `<slug>/web/`;
 *  - a ZIP with all files is built into `<slug>/web/` unless the editor uploaded
 *    the designer's own archive.
 *
 * `web/` is generated output and is not committed.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Loader, LoaderContext } from 'astro/loaders';
import opentype from 'opentype.js';
import { zipSync } from 'fflate';

const FONT_EXT = /\.(ttf|otf|woff2?)$/i;

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

const ALPHABETS: Record<string, string> = {
  latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  cyrillic: 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя',
  kazakh: 'ӘәҒғҚқҢңӨөҰұҮүҺһІі',
  'kazakh-latin': 'ÄäĞğİıÑñÖöŞşŪūÜü',
};

interface StyleMeta {
  name: string;
  weight: number;
  italic: boolean;
  variable: boolean;
  glyphs: number;
  scripts: string[];
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const toArrayBuffer = (b: Uint8Array) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer;

/** Reads style metadata straight from a font binary (TTF, OTF, WOFF or WOFF2). */
async function inspect(buf: Buffer, ext: string): Promise<StyleMeta> {
  let data = toArrayBuffer(buf);
  if (ext === 'woff2') {
    const decompress = (await import('woff2-encoder/decompress')).default;
    data = toArrayBuffer(await decompress(buf));
  }
  const font = opentype.parse(data);
  const names = font.names.windows ?? font.names.macintosh ?? {};
  const pick = (k: string): string | undefined => names[k]?.en ?? (Object.values(names[k] ?? {})[0] as string | undefined);
  const name = pick('preferredSubfamily') || pick('fontSubfamily') || 'Regular';
  const os2 = font.tables.os2 ?? {};
  let weight: number = os2.usWeightClass || 400;
  // Many fonts report 400 for every style — fall back to the style name.
  if (weight === 400 && !/^(regular|book|normal|italic)$/i.test(name)) {
    const hit = WEIGHT_WORDS.find(([re]) => re.test(name));
    if (hit) weight = hit[1];
  }
  return {
    name,
    weight: Math.min(900, Math.max(100, Math.round(weight / 100) * 100)),
    italic: Boolean((os2.fsSelection ?? 0) & 1) || /italic|oblique/i.test(name),
    variable: Boolean(font.tables.fvar),
    glyphs: font.numGlyphs,
    scripts: Object.entries(ALPHABETS)
      .filter(([, chars]) => [...chars].every((c) => font.charToGlyphIndex(c) > 0))
      .map(([k]) => k),
  };
}

const mtime = (file: string) => fs.stat(file).then((s) => s.mtimeMs, () => 0);

/** File names as stored by the CMS: a bare name, or a path whose last segment is the name. */
const baseName = (value: unknown) => decodeURIComponent(String(value ?? '').split('/').pop() ?? '');

/** Turns one `font.json` plus its files into a full catalog entry. Returns null when there is nothing to show yet. */
async function processFont(dir: string, slug: string, raw: Record<string, any>, warn: (m: string) => void) {
  const webDir = path.join(dir, 'web');
  const files = [...new Set((Array.isArray(raw.files) ? raw.files : [raw.files]).map(baseName).filter((f: string) => FONT_EXT.test(f)))] as string[];
  const styles: (StyleMeta & { slug: string; file: string; fileName: string; web: string; format: string; size: number })[] = [];
  let newest = 0;

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
    let meta: StyleMeta;
    try {
      meta = await inspect(buf, ext);
    } catch (e) {
      warn(`${slug}: cannot read "${fileName}" as a font (${(e as Error).message}) — skipped`);
      continue;
    }
    const srcTime = await mtime(src);
    newest = Math.max(newest, srcTime);

    // Preview file: TTF/OTF are compressed to WOFF2, web formats are used as they are.
    let web = `/fonts/${slug}/${encodeURIComponent(fileName)}`;
    if (ext === 'ttf' || ext === 'otf') {
      const webName = `${slugify(path.basename(fileName, path.extname(fileName))) || 'font'}.woff2`;
      const out = path.join(webDir, webName);
      if ((await mtime(out)) < srcTime) {
        const { compress } = await import('woff2-encoder');
        await fs.mkdir(webDir, { recursive: true });
        await fs.writeFile(out, await compress(buf));
      }
      web = `/fonts/${slug}/web/${webName}`;
    }

    let styleSlug = slugify(meta.name + (meta.variable ? '-variable' : '')) || 'regular';
    if (styles.some((s) => s.slug === styleSlug)) styleSlug = `${styleSlug}-${styles.length + 1}`;
    styles.push({ ...meta, slug: styleSlug, file: `/fonts/${slug}/${encodeURIComponent(fileName)}`, fileName, web, format: ext, size: buf.length });
  }

  if (!styles.length) {
    warn(`${slug}: no usable font files — the font is hidden until files are uploaded`);
    return null;
  }
  styles.sort((a, b) => Number(a.variable) - Number(b.variable) || Number(a.italic) - Number(b.italic) || a.weight - b.weight);

  // Archive: the uploaded one, or a ZIP of all files built here.
  let zip: string;
  let zipName: string;
  let zipSize: number;
  const archive = baseName(raw.archive);
  const archiveSize = archive ? await fs.stat(path.join(dir, archive)).then((s) => s.size, () => 0) : 0;
  if (archiveSize) {
    zip = `/fonts/${slug}/${encodeURIComponent(archive)}`;
    zipName = archive;
    zipSize = archiveSize;
  } else {
    if (archive) warn(`${slug}: archive "${archive}" is missing — building one from the font files`);
    zipName = `${slug}.zip`;
    const out = path.join(webDir, zipName);
    if ((await mtime(out)) < newest) {
      const entries: Record<string, Uint8Array> = {};
      for (const s of styles) entries[`${raw.name ?? slug}/${s.fileName}`] = await fs.readFile(path.join(dir, s.fileName));
      await fs.mkdir(webDir, { recursive: true });
      await fs.writeFile(out, zipSync(entries, { level: 9 }));
    }
    zip = `/fonts/${slug}/web/${zipName}`;
    zipSize = (await fs.stat(out)).size;
  }

  // Style shown in lists: the one the editor named, else Regular, else the first.
  const wanted = String(raw.primaryStyle ?? '').trim().toLowerCase();
  const byName = wanted ? styles.findIndex((s) => s.name.toLowerCase() === wanted) : -1;
  const regular = styles.findIndex((s) => !s.italic && !s.variable && s.weight === 400);
  const primary = byName >= 0 ? byName : regular >= 0 ? regular : 0;

  const { files: _files, archive: _archive, primaryStyle: _primary, ...editorial } = raw;
  return {
    ...editorial,
    primary,
    scripts: [...new Set(styles.flatMap((s) => s.scripts))],
    zip,
    zipName,
    zipSize,
    styles: styles.map(({ fileName: _f, ...s }) => s),
  };
}

export function fontLoader({ base = 'public/fonts' }: { base?: string } = {}): Loader {
  return {
    name: 'qarip-fonts',
    async load(context: LoaderContext) {
      const { store, parseData, generateDigest, logger, watcher } = context;
      const root = path.resolve(base);

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
          const data = await processFont(path.join(root, slug), slug, raw, (m) => logger.warn(m));
          if (!data) continue;
          try {
            const parsed = await parseData({ id: slug, data, filePath: file });
            store.set({ id: slug, data: parsed, digest: generateDigest(data), filePath: path.relative(process.cwd(), file) });
            seen.add(slug);
          } catch (e) {
            // A half-filled entry (e.g. no designer yet) must not take the whole site down.
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
          if (rel.startsWith('..') || rel.split(path.sep).includes('web')) return;
          clearTimeout(timer);
          timer = setTimeout(() => sync().catch((e) => logger.error(String(e))), 200);
        };
        watcher.add(root);
        watcher.on('add', onChange).on('change', onChange).on('unlink', onChange);
      }
    },
  };
}
