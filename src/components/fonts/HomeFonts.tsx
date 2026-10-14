import { type KeyboardEvent, useRef, useState } from 'react';
import { FontCard } from './FontRow';
import type { PreviewState } from './PreviewToolbar';
import { type Lang, localePath, useT } from '../../i18n';
import type { FontSummary } from '../../lib/types';

interface Tab {
  id: string;
  label: string;
  /** Where "see all" leads for this tab, and its label. */
  href: string;
  more: string;
  fonts: FontSummary[];
}

interface Props {
  lang: Lang;
  tabs: Tab[];
  /** Total number of fonts ("See all {n} fonts"). */
  total: number;
}

/** Home page: new / popular / Qarip fonts as tabs over one grid. Filters and preview controls live in the catalog. */
export default function HomeFonts({ lang, tabs, total }: Props) {
  const t = useT(lang);
  const [current, setCurrent] = useState(0);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = tabs[current];
  // Sample size comes from --pv-home (smaller on phones, where the cards stack in one column).
  const preview: PreviewState = { text: '', size: 0, textCase: 'none', view: 'grid' };

  const onKey = (e: KeyboardEvent) => {
    const next = { ArrowRight: current + 1, ArrowLeft: current - 1, Home: 0, End: tabs.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const i = (next + tabs.length) % tabs.length;
    setCurrent(i);
    buttons.current[i]?.focus();
  };

  return (
    <div>
      <div className="tabs mb-5" role="tablist" aria-label={t('Қаріптер')} onKeyDown={onKey}>
        {tabs.map((x, i) => (
          <button
            key={x.id}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`home-tab-${x.id}`}
            aria-controls="home-fonts"
            aria-selected={i === current}
            tabIndex={i === current ? 0 : -1}
            className="tab"
            onClick={() => setCurrent(i)}
          >
            {t(x.label)}
          </button>
        ))}
      </div>
      <div id="home-fonts" role="tabpanel" aria-labelledby={`home-tab-${tab.id}`} className="grid gap-4 sm:grid-cols-[repeat(auto-fill,minmax(340px,1fr))]">
        {tab.fonts.map((font) => (
          <FontCard key={font.slug} font={font} lang={lang} preview={preview} size="var(--pv-home)" />
        ))}
      </div>
      <div className="mt-7 flex justify-center">
        <a href={localePath(lang, tab.href)} className="btn-secondary font-medium">
          {t(tab.more, { n: total })}
        </a>
      </div>
    </div>
  );
}
