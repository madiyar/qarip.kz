import { useEffect, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import { PANGRAMS } from '../../lib/site';
import type { T } from '../../i18n';

export type TextCase = 'none' | 'upper' | 'lower';
export type View = 'list' | 'grid';

export interface PreviewState {
  text: string;
  size: number;
  textCase: TextCase;
  view: View;
}

export const CASES: TextCase[] = ['none', 'upper', 'lower'];
export const caseStyle = (c: TextCase) => (c === 'upper' ? 'uppercase' : c === 'lower' ? 'lowercase' : 'none');

interface Props {
  t: T;
  state: PreviewState;
  onChange: (next: Partial<PreviewState>) => void;
  showView?: boolean;
  min?: number;
  max?: number;
}

export default function PreviewToolbar({ t, state, onChange, showView = true, min = 12, max = 160 }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const step = state.size < 32 ? 2 : state.size < 72 ? 4 : 8;
  const nextCase = CASES[(CASES.indexOf(state.textCase) + 1) % CASES.length];
  const caseLabel = { none: 'Aa', upper: 'AA', lower: 'aa' }[state.textCase];

  return (
    <div className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
      <div ref={ref} className="relative flex-1">
        <input
          className="input pr-11"
          value={state.text}
          placeholder={t('Мәтінді осында жазыңыз...')}
          aria-label={t('Превью мәтіні')}
          onChange={(e) => onChange({ text: e.target.value })}
        />
        <button
          type="button"
          className="icon-btn absolute top-0.5 right-0.5"
          aria-label={t('Дайын панграммалар')}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name="chevronDown" size={16} />
        </button>
        {open && (
          <div className="card absolute top-full right-0 z-30 mt-2 w-full max-w-md p-2 shadow-2xl" role="menu">
            <p className="px-2 py-1.5 text-xs font-semibold text-muted">{t('Дайын панграммалар:')}</p>
            {PANGRAMS.map((p) => (
              <button
                key={p.label}
                type="button"
                role="menuitem"
                className="block w-full rounded-lg px-2 py-2 text-left hover:bg-surface-2"
                onClick={() => {
                  onChange({ text: p.text });
                  setOpen(false);
                }}
              >
                <span className="block text-sm font-semibold">{t(p.label)}</span>
                <span className="block truncate text-xs text-muted">{p.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="flex h-9 min-w-10 items-center justify-center rounded-lg bg-surface-2 px-2 text-sm font-bold"
          onClick={() => onChange({ textCase: nextCase })}
          aria-label={t('Әріп регистрі')}
          title={t('Әріп регистрі')}
        >
          {caseLabel}
        </button>
        {showView && (
          <div className="segmented" role="group" aria-label={t('Көрініс')}>
            <button type="button" aria-pressed={state.view === 'list'} onClick={() => onChange({ view: 'list' })} aria-label={t('Тізім')} title={t('Тізім')}>
              <Icon name="list" size={16} />
            </button>
            <button type="button" aria-pressed={state.view === 'grid'} onClick={() => onChange({ view: 'grid' })} aria-label={t('Тор')} title={t('Тор')}>
              <Icon name="grid" size={16} />
            </button>
          </div>
        )}
        <div className="flex items-center">
          <button type="button" className="icon-btn" onClick={() => onChange({ size: Math.max(min, state.size - step) })} aria-label={t('Кішірейту')}>
            <Icon name="minus" size={16} />
          </button>
          <input
            type="range"
            min={min}
            max={max}
            value={state.size}
            onChange={(e) => onChange({ size: Number(e.target.value) })}
            className="hidden w-24 accent-[var(--accent)] lg:block"
            aria-label={t('Өлшемі')}
          />
          <span className="w-14 text-center text-sm tabular-nums text-muted">{state.size}px</span>
          <button type="button" className="icon-btn" onClick={() => onChange({ size: Math.min(max, state.size + step) })} aria-label={t('Үлкейту')}>
            <Icon name="plus" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
