import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import Select from '../ui/Select';
import Switch from '../ui/Switch';
import OwnBadge from '../ui/OwnBadge';
import PreviewToolbar, { type PreviewState, type View } from './PreviewToolbar';
import { FontCard, FontRow } from './FontRow';
import { usePreview } from './usePreview';
import { type Lang, localePath, useT } from '../../i18n';
import { byPopularity } from '../../lib/downloads';
import type { FontSummary } from '../../lib/types';

type Sort = 'popular' | 'new' | 'alpha';
type License = 'all' | 'free' | 'personal';

interface Filters {
  q: string;
  sort: Sort;
  license: License;
  our: boolean;
  variable: boolean;
  purposes: string[];
  /** Legacy ?tag= links (font page tags). */
  tag: string;
}

interface Option {
  id: string;
  name: string;
}

interface Props {
  fonts: FontSummary[];
  lang: Lang;
  purposes?: Option[];
  /** Fonts per page (catalog). */
  perPage?: number;
  /** Search, filters and sorting (catalog and category pages). */
  filters?: boolean;
  /** Keep filters in the URL query string. */
  syncUrl?: boolean;
  /** Preview controls (text, case, size, view). Without them the list uses `view`. */
  toolbar?: boolean;
  /** Show the list/grid switch in the toolbar. */
  viewSwitch?: boolean;
  view?: View;
  prefKey?: string;
}

const DEFAULT: Filters = { q: '', sort: 'new', license: 'all', our: false, variable: false, purposes: [], tag: '' };
// Query values used by older versions of the site.
const SORT_ALIASES: Record<string, Sort> = { popularity: 'popular', newest: 'new', alphabetical: 'alpha', popular: 'popular', new: 'new', alpha: 'alpha' };
const list = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);

function readUrl(): Partial<Filters> {
  const p = new URLSearchParams(window.location.search);
  const out: Partial<Filters> = {};
  if (p.get('q')) out.q = p.get('q')!;
  const sort = SORT_ALIASES[p.get('sort') ?? p.get('sortBy') ?? ''];
  if (sort) out.sort = sort;
  if (p.get('free') === '1' || p.get('free') === 'true' || p.get('license') === 'free') out.license = 'free';
  if (p.get('license') === 'personal') out.license = 'personal';
  if (p.get('our') === '1' || p.get('our') === 'true' || p.get('our_font') === 'true') out.our = true;
  if (p.get('variable') === '1') out.variable = true;
  if (p.get('purpose')) out.purposes = list(p.get('purpose'));
  const tag = p.get('tag');
  if (tag === 'free') out.license = 'free';
  else if (tag === 'variable') out.variable = true;
  // Every font has Cyrillic and Latin: old ?tag=cyrillic|latin links show the whole catalog.
  else if (tag && tag !== 'cyrillic' && tag !== 'latin') out.tag = tag;
  return out;
}

