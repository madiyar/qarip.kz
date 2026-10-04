import { useEffect, useMemo, useState } from 'react';
import Icon from '../ui/Icon';
import PreviewToolbar from './PreviewToolbar';
import { FontRow, FontTile } from './FontRow';
import { usePreview } from './usePreview';
import { type Lang, useT } from '../../i18n';
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

export default function FontBrowser({ fonts, lang, categories = [], tags = [], purposes = [], perPage = 0, filters: showFilters = false, syncUrl = false, ranked = false, initialSize = 24, prefKey = 'catalog' }: Props) {
  const t = useT(lang);
  const [f, setF] = useState<Filters>(DEFAULT);
  const [page, setPage] = useState(1);
  const [preview, setPreview] = usePreview(prefKey, { text: '', size: initialSize, textCase: 'none', view: 'list' });

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
        (!q || x.name.toLowerCase().includes(q) || x.designer.name.toLowerCase().includes(q)) &&
        (!f.category || x.category.id === f.category) &&
        (!f.free || x.free) &&
        (!f.our || x.our) &&
        (!f.script || x.scripts.includes(f.script)) &&
        (!f.tag || x.tags.includes(f.tag)) &&
        (!f.purpose || x.purposes.includes(f.purpose)),
    );
    if (!showFilters && !ranked) return out;
    const sorters: Record<Sort, (a: FontSummary, b: FontSummary) => number> = {
      popular: (a, b) => b.downloads - a.downloads || Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name),
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
              className="input pl-11"
              value={f.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder={t('Қаріп немесе дизайнер іздеу...')}
              aria-label={t('Қаріп іздеу')}
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 pr-1 text-sm text-muted">
              <Icon name="filter" size={14} />
              {t('Іріктеу')}
            </span>
            {categories.length > 0 && (
              <select className="chip pr-8" value={f.category} onChange={(e) => update({ category: e.target.value })} aria-label={t('Категория')}>
                <option value="">{t('Барлық категориялар')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {t(c.description)}
                  </option>
                ))}
              </select>
            )}
            {tags.length > 0 && (
              <select className="chip pr-8" value={f.tag} onChange={(e) => update({ tag: e.target.value })} aria-label={t('Тег')}>
                <option value="">{t('Барлық тегтер')}</option>
                {tags.map((x) => (
                  <option key={x.id} value={x.id}>
                    {t(x.name)}
                  </option>
                ))}
              </select>
            )}
            {purposes.length > 0 && (
              <select className="chip pr-8" value={f.purpose} onChange={(e) => update({ purpose: e.target.value })} aria-label={t('Мақсаты')}>
                <option value="">{t('Кез келген мақсат')}</option>
                {purposes.map((x) => (
                  <option key={x.id} value={x.id}>
                    {t(x.name)}
                  </option>
                ))}
              </select>
            )}
            <select className="chip pr-8" value={f.sort} onChange={(e) => update({ sort: e.target.value as Sort })} aria-label={t('Сұрыптау')}>
              <option value="popular">{t('Популярлық')}</option>
              <option value="new">{t('Жаңа')}</option>
              <option value="alpha">{t('Алфавит')}</option>
            </select>
            <select className="chip pr-8" value={f.script} onChange={(e) => update({ script: e.target.value })} aria-label={t('Әліпби')}>
              <option value="">{t('Кез келген әліпби')}</option>
              <option value="kazakh">{t('Қазақ кирилл')}</option>
              <option value="kazakh-latin">{t('Қазақ латын')}</option>
              <option value="cyrillic">{t('Кирилл')}</option>
              <option value="latin">{t('Латын')}</option>
            </select>
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

      <div className={showFilters ? 'sticky top-[calc(var(--header-h)+0.5rem)] z-20' : ''}>
        <PreviewToolbar t={t} state={preview} onChange={setPreview} />
      </div>

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
