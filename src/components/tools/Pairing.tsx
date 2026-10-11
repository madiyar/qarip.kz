import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import Select from '../ui/Select';
import { CodeBlock } from '../ui/CopyButton';
import { type Lang, localePath, useT } from '../../i18n';
import type { FontSummary } from '../../lib/types';

const SLOTS = [
  { id: 'heading', label: 'Тақырып', sample: 'Қазақ тілі — рухани байлығымыздың бастауы', size: 'mb-3.5 text-[clamp(32px,4vw,52px)] leading-[1.1] text-fg' },
  { id: 'sub', label: 'Қосымша тақырып', sample: 'Сауатты жазу мен оқу мәдениеті', size: 'mb-5 text-[22px] leading-[1.3] text-fg-2' },
  { id: 'body', label: 'Негізгі мәтін', sample: 'Тіл — халықтың жаны. Ана тілімізді сақтап, дамыту — біздің міндетіміз. Қазақ жазуы ғасырлар бойы дамып, бүгінгі күні жаңа белеске шықты. Қаріп жұбын таңдағанда сұлулығына ғана емес, Ә, Ғ, Қ, Ң, Ө, Ұ, Ү, Һ, І әріптерінің бәрі бар-жоғына да қараңыз.', size: 'text-[18px] leading-[1.65] text-fg-2' },
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
  const [contrast, setContrast] = useState(80);
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
  const options = fonts.map((x) => ({ value: x.slug, text: x.name, label: <span style={{ fontFamily: `'qf-${x.slug}', system-ui` }} className="text-[17px]">{x.name}</span>, hint: `${x.category.name} · ${t('{n} стиль', { n: x.stylesCount })}` }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2.5">
        <button type="button" className="btn-primary btn-rect h-[42px]" onClick={generate}>
          <Icon name="shuffle" size={16} />
          {t('Жасау')}
        </button>
        <div role="radiogroup" aria-label={t('Үйлесім түрі')} className="segmented">
          {(
            [
              [20, 'Ұқсас'],
              [80, 'Контраст'],
            ] as const
          ).map(([v, label]) => (
            <button key={v} type="button" role="radio" aria-checked={contrast === v} className="h-9! px-3.5!" onClick={() => setContrast(v)}>
              {t(label)}
            </button>
          ))}
        </div>
        <span className="meta">{t('Ұнаған қаріпті құлыппен бекітіңіз — «Жасау» қалғанын ауыстырады. Space — жаңа үйлесім.')}</span>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="flex max-w-full min-w-0 flex-[1_1_280px] flex-col gap-1 rounded-[18px] bg-elev p-3.5 sm:max-w-[340px]">
          {SLOTS.map((s) => {
            const f = bySlug[pair[s.id]];
            return (
              <div key={s.id} className="flex flex-col gap-1.5 px-0.5 pt-1.5 pb-2.5">
                <span className="label-caps">{t(s.label)}</span>
                <div className="flex gap-1.5">
                  <div className="min-w-0 flex-1">
                    <Select label={t(s.label)} value={pair[s.id]} onChange={(v) => setPair((p) => ({ ...p, [s.id]: v }))} block className="flex h-12 w-full items-center gap-2.5 rounded-xl bg-fill pr-3 pl-3.5 text-left transition-colors hover:bg-fill-2" options={options} />
                  </div>
                  <button
                    type="button"
                    className={`inline-flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors ${locked[s.id] ? 'bg-accent-soft text-accent-ink' : 'bg-fill text-fg-3 hover:text-fg'}`}
                    aria-pressed={locked[s.id]}
                    aria-label={`${t(s.label)}: ${t('Бекіту')}`}
                    title={t('Бекіту')}
                    onClick={() => setLocked((l) => ({ ...l, [s.id]: !l[s.id] }))}
                  >
                    <Icon name={locked[s.id] ? 'lock' : 'unlock'} size={17} />
                  </button>
                </div>
                {f && <span className="meta px-0.5">{f.category.name} · {t('{n} стиль', { n: f.stylesCount })}</span>}
              </div>
            );
          })}
        </div>

        <article className="min-w-0 flex-[999_1_520px] rounded-3xl bg-elev p-[clamp(24px,4vw,56px)]">
          {SLOTS.map((s) => (
            <div
              key={s.id}
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              onBlur={(e) => setTexts((x) => ({ ...x, [s.id]: e.currentTarget.textContent ?? '' }))}
              className={`${s.size} break-words outline-none`}
              style={{ fontFamily: `'qf-${pair[s.id]}', system-ui` }}
            >
              {texts[s.id] || t(s.sample)}
            </div>
          ))}
          <div className="mt-7 flex flex-wrap gap-x-4 gap-y-1.5 border-t border-line pt-[18px] text-sm">
            {SLOTS.map((s) => {
              const f = bySlug[pair[s.id]];
              return (
                f && (
                  <a key={s.id} href={localePath(lang, `/fonts/${f.slug}`)} className="font-medium text-accent-ink hover:underline">
                    {t(s.label)}: {f.name} →
                  </a>
                )
              );
            })}
          </div>
        </article>
      </div>

      <CodeBlock title="CSS" code={css} label={t('Көшіру')} done={t('Көшірілді')} />
    </div>
  );
}
