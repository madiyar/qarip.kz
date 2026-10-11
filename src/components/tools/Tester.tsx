import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import Dropzone from './Dropzone';
import GlyphGrid from '../fonts/GlyphGrid';
import PreviewToolbar, { caseStyle, type PreviewState } from '../fonts/PreviewToolbar';
import Icon from '../ui/Icon';
import Switch from '../ui/Switch';
import { RangeField } from '../ui/Range';
import { featureName, KAZAKH_LETTERS, loadFontFile, type LoadedFont } from '../../lib/userfont';
import { formatSize } from './util';
import { FontMeta, inspectFontFile } from '../fonts/FontInfo';
import { CHARSETS, DEFAULT_PREVIEW } from '../../lib/site';
import { type Lang, localePath, useT } from '../../i18n';

const SCRIPT_LABELS: Record<string, string> = { kazakh: 'Қазақ кирилл', 'kazakh-latin': 'Қазақ латын', cyrillic: 'Кирилл', latin: 'Латын' };
const WATERFALL = [96, 72, 56, 48, 36, 28, 24, 20, 16, 14, 12];
/** Extra samples next to the pangram menu. */
const SAMPLES: [string, string][] = [
  ['Қаз. алфавит', 'АаӘәБбВвГгҒғДдЕеЁёЖжЗзИиЙйКкҚқЛлМмНнҢңОоӨөПпРрСсТтУуҰұҮүФфХхҺһЦцЧчШшЩщЪъЫыІіЬьЭэЮюЯя'],
  ['Латын', 'AaÄäBbCcDdEeFfGgĞğHhIıİiJjKkLlMmNnÑñOoÖöPpQqRrSsŞşTtUuŪūÜüVvWwXxYyZz'],
  ['Цифрлар', '0123456789 ₸ $ € % № + − × ÷ = . , : ; ! ?'],
];
/** Ә, Ғ, Қ… as upper/lower pairs. */
const PAIRS = [...KAZAKH_LETTERS].filter((_, i) => i % 2 === 0).map((c, i) => [c, KAZAKH_LETTERS[i * 2 + 1]]);

type Tab = 'text' | 'waterfall' | 'letters' | 'opentype' | 'axes' | 'glyphs' | 'meta';
const TABS: [Tab, string][] = [
  ['text', 'Мәтін'],
  ['waterfall', 'Сарқырама'],
  ['letters', 'Әріптер'],
  ['opentype', 'OpenType'],
  ['axes', 'Осьтер'],
  ['glyphs', 'Глифтер'],
  ['meta', 'Метадеректер'],
];

