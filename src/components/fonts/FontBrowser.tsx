import { useEffect, useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import Select from '../ui/Select';
import PreviewToolbar, { type PreviewState, type View } from './PreviewToolbar';
import { FontRow, FontTile } from './FontRow';
import { usePreview } from './usePreview';
import { type Lang, useT } from '../../i18n';
import { byPopularity } from '../../lib/downloads';
import type { CategoryInfo, FontSummary } from '../../lib/types';

type Sort = 'popular' | 'new' | 'alpha';

interface Filters {
  q: string;
  category: string;
  sort: Sort;
  free: boolean;
  our: boolean;
  script: string;
  tag: string;
  purpose: string;
}

interface Option {
  id: string;
  name: string;
}

interface Props {
  fonts: FontSummary[];
  lang: Lang;
  categories?: CategoryInfo[];
  tags?: Option[];
  purposes?: Option[];
  /** Fonts per page (catalog). */
  perPage?: number;
  /** Show search, filters and sorting (catalog page). */
  filters?: boolean;
  /** Keep filters in the URL query string. */
  syncUrl?: boolean;
  /** Show rank numbers (top list). */
  ranked?: boolean;
  /** Show the preview controls (text, case, size, view). Without them the list uses `view` and default sizes. */
  toolbar?: boolean;
  view?: View;
  initialSize?: number;
  prefKey?: string;
}

const DEFAULT: Filters = { q: '', category: '', sort: 'new', free: false, our: false, script: '', tag: '', purpose: '' };
// Query values used by the previous (base44) site.
const SORT_ALIASES: Record<string, Sort> = { popularity: 'popular', newest: 'new', alphabetical: 'alpha', popular: 'popular', new: 'new', alpha: 'alpha' };

function readUrl(): Partial<Filters> {
  const p = new URLSearchParams(window.location.search);
  const out: Partial<Filters> = {};
  if (p.get('q')) out.q = p.get('q')!;
  if (p.get('category')) out.category = p.get('category')!.toLowerCase();
  const sort = SORT_ALIASES[p.get('sort') ?? p.get('sortBy') ?? ''];
  if (sort) out.sort = sort;
  if (p.get('tag')) out.tag = p.get('tag')!;
  if (p.get('purpose')) out.purpose = p.get('purpose')!;
  if (p.get('free') === '1' || p.get('free') === 'true') out.free = true;
  if (p.get('our') === '1' || p.get('our') === 'true' || p.get('our_font') === 'true') out.our = true;
  if (p.get('script')) out.script = p.get('script')!;
  return out;
}

function writeUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.category) p.set('category', f.category);
  if (f.sort !== DEFAULT.sort) p.set('sort', f.sort);
  if (f.free) p.set('free', '1');
  if (f.our) p.set('our', '1');
  if (f.script) p.set('script', f.script);
  if (f.tag) p.set('tag', f.tag);
  if (f.purpose) p.set('purpose', f.purpose);
  const qs = p.toString();
  history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

