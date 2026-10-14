import FavoriteButton from './FavoriteButton';
import QualityIndicator from './QualityIndicator';
import OwnBadge from '../ui/OwnBadge';
import Icon from '../ui/Icon';
import { store } from '../../lib/store';
import { trackDownload } from '../../lib/downloads';
import { caseStyle, type PreviewState } from './PreviewToolbar';
import { type Lang, localePath, useT } from '../../i18n';
import type { FontSummary } from '../../lib/types';
import { DEFAULT_PREVIEW } from '../../lib/site';

const family = (slug: string) => `'qf-${slug}', system-ui`;

interface Props {
  font: FontSummary;
  lang: Lang;
  preview: PreviewState;
  /** Download button next to the heart (favorites). */
  download?: boolean;
}

/** "Designers · 4 стиль · жеке жобаға" — the line under a font's name. */
export function fontMeta(font: FontSummary, lang: Lang, kind: 'designer' | 'category' = 'designer') {
  const t = useT(lang);
  const head = kind === 'designer' ? font.designers.map((d) => d.name).join(', ') : font.category.name;
  return [head, t('{n} стиль', { n: font.stylesCount }), !font.free && t('жеке жобаға')].filter(Boolean).join(' · ');
}

const sample = (font: FontSummary, preview: PreviewState) => preview.text || font.previewText || DEFAULT_PREVIEW;

/** Catalog list row: name and meta on top, one line of sample text below. */
export function FontRow({ font, lang, preview, download = false }: Props) {
  const t = useT(lang);
  const href = localePath(lang, `/fonts/${font.slug}`);
  const meta = fontMeta(font, lang);
  return (
    <article className="hover-name flex flex-col gap-2.5 border-b border-line pt-[22px] pb-6">
      <div className="flex min-w-0 items-center gap-2.5">
        <a href={href} className="font-name shrink-0">
          {font.name}
        </a>
        {font.our && <OwnBadge />}
        <span className="min-w-0 flex-1 truncate text-[13px] text-fg-3">{meta}</span>
        <span className="hidden sm:inline-flex">
          <QualityIndicator quality={font.quality} label={t('Сапа')} />
        </span>
        {download && (
          <a
            href={font.zip}
            download
            className="-my-2 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-fg-2 transition-colors hover:bg-fill hover:text-fg"
            aria-label={t('{name} жүктеу', { name: font.name })}
            title={t('Жүктеу')}
            onClick={() => (store.recordDownload(font.slug), trackDownload(font.slug))}
          >
            <Icon name="download" size={17} strokeWidth={2} />
          </a>
        )}
        <FavoriteButton slug={font.slug} lang={lang} name={font.name} className="-my-2 -mr-2 size-9" />
      </div>
      <a
        href={href}
        aria-label={font.name}
        className="block truncate leading-tight text-fg"
        style={{ fontFamily: family(font.slug), fontSize: 'var(--pv-list)', textTransform: caseStyle(preview.textCase) }}
      >
        {sample(font, preview)}
      </a>
    </article>
  );
}

interface CardProps extends Props {
  /** Fixed sample instead of the preview text (similar fonts). */
  text?: string;
  /** Lines of sample text before it is cut. */
  lines?: 2 | 3;
  /** What the line under the name starts with. */
  meta?: 'designer' | 'category';
  favorite?: boolean;
  /** Sample size (CSS value); the shared list size by default. */
  size?: string;
}

/** Font card: the font speaks first (large sample on top), name and meta underneath. */
export function FontCard({ font, lang, preview, text, lines = 3, meta = 'designer', favorite = true, size = 'var(--pv-list)' }: CardProps) {
  const t = useT(lang);
  const href = localePath(lang, `/fonts/${font.slug}`);
  const line = fontMeta(font, lang, meta);
  return (
    <article className={`font-card ${font.our ? 'card-own' : ''}`}>
      <a
        href={href}
        aria-label={font.name}
        className={`leading-[1.2] [overflow-wrap:anywhere] text-fg ${lines === 2 ? 'line-clamp-2 min-h-[2.4em]' : 'line-clamp-3 min-h-[3.6em]'}`}
        style={{ fontFamily: family(font.slug), fontSize: text ? 30 : size, textTransform: text ? undefined : caseStyle(preview.textCase) }}
      >
        {text ?? sample(font, preview)}
      </a>
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <span className="flex min-w-0 items-center gap-2">
            <a href={href} className="font-name min-w-0">
              {font.name}
            </a>
            {font.our && <OwnBadge />}
            {font.quality ? (
              <span className="ml-auto shrink-0 pl-1">
                <QualityIndicator quality={font.quality} label={t('Сапа')} />
              </span>
            ) : null}
          </span>
          <span className="block truncate text-[13px] text-fg-3">{line}</span>
        </div>
        {favorite && <FavoriteButton slug={font.slug} lang={lang} name={font.name} className="-mr-2" />}
      </div>
    </article>
  );
}
