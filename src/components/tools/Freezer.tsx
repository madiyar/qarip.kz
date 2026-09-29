import { useEffect, useMemo, useState } from 'react';
import Dropzone from './Dropzone';
import Icon from '../ui/Icon';
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
  const [size, setSize] = useState(56);
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

  return (
    <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
      <aside className="space-y-4">
        <div className="card space-y-3 p-4">
          <p className="eyebrow">{t('Қаріп көзі')}</p>
          {font ? (
            <div className="flex items-center gap-3">
              <span className="flex-1 truncate text-lg" style={{ fontFamily: `'${font.family}'` }}>
                {font.name} <span className="text-sm text-muted">{font.style}</span>
              </span>
              <button type="button" className="icon-btn size-8" onClick={() => setFont(null)} aria-label={t('Өшіру')}>
                <Icon name="x" size={14} />
              </button>
            </div>
          ) : (
            <Dropzone t={t} compact onFiles={([f]) => load(loadFontFile(f))} title={t('Қаріп файлын тастаңыз')} />
          )}
          <label className="block text-sm">
            <span className="mb-1 block text-muted">{t('Каталогтан')}</span>
            <select
              className="input h-10"
              value=""
              onChange={(e) => {
                const [fi, si] = e.target.value.split(':').map(Number);
                const f = catalog[fi];
                if (f) load(loadFontUrl(f.styles[si].file, f.styles[si].file.split('/').pop()));
              }}
            >
              <option value="">{t('Қаріп таңдаңыз...')}</option>
              {catalog.map((f, fi) =>
                f.styles.map((s, si) => (
                  <option key={`${fi}:${si}`} value={`${fi}:${si}`}>
                    {f.name} {f.styles.length > 1 ? `— ${s.name}` : ''}
                  </option>
                )),
              )}
            </select>
          </label>
          <p className="text-xs text-muted">{t('Файлдарды таратпас бұрын қаріп лицензиясы өзгертуге рұқсат беретінін тексеріңіз.')}</p>
          {error && <p className="text-sm text-rose-500">{error}</p>}
        </div>

        <div className="card p-4">
          <p className="eyebrow mb-1">{t('OpenType мүмкіндіктері')}</p>
          <p className="mb-3 text-sm text-muted">{t('Мүмкіндіктерді қосып/өшіріп қаріпке бекітіңіз.')}</p>
          {!font ? (
            <p className="text-sm text-muted">{t('Мүмкіндіктерді көру үшін қаріп жүктеңіз')}</p>
          ) : freezable.length === 0 ? (
            <p className="text-sm text-muted">{t('Бұл қаріпте бекітуге болатын мүмкіндік жоқ')}</p>
          ) : (
            <div className="space-y-1">
              {freezable.map((f) => (
                <label key={f} className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 hover:bg-surface-2">
                  <input
                    type="checkbox"
                    className="accent-[var(--accent)]"
                    checked={selected.includes(f)}
                    onChange={() => {
                      setSelected((s) => (s.includes(f) ? s.filter((x) => x !== f) : [...s, f]));
                      setFrozen(null);
                      setMode('live');
                    }}
                  />
                  <span className="font-mono text-sm">{f}</span>
                  <span className="flex-1 truncate text-sm text-muted">{featureName(f)}</span>
                  <span className="text-xs text-muted">{counts[f]}</span>
                </label>
              ))}
            </div>
          )}
          {other.length > 0 && (
            <p className="mt-3 text-xs text-muted">
              {t('Контекстік мүмкіндіктер (бекітілмейді)')}: <span className="font-mono">{other.join(', ')}</span>
            </p>
          )}
        </div>

        <div className="card space-y-3 p-4 text-sm">
          <label className="block">
            <span className="mb-1 block text-muted">{t('Атауына жұрнақ')}</span>
            <input className="input h-10" value={suffix} onChange={(e) => setSuffix(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1 block text-muted">{t('Формат')}</span>
            <select className="input h-10" value={format} onChange={(e) => setFormat(e.target.value as OutFormat)}>
              <option value="same">TTF / OTF</option>
              <option value="woff">WOFF</option>
              <option value="woff2">WOFF2</option>
            </select>
          </label>
          <button type="button" className="btn-primary w-full" disabled={!font || !selected.length || busy} onClick={freeze}>
            <Icon name="snowflake" size={16} />
            {t('Бекіту')}
          </button>
          <button type="button" className="btn-secondary w-full" disabled={!frozen} onClick={download}>
            <Icon name="download" size={16} />
            {t('Жүктеу')}
          </button>
          {frozen && <p className="text-xs text-emerald-500">{t('{n} таңба ауыстырылды', { n: frozen.changed })}</p>}
        </div>
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="card flex flex-wrap items-center gap-3 p-3">
          <div className="segmented">
            {(
              [
                ['live', 'Тікелей'],
                ['before', 'Дейін'],
                ['after', 'Кейін'],
              ] as const
            ).map(([id, label]) => (
              <button key={id} type="button" aria-pressed={mode === id} disabled={id === 'after' && !frozen} onClick={() => setMode(id)}>
                {t(label)}
              </button>
            ))}
          </div>
          <label className="ml-auto flex items-center gap-2 text-sm text-muted">
            {t('Өлшемі')}
            <input type="range" min={16} max={160} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-32 accent-[var(--accent)]" />
            <span className="w-12 tabular-nums">{size}px</span>
          </label>
        </div>
        {font ? (
          <>
            <input className="input" value={text} onChange={(e) => setText(e.target.value)} aria-label={t('Превью мәтіні')} />
            <p className="break-words py-6 leading-tight" style={{ ...previewStyle, fontSize: size }}>
              {text}
            </p>
          </>
        ) : (
          <div className="card flex flex-col items-center gap-2 px-6 py-20 text-center text-muted">
            <Icon name="snowflake" size={32} />
            <p className="font-semibold text-fg">{t('Алдын ала қарау үшін қаріп жүктеңіз')}</p>
            <p className="text-sm">{t('TTF, OTF, WOFF, WOFF2 қолдау көрсетіледі')}</p>
          </div>
        )}
      </section>
    </div>
  );
}