export default function FontBrowser({
  fonts,
  lang,
  categories = [],
  tags = [],
  purposes = [],
  perPage = 0,
  filters: showFilters = false,
  syncUrl = false,
  ranked = false,
  toolbar = true,
  view = 'list',
  initialSize = 24,
  prefKey = 'catalog',
}: Props) {
  const t = useT(lang);
  const [f, setF] = useState<Filters>(DEFAULT);
  const [page, setPage] = useState(1);
  const [saved, setPreview] = usePreview(prefKey, { text: '', size: initialSize, textCase: 'none', view });
  const preview: PreviewState = toolbar ? saved : { text: '', size: initialSize, textCase: 'none', view };

  useEffect(() => {
    if (syncUrl) setF((s) => ({ ...s, ...readUrl() }));
  }, [syncUrl]);

  const update = (next: Partial<Filters>) =>
    setF((s) => {
      const merged = { ...s, ...next };
      if (syncUrl) writeUrl(merged);
      setPage(1);
      return merged;
    });

  const list = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const out = fonts.filter(
      (x) =>
        (!q || x.name.toLowerCase().includes(q) || x.designers.some((d) => d.name.toLowerCase().includes(q))) &&
        (!f.category || x.category.id === f.category) &&
        (!f.free || x.free) &&
        (!f.our || x.our) &&
        (!f.script || x.scripts.includes(f.script)) &&
        (!f.tag || x.tags.includes(f.tag)) &&
        (!f.purpose || x.purposes.includes(f.purpose)),
    );
    if (!showFilters && !ranked) return out;
    const sorters: Record<Sort, (a: FontSummary, b: FontSummary) => number> = {
      popular: byPopularity,
      new: (a, b) => b.addedDate.localeCompare(a.addedDate),
      alpha: (a, b) => a.name.localeCompare(b.name),
    };
    return [...out].sort(sorters[ranked ? 'popular' : f.sort]);
  }, [fonts, f, showFilters, ranked]);

  const active = f.q || f.category || f.free || f.our || f.script || f.tag || f.purpose;
  const totalPages = perPage ? Math.ceil(list.length / perPage) : 1;
  const visible = perPage ? list.slice((page - 1) * perPage, page * perPage) : list;
  const goTo = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="card space-y-3 p-4">
          <label className="relative block">
            <Icon name="search" size={16} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              className="input pr-11 pl-11"
              value={f.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder={t('Қаріп немесе дизайнер іздеу...')}
              aria-label={t('Қаріп іздеу')}
            />
            {f.q && (
              <button type="button" className="icon-btn absolute top-0.5 right-0.5" onClick={() => update({ q: '' })} aria-label={t('Тазалау')}>
                <Icon name="x" size={16} />
              </button>
            )}
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 pr-1 text-sm text-muted">
              <Icon name="filter" size={14} />
              {t('Іріктеу')}
            </span>
            {categories.length > 0 && (
              <Select
                label={t('Категория')}
                value={f.category}
                onChange={(category) => update({ category })}
                options={[
                  { value: '', label: t('Барлық категориялар') },
                  ...categories.map((c) => ({
                    value: c.id,
                    text: c.name,
                    label: (
                      <span className="flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full" style={{ background: c.color }} />
                        {c.name}
                      </span>
                    ),
                    hint: t(c.description),
                  })),
                ]}
              />
            )}
            {tags.length > 0 && (
              <Select label={t('Тег')} value={f.tag} onChange={(tag) => update({ tag })} options={[{ value: '', label: t('Барлық тегтер') }, ...tags.map((x) => ({ value: x.id, label: t(x.name) }))]} />
            )}
            {purposes.length > 0 && (
              <Select
                label={t('Мақсаты')}
                value={f.purpose}
                onChange={(purpose) => update({ purpose })}
                options={[{ value: '', label: t('Кез келген мақсат') }, ...purposes.map((x) => ({ value: x.id, label: t(x.name) }))]}
              />
            )}
            <Select<Sort>
              label={t('Сұрыптау')}
              value={f.sort}
              onChange={(sort) => update({ sort })}
              options={[
                { value: 'popular', label: t('Популярлық') },
                { value: 'new', label: t('Жаңа') },
                { value: 'alpha', label: t('Алфавит') },
              ]}
            />
            <Select
              label={t('Әліпби')}
              value={f.script}
              onChange={(script) => update({ script })}
              options={[
                { value: '', label: t('Кез келген әліпби') },
                { value: 'kazakh', label: t('Қазақ кирилл') },
                { value: 'kazakh-latin', label: t('Қазақ латын') },
                { value: 'cyrillic', label: t('Кирилл') },
                { value: 'latin', label: t('Латын') },
              ]}
            />
            <button type="button" className="chip" aria-pressed={f.free} onClick={() => update({ free: !f.free })}>
              {f.free && <Icon name="check" size={14} />}
              {t('100% тегін')}
            </button>
            <button type="button" className="chip" aria-pressed={f.our} onClick={() => update({ our: !f.our })}>
              {f.our && <Icon name="check" size={14} />}
              {t('Біздің қаріп')}
            </button>
            {active && (
              <button type="button" className="text-sm text-muted hover:text-fg" onClick={() => update({ ...DEFAULT, sort: f.sort })}>
                {t('Тазалау')}
              </button>
            )}
            <span className="ml-auto rounded-lg bg-surface-2 px-2.5 py-1 text-xs font-semibold" aria-live="polite">
              {t('{n} қаріп табылды', { n: list.length })}
            </span>
          </div>
        </div>
      )}

      {toolbar && (
        <div className={showFilters ? 'sticky top-[calc(var(--header-h)+0.5rem)] z-20' : ''}>
          <PreviewToolbar t={t} state={preview} onChange={setPreview} />
        </div>
      )}

      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Icon name="search" size={28} className="text-muted" />
          <p className="font-semibold">{t('Ештеңе табылмады')}</p>
          <p className="text-sm text-muted">{t('Сүзгілерді өзгертіп көріңіз.')}</p>
        </div>
      ) : preview.view === 'grid' ? (
        <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((font) => (
            <FontTile key={font.slug} font={font} lang={lang} preview={preview} />
          ))}
        </div>
      ) : (
        <div>
          {visible.map((font, i) => (
            <FontRow key={font.slug} font={font} lang={lang} preview={preview} rank={ranked ? i + 1 : undefined} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-2 pt-6" aria-label={t('Беттер')}>
          <button type="button" className="btn-secondary h-9 px-3" disabled={page <= 1} onClick={() => goTo(page - 1)}>
            <Icon name="chevronLeft" size={16} />
            {t('Алдыңғы')}
          </button>
          {pages.map((n, i) => (
            <span key={n} className="flex items-center gap-2">
              {i > 0 && n - pages[i - 1] > 1 && <span className="text-muted">…</span>}
              <button type="button" className={n === page ? 'btn-primary h-9 min-w-9 px-3' : 'btn-secondary h-9 min-w-9 px-3'} aria-current={n === page ? 'page' : undefined} onClick={() => goTo(n)}>
                {n}
              </button>
            </span>
          ))}
          <button type="button" className="btn-secondary h-9 px-3" disabled={page >= totalPages} onClick={() => goTo(page + 1)}>
            {t('Келесі')}
            <Icon name="chevronRight" size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
