import { type KeyboardEvent, type ReactNode, useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import Select from '../ui/Select';
import Skeleton from '../ui/Skeleton';
import { CodeBlock } from '../ui/CopyButton';
import GlyphGrid from './GlyphGrid';
import { FontMeta, FontTech, useFontFile } from './FontInfo';
import VariableStyle from './VariableStyle';
import PreviewToolbar, { caseStyle } from './PreviewToolbar';
import { usePreview } from './usePreview';
import { useDownloads } from './useDownloads';
import { CHARSETS, DEFAULT_PREVIEW, KAZAKH_LETTERS } from '../../lib/site';
import { type Lang, localePath, useT } from '../../i18n';
import type { StyleInfo } from '../../lib/types';

export interface LicenseInfo {
  slug: string;
  name: string;
  description: string;
  url?: string;
  commercial: boolean;
  modification: boolean;
  distribution: boolean;
  attribution: boolean;
  /** Has its own page with the full text or prices. */
  hasPage: boolean;
}

export interface FileInfo {
  name: string;
  format: string;
  size: string;
}

interface Props {
  lang: Lang;
  name: string;
  slug: string;
  previewText?: string;
  styles: StyleInfo[];
  primary: number;
  license: LicenseInfo;
  purchaseUrl?: string;
  /** One @font-face block per style, same order as `styles`. */
  cssBlocks: string[];
  cssUrl: string;
  info: { label: string; value: string }[];
  /** Numbers on the Info tab, labels already in `lang`. */
  stats: { label: string; value: string }[];
  /** Languages the font supports, counted like the Hyperglot checker. */
  languages: number;
  /** Build-time download count; the live one replaces it after load. */
  downloads: number;
  /** Contents of the ZIP archive. */
  files: FileInfo[];
  zipName: string;
  /** Catalog links. */
  tags: { label: string; href: string }[];
  purposes: { label: string; href: string }[];
  designers: { name: string; href: string; fonts: number }[];
}

const TABS = [
  ['preview', 'Превью'],
  ['letters', 'Әріп'],
  ['glyphs', 'Глиф'],
  ['license', 'Лицензия'],
  ['css', 'CSS'],
  ['info', 'Инфо'],
] as const;
type Tab = (typeof TABS)[number][0];

const KAZAKH = new Set(KAZAKH_LETTERS);
const WATERFALL = [48, 32, 24, 18, 14];
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

/** Small heading inside a tab. */
const H = ({ children }: { children: ReactNode }) => <h2 className="mb-1.5 text-[15px] font-semibold text-fg-2">{children}</h2>;

export default function FontDetail(props: Props) {
  const { lang, styles, license } = props;
  const t = useT(lang);
  const [tab, setTab] = useState<Tab>('preview');
  const [preview, setPreview] = usePreview('detail', { text: '', size: 48, textCase: 'none', view: 'list' }, true);
  const [letterSize, setLetterSize] = useState(32);
  const [cssSelected, setCssSelected] = useState<number[]>(() => styles.map((_, i) => i));
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [styleIdx, setStyleIdx] = useState(props.primary);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const downloads = useDownloads(props.slug, props.downloads);
  const css = props.cssBlocks.filter((_, i) => cssSelected.includes(i)).join('\n\n');
  const allSelected = cssSelected.length === styles.length;
  const stats = [...props.stats, { label: t('рет жүктеп алынған'), value: String(downloads) }];
  // Variable styles open the preview (with their axes), static ones follow.
  const previewOrder = [...styles.keys()].sort((a, b) => Number(styles[b].variable) - Number(styles[a].variable));

  useEffect(() => {
    const fromHash = window.location.hash.slice(1) as Tab;
    if (TABS.some(([id]) => id === fromHash)) setTab(fromHash);
    if (window.innerWidth < 640) setLetterSize(24);
  }, []);
  const select = (id: Tab) => {
    setTab(id);
    history.replaceState(null, '', id === 'preview' ? window.location.pathname : `#${id}`);
  };
  const onKey = (e: KeyboardEvent) => {
    const i = TABS.findIndex(([id]) => id === tab);
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: TABS.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const n = (next + TABS.length) % TABS.length;
    select(TABS[n][0]);
    buttons.current[n]?.focus();
  };

  const text = preview.text || props.previewText || DEFAULT_PREVIEW;
  const primary = styles[props.primary] ?? styles[0];
  const current = styles[styleIdx] ?? styles[0];
  const isSource = (s: StyleInfo) => /\.(ttf|otf|woff)$/i.test(s.file);
  const glyphSource = styles.find((s) => isSource(s) && s.slug === current.slug) ?? styles.find(isSource);
  const tt = caseStyle(preview.textCase);
  // The Info tab reads the file only once it is opened.
  const rich = useFontFile(tab === 'info' ? glyphSource?.file : undefined);
  const axes = [...new Set(styles.flatMap((s) => s.axes?.map((a) => a.tag) ?? []))];

  const stylePicker =
    styles.length > 1 ? (
      <Select
        label={t('Стиль')}
        value={styleIdx}
        onChange={setStyleIdx}
        options={styles.map((s, i) => ({ value: i, label: s.name }))}
      />
    ) : null;

  const verdict = (ok: boolean, yes: string, no: string) => ({ text: ok ? yes : no, ok });
  const licenseRows = [
    { what: 'Коммерциялық қолдану', ...verdict(license.commercial, 'Рұқсат етілген', props.purchaseUrl ? 'Сатып алу керек' : 'Тыйым салынған') },
    { what: 'Өзгерту', ...verdict(license.modification, 'Рұқсат етілген', 'Тыйым салынған') },
    { what: 'Тарату', ...verdict(license.distribution, 'Рұқсат етілген', 'Тыйым салынған') },
    { what: 'Авторды көрсету', text: license.attribution ? 'Міндетті' : 'Міндетті емес', ok: !license.attribution },
    { what: 'Жеке жоба, оқу, портфолио', text: 'Тегін', ok: true },
  ];

  return (
    <div>
      <div className="tabs" role="tablist" aria-label={t('Қаріп бөлімдері')} onKeyDown={onKey}>
        {TABS.map(([id, label], i) => (
          <button
            key={id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-controls="font-tab"
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            className="tab"
            onClick={() => select(id)}
          >
            {t(label)}
          </button>
        ))}
      </div>

      <div id="font-tab" role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'preview' && (
          <div className="pt-5">
            <PreviewToolbar t={t} state={preview} onChange={(n) => (setPreview(n), 'text' in n && setOverrides({}))} showView={false} max={160} />
            <div className="mt-2 rows" data-pv="detail">
              {previewOrder.map((i) => {
                const s = styles[i];
                // Callers read the text on blur, before the update: by the time the updater runs, the event's currentTarget is null.
                const edit = (value: string) => setOverrides((o) => ({ ...o, [i]: value }));
                return s.variable ? (
                  <div key={s.slug + i} className="py-4">
                    <VariableStyle t={t} fontName={props.name} style={s} text={overrides[i] ?? text} textTransform={tt} onEdit={edit} />
                  </div>
                ) : (
                  <div key={s.slug + i} className="pt-6 pb-7">
                    <p className="mb-2.5 text-[13px] text-fg-3">
                      <b className="font-semibold text-fg-2">{props.name}</b> {s.name}
                      <span className="ml-2 font-mono text-xs">
                        {s.weight}
                        {s.italic ? ' italic' : ''}
                      </span>
                    </p>
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      spellCheck={false}
                      title={t('Мәтінді өзгерту үшін превьюге басыңыз — әр стиль үшін жеке.')}
                      className="line-clamp-3 cursor-text leading-[1.15] text-fg [overflow-wrap:anywhere] outline-none focus:line-clamp-none"
                      style={{ fontFamily: `'${s.family}', system-ui`, fontSize: 'var(--pv-detail)', textTransform: tt }}
                      onBlur={(e) => edit(e.currentTarget.textContent ?? '')}
                    >
                      {overrides[i] ?? text}
                    </div>
                  </div>
                );
              })}
            </div>
            <h2 className="mt-12 mb-1 text-[15px] font-semibold text-fg-2">{t('Өлшем бойынша')}</h2>
            <div className="rows">
              {WATERFALL.map((px) => (
                <div key={px} className="flex items-baseline gap-5 py-3.5">
                  <span className="w-8 shrink-0 font-mono text-xs text-fg-3">{px}</span>
                  <span className="min-w-0 flex-1 truncate leading-tight text-fg" style={{ fontFamily: `'${primary.family}', system-ui`, fontSize: px, textTransform: tt }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'letters' && (
          <div className="pt-6">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
              <span className="meta">
                {t('Қазақ әріптері')} <span className="text-accent-ink">{t('түспен белгіленген')}</span>
              </span>
              <div className="flex items-center gap-2">
                {stylePicker}
                <div role="group" aria-label={t('Кегль өлшемі')} className="segmented">
                  <button type="button" aria-label={t('Кішірейту')} className="w-8 !px-0 text-[17px] !text-fg" onClick={() => setLetterSize((n) => Math.max(16, n - 4))}>
                    −
                  </button>
                  <span className="inline-flex min-w-12 items-center justify-center text-[13px] font-medium tabular-nums">{letterSize} px</span>
                  <button type="button" aria-label={t('Үлкейту')} className="w-8 !px-0 text-[17px] !text-fg" onClick={() => setLetterSize((n) => Math.min(96, n + 4))}>
                    +
                  </button>
                </div>
              </div>
            </div>
            <div className="rows">
              {CHARSETS.map((set) => (
                <div key={set.label} className="pt-[18px] pb-[22px]">
                  <p className="mb-2.5 meta">{t(set.label)}</p>
                  <p className="flex flex-wrap gap-x-3.5 gap-y-1 leading-[1.3]" style={{ fontFamily: `'${current.family}', system-ui`, fontSize: letterSize }}>
                    {[...set.chars.replace(/\s/g, '')].map((ch, i) => (
                      <span key={ch + i} className={KAZAKH.has(ch) ? 'text-accent-ink' : 'text-fg'}>
                        {ch}
                      </span>
                    ))}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'glyphs' && (
          <div className="space-y-4 pt-6">
            {stylePicker}
            {glyphSource ? <GlyphGrid url={glyphSource.file} t={t} /> : <p className="text-fg-3">{t('Превью қолжетімді емес')}</p>}
          </div>
        )}

        {tab === 'license' && (
          <div className="max-w-[720px] pt-6">
            <h2 className="title-md mb-1.5">{license.name}</h2>
            <p className="mb-4 text-[15px] leading-relaxed whitespace-pre-line text-fg-2">{license.description}</p>
            <div className="rows">
              {licenseRows.map((row) => (
                <div key={row.what} className="flex justify-between gap-4 py-3.5 text-[15px]">
                  <span>{t(row.what)}</span>
                  <span className={`font-medium whitespace-nowrap ${row.ok ? 'text-ok' : 'text-fg-3'}`}>{t(row.text)}</span>
                </div>
              ))}
            </div>
            {props.purchaseUrl && !license.commercial && (
              <div className="note mt-6 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-[18px]">
                <span className="flex-[1_1_300px] text-[15px] text-fg-2">{t('Логотипке, жарнамаға немесе сатылатын өнімге керек пе? Коммерциялық лицензияны авторынан сатып алыңыз.')}</span>
                <a href={props.purchaseUrl} className="btn-primary btn-rect h-[42px]" {...(props.purchaseUrl.startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                  <Icon name="cart" size={17} />
                  {t('Лицензия сатып алу')}
                </a>
              </div>
            )}
            {(license.hasPage || license.url) && (
              <p className="mt-[18px] flex flex-wrap gap-x-2 text-sm text-fg-3">
                {license.hasPage && (
                  <a className="link-quiet" href={localePath(lang, `/licenses/${license.slug}`)}>
                    {t('Толық мәтін')}
                  </a>
                )}
                {license.hasPage && license.url && <span aria-hidden="true">·</span>}
                {license.url && (
                  <a className="link-quiet break-all" href={license.url} target="_blank" rel="noopener noreferrer">
                    {license.url.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </p>
            )}
          </div>
        )}

        {tab === 'css' && (
          <div className="flex max-w-[720px] flex-col gap-4 pt-6">
            {styles.length > 1 && (
              <div className="flex flex-wrap gap-1.5" role="group" aria-label={t('Қаріп түрлері')}>
                <button type="button" className="chip font-semibold text-fg" onClick={() => setCssSelected(allSelected ? [] : styles.map((_, i) => i))}>
                  {allSelected ? t('Таңдауды алып тастау') : t('Барлығын таңдау')}
                </button>
                {styles.map((s, i) => (
                  <button
                    key={s.slug + i}
                    type="button"
                    className="chip"
                    aria-pressed={cssSelected.includes(i)}
                    onClick={() => setCssSelected((sel) => (sel.includes(i) ? sel.filter((x) => x !== i) : [...sel, i]))}
                  >
                    {cssSelected.includes(i) && <Icon name="check" size={12} strokeWidth={3} />}
                    {s.name}
                  </button>
                ))}
              </div>
            )}
            <CodeBlock title={t('Ендіру')} code={`<link rel="stylesheet" href="${props.cssUrl}">`} label={t('Көшіру')} done={t('Көшірілді')} />
            <CodeBlock title="@font-face" code={css} label={t('Көшіру')} done={t('Көшірілді')} />
            <CodeBlock
              title={t('Қолдану мысалы')}
              code={`font-family: '${props.name}', sans-serif;\n${[...new Set(styles.filter((_, i) => cssSelected.includes(i)).map((s) => s.weight))].map((w) => `font-weight: ${w};`).join('\n')}`}
              label={t('Көшіру')}
              done={t('Көшірілді')}
            />
            <p className="text-sm text-fg-3">
              {t('WOFF2 керек пе?')}{' '}
              <a className="link" href={localePath(lang, '/tools/converter')}>
                {t('Конвертер')}
              </a>{' '}
              {t('бір қадамда жасайды.')} {t('Сайтта қолданбас бұрын лицензия веб-қолдануға рұқсат беретінін тексеріңіз.')}
            </p>
          </div>
        )}

        {tab === 'info' && (
          <div className="flex flex-col gap-8 pt-6">
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="card px-[18px] py-4">
                  <b className="block text-2xl font-[650] tracking-[-0.02em] tabular-nums">{s.value}</b>
                  <span className="meta">{s.label}</span>
                </div>
              ))}
            </div>
            {/* Two independent columns: a long block on one side leaves no gap on the other. */}
            <div className="grid items-start gap-x-14 gap-y-8 md:grid-cols-2">
              <div className="flex flex-col gap-8">
                <div>
                  <H>{t('Жалпы ақпарат')}</H>
                  <dl className="rows text-sm">
                    {props.info.map((row) => (
                      <div key={row.label} className="flex justify-between gap-4 py-[11px]">
                        <dt className="text-fg-3">{t(row.label)}</dt>
                        <dd className="text-right">{row.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
                {glyphSource && <FontTech rich={rich} t={t} languages={props.languages} axes={axes} />}
                {props.designers.map((d) => (
                  <a key={d.href} href={d.href} className="hover-name flex items-center gap-3">
                    <span aria-hidden="true" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-ink">
                      {initials(d.name)}
                    </span>
                    <span className="min-w-0">
                      <b className="font-name">{d.name}</b>
                      <span className="meta">{t('{n} қаріп', { n: d.fonts })}</span>
                    </span>
                  </a>
                ))}
              </div>
              <div className="flex flex-col gap-8">
                <div>
                  <H>
                    {t('Архивтегі файлдар')} · {props.files.length}
                  </H>
                  <ul className="rows max-h-96 overflow-y-auto text-sm" title={props.zipName}>
                    {props.files.map((f) => {
                      const slash = f.name.lastIndexOf('/');
                      return (
                        <li key={f.name} className="flex items-center justify-between gap-4 py-2.5" title={f.name}>
                          <span className="min-w-0">
                            <span className="block truncate font-mono text-[13px]">{f.name.slice(slash + 1)}</span>
                            {slash > 0 && <span className="block truncate text-xs text-fg-3">{f.name.slice(0, slash)}/</span>}
                          </span>
                          <span className="shrink-0 text-fg-3 tabular-nums">
                            {f.format && <span className="uppercase">{f.format}</span>}
                            {f.format && ' · '}
                            {f.size}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                {(
                  [
                    ['Тегтер', props.tags],
                    ['Мақсаты', props.purposes],
                  ] as const
                ).map(
                  ([heading, links]) =>
                    links.length > 0 && (
                      <div key={heading}>
                        <h2 className="mb-2.5 text-[15px] font-semibold text-fg-2">{t(heading)}</h2>
                        <div className="flex flex-wrap gap-1.5">
                          {links.map((x) => (
                            <a key={x.href} href={x.href} className="inline-flex h-[30px] items-center rounded-full bg-fill px-3 text-[13px] text-fg-2 transition-colors hover:bg-fill-2 hover:text-fg">
                              {x.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    ),
                )}
                {glyphSource &&
                  (rich ? (
                    <FontMeta meta={rich.meta} t={t} />
                  ) : (
                    <div className="flex flex-col gap-3" aria-busy="true">
                      <Skeleton className="h-5 w-40 rounded-md" />
                      {Array.from({ length: 7 }, (_, i) => (
                        <Skeleton key={i} className="h-[22px] rounded-md" />
                      ))}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
