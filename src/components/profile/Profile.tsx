import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import { FontRow } from '../fonts/FontRow';
import PreviewToolbar from '../fonts/PreviewToolbar';
import { usePreview } from '../fonts/usePreview';
import { store } from '../../lib/store';
import { useStore } from '../../lib/useStore';
import { trackDownload } from '../../lib/downloads';
import { type Lang, LOCALE_TAG, localePath, useT } from '../../i18n';
import type { FontSummary } from '../../lib/types';

interface Props {
  fonts: FontSummary[];
  lang: Lang;
}

type Tab = 'favorites' | 'downloads' | 'collections';
const TABS: [Tab, string][] = [
  ['favorites', 'Таңдаулылар'],
  ['downloads', 'Жүктеу тарихы'],
  ['collections', 'Жинақтар'],
];
const family = (slug: string) => `'qf-${slug}', system-ui`;

/** "My fonts": favorites, download history and collections, all kept in this browser (src/lib/store.ts). */
export default function Profile({ fonts, lang }: Props) {
  const t = useT(lang);
  const { favorites, downloads, catalogs } = useStore();
  const [tab, setTab] = useState<Tab>('favorites');
  const [preview, setPreview] = usePreview('profile', { text: '', size: 28, textCase: 'none', view: 'list' });
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [shared, setShared] = useState<{ name: string; fonts: string[] } | null>(null);
  const [copied, setCopied] = useState('');
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const bySlug = useMemo(() => Object.fromEntries(fonts.map((f) => [f.slug, f])), [fonts]);

  useEffect(() => {
    // A collection shared by link: /profile?catalog=Name&fonts=a,b,c
    const p = new URLSearchParams(window.location.search);
    const list = p.get('fonts')?.split(',').filter((s) => s in bySlug);
    if (list?.length) {
      setShared({ name: p.get('catalog') || t('Ортақ жинақ'), fonts: list });
      setTab('collections');
      return;
    }
    const hash = window.location.hash.slice(1);
    if (hash === 'downloads' || hash === 'collections') setTab(hash);
    else if (hash === 'catalogs') setTab('collections');
  }, [bySlug]);

  const select = (id: Tab) => {
    setTab(id);
    history.replaceState(null, '', id === 'favorites' ? window.location.pathname : `#${id}`);
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

  const favFonts = favorites.map((s) => bySlug[s]).filter(Boolean);
  const log = downloads.filter((d) => bySlug[d.slug]);
  const counts: Record<Tab, number> = { favorites: favFonts.length, downloads: log.length, collections: catalogs.length };
  const shareUrl = (name: string, list: string[]) => `${window.location.origin}${localePath(lang, '/profile')}?catalog=${encodeURIComponent(name)}&fonts=${list.join(',')}`;
  const when = (iso: string) => new Date(iso).toLocaleString(LOCALE_TAG[lang], { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
  const create = () => {
    if (!draft.trim()) return;
    store.createCatalog(draft.trim());
    setDraft('');
    setCreating(false);
  };

  return (
    <div>
      {shared && (
        <div role="status" className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl bg-accent-soft py-4 pr-3 pl-5">
          <span className="min-w-0 flex-[1_1_280px]">
            <b className="block text-[15px] font-semibold">{shared.name}</b>
            <span className="block truncate text-sm text-fg-2">{shared.fonts.map((s) => bySlug[s].name).join(', ')}</span>
          </span>
          <button
            type="button"
            className="btn-primary btn-sm h-10!"
            onClick={() => {
              store.createCatalog(shared.name, shared.fonts);
              setShared(null);
              window.history.replaceState(null, '', `${window.location.pathname}#collections`);
            }}
          >
            {t('Жинақты сақтау')}
          </button>
          <button type="button" className="icon-btn size-8 rounded-lg text-fg-3" onClick={() => setShared(null)} aria-label={t('Жабу')}>
            <Icon name="x" size={14} strokeWidth={2.2} />
          </button>
        </div>
      )}

      <div className="tabs mb-2" role="tablist" aria-label={t('Бөлімдер')} onKeyDown={onKey}>
        {TABS.map(([id, label], i) => (
          <button
            key={id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`profile-tab-${id}`}
            aria-controls="profile-panel"
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            className="tab"
            onClick={() => select(id)}
          >
            {t(label)}
            <span className="text-[13px] text-fg-3 tabular-nums">{counts[id]}</span>
          </button>
        ))}
      </div>

      <div id="profile-panel" role="tabpanel" aria-labelledby={`profile-tab-${tab}`}>
        {tab === 'favorites' &&
          (favFonts.length === 0 ? (
            <div className="px-6 py-16 text-center text-fg-3">
              <p className="mb-3.5">{t('Таңдаулы қаріп әлі жоқ. Ұнаған қаріптің жанындағы жүрекшені басыңыз.')}</p>
              <a className="btn-secondary btn-sm h-10!" href={localePath(lang, '/fonts')}>
                {t('Қаріптерге өту')}
              </a>
            </div>
          ) : (
            <div className="pt-3">
              <PreviewToolbar t={t} state={preview} onChange={setPreview} showView={false} />
              <div data-pv="profile">
                {favFonts.map((f) => (
                  <FontRow key={f.slug} font={f} lang={lang} preview={preview} download />
                ))}
              </div>
            </div>
          ))}

        {tab === 'downloads' &&
          (log.length === 0 ? (
            <p className="px-6 py-16 text-center text-fg-3">{t('Тарих бос. Жүктелген қаріптер осында көрінеді.')}</p>
          ) : (
            <div className="pt-1">
              <ul className="rows">
                {log.map((d, i) => {
                  const f = bySlug[d.slug];
                  return (
                    <li key={d.at + i} className="hover-name flex items-center gap-4 py-3.5">
                      <span aria-hidden="true" className="w-14 shrink-0 text-[30px] leading-none" style={{ fontFamily: family(d.slug) }}>
                        Аа
                      </span>
                      <span className="min-w-0 flex-1">
                        <a href={localePath(lang, `/fonts/${d.slug}`)} className="font-name">
                          {f.name}
                        </a>
                        <time className="meta" dateTime={d.at}>
                          {when(d.at)}
                        </time>
                      </span>
                      <a href={f.zip} download className="btn-secondary btn-sm" aria-label={t('{name} жүктеу', { name: f.name })} onClick={() => (store.recordDownload(d.slug), trackDownload(d.slug))}>
                        <Icon name="download" size={16} strokeWidth={2} />
                        <span className="max-sm:hidden">{t('Қайта жүктеу')}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
              <button type="button" className="mt-4 h-9 text-sm text-fg-3 transition-colors hover:text-fg" onClick={() => store.clearDownloads()}>
                {t('Тарихты тазалау')}
              </button>
            </div>
          ))}

        {tab === 'collections' && (
          <div className="grid gap-4 pt-4 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
            {catalogs.map((c) => {
              const list = c.fonts.filter((s) => bySlug[s]);
              const addable = favFonts.filter((f) => !c.fonts.includes(f.slug));
              return (
                <article key={c.id} className="card flex flex-col gap-[18px] px-[22px] pt-[22px] pb-[18px]">
                  {list.length === 0 ? (
                    <p className="min-h-24 text-sm text-fg-3">{t('Қаріп бетіндегі «Жинаққа қосу» батырмасымен қаріп қосыңыз.')}</p>
                  ) : (
                    <ul className="flex min-h-24 flex-col gap-1">
                      {list.map((s) => (
                        <li key={s} className="group flex items-center gap-2">
                          <a href={localePath(lang, `/fonts/${s}`)} className="min-w-0 flex-1 truncate text-2xl leading-[1.2] text-fg hover:text-accent-ink" style={{ fontFamily: family(s) }}>
                            {bySlug[s].name}
                          </a>
                          <button
                            type="button"
                            className="icon-btn size-7 rounded-lg opacity-0 group-hover:opacity-100 focus:opacity-100 max-sm:opacity-100"
                            onClick={() => store.toggleInCatalog(c.id, s)}
                            aria-label={t('{name} жинақтан алу', { name: bySlug[s].name })}
                          >
                            <Icon name="x" size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {addable.length > 0 && (
                    <div>
                      <p className="meta mb-1.5">{t('Таңдаулылардан қосу:')}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {addable.map((f) => (
                          <button key={f.slug} type="button" className="chip h-8 text-[13px]" onClick={() => store.toggleInCatalog(c.id, f.slug)}>
                            <Icon name="plus" size={13} strokeWidth={2.4} />
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-1 border-t border-line pt-3.5">
                    <div className="min-w-0 flex-1">
                      {editing === c.id ? (
                        <input
                          autoFocus
                          className="input h-9"
                          defaultValue={c.name}
                          aria-label={t('Жинақ атауы')}
                          onBlur={(e) => {
                            if (e.target.value.trim()) store.renameCatalog(c.id, e.target.value.trim());
                            setEditing(null);
                          }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                        />
                      ) : (
                        <>
                          <b className="font-name">{c.name}</b>
                          <span className="meta">{t('{n} қаріп', { n: list.length })}</span>
                        </>
                      )}
                    </div>
                    <button type="button" className="icon-btn size-9" onClick={() => setEditing(c.id)} aria-label={t('Атын өзгерту')} title={t('Атын өзгерту')}>
                      <Icon name="pencil" size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn size-9"
                      disabled={!list.length}
                      onClick={async () => {
                        await navigator.clipboard?.writeText(shareUrl(c.name, list));
                        setCopied(c.id);
                        setTimeout(() => setCopied(''), 1500);
                      }}
                      aria-label={t('Сілтемені көшіру')}
                      title={copied === c.id ? t('Көшірілді') : t('Сілтемені көшіру')}
                    >
                      <Icon name={copied === c.id ? 'check' : 'share'} size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn size-9 hover:text-heart"
                      onClick={() => confirm(t('Жинақты өшіру керек пе?')) && store.deleteCatalog(c.id)}
                      aria-label={t('Өшіру')}
                      title={t('Өшіру')}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                </article>
              );
            })}

            <div className="flex min-h-[180px] flex-col justify-center gap-2.5 rounded-[20px] border-[1.5px] border-dashed border-line-2 p-[22px]">
              {creating ? (
                <form
                  className="flex flex-col gap-2.5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    create();
                  }}
                >
                  <label htmlFor="new-collection" className="text-[13px] font-semibold text-fg-3">
                    {t('Жинақ атауы')}
                  </label>
                  <input id="new-collection" autoFocus className="input" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={t('Мысалы: Кофехана брендингі')} />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary btn-rect h-10! flex-1 text-sm!">
                      {t('Құру')}
                    </button>
                    <button type="button" className="btn-secondary btn-rect h-10! text-sm!" onClick={() => setCreating(false)}>
                      {t('Болдырмау')}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <button type="button" className="flex flex-col items-center gap-2 p-3 text-[15px] font-medium text-fg-2 transition-colors hover:text-fg" onClick={() => setCreating(true)}>
                    <span aria-hidden="true" className="inline-flex size-10 items-center justify-center rounded-full bg-fill">
                      <Icon name="plus" size={20} />
                    </span>
                    {t('Жаңа жинақ')}
                  </button>
                  <span className="meta text-center">{t('Жоба бойынша қаріптерді топтаңыз')}</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="meta mt-8 flex items-center gap-2">
        <Icon name="lock" size={14} />
        {t('Барлық деректер тек осы браузерде сақталады және серверге жіберілмейді.')}
      </p>
    </div>
  );
}
