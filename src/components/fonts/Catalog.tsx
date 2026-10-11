import { type MouseEvent, useEffect, useMemo, useState } from 'react';
import FontBrowser from './FontBrowser';
import { type Lang, useT } from '../../i18n';
import type { FontSummary } from '../../lib/types';

export interface CatalogSection {
  /** '' for the whole catalog. */
  id: string;
  /** Pill label. */
  label: string;
  href: string;
  /** Document title, heading and intro of the section's page. */
  title: string;
  h1: string;
  lead: string;
}

interface Props {
  lang: Lang;
  /** Every font; the section filters them. */
  fonts: FontSummary[];
  purposes: { id: string; name: string }[];
  /** The whole catalog first, then the categories. */
  sections: CatalogSection[];
  /** Section of the page that was requested. */
  current: string;
}

/**
 * Catalog and category pages: heading, category pills and the font list.
 * Every category has its own static page (search engines index them), but in the browser a
 * pill only swaps the list and the URL — no reload, so nothing on the page jumps.
 */
export default function Catalog({ lang, fonts, purposes, sections, current }: Props) {
  const t = useT(lang);
  const [id, setId] = useState(current);
  const section = sections.find((s) => s.id === id) ?? sections[0];
  const list = useMemo(() => (id ? fonts.filter((f) => f.category.id === id) : fonts), [fonts, id]);
  const count = (sid: string) => (sid ? fonts.filter((f) => f.category.id === sid).length : fonts.length);

  useEffect(() => {
    const onPop = () => setId(sections.find((s) => s.href === window.location.pathname)?.id ?? '');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [sections]);

  const open = (e: MouseEvent, next: CatalogSection) => {
    // Let the browser handle new tabs and windows.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    if (next.id === id) return;
    setId(next.id);
    history.pushState(null, '', `${next.href}${window.location.search}`);
    document.title = next.title;
  };

  const all = sections[0];
  return (
    <>
      <nav aria-label={t('Жол')} className="mb-2.5 flex flex-wrap gap-1.5 text-[13px] text-fg-3">
        {id ? (
          <>
            <a href={all.href} className="transition-colors hover:text-accent-ink" onClick={(e) => open(e, all)}>
              {t('Қаріптер')}
            </a>
            <span aria-hidden="true">/</span>
            <span className="text-fg-2" aria-current="page">
              {section.label}
            </span>
          </>
        ) : (
          <span className="text-fg-2" aria-current="page">
            {t('Қаріптер')}
          </span>
        )}
      </nav>
      <header className="mb-5">
        <div className="flex items-baseline gap-2.5">
          <h1 className="title-lg">{section.h1}</h1>
          <span className="text-[15px] text-fg-3 tabular-nums">{list.length}</span>
        </div>
        {/* Room for three lines on phones and two on larger screens, so the list does not move between sections. */}
        <p className="sub mt-1.5 min-h-[4.5em] max-w-[680px] sm:min-h-[3em]">{section.lead}</p>
      </header>

      {/* Categories are links to static pages (for search engines), drawn as pills. */}
      <nav className="no-scrollbar -mx-4 mb-3 flex gap-1 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0" aria-label={t('Категориялар')}>
        {sections.map((s) => (
          <a key={s.id || 'all'} href={s.href} className="pill" aria-current={s.id === id ? 'page' : undefined} onClick={(e) => open(e, s)}>
            {s.label}
            {s.id && <span className="text-xs tabular-nums opacity-60">{count(s.id)}</span>}
          </a>
        ))}
      </nav>

      <FontBrowser fonts={list} purposes={purposes} perPage={100} lang={lang} filters syncUrl prefKey="catalog" />
    </>
  );
}
