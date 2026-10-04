#!/usr/bin/env node
/**
 * Adds (or updates) a font from the command line — the same thing an editor does
 * in the CMS at /admin:
 *
 *   npm run font:add -- --name "Balpaq" --designer abay-emes --category display \
 *     --license ofl --tags free,cyrillic --our [--archive designer.zip] path/to/*.ttf
 *
 * It copies the files to public/fonts/<slug>/ and writes public/fonts/<slug>/font.json.
 * Styles, weights, glyph counts, alphabets, WOFF2 previews and the ZIP are derived
 * from the files at build time (src/lib/fontLoader.ts), so nothing else is needed.
 * Re-running on an existing slug keeps fields that are not passed again.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';

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
    'description-en': { type: 'string' },
    'description-ru': { type: 'string' },
    quality: { type: 'string' },
    preview: { type: 'string' },
    purchase: { type: 'string' },
    'primary-style': { type: 'string' },
    archive: { type: 'string' },
    our: { type: 'boolean' },
    featured: { type: 'boolean' },
  },
});

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
const list = (v) => (v ? v.split(',').map((s) => s.trim()).filter(Boolean) : undefined);
const safeName = (file) => path.basename(file).replace(/\s+/g, '-');

async function main() {
  if (!args.name || !files.length) {
    console.error('Usage: npm run font:add -- --name "Font" --designer slug --category sans --license ofl [options] files…');
    process.exit(1);
  }
  const slug = args.slug || slugify(args.name);
  const dir = path.join(ROOT, 'public', 'fonts', slug);
  const jsonPath = path.join(dir, 'font.json');
  let prev = {};
  try {
    prev = JSON.parse(await fs.readFile(jsonPath, 'utf8'));
  } catch {}

  await fs.mkdir(dir, { recursive: true });
  for (const src of files) await fs.copyFile(src, path.join(dir, safeName(src)));
  if (args.archive) await fs.copyFile(args.archive, path.join(dir, safeName(args.archive)));

  const entry = {
    name: args.name,
    designer: args.designer ?? prev.designer,
    category: args.category ?? prev.category ?? 'sans',
    tags: list(args.tags) ?? prev.tags ?? [],
    purposes: list(args.purposes) ?? prev.purposes ?? [],
    license: args.license ?? prev.license ?? 'ofl',
    our: args.our ?? prev.our ?? false,
    featured: args.featured ?? prev.featured ?? false,
    quality: args.quality ? Number(args.quality) : prev.quality,
    description: args.description ?? prev.description,
    descriptionRu: args['description-ru'] ?? prev.descriptionRu,
    descriptionEn: args['description-en'] ?? prev.descriptionEn,
    previewText: args.preview ?? prev.previewText,
    purchaseUrl: args.purchase ?? prev.purchaseUrl,
    addedDate: prev.addedDate ?? new Date().toISOString().slice(0, 10),
    downloads: prev.downloads ?? 0,
    primaryStyle: args['primary-style'] ?? prev.primaryStyle,
    files: [...new Set([...(prev.files ?? []), ...files.map(safeName)])],
    archive: args.archive ? safeName(args.archive) : prev.archive,
  };
  if (!entry.designer) throw new Error('--designer is required for a new font');
  await fs.writeFile(jsonPath, JSON.stringify(entry, null, 2) + '\n');
  console.log(`✓ ${args.name} → public/fonts/${slug}/font.json (${entry.files.length} file(s))`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
