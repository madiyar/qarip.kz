import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import { type Lang, localePath, useT } from '../../i18n';
import type { FontSummary } from '../../lib/types';

const SLOTS = [
  { id: 'heading', label: 'Тақырып', sample: 'Қазақ тілі – рухани байлығымыздың бастауы', size: 'text-4xl sm:text-5xl font-bold' },
  { id: 'sub', label: 'Қосымша тақырып', sample: 'Сауатты жазу мен оқу мәдениеті', size: 'text-2xl' },
  { id: 'body', label: 'Негізгі мәтін', sample: 'Тіл – халықтың жаны. Ана тілімізді сақтап, дамыту – біздің міндетіміз. Қазақ жазуы ғасырлар бойы дамып, бүгінгі күні жаңа белеске шықты.', size: 'text-lg leading-relaxed' },
] as const;
type SlotId = (typeof SLOTS)[number]['id'];

// Categories that read well as body text.
const BODY = new Set(['sans', 'serif', 'slab', 'monospace']);

function pick(fonts: FontSummary[], exclude: string[], anchor: FontSummary | undefined, contrast: number, forBody: boolean): FontSummary {
  const pool = fonts.filter((f) => !exclude.includes(f.slug));
  const candidates = pool.length ? pool : fonts;
  const weights = candidates.map((f) => {
    let w = 1;
    if (anchor) w *= f.category.id === anchor.category.id ? 1 + (100 - contrast) / 25 : 1 + contrast / 25;
    if (forBody && BODY.has(f.category.id)) w *= 3;
    return w;
  });
  let r = Math.random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < candidates.length; i++) if ((r -= weights[i]) <= 0) return candidates[i];
  return candidates[0];
}

export default function Pairing({ fonts, lang }: { fonts: FontSummary[]; lang: Lang }) {
  const t = useT(lang);
  const [contrast, setContrast] = useState(50);
  const [locked, setLocked] = useState<Record<SlotId, boolean>>({ heading: false, sub: false, body: false });
  const [pair, setPair] = useState<Record<SlotId, string>>(() => ({ heading: fonts[0]?.slug, sub: fonts[1 % fonts.length]?.slug, body: fonts[2 % fonts.length]?.slug }));
  const [texts, setTexts] = useState<Record<SlotId, string>>({ heading: '', sub: '', body: '' });
  const bySlug = Object.fromEntries(fonts.map((f) => [f.slug, f]));

  const generate = () =>
    setPair((prev) => {
      const next = { ...prev };
      const used: string[] = [];
      for (const s of SLOTS) {
        if (locked[s.id]) {
          used.push(next[s.id]);
          continue;
        }
        const anchor = s.id === 'heading' ? (locked.body ? bySlug[next.body] : undefined) : bySlug[next.heading];
        const f = pick(fonts, used, anchor, contrast, s.id === 'body');
        next[s.id] = f.slug;
        used.push(f.slug);
      }
      return next;
    });

  useEffect(() => {
    if (fonts.length > 1) generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable)) {
        e.preventDefault();
        generate();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const css = SLOTS.map((s) => `${s.id === 'heading' ? 'h1' : s.id === 'sub' ? 'h2' : 'body'} { font-family: '${bySlug[pair[s.id]]?.name}', sans-serif; }`).join('\n');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn-primary" onClick={generate}>
          <Icon name="refresh" size={16} />
          {t('Жасау')}
        </button>
        <label className="card flex h-11 items-center gap-3 px-4 text-sm">
          <span className="text-muted">{t('Ұқсас')}</span>
          <input type="range" min={0} max={100} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-32 accent-[var(--accent)]" aria-label={t('Ұқсас / Контраст')} />
          <span className="text-muted">{t('Контраст')}</span>
        </label>
        <span className="ml-auto flex items-center gap-2 text-sm text-muted">
          <Icon name="lock" size={14} />
          {t('Бекіту үшін құлыпты басыңыз · Space — жаңа үйлесім')}
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {SLOTS.map((s) => {
          const f = bySlug[pair[s.id]];
          return (
            <div key={s.id} className={`card p-4 ${locked[s.id] ? 'border-accent' : ''}`}>
              <div className="flex items-center justify-between">
                <p className="eyebrow">{t(s.label)}</p>
                <button
                  type="button"
                  className={`icon-btn size-8 ${locked[s.id] ? 'text-accent hover:text-accent' : ''}`}
                  aria-pressed={locked[s.id]}
                  aria-label={t('Бекіту')}
                  onClick={() => setLocked((l) => ({ ...l, [s.id]: !l[s.id] }))}
                >
                  <Icon name={locked[s.id] ? 'lock' : 'unlock'} size={15} />
                </button>
              </div>
              <select className="mt-2 w-full bg-transparent text-lg font-semibold outline-none" value={pair[s.id]} onChange={(e) => setPair((p) => ({ ...p, [s.id]: e.target.value }))} aria-label={t(s.label)}>
                {fonts.map((x) => (
                  <option key={x.slug} value={x.slug}>
                    {x.name}
                  </option>
                ))}
              </select>
              {f && (
                <p className="text-xs text-muted">
                  {f.category.name} · {t('{n} стиль', { n: f.stylesCount })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <article className="card space-y-6 p-8 sm:p-12">
        {SLOTS.map((s) => {
          const f = bySlug[pair[s.id]];
          return (
            <div key={s.id}>
              <p className="mb-2 flex items-center gap-2 text-xs text-muted">
                <span className="eyebrow">{t(s.label)}</span>
                {f && (
                  <a href={localePath(lang, `/fonts/${f.slug}`)} className="link">
                    {f.name}
                  </a>
                )}
              </p>
              <div
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                onBlur={(e) => setTexts((x) => ({ ...x, [s.id]: e.currentTarget.textContent ?? '' }))}
                className={`${s.size} break-words outline-none`}
                style={{ fontFamily: `'qf-${pair[s.id]}', system-ui` }}
              >
                {texts[s.id] || t(s.sample)}
              </div>
            </div>
          );
        })}
      </article>

      <details className="card p-4">
        <summary className="cursor-pointer text-sm font-semibold">CSS</summary>
        <pre className="mt-3 overflow-auto font-mono text-xs">{css}</pre>
      </details>
    </div>
  );
}