function writeUrl(f: Filters) {
  const p = new URLSearchParams();
  if (f.q) p.set('q', f.q);
  if (f.sort !== DEFAULT.sort) p.set('sort', f.sort);
  if (f.license !== 'all') p.set('license', f.license);
  if (f.our) p.set('our', '1');
  if (f.variable) p.set('variable', '1');
  if (f.purposes.length) p.set('purpose', f.purposes.join(','));
  if (f.tag) p.set('tag', f.tag);
  const qs = p.toString();
  history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

export default function FontBrowser({
  fonts,
  lang,
  purposes = [],
  perPage = 0,
  filters: showFilters = false,
  syncUrl = false,
  toolbar = true,
  viewSwitch = true,
  view = 'list',
  prefKey = 'catalog',
}: Props) {
  const t = useT(lang);
  const [f, setF] = useState<Filters>(DEFAULT);
  const [page, setPage] = useState(1);
  const [panel, setPanel] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const [saved, setPreview] = usePreview(prefKey, { text: '', size: 24, textCase: 'none', view });
  const preview: PreviewState = toolbar ? { ...saved, view: viewSwitch ? saved.view : view } : { text: '', size: 24, textCase: 'none', view };

  // A new set of fonts (another category) starts from the first page.
  useEffect(() => setPage(1), [fonts]);

  useEffect(() => {
    if (syncUrl) setF((s) => ({ ...s, ...readUrl() }));
  }, [syncUrl]);

  useEffect(() => {
    if (!panel) return;
    const onDown = (e: MouseEvent) => !panelRef.current?.contains(e.target as Node) && setPanel(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setPanel(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [panel]);

  const update = (next: Partial<Filters>) =>
    setF((s) => {
      const merged = { ...s, ...next };
      if (syncUrl) writeUrl(merged);
      setPage(1);
      return merged;
    });
  const toggleIn = (key: 'purposes', id: string) => update({ [key]: f[key].includes(id) ? f[key].filter((x) => x !== id) : [...f[key], id] });

  const match = (x: FontSummary, filters: Filters) => {
    const q = filters.q.trim().toLowerCase();
    return (
      (!q || x.name.toLowerCase().includes(q) || x.designers.some((d) => d.name.toLowerCase().includes(q))) &&
      (filters.license === 'all' || (filters.license === 'free' ? x.free : !x.free)) &&
      (!filters.our || x.our) &&
      (!filters.variable || x.variable) &&
      filters.purposes.every((p) => x.purposes.includes(p)) &&
      (!filters.tag || x.tags.includes(filters.tag))
    );
  };

  const results = useMemo(() => {
    const out = fonts.filter((x) => match(x, f));
    if (!showFilters) return out;
    const sorters: Record<Sort, (a: FontSummary, b: FontSummary) => number> = {
      popular: byPopularity,
      new: (a, b) => b.addedDate.localeCompare(a.addedDate),
      alpha: (a, b) => a.name.localeCompare(b.name),
    };
    return [...out].sort(sorters[f.sort]);
  }, [fonts, f, showFilters]);

  // Active filters as removable chips (search and sort are not filters).
  const chips: { label: string; clear: () => void }[] = [];
  if (f.license !== 'all') chips.push({ label: t(f.license === 'free' ? '100% тегін' : 'Жеке жобаға'), clear: () => update({ license: 'all' }) });
  f.purposes.forEach((id) => chips.push({ label: t(purposes.find((p) => p.id === id)?.name ?? id), clear: () => toggleIn('purposes', id) }));
  if (f.our) chips.push({ label: t('Qarip қаріптері'), clear: () => update({ our: false }) });
  if (f.variable) chips.push({ label: t('Вариативті'), clear: () => update({ variable: false }) });
  if (f.tag) chips.push({ label: f.tag, clear: () => update({ tag: '' }) });
  const clearAll = () => update({ ...DEFAULT, sort: f.sort });
  const countFor = (license: License) => fonts.filter((x) => match(x, { ...f, license })).length;

  const totalPages = perPage ? Math.ceil(results.length / perPage) : 1;
  const visible = perPage ? results.slice((page - 1) * perPage, page * perPage) : results;
  const goTo = (n: number) => {
    setPage(n);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const pages = [...new Set([1, page - 1, page, page + 1, totalPages])].filter((n) => n >= 1 && n <= totalPages).sort((a, b) => a - b);
  const sortLabels: Record<Sort, string> = { new: t('Жаңалары'), popular: t('Танымалдары'), alpha: t('Алфавит бойынша') };

  return (
    <div>
      {toolbar && (
        <div className={showFilters ? 'sticky top-[var(--header-h)] z-30 -mx-2 bg-bg p-2 max-sm:static' : 'mb-2'}>
          <PreviewToolbar t={t} state={preview} onChange={setPreview} showView={viewSwitch} min={16} max={96} />
        </div>
      )}

      {showFilters && (
        <>
          <div className="mt-4 mb-2 flex flex-wrap items-center gap-2">
            <label className="field h-9 min-w-0 flex-[1_1_100%] rounded-full px-3 sm:flex-[0_1_240px]">
              <Icon name="search" size={15} />
              <span className="sr-only">{t('Қаріп немесе дизайнер іздеу')}</span>
              <input type="search" className="!text-sm" value={f.q} onChange={(e) => update({ q: e.target.value })} placeholder={t('Қаріп іздеу')} />
              {f.q && (
                <button type="button" className="-mr-1 text-fg-3 hover:text-fg" onClick={() => update({ q: '' })} aria-label={t('Тазалау')}>
                  <Icon name="x" size={15} />
                </button>
              )}
            </label>

            <div ref={panelRef} className="relative">
              <button type="button" className="chip text-fg" aria-haspopup="dialog" aria-expanded={panel} onClick={() => setPanel((o) => !o)}>
                <Icon name="sliders" size={15} />
                {t('Сүзгілер')}
                {chips.length > 0 && <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-accent text-[11px] font-bold text-on-accent">{chips.length}</span>}
              </button>
              {panel && (
                <>
                  <div className="pop-scrim fixed inset-0 z-[68]" onClick={() => setPanel(false)} aria-hidden="true" />
                  <div role="dialog" aria-label={t('Сүзгілер')} className="pop absolute top-[calc(100%+10px)] left-0 z-[70] flex w-[340px] flex-col gap-[22px] !p-[18px] sm:left-auto sm:right-auto">
                    <b className="-mb-1.5 text-lg font-[650] tracking-[-0.02em] sm:hidden">{t('Сүзгілер')}</b>
                    <fieldset>
                      <legend className="mb-1.5 text-[13px] font-semibold text-fg-3">{t('Қай жобаға')}</legend>
                      {(
                        [
                          ['all', 'Барлық лицензия'],
                          ['free', 'Кез келген жобаға (100% тегін)'],
                          ['personal', 'Жеке жобаға'],
                        ] as const
                      ).map(([id, label]) => (
                        <button
                          key={id}
                          type="button"
                          role="radio"
                          aria-checked={f.license === id}
                          onClick={() => update({ license: id })}
                          className="-mx-2.5 flex min-h-11 w-[calc(100%+20px)] items-center gap-3 rounded-[10px] px-2.5 text-left text-[15px] hover:bg-fill-2"
                        >
                          <span className={`size-[18px] shrink-0 rounded-full ${f.license === id ? 'border-[6px] border-accent' : 'border-[1.5px] border-line-2'}`} />
                          <span className="flex-1">{t(label)}</span>
                          <span className="text-[13px] text-fg-3 tabular-nums">{countFor(id)}</span>
                        </button>
                      ))}
                      <p className="mt-1 text-[13px] text-fg-3">
                        {t('Бәрі тегін жүктеледі — айырмасы тек қолдану аясында.')}{' '}
                        <a className="link" href={localePath(lang, '/licenses')}>
                          {t('Толығырақ')}
                        </a>
                      </p>
                    </fieldset>
                    {purposes.length > 0 && (
                      <fieldset>
                        <legend className="mb-2 text-[13px] font-semibold text-fg-3">{t('Не үшін')}</legend>
                        <div className="flex flex-wrap gap-1.5">
                          {purposes.map((p) => (
                            <button key={p.id} type="button" className="chip" aria-pressed={f.purposes.includes(p.id)} onClick={() => toggleIn('purposes', p.id)}>
                              {f.purposes.includes(p.id) && <Icon name="check" size={12} strokeWidth={3} />}
                              {t(p.name)}
                            </button>
                          ))}
                        </div>
                      </fieldset>
                    )}
                    <div>
                      <div className="flex min-h-11 items-center justify-between gap-3">
                        <span id="flt-our" className="inline-flex items-center gap-2">
                          {t('Тек')} <OwnBadge /> {t('қаріптері')}
                        </span>
                        <Switch checked={f.our} onChange={(our) => update({ our })} labelledBy="flt-our" />
                      </div>
                      <div className="flex min-h-11 items-center justify-between gap-3">
                        <span id="flt-var">{t('Вариативті')}</span>
                        <Switch checked={f.variable} onChange={(variable) => update({ variable })} labelledBy="flt-var" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="btn-secondary btn-rect" onClick={clearAll}>
                        {t('Тазалау')}
                      </button>
                      <button type="button" className="btn-primary btn-rect flex-1" onClick={() => setPanel(false)}>
                        {t('{n} қаріпті көрсету', { n: results.length })}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <Select<Sort>
              label={t('Сұрыптау')}
              value={f.sort}
              onChange={(sort) => update({ sort })}
              className="inline-flex h-9 items-center gap-1.5 rounded-full pr-3 pl-3.5 text-sm font-medium text-fg-2 transition-colors hover:bg-fill"
              options={(['new', 'popular', 'alpha'] as const).map((value) => ({ value, label: sortLabels[value] }))}
            />
            <span className="ml-auto text-[13px] text-fg-3 tabular-nums" aria-live="polite">
              {t('{n} қаріп', { n: results.length })}
            </span>
          </div>

          {chips.length > 0 && (
            <div className="mb-1 flex flex-wrap items-center gap-1.5">
              {chips.map((c) => (
                <button key={c.label} type="button" onClick={c.clear} className="inline-flex h-[30px] items-center gap-1.5 rounded-full bg-accent-soft pr-2 pl-3 text-[13px] font-medium text-accent-ink" aria-label={t('{name} сүзгісін алып тастау', { name: c.label })}>
                  {c.label}
                  <Icon name="x" size={12} strokeWidth={2.4} />
                </button>
              ))}
              <button type="button" className="h-[30px] px-2 text-[13px] text-fg-3 hover:text-fg" onClick={clearAll}>
                {t('Тазалау')}
              </button>
            </div>
          )}
        </>
      )}

      {results.length === 0 ? (
        <div className="px-6 py-16 text-center text-fg-3">
          <p className="mb-3">{t('Бұл сұрау бойынша қаріп табылмады.')}</p>
          <button type="button" className="btn-secondary btn-sm" onClick={clearAll}>
            {t('Барлығын көрсету')}
          </button>
        </div>
      ) : preview.view === 'grid' ? (
        <div className="mt-3 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]" data-pv={prefKey}>
          {visible.map((font) => (
            <FontCard key={font.slug} font={font} lang={lang} preview={preview} />
          ))}
        </div>
      ) : (
        <div data-pv={prefKey}>
          {visible.map((font) => (
            <FontRow key={font.slug} font={font} lang={lang} preview={preview} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-2 pt-8" aria-label={t('Беттер')}>
          <button type="button" className="btn-secondary btn-sm" disabled={page <= 1} onClick={() => goTo(page - 1)}>
            <Icon name="chevronLeft" size={16} />
            {t('Алдыңғы')}
          </button>
          {pages.map((n, i) => (
            <span key={n} className="flex items-center gap-2">
              {i > 0 && n - pages[i - 1] > 1 && <span className="text-fg-3">…</span>}
              <button type="button" className={`${n === page ? 'btn-primary' : 'btn-secondary'} btn-sm min-w-9`} aria-current={n === page ? 'page' : undefined} onClick={() => goTo(n)}>
                {n}
              </button>
            </span>
          ))}
          <button type="button" className="btn-secondary btn-sm" disabled={page >= totalPages} onClick={() => goTo(page + 1)}>
            {t('Келесі')}
            <Icon name="chevronRight" size={16} />
          </button>
        </nav>
      )}
    </div>
  );
}
