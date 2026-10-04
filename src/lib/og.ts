/**
 * Social preview images (1200×630 PNG), rendered at build time.
 * Text is converted to outlines with opentype.js so the result does not depend
 * on the fonts installed on the build machine.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import opentype from 'opentype.js';
import sharp from 'sharp';
import { pathData } from './glyphPath';

const W = 1200;
const H = 630;
const cache = new Map<string, Promise<any>>();

function load(file: string) {
  if (!cache.has(file)) {
    cache.set(
      file,
      fs.readFile(file).then((b) => opentype.parse(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength))),
    );
  }
  return cache.get(file)!;
}

/** Interface font: Inter, split by fontsource into script subsets. */
const ui = (weight: number) =>
  Promise.all(['latin', 'cyrillic', 'cyrillic-ext'].map((subset) => load(path.resolve(`node_modules/@fontsource/inter/files/inter-${subset}-${weight}-normal.woff`))));

/** Lays out one line, picking for every character the first font that has it. */
function line(fonts: any[], text: string, size: number): { d: string; width: number } {
  let x = 0;
  let d = '';
  for (const ch of text) {
    const font = fonts.find((f) => f.charToGlyphIndex(ch) > 0) ?? fonts[0];
    const glyph = font.charToGlyph(ch);
    const scale = size / font.unitsPerEm;
    d += pathData(glyph.getPath(x, 0, size).commands);
    x += (glyph.advanceWidth ?? font.unitsPerEm / 2) * scale;
  }
  return { d, width: x };
}

/** Largest size (≤ max) at which the text fits the given width. */
function fit(fonts: any[], text: string, max: number, width: number) {
  const probe = line(fonts, text, max);
  const size = probe.width > width ? Math.floor((max * width) / probe.width) : max;
  return { size, ...line(fonts, text, size) };
}

interface OgOptions {
  title: string;
  /** Font file used for the title (the catalog font itself); Inter when omitted. */
  titleFont?: string;
  subtitle: string;
  footer: string;
}

export async function renderOg({ title, titleFont, subtitle, footer }: OgOptions): Promise<Buffer> {
  const [bold, medium] = await Promise.all([ui(800), ui(500)]);
  const display = titleFont ? [await load(titleFont), ...bold] : bold;
  const pad = 80;
  const t = fit(display, title, 150, W - pad * 2);
  const s = fit(medium, subtitle, 36, W - pad * 2);
  const brand = line(bold, 'Qarip', 40);
  const f = line(medium, footer, 28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="g" cx="50%" cy="0%" r="90%">
      <stop offset="0" stop-color="#1b2a66"/>
      <stop offset="0.6" stop-color="#0a0a0a"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <rect x="0" y="${H - 8}" width="${W}" height="8" fill="#3b63f0"/>
  <path transform="translate(${pad} ${pad + 34})" d="${brand.d}" fill="#ffffff"/>
  <path transform="translate(${pad} ${H / 2 + t.size * 0.3})" d="${t.d}" fill="#ffffff"/>
  <path transform="translate(${pad} ${H / 2 + t.size * 0.3 + 70})" d="${s.d}" fill="#a1a1aa"/>
  <path transform="translate(${W - pad - f.width} ${pad + 30})" d="${f.d}" fill="#71717a"/>
</svg>`;
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}
