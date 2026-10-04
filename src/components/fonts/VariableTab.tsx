import { useEffect, useState } from 'react';
import { CodeBlock } from '../ui/CopyButton';
import { DEFAULT_PREVIEW } from '../../lib/site';
import type { T } from '../../i18n';

interface Axis {
  tag: string;
  name: string;
  min: number;
  max: number;
  default: number;
}

/** Sliders for every variation axis of a variable font, with a live preview. */
export default function VariableTab({ name, family, url, t }: { name: string; family: string; url: string; t: T }) {
  const [axes, setAxes] = useState<Axis[] | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [size, setSize] = useState(48);
  const [text, setText] = useState(DEFAULT_PREVIEW);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const opentype = (await import('opentype.js')).default;
        const font = opentype.parse(await (await fetch(url)).arrayBuffer());
        const list: Axis[] = (font.tables.fvar?.axes ?? []).map((a: { tag: string; name?: Record<string, string>; minValue: number; maxValue: number; defaultValue: number }) => ({
          tag: a.tag,
          name: a.name?.en ?? a.tag,
          min: a.minValue,
          max: a.maxValue,
          default: a.defaultValue,
        }));
        if (off) return;
        setAxes(list);
        setValues(Object.fromEntries(list.map((a) => [a.tag, a.default])));
      } catch {
        if (!off) setAxes([]);
      }
    })();
    return () => {
      off = true;
    };
  }, [url]);

  if (!axes) return <p className="text-sm text-muted">{t('Жүктелуде...')}</p>;
  if (!axes.length) return <p className="py-12 text-center text-sm text-muted">{t('Бұл қаріпте вариативтік осьтер табылмады')}</p>;
  const settings = axes.map((a) => `'${a.tag}' ${values[a.tag] ?? a.default}`).join(', ');

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <h3 className="font-semibold">{t('Вариативтік осьтер')}</h3>
          <label className="flex items-center gap-2 text-sm text-muted">
            {t('Өлшемі')}
            <input type="range" min={12} max={160} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-28 accent-[var(--accent)]" />
            <span className="w-12 tabular-nums">{size}px</span>
          </label>
        </div>
        <div className="space-y-5">
          {axes.map((a) => (
            <label key={a.tag} className="block">
              <span className="mb-2 flex items-center gap-2 text-sm">
                <span className="badge bg-surface-2 font-mono">{a.tag}</span>
                {a.name}
                <span className="ml-auto font-mono text-accent">{Math.round(values[a.tag] ?? a.default)}</span>
              </span>
              <span className="flex items-center gap-3 text-xs text-muted">
                {a.min}
                <input
                  type="range"
                  min={a.min}
                  max={a.max}
                  step={(a.max - a.min) / 200}
                  value={values[a.tag] ?? a.default}
                  onChange={(e) => setValues((v) => ({ ...v, [a.tag]: Number(e.target.value) }))}
                  className="flex-1 accent-[var(--accent)]"
                />
                {a.max}
              </span>
            </label>
          ))}
        </div>
        <button type="button" className="btn-ghost mt-4 h-9 px-3 text-muted" onClick={() => setValues(Object.fromEntries(axes.map((a) => [a.tag, a.default])))}>
          {t('Әдепкіге қайтару')}
        </button>
      </section>
      <section className="card p-6">
        <input className="input mb-4" value={text} onChange={(e) => setText(e.target.value)} aria-label={t('Превью мәтіні')} />
        <p className="leading-tight break-words" style={{ fontFamily: `'${family}', system-ui`, fontSize: size, fontVariationSettings: settings }}>
          {text}
        </p>
      </section>
      <CodeBlock code={`font-family: '${name}', sans-serif;\nfont-variation-settings: ${settings};`} label={t('Көшіру')} done={t('Көшірілді')} />
    </div>
  );
}
