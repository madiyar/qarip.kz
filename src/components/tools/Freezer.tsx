import { useEffect, useMemo, useState } from 'react';
import Dropzone from './Dropzone';
import Icon from '../ui/Icon';
import Select from '../ui/Select';
import Switch from '../ui/Switch';
import { buildCmap, buildSfnt, downloadBytes, parseSfnt, renameFamily, sfntExtension, sfntToWoff, toWoff2 } from '../../lib/sfnt';
import { featureName, loadFontFile, loadFontUrl, type LoadedFont } from '../../lib/userfont';
import { baseName } from './util';
import { DEFAULT_PREVIEW } from '../../lib/site';
import { type Lang, useT } from '../../i18n';

export interface CatalogFont {
  name: string;
  styles: { name: string; file: string }[];
}

type Mode = 'live' | 'before' | 'after';
type OutFormat = 'same' | 'woff' | 'woff2';

// Features that only make sense in context and cannot be baked into cmap.
const NOT_FREEZABLE = new Set(['ccmp', 'kern', 'mark', 'mkmk', 'liga', 'rlig', 'clig', 'calt', 'rclt', 'curs', 'dist', 'abvm', 'blwm', 'init', 'medi', 'fina', 'isol']);

/** Substitution map (glyph → glyph) for the chosen GSUB features. */
async function collectSubstitutions(sfnt: ArrayBuffer, features: string[]) {
  const opentype = (await import('opentype.js')).default;
  const font = opentype.parse(sfnt);
  const scripts: string[] = [...new Set<string>((font.tables.gsub?.scripts ?? []).map((s: { tag: string }) => s.tag))];
  const steps: Map<number, number>[] = [];
  for (const feature of features) {
    const map = new Map<number, number>();
    for (const script of scripts.length ? scripts : ['DFLT']) {
      try {
        for (const { sub, by } of font.substitution.getSingle(feature, script, 'dflt') as { sub: number; by: number }[]) if (!map.has(sub)) map.set(sub, by);
        for (const { sub, by } of font.substitution.getAlternates(feature, script, 'dflt') as { sub: number; by: number[] }[]) if (!map.has(sub) && by.length) map.set(sub, by[0]);
      } catch {}
    }
    steps.push(map);
  }
  const cmap = new Map<number, number>(Object.entries(font.tables.cmap.glyphIndexMap as Record<string, number>).map(([k, v]) => [Number(k), v]));
  return { font, cmap, steps };
}

