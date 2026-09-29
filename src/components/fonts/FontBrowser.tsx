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
}

interface Props {
  fonts: FontSummary[];
  lang: Lang;
  categories?: CategoryInfo[];
  /** Show search, filters and sorting (catalog page). */
  filters?: boolean;
  /** Keep filters in the URL query string. */
  syncUrl?: boolean;
  /** Show rank numbers (top list). */
  ranked?: boolean;
  initialSize?: number;
  prefKey?: string;
}

const DEFAULT: Filters = { q: '', category: '', sort: 'popular', free: false, our: false, script: '' };

function readUrl(): Partial<Filters> {
  const p = new URLSearchParams(window.location.search);
  const out: Partial<Filters> = {};
  if (p.get('q')) out.q = p.get('q')!;
  if (p.get('category')) out.category = p.get('category')!.toLowerCase();
  if (['popular', 'new', 'alpha'].includes(p.get('sort') ?? '')) out.sort = p.get('sort') as Sort;
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
  const qs = p.toString();
  history.replaceState(null, '', `${window.location.pathname}${qs ? `?${qs}` : ''}`);
}

export default function FontBrowser({ fonts, lang, categories = [], filters: showFilters = false, syncUrl = false, ranked = false, initialSize = 32, prefKey = 'catalog' }: Props) {
  const t = useT(lang);
  const [f, setF] = useState<Filters>(DEFAULT);
  const [preview, setPreview] = usePreview(prefKey, { text: '', size: initialSize, textCase: 'none', view: 'list' });

  useEffect(() => {
    if (syncUrl) setF((s) => ({ ...s, ...readUrl() }));
  }, [syncUrl]);

  const update = (next: Partial<Filters>) =>
    setF((s) => {
      const merged = { ...s, ...next };
      if (syncUrl) writeUrl(merged);
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
        (!f.script || x.scripts.includes(f.script)),
    );
    if (!showFilters && !ranked) return out;
    const sorters: Record<Sort, (a: FontSummary, b: FontSummary) => number> = {
      popular: (a, b) => b.downloads - a.downloads || Number(b.featured) - Number(a.featured) || a.name.localeCompare(b.name),
      new: (a, b) => b.addedDate.localeCompare(a.addedDate),
      alpha: (a, b) => a.name.localeCompare(b.name),
    };
    return [...out].sort(sorters[ranked ? 'popular' : f.sort]);
  }, [fonts, f, showFilters, ranked]);

  const active = f.q || f.category || f.free || f.our || f.script;

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
            <select className="chip pr-8" value={f.category} onChange={(e) => update({ category: e.target.value })} aria-label={t('Категория')}>
              <option value="">{t('Барлық категориялар')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {t(c.description)}
                </option>
              ))}
            </select>
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

      <PreviewToolbar t={t} state={preview} onChange={setPreview} />

      {list.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Icon name="search" size={28} className="text-muted" />
          <p className="font-semibold">{t('Ештеңе табылмады')}</p>
          <p className="text-sm text-muted">{t('Сүзгілерді өзгертіп көріңіз.')}</p>
        </div>
      ) : preview.view === 'grid' ? (
        <div className="grid gap-4 pt-2 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((font) => (
            <FontTile key={font.slug} font={font} lang={lang} preview={preview} />
          ))}
        </div>
      ) : (
        <div>
          {list.map((font, i) => (
            <FontRow key={font.slug} font={font} lang={lang} preview={preview} rank={ranked ? i + 1 : undefined} />
          ))}
        </div>
      )}
    </div>
  );
}
