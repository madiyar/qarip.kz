#!/usr/bin/env node
/**
 * Builds src/data/languages.json: the letters each Latin- or Cyrillic-script language needs,
 * from the CLDR exemplar characters. The font loader counts the languages a font covers.
 *
 *   npm pack cldr-misc-full && tar -xzf cldr-misc-full-*.tgz
 *   node scripts/languages.mjs package/main
 *
 * Rules: one entry per language and script (regional variants are skipped); every single
 * letter of the main exemplar set is required in lower and upper case; sequences in braces
 * ({dž}, {íj́}: digraphs and letters with combining marks) are not required.
 */
import fs from 'node:fs';
import path from 'node:path';

const root = process.argv[2];
if (!root) {
  console.error('Usage: node scripts/languages.mjs <cldr-misc-full>/main');
  process.exit(1);
}

/** Single code points of a CLDR UnicodeSet such as "[aä b c {dž} ʼ]"; ranges "a-z" are expanded. */
function letters(set) {
  const body = [...set.trim().replace(/^\[|\]$/g, '')];
  const out = [];
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c === ' ') continue;
    if (c === '{') {
      while (i < body.length && body[i] !== '}') i++;
      continue;
    }
    if (c === '\\') {
      out.push(body[++i]);
      continue;
    }
    if (c === '-' && out.length && body[i + 1] && body[i + 1] !== ' ') {
      const from = out.pop().codePointAt(0);
      const to = body[++i].codePointAt(0);
      for (let cp = from; cp <= to; cp++) out.push(String.fromCodePoint(cp));
      continue;
    }
    out.push(c);
  }
  return out;
}

const LATIN = /\p{Script=Latin}/u;
const CYRILLIC = /\p{Script=Cyrillic}/u;
const LETTER = /\p{L}/u;
const COMMON = /\p{Script=Common}/u;

const entries = new Map();
const locales = fs.readdirSync(root).filter((l) => /^[a-z]{2,3}(-(Latn|Cyrl))?$/.test(l));
// Bare language codes first, so "az" wins over an identical "az-Latn".
locales.sort((a, b) => a.split('-').length - b.split('-').length || a.localeCompare(b));
for (const locale of locales) {
  const file = path.join(root, locale, 'characters.json');
  if (!fs.existsSync(file)) continue;
  const data = Object.values(JSON.parse(fs.readFileSync(file, 'utf8')).main)[0];
  const set = data.characters?.exemplarCharacters;
  if (!set) continue;
  const lang = locale.split('-')[0];
  const lower = letters(set).map((c) => c.normalize('NFC')).filter((c) => [...c].length === 1);
  // Script of the letters; shared signs like ʼ (Common script) don't decide it.
  const scripted = lower.filter((c) => LETTER.test(c) && !COMMON.test(c));
  const script = scripted.length && scripted.every((c) => LATIN.test(c)) ? 'Latn' : scripted.length && scripted.every((c) => CYRILLIC.test(c)) ? 'Cyrl' : null;
  if (!script) continue;
  const key = `${lang}-${script}`;
  if (entries.has(key)) continue;
  const chars = new Set();
  for (const c of lower) {
    chars.add(c);
    for (const u of c.toLocaleUpperCase(lang)) if (LETTER.test(u)) chars.add(u);
  }
  entries.set(key, { id: locale, script, chars: [...chars].join('') });
}

// Kazakh in the Latin alphabet of 2021 (not in CLDR).
const kkLatn = [...'aäbdefgğhıijklmnñoöpqrsştuūüvyz'];
entries.set('kk-Latn', { id: 'kk-Latn', script: 'Latn', chars: [...new Set([...kkLatn, ...kkLatn.map((c) => c.toLocaleUpperCase('tr'))])].join('') });

const list = [...entries.values()].sort((a, b) => a.id.localeCompare(b.id));
const out = path.join(path.dirname(new URL(import.meta.url).pathname), '../src/data/languages.json');
fs.writeFileSync(out, `${JSON.stringify(list, null, 0).replace(/\},\{/g, '},\n{')}\n`);
console.log(`${list.length} languages (${list.filter((x) => x.script === 'Latn').length} Latin, ${list.filter((x) => x.script === 'Cyrl').length} Cyrillic) → ${path.relative(process.cwd(), out)}`);
