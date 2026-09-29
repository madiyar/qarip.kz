import Icon from '../ui/Icon';
import FavoriteButton from './FavoriteButton';
import { caseStyle, type PreviewState } from './PreviewToolbar';
import { type Lang, localePath, useT } from '../../i18n';
import type { FontSummary } from '../../lib/types';
import { DEFAULT_PREVIEW } from '../../lib/site';

const family = (slug: string) => `'qf-${slug}', system-ui`;

interface Props {
  font: FontSummary;
  lang: Lang;
  preview: PreviewState;
  rank?: number;
}

export function FontRow({ font, lang, preview, rank }: Props) {
  const t = useT(lang);
  const href = localePath(lang, `/fonts/${font.slug}`);
  return (
    <article className="group border-b border-line py-6">
      <div className="mb-3 flex items-center gap-2 text-sm">
        {rank !== undefined && <span className="w-7 font-mono text-muted tabular-nums">{String(rank).padStart(2, '0')}</span>}
        <a href={href} className="text-base font-bold hover:text-accent">
          {font.name}
        </a>
        <span className="hidden text-muted sm:inline">·</span>
        <a href={localePath(lang, `/designers/${font.designer.slug}`)} className="hidden truncate text-muted hover:text-fg sm:inline">
          {font.designer.name}
        </a>
        <span className="text-muted">·</span>
        <span className="whitespace-nowrap text-muted">{t('{n} стиль', { n: font.stylesCount })}</span>
        {font.downloads > 0 && (
          <span className="hidden items-center gap-1 text-muted sm:inline-flex" title={t('Жүктеулер')}>
            <Icon name="download" size={13} />
            {font.downloads}
          </span>
        )}
        {font.our && <span className="badge-accent">{t('Біздің қаріп')}</span>}
        <span className="ml-auto flex items-center">
          <a href={font.zip} download className="icon-btn opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label={t('Жүктеу')} title={t('Жүктеу')}>
            <Icon name="download" size={17} />
          </a>
          <FavoriteButton slug={font.slug} lang={lang} />
        </span>
      </div>
      <a
        href={href}
        className="block break-words leading-tight"
        style={{ fontFamily: family(font.slug), fontSize: preview.size, textTransform: caseStyle(preview.textCase) }}
      >
        {preview.text || font.previewText || DEFAULT_PREVIEW}
      </a>
    </article>
  );
}

export function FontTile({ font, lang, preview }: Props) {
  const t = useT(lang);
  const href = localePath(lang, `/fonts/${font.slug}`);
  return (
    <article className="card group relative flex min-h-64 flex-col p-5 transition-colors hover:border-muted">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <a href={href} className="block truncate font-bold after:absolute after:inset-0 hover:text-accent">
            {font.name}
          </a>
          <p className="truncate text-sm text-muted">
            {font.designer.name} · {t('{n} стиль', { n: font.stylesCount })}
          </p>
        </div>
        <div className="relative z-10 -mt-2 -mr-2">
          <FavoriteButton slug={font.slug} lang={lang} />
        </div>
      </div>
      <p
        className="my-6 line-clamp-4 flex-1 break-words leading-tight"
        style={{ fontFamily: family(font.slug), fontSize: Math.min(preview.size, 64), textTransform: caseStyle(preview.textCase) }}
      >
        {preview.text || font.previewText || DEFAULT_PREVIEW}
      </p>
      <div className="flex flex-wrap gap-1.5">
        <span className="badge" style={{ background: `${font.category.color}22`, color: font.category.color }}>
          {font.category.name}
        </span>
        {font.our && <span className="badge-accent">{t('Біздің қаріп')}</span>}
        {font.free && <span className="badge bg-emerald-500/15 text-emerald-500">{t('Тегін')}</span>}
      </div>
    </article>
  );
}
