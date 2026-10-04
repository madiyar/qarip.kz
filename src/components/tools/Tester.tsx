import { useEffect, useState } from 'react';
import Dropzone from './Dropzone';
import GlyphGrid from '../fonts/GlyphGrid';
import PreviewToolbar, { caseStyle, type PreviewState } from '../fonts/PreviewToolbar';
import Icon from '../ui/Icon';
import { featureName, loadFontFile, type LoadedFont } from '../../lib/userfont';
import { formatSize } from './util';
import { FontMeta, inspectFontFile } from '../fonts/FontInfo';
import { CHARSETS, DEFAULT_PREVIEW } from '../../lib/site';
import { type Lang, useT } from '../../i18n';

const SCRIPT_LABELS: Record<string, string> = { kazakh: 'Қазақ кирилл', 'kazakh-latin': 'Қазақ латын', cyrillic: 'Кирилл', latin: 'Латын' };
const WATERFALL = [96, 72, 56, 48, 36, 28, 24, 20, 16, 14, 12];
const PRESETS: [string, string][] = [
  ['Қазақша', DEFAULT_PREVIEW],
  ['Ағылшынша', 'The quick brown fox jumps over the lazy dog.'],
  ['Орысша', 'Съешь же ещё этих мягких французских булок, да выпей чаю.'],
  ['Қаз. алфавит', 'АаӘәБбВвГгҒғДдЕеЁёЖжЗзИиЙйКкҚқЛлМмНнҢңОоӨөПпРрСсТтУуҰұҮүФфХхҺһЦцЧчШшЩщЪъЫыІіЬьЭэЮюЯя'],
  ['Латын', 'AaÄäBbCcDdEeFfGgĞğHhIıİiJjKkLlMmNnÑñOoÖöPpQqRrSsŞşTtUuŪūÜüVvWwXxYyZz'],
  ['Цифрлар', '0123456789 ₸ $ € % № + − × ÷ = . , : ; ! ?'],
];

