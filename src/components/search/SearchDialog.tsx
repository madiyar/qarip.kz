import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import OwnBadge from '../ui/OwnBadge';
import { type Lang, localePath, useT } from '../../i18n';
import { TOOLS } from '../../lib/site';

interface Index {
  fonts: { s: string; n: string; d: string; o: boolean; c: string }[];
  designers: { s: string; n: string; k: number }[];
  categories: { id: string; label: Record<Lang, string> }[];
}

interface Item {
  href: string;
  label: string;
  hint?: string;
  own?: boolean;
}

let indexPromise: Promise<Index> | null = null;
const loadIndex = () => (indexPromise ??= fetch('/search.json').then((r) => r.json() as Promise<Index>));

const norm = (s: string) => s.toLocaleLowerCase('kk').normalize('NFKD');

/**
 * Site search: fonts, designers and tools. Opens from any [data-search-open] button,
 * ⌘K / Ctrl+K or "/". Full screen on phones, a panel under the header on larger screens.
 */
export default function SearchDialog({ lang }: { lang: Lang }) {
  const t = useT(lang);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<Index | null>(null);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as Element | null)?.closest<HTMLElement>('[data-search-open]');
      if (!btn) return;
      opener.current = btn;
      setOpen(true);
    };
    const onKey = (e: globalThis.KeyboardEvent) => {
      const typing = (e.target as HTMLElement | null)?.closest('input, textarea, [contenteditable="true"]');
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        opener.current = document.activeElement as HTMLElement | null;
        setOpen(true);
      }
    };
    document.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    loadIndex().then(setIndex, () => setIndex({ fonts: [], designers: [], categories: [] }));
    document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => input.current?.focus());
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    setQ('');
    setActive(0);
    opener.current?.focus();
  };

  const tools = useMemo((): Item[] => TOOLS.map((x) => ({ href: localePath(lang, x.href), label: t(x.title) })), [lang]);

  const groups = useMemo((): { title: string; items: Item[] }[] => {
    if (!index) return [];
    const query = norm(q.trim());
    const font = (f: Index['fonts'][number]): Item => ({ href: localePath(lang, `/fonts/${f.s}`), label: f.n, hint: f.d, own: f.o });
    if (!query) return [{ title: t('Танымал'), items: index.fonts.slice(0, 5).map(font) }];
    const fonts = index.fonts.filter((f) => norm(f.n).includes(query) || norm(f.d).includes(query)).slice(0, 8).map(font);
    const designers = index.designers
      .filter((d) => norm(d.n).includes(query))
      .slice(0, 4)
      .map((d) => ({ href: localePath(lang, `/designers/${d.s}`), label: d.n, hint: t('{n} қаріп', { n: d.k }) }));
    const matchedTools = tools.filter((x) => norm(x.label).includes(query)).slice(0, 4);
    return [
      { title: t('Қаріптер'), items: fonts },
      { title: t('Дизайнерлер'), items: designers },
      { title: t('Құралдар'), items: matchedTools },
    ].filter((g) => g.items.length);
  }, [index, q, lang]);

  const flat = groups.flatMap((g) => g.items);
  useEffect(() => setActive(0), [q]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (flat.length) setActive((i) => (i + (e.key === 'ArrowDown' ? 1 : -1) + flat.length) % flat.length);
    } else if (e.key === 'Enter') {
      const target = flat[active];
      if (target) window.location.href = target.href;
      else if (q.trim()) window.location.href = `${localePath(lang, '/fonts')}?q=${encodeURIComponent(q.trim())}`;
    }
  };

  if (!open) return null;
  let n = -1;
  return (
    <>
      <div className="fixed inset-0 z-[119] hidden bg-black/50 sm:block" onClick={close} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('Іздеу')}
        className="fixed inset-0 z-[120] flex flex-col overflow-y-auto bg-bg sm:inset-x-0 sm:top-[10vh] sm:bottom-auto sm:mx-auto sm:max-h-[75vh] sm:w-[min(640px,calc(100vw-2rem))] sm:overflow-hidden sm:rounded-2xl sm:bg-pop sm:shadow-pop"
        onKeyDown={onKey}
      >
        <div className="sticky top-0 z-[1] flex items-center gap-1 bg-inherit px-4 pt-3 pb-2 sm:px-3 sm:pt-3">
          <label className="field flex-1">
            <Icon name="search" size={17} />
            <span className="sr-only">{t('Қаріп іздеу')}</span>
            <input
              ref={input}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t('Қаріп, дизайнер, құрал')}
              role="combobox"
              aria-expanded="true"
              aria-controls="search-results"
              aria-activedescendant={flat.length ? `search-${active}` : undefined}
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <button type="button" className="h-11 px-2.5 text-[15px] font-medium text-accent-ink" onClick={close}>
            {t('Жабу')}
          </button>
        </div>

        <div id="search-results" role="listbox" aria-label={t('Нәтижелер')} className="flex flex-col gap-6 overflow-y-auto px-4 pt-3 pb-8 sm:px-3 sm:pb-4">
          {!index && <p className="meta px-1">{t('Жүктелуде…')}</p>}
          {index && groups.length === 0 && (
            <p className="px-1 text-fg-3">
              {t('Ештеңе табылмады')}.{' '}
              <a className="link" href={`${localePath(lang, '/fonts')}?q=${encodeURIComponent(q.trim())}`}>
                {t('Каталогта іздеу')} →
              </a>
            </p>
          )}
          {groups.map((g) => (
            <section key={g.title}>
              <h2 className="label-caps mb-2 px-1">{g.title}</h2>
              <div className="overflow-hidden rounded-[14px] bg-elev sm:bg-fill">
                {g.items.map((item) => {
                  n += 1;
                  const i = n;
                  return (
                    <a
                      key={item.href}
                      id={`search-${i}`}
                      role="option"
                      aria-selected={i === active}
                      href={item.href}
                      onMouseEnter={() => setActive(i)}
                      className={`flex min-h-12 items-center justify-between gap-2.5 border-b border-line px-3.5 last:border-0 ${i === active ? 'bg-fill-2' : ''}`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium">{item.label}</span>
                        {item.own && <OwnBadge />}
                        {item.hint && <span className="truncate text-[13px] text-fg-3">{item.hint}</span>}
                      </span>
                      <Icon name="chevronRight" size={15} className="shrink-0 text-fg-3" />
                    </a>
                  );
                })}
              </div>
            </section>
          ))}
          {index && !q.trim() && (
            <>
              <section>
                <h2 className="label-caps mb-2 px-1">{t('Категориялар')}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {index.categories.map((c) => (
                    <a key={c.id} href={localePath(lang, `/fonts/category/${c.id}`)} className="chip">
                      {c.label[lang]}
                    </a>
                  ))}
                </div>
              </section>
              <section>
                <h2 className="label-caps mb-2 px-1">{t('Құралдар')}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {tools.map((x) => (
                    <a key={x.href} href={x.href} className="chip">
                      {x.label}
                    </a>
                  ))}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </>
  );
}