export default function Tester({ lang }: { lang: Lang }) {
  const t = useT(lang);
  const [fonts, setFonts] = useState<LoadedFont[]>([]);
  const [activeId, setActiveId] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<PreviewState>({ text: '', size: 48, textCase: 'none', view: 'list' });
  const [lineHeight, setLineHeight] = useState(1.25);
  const [tracking, setTracking] = useState(0);
  const [mark, setMark] = useState(true);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [axes, setAxes] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<Tab>('text');
  const [meta, setMeta] = useState<Record<string, [string, string][]>>({});
  const more = useRef<HTMLInputElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  const active = fonts.find((f) => f.id === activeId) ?? fonts[0];
  useEffect(() => {
    if (window.innerWidth < 640) setPreview((p) => ({ ...p, size: 32 }));
  }, []);
  useEffect(() => {
    if (active && !meta[active.id]) inspectFontFile(active.sfnt).then((r) => setMeta((m) => ({ ...m, [active.id]: r.meta }))).catch(() => {});
  }, [active?.id]);

  const pick = (f: LoadedFont) => {
    setActiveId(f.id);
    setAxes(Object.fromEntries(f.axes.map((a) => [a.tag, a.default])));
    setFeatures({});
  };
  const add = async (files: File[]) => {
    setError('');
    const loaded: LoadedFont[] = [];
    for (const file of files) {
      try {
        loaded.push(await loadFontFile(file));
      } catch {
        setError(t('{name} файлын оқу мүмкін болмады', { name: file.name }));
      }
    }
    if (loaded.length) {
      setFonts((f) => [...f, ...loaded]);
      pick(loaded[0]);
    }
  };
  const onKey = (e: KeyboardEvent) => {
    const i = TABS.findIndex(([id]) => id === tab);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const n = (next + TABS.length) % TABS.length;
    setTab(TABS[n][0]);
    buttons.current[n]?.focus();
  };

  if (!active)
    return (
      <div className="flex flex-col gap-3">
        <Dropzone t={t} onFiles={add} multiple />
        {error && <p className="text-sm text-heart">{error}</p>}
      </div>
    );

  const style = {
    fontFamily: `'${active.family}', system-ui`,
    lineHeight,
    letterSpacing: `${tracking / 1000}em`,
    textTransform: caseStyle(preview.textCase),
    fontFeatureSettings: Object.entries(features).map(([k, v]) => `"${k}" ${v ? 1 : 0}`).join(', ') || undefined,
    fontVariationSettings: active.axes.length ? active.axes.map((a) => `"${a.tag}" ${axes[a.tag] ?? a.default}`).join(', ') : undefined,
  } as const;
  const text = preview.text || DEFAULT_PREVIEW;
  const missing = new Set(active.missingKazakh);
  const missingPairs = PAIRS.filter(([u, l]) => missing.has(u) || missing.has(l));
  // The sample split into runs, so missing letters can be highlighted.
  const runs = mark && missing.size ? text.split(new RegExp(`([${[...missing].join('')}])`, 'u')).filter(Boolean) : [text];

  return (
    <div className="flex flex-col gap-3.5">
      {/* Loaded files */}
      <div className="panel overflow-hidden">
        {fonts.map((f) => (
          <div key={f.id} className={`flex flex-wrap items-center gap-x-5 gap-y-3 border-b border-line py-3.5 pr-4 pl-[18px] last:border-0 ${f.id === active.id ? 'bg-fill' : ''}`}>
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-fill font-mono text-[13px] font-semibold text-fg-2 uppercase">{f.format}</span>
            <button type="button" className="min-w-0 flex-[1_1_240px] text-left" aria-pressed={f.id === active.id} onClick={() => pick(f)}>
              <b className="block truncate font-semibold">{f.fileName}</b>
              <span className="meta block truncate">
                {[formatSize(f.size), f.style, t('{n} глиф', { n: f.glyphs }), f.scripts.map((s) => t(SCRIPT_LABELS[s] ?? s)).join(', ')].filter(Boolean).join(' · ')}
              </span>
            </button>
            <button type="button" className="icon-btn size-9 rounded-full" aria-label={t('Өшіру')} onClick={() => setFonts((list) => list.filter((x) => x.id !== f.id))}>
              <Icon name="x" size={15} />
            </button>
          </div>
        ))}
        <div className="flex flex-wrap items-center gap-3 px-[18px] py-3">
          <button type="button" className="btn-secondary btn-sm" onClick={() => more.current?.click()}>
            <Icon name="plus" size={15} />
            {t('Тағы қосу')}
          </button>
          {error && <span className="text-sm text-heart">{error}</span>}
          <input ref={more} type="file" multiple accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={(e) => add([...(e.target.files ?? [])])} />
        </div>
      </div>

      {/* Kazakh coverage */}
      <div className="flex flex-wrap gap-3.5">
        <div className="panel flex min-w-0 flex-[2_1_460px] flex-col gap-3 p-[18px]">
          <div className="flex items-baseline justify-between gap-2.5">
            <b className="font-semibold">{t('Қазақ әріптері')}</b>
            <span className={`text-sm font-medium ${missingPairs.length ? 'text-warn' : 'text-ok'}`}>{t('{n} / {total} бар', { n: PAIRS.length - missingPairs.length, total: PAIRS.length })}</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2">
            {PAIRS.map(([u, l]) => {
              const ok = !missing.has(u) && !missing.has(l);
              return (
                <div key={u} className={`flex flex-col items-center gap-0.5 rounded-xl py-2.5 ${ok ? 'bg-ok-soft text-ok' : 'bg-bad-soft text-heart'}`}>
                  <span className="text-[28px] leading-none" style={{ fontFamily: style.fontFamily }}>
                    {u}
                    {l}
                  </span>
                  <span className="text-[11px] font-semibold">{ok ? t('бар') : t('жоқ')}</span>
                </div>
              );
            })}
          </div>
        </div>
        {missingPairs.length ? (
          <div className="flex flex-[1_1_280px] flex-col gap-2 rounded-[18px] bg-warn-soft p-[18px]">
            <b className="font-semibold">{t('{letters} жетіспейді', { letters: missingPairs.map(([u]) => u).join(', ') })}</b>
            <span className="text-sm text-fg-2">{t('Мәтінде бұл әріптер басқа қаріппен шығады. Жетіспейтін әріптерді қаріптің стиліне сай салып береміз.')}</span>
            <a href={localePath(lang, '/services')} className="mt-auto inline-flex h-[38px] w-fit items-center rounded-full bg-elev px-3.5 text-sm font-medium shadow-1 transition-colors hover:bg-fill-2">
              {t('Қосуға тапсырыс беру')}
            </a>
          </div>
        ) : (
          <div className="flex flex-[1_1_280px] flex-col gap-2 rounded-[18px] bg-ok-soft p-[18px]">
            <b className="font-semibold text-ok">{t('Қазақ әріптерінің бәрі бар')}</b>
            <span className="text-sm text-fg-2">{t('Қаріп қазақ мәтінін толық көрсетеді.')}</span>
          </div>
        )}
      </div>

      <div className="tabs mt-2" role="tablist" aria-label={t('Тестер бөлімдері')} onKeyDown={onKey}>
        {TABS.map(([id, label], i) => (
          <button
            key={id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            className="tab"
            onClick={() => setTab(id)}
          >
            {t(label)}
            {id === 'opentype' && active.features.length > 0 && <span className="text-[13px] text-fg-3">{active.features.length}</span>}
            {id === 'axes' && active.axes.length > 0 && <span className="text-[13px] text-fg-3">{active.axes.length}</span>}
          </button>
        ))}
      </div>

      {(tab === 'text' || tab === 'waterfall') && (
        <div className="flex flex-col gap-2.5">
          <PreviewToolbar t={t} state={preview} onChange={(n) => setPreview((p) => ({ ...p, ...n }))} showView={false} min={12} max={240} />
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 px-1">
            <div className="flex flex-wrap gap-1.5">
              {SAMPLES.map(([label, sample]) => (
                <button key={label} type="button" className="chip h-8 text-[13px]" aria-pressed={text === sample} onClick={() => setPreview((p) => ({ ...p, text: p.text === sample ? '' : sample }))}>
                  {t(label)}
                </button>
              ))}
            </div>
            <div className="grid min-w-0 flex-[1_1_320px] grid-cols-2 gap-5">
              <RangeField label={t('Жол аралығы')} display={lineHeight.toFixed(2)} min={0.8} max={2.4} step={0.05} value={lineHeight} onChange={setLineHeight} />
              <RangeField label={t('Әріп аралығы')} min={-100} max={400} step={5} value={tracking} onChange={setTracking} />
            </div>
          </div>
          {tab === 'text' && missing.size > 0 && (
            <div className="flex items-center justify-between gap-3 px-1 py-0.5">
              <span id="t-mark" className="text-sm text-fg-2">
                {t('Жетіспейтін әріптерді белгілеу')}
              </span>
              <Switch checked={mark} onChange={setMark} labelledBy="t-mark" />
            </div>
          )}
          {tab === 'text' ? (
            <div
              key={text + mark}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              className="panel min-h-40 px-5 py-6 break-words text-fg outline-none sm:px-7"
              style={{ ...style, fontSize: preview.size }}
              onBlur={(e) => setPreview((p) => ({ ...p, text: e.currentTarget.textContent ?? '' }))}
            >
              {runs.map((r, i) =>
                missing.has(r) ? (
                  <span key={i} className="rounded bg-bad-soft text-heart">
                    {r}
                  </span>
                ) : (
                  r
                ),
              )}
            </div>
          ) : (
            <div className="rows">
              {WATERFALL.map((size) => (
                <div key={size} className="flex items-baseline gap-4 py-3">
                  <span className="w-10 shrink-0 font-mono text-xs text-fg-3">{size}</span>
                  <p className="min-w-0 truncate" style={{ ...style, fontSize: size }}>
                    {text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'letters' && (
        <div className="rows">
          {CHARSETS.map((set) => (
            <div key={set.label} className="pt-[18px] pb-[22px]">
              <p className="meta mb-2.5">{t(set.label)}</p>
              <p className="flex flex-wrap gap-x-3.5 gap-y-1 text-[32px] leading-[1.3]" style={style}>
                {[...set.chars.replace(/\s/g, '')].map((ch, i) => (
                  <span key={ch + i} className={missing.has(ch) ? 'rounded bg-bad-soft text-heart' : ''}>
                    {ch}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
      )}

      {tab === 'opentype' &&
        (active.features.length ? (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              {active.features.map((f) => (
                <button key={f} type="button" className="chip h-[38px]" aria-pressed={Boolean(features[f])} onClick={() => setFeatures((x) => ({ ...x, [f]: !x[f] }))}>
                  <span className="font-mono text-xs">{f}</span>
                  {featureName(f) !== f && featureName(f)}
                </button>
              ))}
            </div>
            <div className="panel px-5 py-6 text-[44px] leading-[1.25] sm:px-7" style={style}>
              fi fl 0123456789 «Қазақ» — 1/2
            </div>
          </div>
        ) : (
          <p className="panel p-8 text-center text-fg-3">{t('Бұл файлда OpenType мүмкіндіктері жоқ.')}</p>
        ))}

      {tab === 'axes' &&
        (active.axes.length ? (
          <div className="flex flex-col gap-3">
            <div className="panel grid gap-5 p-5 sm:grid-cols-2">
              {active.axes.map((a) => (
                <RangeField
                  key={a.tag}
                  label={`${a.name} (${a.tag})`}
                  min={a.min}
                  max={a.max}
                  step={(a.max - a.min) / 100}
                  value={axes[a.tag] ?? a.default}
                  display={String(Math.round(axes[a.tag] ?? a.default))}
                  onChange={(v) => setAxes((x) => ({ ...x, [a.tag]: Number(v.toFixed(1)) }))}
                />
              ))}
            </div>
            <div className="panel px-5 py-6 break-words sm:px-7" style={{ ...style, fontSize: preview.size }}>
              {text}
            </div>
          </div>
        ) : (
          <p className="panel p-8 text-center text-fg-3">{t('Бұл файлда вариативті ось жоқ. Вариативті қаріп жүктесеңіз, әр ось үшін жүгірткі осында пайда болады.')}</p>
        ))}

      {tab === 'glyphs' && <GlyphGrid key={active.id} buffer={active.sfnt} t={t} />}
      {tab === 'meta' && (meta[active.id]?.length ? <FontMeta meta={meta[active.id]} t={t} /> : <p className="meta">{t('Метадеректер табылмады')}</p>)}
    </div>
  );
}
