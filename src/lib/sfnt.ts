/**
 * Minimal, dependency-light font binary toolkit used by the browser tools:
 * format detection, SFNT table (de)serialisation, WOFF 1.0 encode/decode,
 * WOFF2 via WebAssembly, cmap rebuilding and family renaming.
 */
import { unzlibSync, zlibSync } from 'fflate';

export type FontFormat = 'ttf' | 'otf' | 'woff' | 'woff2' | 'unknown';

export function detectFormat(buf: ArrayBuffer): FontFormat {
  if (buf.byteLength < 4) return 'unknown';
  const tag = new DataView(buf).getUint32(0);
  if (tag === 0x774f4646) return 'woff';
  if (tag === 0x774f4632) return 'woff2';
  if (tag === 0x4f54544f) return 'otf';
  if (tag === 0x00010000 || tag === 0x74727565) return 'ttf';
  return 'unknown';
}

export interface Sfnt {
  flavor: number;
  tables: Map<string, Uint8Array>;
}

const tagOf = (dv: DataView, o: number) => String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3));
const pad4 = (n: number) => (n + 3) & ~3;

function checksum(data: Uint8Array): number {
  const padded = new Uint8Array(pad4(data.length));
  padded.set(data);
  const dv = new DataView(padded.buffer);
  let sum = 0;
  for (let i = 0; i < padded.length; i += 4) sum = (sum + dv.getUint32(i)) >>> 0;
  return sum;
}

export function parseSfnt(buf: ArrayBuffer): Sfnt {
  const dv = new DataView(buf);
  const flavor = dv.getUint32(0);
  const n = dv.getUint16(4);
  const tables = new Map<string, Uint8Array>();
  for (let i = 0; i < n; i++) {
    const o = 12 + i * 16;
    const offset = dv.getUint32(o + 8);
    const length = dv.getUint32(o + 12);
    tables.set(tagOf(dv, o), new Uint8Array(buf, offset, length).slice());
  }
  return { flavor, tables };
}

export function buildSfnt({ flavor, tables }: Sfnt): Uint8Array {
  const tags = [...tables.keys()].sort();
  const n = tags.length;
  const entrySelector = Math.floor(Math.log2(n));
  const searchRange = 2 ** entrySelector * 16;
  let size = 12 + n * 16;
  for (const t of tags) size += pad4(tables.get(t)!.length);
  const out = new Uint8Array(size);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, flavor);
  dv.setUint16(4, n);
  dv.setUint16(6, searchRange);
  dv.setUint16(8, entrySelector);
  dv.setUint16(10, n * 16 - searchRange);
  let offset = 12 + n * 16;
  let headOffset = -1;
  tags.forEach((t, i) => {
    const data = tables.get(t)!.slice();
    if (t === 'head' && data.length >= 12) {
      new DataView(data.buffer).setUint32(8, 0);
      headOffset = offset;
    }
    const o = 12 + i * 16;
    for (let k = 0; k < 4; k++) dv.setUint8(o + k, t.charCodeAt(k));
    dv.setUint32(o + 4, checksum(data));
    dv.setUint32(o + 8, offset);
    dv.setUint32(o + 12, data.length);
    out.set(data, offset);
    offset += pad4(data.length);
  });
  if (headOffset >= 0) dv.setUint32(headOffset + 8, (0xb1b0afba - checksum(out)) >>> 0);
  return out;
}

// WOFF 1.0 ------------------------------------------------------------------

export function woffToSfnt(buf: ArrayBuffer): Uint8Array {
  const dv = new DataView(buf);
  const flavor = dv.getUint32(4);
  const n = dv.getUint16(12);
  const tables = new Map<string, Uint8Array>();
  for (let i = 0; i < n; i++) {
    const o = 44 + i * 20;
    const offset = dv.getUint32(o + 4);
    const compLength = dv.getUint32(o + 8);
    const origLength = dv.getUint32(o + 12);
    const raw = new Uint8Array(buf, offset, compLength);
    tables.set(tagOf(dv, o), compLength < origLength ? unzlibSync(raw) : raw.slice());
  }
  return buildSfnt({ flavor, tables });
}

export function sfntToWoff(sfnt: Uint8Array): Uint8Array {
  const { flavor, tables } = parseSfnt(sfnt.buffer.slice(sfnt.byteOffset, sfnt.byteOffset + sfnt.byteLength) as ArrayBuffer);
  const tags = [...tables.keys()].sort();
  const entries = tags.map((tag) => {
    const orig = tables.get(tag)!;
    const comp = zlibSync(orig, { level: 9 });
    const data = comp.length < orig.length ? comp : orig;
    return { tag, orig, data };
  });
  let size = 44 + entries.length * 20;
  for (const e of entries) size += pad4(e.data.length);
  const out = new Uint8Array(size);
  const dv = new DataView(out.buffer);
  const totalSfntSize = 12 + entries.length * 16 + entries.reduce((s, e) => s + pad4(e.orig.length), 0);
  dv.setUint32(0, 0x774f4646);
  dv.setUint32(4, flavor);
  dv.setUint32(8, size);
  dv.setUint16(12, entries.length);
  dv.setUint32(16, totalSfntSize);
  dv.setUint16(20, 1);
  let offset = 44 + entries.length * 20;
  entries.forEach((e, i) => {
    const o = 44 + i * 20;
    for (let k = 0; k < 4; k++) dv.setUint8(o + k, e.tag.charCodeAt(k));
    dv.setUint32(o + 4, offset);
    dv.setUint32(o + 8, e.data.length);
    dv.setUint32(o + 12, e.orig.length);
    dv.setUint32(o + 16, checksum(e.orig));
    out.set(e.data, offset);
    offset += pad4(e.data.length);
  });
  return out;
}

