import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import { FontTile } from './FontRow';
import type { PreviewState } from './PreviewToolbar';
import { type Lang, localePath, useT } from '../../i18n';
import type { FontSummary } from '../../lib/types';

interface Tab {
  id: string;
  label: string;
  /** "All" link for this list. */
  href: string;
  fonts: FontSummary[];
}

interface Props {
  lang: Lang;
  tabs: Tab[];
}

/** Home page: latest / popular / our fonts as tabs over one grid. No filters or preview controls here — those live in the catalog. */
export default function HomeFonts({ lang, tabs }: Props) {
  const t = useT(lang);
  const [current, setCurrent] = useState(0);
  const [size, setSize] = useState(28);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const tab = tabs[current];
  const preview: PreviewState = { text: '', size, textCase: 'none', view: 'grid' };

  // Smaller previews on phones, where the cards stack in one column.
  useEffect(() => {
    if (window.innerWidth < 640) setSize(22);
  }, []);

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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="no-scrollbar -mx-4 max-w-[calc(100%+2rem)] overflow-x-auto px-4">
          <div className="segmented" role="tablist" aria-label={t('Қаріптер')} onKeyDown={onKey}>
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
                aria-pressed={i === current}
                tabIndex={i === current ? 0 : -1}
                className="px-4 font-semibold whitespace-nowrap sm:text-base"
                onClick={() => setCurrent(i)}
              >
                {t(x.label)}
              </button>
            ))}
          </div>
        </div>
        <a href={localePath(lang, tab.href)} className="group flex items-center gap-1 text-sm font-semibold whitespace-nowrap text-muted hover:text-fg">
          {t('Барлығы')}
          <Icon name="arrowRight" size={16} className="transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
      <div id="home-fonts" role="tabpanel" aria-labelledby={`home-tab-${tab.id}`} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tab.fonts.map((font) => (
          <FontTile key={font.slug} font={font} lang={lang} preview={preview} />
        ))}
      </div>
    </div>
  );
}
