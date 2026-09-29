import { useEffect, useState } from 'react';
import Icon from '../ui/Icon';
import { CodeBlock } from '../ui/CopyButton';
import GlyphGrid from './GlyphGrid';
import PreviewToolbar, { caseStyle } from './PreviewToolbar';
import { usePreview } from './usePreview';
import { CHARSETS, DEFAULT_PREVIEW } from '../../lib/site';
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
  hasPage: boolean;
}

export interface FileInfo {
  name: string;
  format: string;
  size: string;
  style: string;
}

interface Props {
  lang: Lang;
  name: string;
  slug: string;
  previewText?: string;
  styles: StyleInfo[];
  primary: number;
  license: LicenseInfo;
  css: string;
  cssUrl: string;
  info: { label: string; value: string }[];
  stats: { label: string; value: string }[];
  files: FileInfo[];
}

const TABS = [
  ['preview', 'Превью'],
  ['letters', 'Әріптер'],
  ['glyphs', 'Глиф'],
  ['license', 'Лицензия'],
  ['css', 'CSS'],
  ['info', 'Инфо'],
] as const;
type Tab = (typeof TABS)[number][0];

export default function FontDetail(props: Props) {
  const { lang, styles, license } = props;
  const t = useT(lang);
  const [tab, setTab] = useState<Tab>('preview');
  const [preview, setPreview] = usePreview('detail', { text: '', size: 40, textCase: 'none', view: 'list' });
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [styleIdx, setStyleIdx] = useState(props.primary);

  useEffect(() => {
    const fromHash = window.location.hash.slice(1) as Tab;
    if (TABS.some(([id]) => id === fromHash)) setTab(fromHash);
  }, []);
  const select = (id: Tab) => {
    setTab(id);
    history.replaceState(null, '', id === 'preview' ? window.location.pathname : `#${id}`);
  };

  const text = preview.text || props.previewText || DEFAULT_PREVIEW;
  const current = styles[styleIdx] ?? styles[0];
  const glyphSource = styles.find((s) => /\.(ttf|otf|woff)$/i.test(s.file) && s.slug === current.slug) ?? styles.find((s) => /\.(ttf|otf|woff)$/i.test(s.file));

  const StylePicker = () =>
    styles.length > 1 ? (
      <select className="chip pr-8" value={styleIdx} onChange={(e) => setStyleIdx(Number(e.target.value))} aria-label={t('Стиль')}>
        {styles.map((s, i) => (
          <option key={s.slug + i} value={i}>
            {s.name}
          </option>
        ))}
      </select>
    ) : null;

  return (
    <div>
      <div className="no-scrollbar -mx-4 mb-8 overflow-x-auto px-4">
        <div className="segmented" role="tablist">
          {TABS.map(([id, label]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} aria-pressed={tab === id} onClick={() => select(id)} className="whitespace-nowrap">
              {t(label)}
            </button>
          ))}
        </div>
      </div>

      {tab === 'preview' && (
        <div className="space-y-2">
          <PreviewToolbar t={t} state={preview} onChange={(n) => (setPreview(n), 'text' in n && setOverrides({}))} showView={false} />
          <p className="px-1 pt-2 text-xs text-muted">{t('Мәтінді өзгерту үшін превьюге басыңыз — әр стиль үшін жеке.')}</p>
          {styles.map((s, i) => (
            <div key={s.slug + i} className="border-b border-line py-6">
              <p className="mb-3 text-sm">
                <span className="font-semibold">{props.name}</span> <span className="text-muted">{s.name}</span>
                <span className="ml-2 font-mono text-xs text-muted">
                  {s.variable ? '100–900' : s.weight}
                  {s.italic ? ' italic' : ''}
                </span>
              </p>
              <div
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                className="break-words leading-tight outline-none focus:rounded-lg focus:bg-surface/50"
                style={{ fontFamily: `'${s.family}', system-ui`, fontSize: preview.size, textTransform: caseStyle(preview.textCase) }}
                onBlur={(e) => setOverrides((o) => ({ ...o, [i]: e.currentTarget.textContent ?? '' }))}
              >
                {overrides[i] ?? text}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'letters' && (
        <div className="space-y-4">
          <StylePicker />
          <div className="card space-y-8 p-6">
            {CHARSETS.map((set) => (
              <div key={set.label}>
                <p className="mb-3 text-sm text-muted">{t(set.label)}</p>
                <p className="text-3xl leading-snug tracking-wide break-all sm:text-4xl" style={{ fontFamily: `'${current.family}', system-ui` }}>
                  {set.chars.split('').join(' ')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'glyphs' && (
        <div className="space-y-4">
          <StylePicker />
          {glyphSource ? <GlyphGrid url={glyphSource.file} t={t} /> : <p className="text-muted">{t('Превью қолжетімді емес')}</p>}
        </div>
      )}

      {tab === 'license' && (
        <div className="card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold">{license.name}</h3>
            {license.hasPage && (
              <a className="link text-sm" href={localePath(lang, `/licenses/${license.slug}`)}>
                {t('Толық мәтін')} →
              </a>
            )}
          </div>
          <p className="mt-3 whitespace-pre-line text-muted">{license.description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ['Коммерциялық қолдану', license.commercial],
                ['Өзгерту', license.modification],
                ['Таратуға болады', license.distribution],
                ['Авторды көрсету', license.attribution],
              ] as const
            ).map(([label, ok], i) => (
              <div key={label} className="rounded-xl border border-line p-4">
                <p className="text-sm text-muted">{t(label)}</p>
                <p className={`mt-1 flex items-center gap-1.5 font-semibold ${i === 3 ? (ok ? 'text-amber-500' : 'text-muted') : ok ? 'text-emerald-500' : 'text-rose-500'}`}>
                  <Icon name={i === 3 ? 'info' : ok ? 'check' : 'x'} size={16} />
                  {i === 3 ? (ok ? t('Міндетті') : t('Міндетті емес')) : ok ? t('Рұқсат етілген') : t('Тыйым салынған')}
                </p>
              </div>
            ))}
          </div>
          {license.url && (
            <p className="mt-6 text-sm">
              <span className="text-muted">{t('Қосымша ақпарат')}: </span>
              <a className="link break-all" href={license.url} target="_blank" rel="noopener noreferrer">
                {license.url}
              </a>
            </p>
          )}
        </div>
      )}

      {tab === 'css' && (
        <div className="space-y-6">
          <section>
            <h3 className="mb-3 font-semibold">{t('Ендіру')}</h3>
            <CodeBlock code={`<link rel="stylesheet" href="${props.cssUrl}">`} label={t('Көшіру')} done={t('Көшірілді')} />
          </section>
          <section>
            <h3 className="mb-3 font-semibold">@font-face</h3>
            <CodeBlock code={props.css} label={t('Көшіру')} done={t('Көшірілді')} />
          </section>
          <section>
            <h3 className="mb-3 font-semibold">{t('Қолдану мысалы')}</h3>
            <CodeBlock
              code={`font-family: '${props.name}', sans-serif;\n${[...new Set(styles.map((s) => s.weight))].map((w) => `font-weight: ${w};`).join('\n')}`}
              label={t('Көшіру')}
              done={t('Көшірілді')}
            />
          </section>
          <p className="text-sm text-muted">{t('Сайтта қолданбас бұрын лицензия веб-қолдануға рұқсат беретінін тексеріңіз.')}</p>
        </div>
      )}

      {tab === 'info' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {props.stats.map((s) => (
              <div key={s.label} className="card p-5">
                <p className="text-3xl font-bold tabular-nums">{s.value}</p>
                <p className="mt-1 text-sm text-muted">{t(s.label)}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="card p-5">
              <h3 className="mb-4 font-semibold">{t('Жалпы ақпарат')}</h3>
              <dl className="divide-y divide-line text-sm">
                {props.info.map((row) => (
                  <div key={row.label} className="flex justify-between gap-4 py-2.5">
                    <dt className="text-muted">{t(row.label)}</dt>
                    <dd className="text-right font-medium">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="card p-5">
              <h3 className="mb-4 font-semibold">
                {t('Файлдар')} <span className="text-muted">({props.files.length})</span>
              </h3>
              <ul className="divide-y divide-line text-sm">
                {props.files.map((f) => (
                  <li key={f.name} className="flex items-center gap-3 py-2.5">
                    <Icon name="file" size={16} className="text-muted" />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-muted">{f.size}</span>
                    <span className="badge bg-surface-2 uppercase">{f.format}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