export default function Freezer({ lang, catalog }: { lang: Lang; catalog: CatalogFont[] }) {
  const t = useT(lang);
  const [font, setFont] = useState<LoadedFont | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<Mode>('live');
  const [size, setSize] = useState(40);
  const [text, setText] = useState(DEFAULT_PREVIEW);
  const [suffix, setSuffix] = useState(' Frozen');
  const [format, setFormat] = useState<OutFormat>('same');
  const [frozen, setFrozen] = useState<{ family: string; bytes: Uint8Array; changed: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async (p: Promise<LoadedFont>) => {
    setError('');
    setFrozen(null);
    setSelected([]);
    try {
      setFont(await p);
    } catch {
      setError(t('Файлды оқу мүмкін болмады'));
    }
  };

  // How many glyph substitutions each feature would apply.
  useEffect(() => {
    if (!font) return;
    collectSubstitutions(font.sfnt, font.features).then(({ steps }) => setCounts(Object.fromEntries(font.features.map((f, i) => [f, steps[i].size]))));
  }, [font]);

  const freezable = useMemo(() => (font?.features ?? []).filter((f) => !NOT_FREEZABLE.has(f) && (counts[f] ?? 0) > 0), [font, counts]);
  const other = useMemo(() => (font?.features ?? []).filter((f) => !freezable.includes(f)), [font, freezable]);

  const freeze = async () => {
    if (!font) return;
    setBusy(true);
    try {
      const { cmap, steps } = await collectSubstitutions(font.sfnt, selected);
      let changed = 0;
      const next = new Map(cmap);
      for (const [cp, gid] of cmap) {
        let g = gid;
        for (const step of steps) g = step.get(g) ?? g;
        if (g !== gid) changed++;
        next.set(cp, g);
      }
      const sfnt = parseSfnt(font.sfnt);
      sfnt.tables.set('cmap', buildCmap(next));
      if (suffix.trim()) sfnt.tables.set('name', renameFamily(sfnt.tables.get('name')!, suffix));
      const bytes = buildSfnt(sfnt);
      const family = `qf-frozen-${Date.now().toString(36)}`;
      const face = new FontFace(family, bytes.slice().buffer);
      await face.load();
      document.fonts.add(face);
      setFrozen({ family, bytes, changed });
      setMode('after');
    } catch (e) {
      setError(String(e));
    }
    setBusy(false);
  };

  const download = async () => {
    if (!frozen || !font) return;
    const base = `${baseName(font.fileName)}${suffix.replace(/\s+/g, '')}`;
    const buf = frozen.bytes.buffer.slice(frozen.bytes.byteOffset, frozen.bytes.byteOffset + frozen.bytes.byteLength) as ArrayBuffer;
    if (format === 'woff2') downloadBytes(await toWoff2(buf), `${base}.woff2`, 'font/woff2');
    else if (format === 'woff') downloadBytes(sfntToWoff(frozen.bytes), `${base}.woff`, 'font/woff');
    else downloadBytes(frozen.bytes, `${base}.${sfntExtension(buf)}`, 'font/ttf');
  };

  const previewStyle = font
    ? mode === 'after' && frozen
      ? { fontFamily: `'${frozen.family}'` }
      : { fontFamily: `'${font.family}'`, fontFeatureSettings: mode === 'live' && selected.length ? selected.map((f) => `"${f}" 1`).join(', ') : undefined }
    : {};

  const toggle = (f: string) => {
    setSelected((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));
    setFrozen(null);
    setMode('live');
  };

  return (
    <div className="flex flex-wrap items-start gap-6">
      <div className="flex w-full max-w-full flex-col gap-4 sm:max-w-[360px] sm:flex-[1_1_300px]">
        <div className="flex flex-col gap-3 rounded-[18px] bg-elev p-4">
          <span className="label-caps">{t('Қаріп көзі')}</span>
          {font ? (
            <div className="flex items-center gap-3 rounded-[14px] bg-fill py-2.5 pr-1.5 pl-3.5">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-lg" style={{ fontFamily: `'${font.family}'` }}>
                  {font.name}
                </span>
                <span className="meta block truncate">{font.style} · {font.fileName}</span>
              </span>
              <button type="button" className="icon-btn size-9 rounded-full" onClick={() => setFont(null)} aria-label={t('Өшіру')}>
                <Icon name="x" size={15} />
              </button>
            </div>
          ) : (
            <Dropzone t={t} compact onFiles={([f]) => load(loadFontFile(f))} title={t('Қаріп файлын тастаңыз')} />
          )}
          <span className="meta text-center">{t('немесе каталогтан')}</span>
          <Select
            label={t('Каталогтан')}
            value=""
            placeholder={t('Қаріп таңдаңыз...')}
            className="flex h-10 w-full items-center gap-2.5 rounded-xl bg-fill pr-3 pl-3.5 text-[15px] transition-colors hover:bg-fill-2"
            block
            onChange={(v) => {
              const [fi, si] = v.split(':').map(Number);
              const f = catalog[fi];
              if (f) load(loadFontUrl(f.styles[si].file, f.styles[si].file.split('/').pop()));
            }}
            options={catalog.flatMap((f, fi) => f.styles.map((s, si) => ({ value: `${fi}:${si}`, label: f.styles.length > 1 ? `${f.name} — ${s.name}` : f.name })))}
          />
          <p className="text-xs leading-normal text-fg-3">{t('Файлды таратпас бұрын қаріп лицензиясы өзгертуге рұқсат беретінін тексеріңіз. Файл браузерде өңделеді, серверге жіберілмейді.')}</p>
          {error && <p className="text-sm text-heart">{error}</p>}
        </div>

        <div className="rounded-[18px] bg-elev px-4 py-2">
          <div className="label-caps pt-2 pb-1.5">{t('OpenType мүмкіндіктері')}</div>
          {!font ? (
            <p className="py-2.5 text-sm text-fg-3">{t('Мүмкіндіктерді көру үшін қаріп жүктеңіз')}</p>
          ) : freezable.length === 0 ? (
            <p className="py-2.5 text-sm text-fg-3">{t('Бұл қаріпте бекітуге болатын мүмкіндік жоқ')}</p>
          ) : (
            <div className="rows">
              {freezable.map((f) => (
                <div key={f} className="flex min-h-12 items-center gap-3">
                  <code className="w-10 shrink-0 font-mono text-xs text-fg-3">{f}</code>
                  <span id={`fz-${f}`} className="min-w-0 flex-1 truncate text-sm">
                    {featureName(f)} <span className="text-fg-3 tabular-nums">· {counts[f]}</span>
                  </span>
                  <Switch checked={selected.includes(f)} onChange={() => toggle(f)} labelledBy={`fz-${f}`} />
                </div>
              ))}
            </div>
          )}
          <p className="my-2.5 text-xs text-fg-3">
            {other.length > 0 ? (
              <>
                {t('Контекстік мүмкіндіктер (бекітілмейді)')}: <span className="font-mono">{other.join(', ')}</span>
              </>
            ) : (
              t('Тізімде тек осы қаріпте бар мүмкіндіктер көрсетіледі.')
            )}
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div role="radiogroup" aria-label={t('Көрсету')} className="segmented">
            {(
              [
                ['live', 'Тікелей'],
                ['before', 'Дейін'],
                ['after', 'Кейін'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" role="radio" aria-checked={mode === id} disabled={id === 'after' && !frozen} className="disabled:opacity-40" onClick={() => setMode(id)}>
                {t(label)}
              </button>
            ))}
          </div>
          <div role="group" aria-label={t('Өлшемі')} className="segmented">
            <button type="button" aria-label={t('Кішірейту')} className="w-8 !px-0 text-[17px] !text-fg" onClick={() => setSize((n) => Math.max(16, n - 4))}>
              −
            </button>
            <span className="inline-flex min-w-[52px] items-center justify-center text-[13px] font-medium tabular-nums">{size} px</span>
            <button type="button" aria-label={t('Үлкейту')} className="w-8 !px-0 text-[17px] !text-fg" onClick={() => setSize((n) => Math.min(160, n + 4))}>
              +
            </button>
          </div>
        </div>
        {font ? (
          <div className="rounded-[20px] bg-elev p-6">
            <input className="mb-4 w-full border-b border-line bg-transparent pb-2 text-sm text-fg-2 outline-none focus:border-accent" value={text} onChange={(e) => setText(e.target.value)} aria-label={t('Превью мәтіні')} />
            <p className="leading-[1.35] break-words text-fg" style={{ ...previewStyle, fontSize: size }}>
              {text}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-[20px] bg-elev px-6 py-20 text-center text-fg-3">
            <Icon name="snowflake" size={32} />
            <p className="font-semibold text-fg">{t('Алдын ала қарау үшін қаріп жүктеңіз')}</p>
            <p className="text-sm">{t('TTF, OTF, WOFF, WOFF2 қолдау көрсетіледі')}</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2.5 rounded-[18px] bg-elev p-4">
          <label htmlFor="fz-name" className="text-[13px] text-fg-3">
            {t('Атауына жұрнақ')}
          </label>
          <input id="fz-name" className="input h-10 min-w-0 flex-[1_1_160px]" value={suffix} onChange={(e) => setSuffix(e.target.value)} />
          <Select<OutFormat>
            label={t('Формат')}
            value={format}
            onChange={setFormat}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-fill px-3.5 text-sm font-medium transition-colors hover:bg-fill-2"
            options={[
              { value: 'same', label: 'TTF / OTF' },
              { value: 'woff', label: 'WOFF' },
              { value: 'woff2', label: 'WOFF2' },
            ]}
          />
          {frozen ? (
            <button type="button" className="btn-primary btn-rect btn-sm h-10!" onClick={download}>
              <Icon name="download" size={16} />
              {t('Жүктеу')}
            </button>
          ) : (
            <button type="button" className="btn-primary btn-rect btn-sm h-10!" disabled={!font || !selected.length || busy} onClick={freeze}>
              <Icon name="snowflake" size={16} />
              {selected.length ? t('Бекіту · {n} мүмкіндік', { n: selected.length }) : t('Бекіту')}
            </button>
          )}
        </div>
        <p className="meta">{frozen ? t('{n} таңба ауыстырылды', { n: frozen.changed }) : t('OFL талабы бойынша өзгертілген қаріпке жаңа атау беріледі.')}</p>
      </div>
    </div>
  );
}