export default function Tester({ lang }: { lang: Lang }) {
  const t = useT(lang);
  const [fonts, setFonts] = useState<LoadedFont[]>([]);
  const [activeId, setActiveId] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<PreviewState>({ text: '', size: 48, textCase: 'none', view: 'list' });
  const [lineHeight, setLineHeight] = useState(1.2);
  const [tracking, setTracking] = useState(0);
  const [features, setFeatures] = useState<Record<string, boolean>>({});
  const [axes, setAxes] = useState<Record<string, number>>({});
  const [tab, setTab] = useState<'preview' | 'waterfall' | 'letters' | 'glyphs' | 'meta'>('preview');
  const [meta, setMeta] = useState<Record<string, [string, string][]>>({});

  const active = fonts.find((f) => f.id === activeId) ?? fonts[0];
  useEffect(() => {
    if (active && !meta[active.id]) inspectFontFile(active.sfnt).then((r) => setMeta((m) => ({ ...m, [active.id]: r.meta }))).catch(() => {});
  }, [active?.id]);
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
      setActiveId(loaded[0].id);
      setAxes(Object.fromEntries(loaded[0].axes.map((a) => [a.tag, a.default])));
      setFeatures({});
    }
  };

  if (!active)
    return (
      <div className="space-y-3">
        <Dropzone t={t} onFiles={add} multiple />
        {error && <p className="text-sm text-rose-500">{error}</p>}
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

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-4">
        <div className="card divide-y divide-line">
          {fonts.map((f) => (
            <div key={f.id} className={`flex items-center gap-3 p-3 ${f.id === active.id ? 'bg-accent-soft' : ''}`}>
              <button
                type="button"
                className="min-w-0 flex-1 text-left"
                onClick={() => {
                  setActiveId(f.id);
                  setAxes(Object.fromEntries(f.axes.map((a) => [a.tag, a.default])));
                  setFeatures({});
                }}
              >
                <span className="block truncate text-lg" style={{ fontFamily: `'${f.family}'` }}>
                  {f.name}
                </span>
                <span className="block truncate text-xs text-muted">
                  {f.style} · {f.format.toUpperCase()} · {formatSize(f.size)}
                </span>
              </button>
              <button type="button" className="icon-btn size-8" aria-label={t('Өшіру')} onClick={() => setFonts((list) => list.filter((x) => x.id !== f.id))}>
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>
        <Dropzone t={t} onFiles={add} multiple compact title={t('Тағы қосу')} />
        {error && <p className="text-sm text-rose-500">{error}</p>}

        <div className="card space-y-3 p-4 text-sm">
          <p className="font-semibold">{t('Қаріп туралы')}</p>
          <dl className="grid grid-cols-2 gap-y-1.5">
            <dt className="text-muted">{t('Глиф саны')}</dt>
            <dd className="text-right">{active.glyphs}</dd>
            <dt className="text-muted">{t('Салмағы')}</dt>
            <dd className="text-right">{active.weight}</dd>
            <dt className="text-muted">{t('Вариативті')}</dt>
            <dd className="text-right">{active.axes.length ? active.axes.map((a) => a.tag).join(', ') : '—'}</dd>
          </dl>
          <div className="flex flex-wrap gap-1.5">
            {active.scripts.map((s) => (
              <span key={s} className="badge bg-surface-2">
                {t(SCRIPT_LABELS[s] ?? s)}
              </span>
            ))}
          </div>
          {active.missingKazakh.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
              <Icon name="check" size={16} />
              {t('Қазақ әріптерінің бәрі бар')}
            </p>
          ) : (
            <p className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
              {t('Жетіспейтін қазақ әріптері')}: <span className="font-mono">{active.missingKazakh.join(' ')}</span>
            </p>
          )}
        </div>

        <div className="card space-y-4 p-4 text-sm">
          <label className="block">
            <span className="flex justify-between text-muted">
              {t('Жол аралығы')} <span>{lineHeight.toFixed(2)}</span>
            </span>
            <input type="range" min={0.8} max={2.4} step={0.05} value={lineHeight} onChange={(e) => setLineHeight(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
          </label>
          <label className="block">
            <span className="flex justify-between text-muted">
              {t('Әріп аралығы')} <span>{tracking}</span>
            </span>
            <input type="range" min={-100} max={400} step={5} value={tracking} onChange={(e) => setTracking(Number(e.target.value))} className="w-full accent-[var(--accent)]" />
          </label>
          {active.axes.map((a) => (
            <label key={a.tag} className="block">
              <span className="flex justify-between text-muted">
                {a.name} ({a.tag}) <span>{axes[a.tag] ?? a.default}</span>
              </span>
              <input
                type="range"
                min={a.min}
                max={a.max}
                step={(a.max - a.min) / 100}
                value={axes[a.tag] ?? a.default}
                onChange={(e) => setAxes((x) => ({ ...x, [a.tag]: Number(Number(e.target.value).toFixed(1)) }))}
                className="w-full accent-[var(--accent)]"
              />
            </label>
          ))}
        </div>

        {active.features.length > 0 && (
          <div className="card p-4 text-sm">
            <p className="mb-2 font-semibold">OpenType</p>
            <div className="flex flex-wrap gap-1.5">
              {active.features.map((f) => (
                <button key={f} type="button" className="chip h-8 font-mono text-xs" aria-pressed={Boolean(features[f])} title={featureName(f)} onClick={() => setFeatures((x) => ({ ...x, [f]: !x[f] }))}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        )}
      </aside>

      <section className="min-w-0 space-y-4">
        <div className="segmented">
          {(
            [
              ['preview', 'Превью'],
              ['waterfall', 'Сарқырама'],
              ['letters', 'Әріптер'],
              ['glyphs', 'Глиф'],
              ['meta', 'Метадеректер'],
            ] as const
          ).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={tab === id} onClick={() => setTab(id)}>
              {t(label)}
            </button>
          ))}
        </div>
        {tab === 'preview' && (
          <>
            <PreviewToolbar t={t} state={preview} onChange={(n) => setPreview((p) => ({ ...p, ...n }))} showView={false} max={240} />
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(([label, sample]) => (
                <button key={label} type="button" className="chip h-8 text-xs" aria-pressed={text === sample} onClick={() => setPreview((p) => ({ ...p, text: sample }))}>
                  {t(label)}
                </button>
              ))}
            </div>
            <div key={text} contentEditable suppressContentEditableWarning spellCheck={false} className="min-h-40 break-words py-6 outline-none" style={{ ...style, fontSize: preview.size }}>
              {text}
            </div>
          </>
        )}
        {tab === 'waterfall' && (
          <div className="space-y-4">
            {WATERFALL.map((size) => (
              <div key={size} className="flex items-baseline gap-4 border-b border-line pb-3">
                <span className="w-10 shrink-0 font-mono text-xs text-muted">{size}</span>
                <p className="truncate" style={{ ...style, fontSize: size }}>
                  {text}
                </p>
              </div>
            ))}
          </div>
        )}
        {tab === 'letters' && (
          <div className="card space-y-8 p-6">
            {CHARSETS.map((set) => (
              <div key={set.label}>
                <p className="mb-3 text-sm text-muted">{t(set.label)}</p>
                <p className="text-4xl leading-snug break-all" style={style}>
                  {set.chars.split('').join(' ')}
                </p>
              </div>
            ))}
          </div>
        )}
        {tab === 'glyphs' && <GlyphGrid key={active.id} buffer={active.sfnt} t={t} />}
        {tab === 'meta' && (meta[active.id]?.length ? <FontMeta meta={meta[active.id]} t={t} /> : <p className="text-sm text-muted">{t('Метадеректер табылмады')}</p>)}
      </section>
    </div>
  );
}
