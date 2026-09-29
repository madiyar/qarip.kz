#!/usr/bin/env node
/**
 * Adds (or refreshes) a font in the catalog.
 *
 *   npm run font:add -- --name "Balpaq" --designer abay-emes --category display \
 *     --license ofl --tags free,cyrillic --our [--zip path/to/archive.zip] path/to/*.ttf
 *
 * Writes:
 *   public/fonts/<slug>/<file>          original files (downloads)
 *   public/fonts/<slug>/web/<x>.woff2   compressed files for previews on the site
 *   public/fonts/<slug>/<slug>.zip      archive (copied from --zip or packed from the files)
 *   src/content/fonts/<slug>.json       catalog entry
 *
 * Style name, weight, italic, glyph count and supported alphabets are read from the
 * font binaries. Re-running on an existing slug keeps the editorial fields
 * (description, tags, downloads…) unless they are passed again.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';
import { compress as woff2 } from 'woff2-encoder';
import { zipSync } from 'fflate';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const { values: args, positionals: files } = parseArgs({
  allowPositionals: true,
  options: {
    name: { type: 'string' },
    slug: { type: 'string' },
    designer: { type: 'string' },
    category: { type: 'string' },
    license: { type: 'string' },
    tags: { type: 'string' },
    purposes: { type: 'string' },
    description: { type: 'string' },
    preview: { type: 'string' },
    purchase: { type: 'string' },
    zip: { type: 'string' },
    our: { type: 'boolean' },
    featured: { type: 'boolean' },
  },
});

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const WEIGHT_WORDS = [
  [/hairline|thin/i, 100],
  [/extra[- ]?light|ultra[- ]?light/i, 200],
  [/light/i, 300],
  [/semi[- ]?bold|demi[- ]?bold/i, 600],
  [/extra[- ]?bold|ultra[- ]?bold/i, 800],
  [/extra[- ]?black|ultra[- ]?black|heavy|black/i, 900],
  [/bold/i, 700],
  [/medium/i, 500],
];

const ALPHABETS = {
  latin: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  cyrillic: 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯабвгдежзийклмнопрстуфхцчшщъыьэюя',
  kazakh: 'ӘәҒғҚқҢңӨөҰұҮүҺһІі',
  'kazakh-latin': 'ÄäĞğİıÑñÖöŞşŪūÜü',
};

function inspect(buf, fileName) {
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const names = font.names.windows ?? font.names.macintosh ?? {};
  const pick = (k) => names[k]?.en ?? Object.values(names[k] ?? {})[0];
  const style = pick('preferredSubfamily') || pick('fontSubfamily') || 'Regular';
  const os2 = font.tables.os2 ?? {};
  let weight = os2.usWeightClass || 400;
  // Many fonts report 400 for every style — fall back to the style name.
  if (weight === 400 && !/^(regular|book|normal|italic)$/i.test(style)) {
    const hit = WEIGHT_WORDS.find(([re]) => re.test(style));
    if (hit) weight = hit[1];
  }
  return {
    family: pick('preferredFamily') || pick('fontFamily') || fileName,
    style,
    weight: Math.min(900, Math.max(100, Math.round(weight / 100) * 100)),
    italic: Boolean((os2.fsSelection ?? 0) & 1) || /italic|oblique/i.test(style),
    variable: Boolean(font.tables.fvar),
    glyphs: font.numGlyphs,
    scripts: Object.entries(ALPHABETS)
      .filter(([, chars]) => [...chars].every((c) => font.charToGlyphIndex(c) > 0))
      .map(([k]) => k),
  };
}

async function main() {
  if (!args.name || !files.length) {
    console.error('Usage: npm run font:add -- --name "Font" --designer slug --category sans --license ofl [options] files…');
    process.exit(1);
  }
  const slug = args.slug || slugify(args.name);
  const dir = path.join(ROOT, 'public', 'fonts', slug);
  const jsonPath = path.join(ROOT, 'src', 'content', 'fonts', `${slug}.json`);
  let prev = {};
  try {
    prev = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  } catch {}

  await fs.mkdir(path.join(dir, 'web'), { recursive: true });
  const styles = [];
  for (const src of files) {
    const buf = await fs.readFile(src);
    const fileName = path.basename(src).replace(/\s+/g, '-');
    const ext = path.extname(fileName).slice(1).toLowerCase();
    const meta = inspect(buf, fileName);
    await fs.writeFile(path.join(dir, fileName), buf);
    let web = `/fonts/${slug}/${fileName}`;
    if (ext === 'ttf' || ext === 'otf') {
      const webName = `${slugify(path.basename(fileName, path.extname(fileName)))}.woff2`;
      await fs.writeFile(path.join(dir, 'web', webName), Buffer.from(await woff2(buf)));
      web = `/fonts/${slug}/web/${webName}`;
    }
    styles.push({
      name: meta.style,
      slug: slugify(meta.style + (meta.variable ? '-variable' : '')) || 'regular',
      file: `/fonts/${slug}/${fileName}`,
      web,
      format: ext,
      size: buf.length,
      weight: meta.weight,
      italic: meta.italic,
      variable: meta.variable,
      glyphs: meta.glyphs,
      scripts: meta.scripts,
    });
    console.log(`  ${fileName}: ${meta.style} ${meta.weight}${meta.italic ? ' italic' : ''}, ${meta.glyphs} glyphs, ${meta.scripts.join('/')}`);
  }
  styles.sort((a, b) => Number(a.variable) - Number(b.variable) || Number(a.italic) - Number(b.italic) || a.weight - b.weight);

  const zipPath = path.join(dir, `${slug}.zip`);
  if (args.zip) {
    await fs.copyFile(args.zip, zipPath);
  } else {
    const entries = {};
    for (const s of styles) entries[`${args.name}/${path.basename(s.file)}`] = await fs.readFile(path.join(ROOT, 'public', s.file));
    await fs.writeFile(zipPath, zipSync(entries, { level: 9 }));
  }
  const zipSize = (await fs.stat(zipPath)).size;
  const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
  const regular = styles.findIndex((s) => !s.italic && !s.variable && s.weight === 400);

  const entry = {
    name: args.name,
    designer: args.designer ?? prev.designer,
    category: args.category ?? prev.category ?? 'sans',
    tags: list(args.tags) ?? prev.tags ?? [],
    purposes: list(args.purposes) ?? prev.purposes ?? [],
    license: args.license ?? prev.license ?? 'ofl',
    our: args.our ?? prev.our ?? false,
    featured: args.featured ?? prev.featured ?? false,
    description: args.description ?? prev.description,
    previewText: args.preview ?? prev.previewText,
    purchaseUrl: args.purchase ?? prev.purchaseUrl,
    addedDate: prev.addedDate ?? new Date().toISOString().slice(0, 10),
    updatedDate: prev.addedDate ? new Date().toISOString().slice(0, 10) : undefined,
    downloads: prev.downloads ?? 0,
    primary: regular >= 0 ? regular : 0,
    scripts: [...new Set(styles.flatMap((s) => s.scripts))],
    zip: `/fonts/${slug}/${slug}.zip`,
    zipSize,
    styles,
  };
  if (!entry.designer) throw new Error('--designer is required for a new font');
  await fs.mkdir(path.dirname(jsonPath), { recursive: true });
  await fs.writeFile(jsonPath, JSON.stringify(entry, null, 2) + '\n');
  console.log(`✓ ${args.name} → src/content/fonts/${slug}.json`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