// Conversions ----------------------------------------------------------------

const toBuffer = (u8: Uint8Array) => u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;

/** Any supported input → raw TTF/OTF bytes. */
export async function toSfnt(buf: ArrayBuffer): Promise<ArrayBuffer> {
  switch (detectFormat(buf)) {
    case 'woff':
      return toBuffer(woffToSfnt(buf));
    case 'woff2': {
      const decompress = (await import('woff2-encoder/decompress')).default;
      return toBuffer(await decompress(buf));
    }
    case 'ttf':
    case 'otf':
      return buf;
    default:
      throw new Error('Unsupported font format');
  }
}

export async function toWoff2(sfnt: ArrayBuffer): Promise<Uint8Array> {
  const { compress } = await import('woff2-encoder');
  return compress(sfnt);
}

export function sfntExtension(sfnt: ArrayBuffer): 'ttf' | 'otf' {
  return detectFormat(sfnt) === 'otf' ? 'otf' : 'ttf';
}

// cmap -----------------------------------------------------------------------

/** Builds a cmap table (format 4 for the BMP, plus format 12 when needed). */
export function buildCmap(map: Map<number, number>): Uint8Array {
  const codes = [...map.keys()].filter((c) => map.get(c)! > 0).sort((a, b) => a - b);
  const bmp = codes.filter((c) => c <= 0xfffe);
  const needs12 = codes.some((c) => c > 0xffff);

  // Format 4: one segment per run of consecutive code points.
  const segs: { start: number; end: number; gids: number[] }[] = [];
  for (const c of bmp) {
    const last = segs[segs.length - 1];
    if (last && c === last.end + 1) {
      last.end = c;
      last.gids.push(map.get(c)!);
    } else segs.push({ start: c, end: c, gids: [map.get(c)!] });
  }
  segs.push({ start: 0xffff, end: 0xffff, gids: [0] });
  const segX2 = segs.length * 2;
  const useDelta = segs.map((s) => s.gids.every((g, i) => g - (s.start + i) === s.gids[0] - s.start));
  const glyphIdArray: number[] = [];
  const rangeOffsets = segs.map((s, i) => {
    if (useDelta[i] || s.start === 0xffff) return 0;
    const ro = (segs.length - i + glyphIdArray.length) * 2;
    glyphIdArray.push(...s.gids);
    return ro;
  });
  const f4len = 16 + segX2 * 4 + glyphIdArray.length * 2;
  const f4 = new DataView(new ArrayBuffer(f4len));
  const es = Math.floor(Math.log2(segs.length));
  f4.setUint16(0, 4);
  f4.setUint16(2, f4len);
  f4.setUint16(6, segX2);
  f4.setUint16(8, 2 * 2 ** es);
  f4.setUint16(10, es);
  f4.setUint16(12, segX2 - 2 * 2 ** es);
  segs.forEach((s, i) => {
    f4.setUint16(14 + i * 2, s.end);
    f4.setUint16(16 + segX2 + i * 2, s.start);
    const delta = s.start === 0xffff ? 1 : useDelta[i] ? (s.gids[0] - s.start) & 0xffff : 0;
    f4.setUint16(16 + segX2 * 2 + i * 2, delta);
    f4.setUint16(16 + segX2 * 3 + i * 2, rangeOffsets[i]);
  });
  glyphIdArray.forEach((g, i) => f4.setUint16(16 + segX2 * 4 + i * 2, g));

  // Format 12: sequential map groups over all code points.
  let f12: DataView | null = null;
  if (needs12) {
    const groups: [number, number, number][] = [];
    for (const c of codes) {
      const g = map.get(c)!;
      const last = groups[groups.length - 1];
      if (last && c === last[1] + 1 && g === last[2] + (c - last[0])) last[1] = c;
      else groups.push([c, c, g]);
    }
    f12 = new DataView(new ArrayBuffer(16 + groups.length * 12));
    f12.setUint16(0, 12);
    f12.setUint32(4, f12.byteLength);
    f12.setUint32(12, groups.length);
    groups.forEach(([s, e, g], i) => {
      f12!.setUint32(16 + i * 12, s);
      f12!.setUint32(20 + i * 12, e);
      f12!.setUint32(24 + i * 12, g);
    });
  }

  const records: [number, number, 'f4' | 'f12'][] = [
    [0, 3, 'f4'],
    [3, 1, 'f4'],
  ];
  if (f12) records.splice(1, 0, [0, 4, 'f12']), records.push([3, 10, 'f12']);
  const headerLen = 4 + records.length * 8;
  const total = headerLen + f4len + (f12?.byteLength ?? 0);
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint16(2, records.length);
  records.forEach(([p, e, f], i) => {
    dv.setUint16(4 + i * 8, p);
    dv.setUint16(6 + i * 8, e);
    dv.setUint32(8 + i * 8, f === 'f4' ? headerLen : headerLen + f4len);
  });
  out.set(new Uint8Array(f4.buffer), headerLen);
  if (f12) out.set(new Uint8Array(f12.buffer), headerLen + f4len);
  return out;
}

// name -----------------------------------------------------------------------

interface NameRecord {
  platformID: number;
  encodingID: number;
  languageID: number;
  nameID: number;
  bytes: Uint8Array;
}

function parseName(data: Uint8Array): NameRecord[] {
  const dv = new DataView(data.buffer, data.byteOffset, data.byteLength);
  const count = dv.getUint16(2);
  const strOffset = dv.getUint16(4);
  const out: NameRecord[] = [];
  for (let i = 0; i < count; i++) {
    const o = 6 + i * 12;
    const length = dv.getUint16(o + 8);
    const offset = dv.getUint16(o + 10);
    out.push({
      platformID: dv.getUint16(o),
      encodingID: dv.getUint16(o + 2),
      languageID: dv.getUint16(o + 4),
      nameID: dv.getUint16(o + 6),
      bytes: data.slice(strOffset + offset, strOffset + offset + length),
    });
  }
  return out;
}

function buildName(records: NameRecord[]): Uint8Array {
  records.sort((a, b) => a.platformID - b.platformID || a.encodingID - b.encodingID || a.languageID - b.languageID || a.nameID - b.nameID);
  const strOffset = 6 + records.length * 12;
  const total = strOffset + records.reduce((s, r) => s + r.bytes.length, 0);
  const out = new Uint8Array(total);
  const dv = new DataView(out.buffer);
  dv.setUint16(2, records.length);
  dv.setUint16(4, strOffset);
  let offset = 0;
  records.forEach((r, i) => {
    const o = 6 + i * 12;
    dv.setUint16(o, r.platformID);
    dv.setUint16(o + 2, r.encodingID);
    dv.setUint16(o + 4, r.languageID);
    dv.setUint16(o + 6, r.nameID);
    dv.setUint16(o + 8, r.bytes.length);
    dv.setUint16(o + 10, offset);
    out.set(r.bytes, strOffset + offset);
    offset += r.bytes.length;
  });
  return out;
}

const isUtf16 = (r: NameRecord) => r.platformID === 0 || r.platformID === 3;
function decodeName(r: NameRecord): string {
  if (isUtf16(r)) {
    let s = '';
    for (let i = 0; i + 1 < r.bytes.length; i += 2) s += String.fromCharCode((r.bytes[i] << 8) | r.bytes[i + 1]);
    return s;
  }
  return String.fromCharCode(...r.bytes);
}
function encodeName(r: NameRecord, s: string): Uint8Array {
  if (isUtf16(r)) {
    const out = new Uint8Array(s.length * 2);
    for (let i = 0; i < s.length; i++) {
      out[i * 2] = s.charCodeAt(i) >> 8;
      out[i * 2 + 1] = s.charCodeAt(i) & 0xff;
    }
    return out;
  }
  return new Uint8Array([...s].map((c) => (c.charCodeAt(0) < 128 ? c.charCodeAt(0) : 63)));
}

/**
 * Appends a suffix to the family names (IDs 1, 3, 4, 6, 16) so a modified font
 * installs next to the original instead of replacing it.
 */
export function renameFamily(nameTable: Uint8Array, suffix: string): Uint8Array {
  const records = parseName(nameTable);
  const family = records.find((r) => r.nameID === 16 && isUtf16(r)) ?? records.find((r) => r.nameID === 1 && isUtf16(r)) ?? records.find((r) => r.nameID === 1);
  if (!family) return nameTable;
  const oldFamily = decodeName(family);
  const newFamily = `${oldFamily}${suffix}`;
  const ps = (x: string) => x.replace(/[^A-Za-z0-9]/g, '');
  for (const r of records) {
    const current = decodeName(r);
    let next = current;
    if (r.nameID === 1 || r.nameID === 16) next = current.startsWith(oldFamily) ? newFamily + current.slice(oldFamily.length) : `${current}${suffix}`;
    else if (r.nameID === 4) next = current.startsWith(oldFamily) ? newFamily + current.slice(oldFamily.length) : `${newFamily} ${current}`;
    else if (r.nameID === 6) next = current.startsWith(ps(oldFamily)) ? ps(newFamily) + current.slice(ps(oldFamily).length) : `${current}${ps(suffix)}`;
    else if (r.nameID === 3) next = `${current};${suffix.trim()}`;
    if (next !== current) r.bytes = encodeName(r, next);
  }
  return buildName(records);
}

export function downloadBytes(bytes: Uint8Array | ArrayBuffer, name: string, type = 'application/octet-stream') {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
