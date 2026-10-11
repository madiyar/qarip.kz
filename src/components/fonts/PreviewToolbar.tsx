import { type RefObject, useEffect, useId, useRef, useState } from 'react';
import Icon from '../ui/Icon';
import Range from '../ui/Range';
import { PANGRAMS } from '../../lib/site';
import type { T } from '../../i18n';

export type TextCase = 'none' | 'upper' | 'lower' | 'title';
export type View = 'list' | 'grid';

export interface PreviewState {
  text: string;
  size: number;
  textCase: TextCase;
  view: View;
}

export const CASES: TextCase[] = ['none', 'upper', 'lower', 'title'];
export const caseStyle = (c: TextCase) => ({ none: 'none', upper: 'uppercase', lower: 'lowercase', title: 'capitalize' } as const)[c] ?? 'none';
const CASE_LABEL: Record<TextCase, [string, string]> = {
  none: ['Аа', 'Жазылғандай'],
  upper: ['АА', 'Бас әріппен'],
  lower: ['аа', 'Кіші әріппен'],
  title: ['Аа Бб', 'Әр сөз бас әріппен'],
};
/** Short names for the pangram button. */
const PANGRAM_SHORT = ['Панграмма 1', 'Панграмма 2', 'English'];

interface Props {
  t: T;
  state: PreviewState;
  onChange: (next: Partial<PreviewState>) => void;
  showView?: boolean;
  min?: number;
  max?: number;
}

/** Closes a popover on outside click and Escape. */
function useDismiss(open: boolean, close: () => void, ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && close();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
}

const Divider = () => <span aria-hidden="true" className="mx-1 h-[22px] w-px shrink-0 bg-line" />;

/**
 * Preview controls shared by every font list: own text, pangrams, letter case, size and view.
 * On phones the size slider moves into a popover with quick sizes.
 */
export default function PreviewToolbar({ t, state, onChange, showView = true, min = 16, max = 96 }: Props) {
  const id = useId();
  const [menu, setMenu] = useState<'pangram' | 'size' | null>(null);
  const pangramRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  useDismiss(menu === 'pangram', () => setMenu(null), pangramRef);
  useDismiss(menu === 'size', () => setMenu(null), sizeRef);

  const pangramIndex = PANGRAMS.findIndex((p) => p.text === state.text);
  const custom = state.text && pangramIndex < 0;
  const nextCase = CASES[(CASES.indexOf(state.textCase) + 1) % CASES.length];
  const [caseShort, caseName] = CASE_LABEL[state.textCase] ?? CASE_LABEL.none;
  const quick = [16, 24, 32, 48, 64, 96, 120].filter((v) => v >= min && v <= max).slice(0, 5);
  const ctl = 'inline-flex h-10 shrink-0 items-center justify-center rounded-[10px] px-2.5 text-sm transition-colors hover:bg-fill';

  return (
    // `relative` positions the menus. No z-index here: it would make a stacking context and trap the
    // phone bottom sheets under the tab bar; the menus' own z-index already covers the cards below.
    <div role="toolbar" aria-label={t('Превью баптаулары')} className="relative flex h-[52px] items-center rounded-[14px] bg-elev pr-1.5 pl-3.5 shadow-1 sm:pl-4">
      <Icon name="pen" size={16} className="hidden shrink-0 text-fg-3 sm:block" />
      <label htmlFor={`${id}-text`} className="sr-only">
        {t('Превью мәтіні')}
      </label>
      <input
        id={`${id}-text`}
        className="h-full min-w-0 flex-1 bg-transparent px-1 text-base text-fg outline-none sm:px-2.5"
        value={state.text}
        placeholder={t('Мәтін жазыңыз')}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => onChange({ text: e.target.value })}
      />
      {state.text && (
        <button type="button" className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-fg-3 hover:text-fg" onClick={() => onChange({ text: '' })} aria-label={t('Мәтінді тазалау')}>
          <Icon name="x" size={15} />
        </button>
      )}

      <Divider />
      <div ref={pangramRef} className="relative shrink-0">
        <button
          type="button"
          className={`${ctl} gap-1.5 font-medium text-fg-2`}
          aria-haspopup="listbox"
          aria-expanded={menu === 'pangram'}
          aria-label={t('Панграмма')}
          onClick={() => setMenu((m) => (m === 'pangram' ? null : 'pangram'))}
        >
          <span className="hidden max-w-28 truncate sm:inline">{custom ? t('Өз мәтінім') : t(PANGRAM_SHORT[Math.max(0, pangramIndex)])}</span>
          <Icon name="chevronDown" size={14} strokeWidth={2.2} className={`transition-transform ${menu === 'pangram' ? 'rotate-180' : ''}`} />
        </button>
        {menu === 'pangram' && (
          <>
            <div className="pop-scrim fixed inset-0 z-[68]" onClick={() => setMenu(null)} aria-hidden="true" />
            <div role="listbox" aria-label={t('Панграмма')} className="pop absolute top-[calc(100%+8px)] right-0 z-[70] w-[290px]">
              <p className="px-2.5 pt-1 pb-1.5 text-[17px] font-[650] sm:hidden">{t('Панграмма')}</p>
              {PANGRAMS.map((p, i) => (
                <button
                  key={p.label}
                  type="button"
                  role="option"
                  aria-selected={i === Math.max(0, pangramIndex) && !custom}
                  className="pop-item min-h-[52px]"
                  onClick={() => {
                    onChange({ text: i === 0 ? '' : p.text });
                    setMenu(null);
                  }}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block">{t(p.label)}</span>
                    <span className="block truncate text-xs font-normal text-fg-3">{p.text}</span>
                  </span>
                  <Icon name="check" size={16} strokeWidth={2.6} className={`shrink-0 text-accent-ink ${i === Math.max(0, pangramIndex) && !custom ? '' : 'invisible'}`} />
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Divider />
      <button type="button" className={`${ctl} min-w-[52px] font-semibold text-fg`} onClick={() => onChange({ textCase: nextCase })} aria-label={`${t('Әріп регистрі')}: ${t(caseName)}`} title={t(caseName)}>
        {caseShort}
      </button>

      <Divider />
      {/* Size: a slider on larger screens, a popover on phones. */}
      <div className="hidden w-[210px] shrink-0 items-center gap-3 pr-2.5 pl-2 sm:flex">
        <Range min={min} max={max} value={state.size} onChange={(size) => onChange({ size })} className="flex-1" label={t('Қаріп өлшемі')} />
        <span className="min-w-11 text-right text-sm font-medium text-fg-2 tabular-nums">{state.size} px</span>
      </div>
      <div ref={sizeRef} className="relative shrink-0 sm:hidden">
        <button type="button" className={`${ctl} min-w-12 font-semibold text-fg tabular-nums`} aria-haspopup="dialog" aria-expanded={menu === 'size'} aria-label={`${t('Қаріп өлшемі')}: ${state.size}px`} onClick={() => setMenu((m) => (m === 'size' ? null : 'size'))}>
          {state.size}
        </button>
        {menu === 'size' && (
          <>
            <div className="pop-scrim fixed inset-0 z-[68]" onClick={() => setMenu(null)} aria-hidden="true" />
            <div role="dialog" aria-label={t('Қаріп өлшемі')} className="pop absolute top-[calc(100%+10px)] right-0 z-[70] flex w-[300px] flex-col gap-4 !p-3.5">
              <div className="flex items-baseline justify-between px-1.5">
                <b className="text-[17px] font-[650]">{t('Өлшем')}</b>
                <span className="text-[15px] font-medium text-fg-2 tabular-nums">{state.size} px</span>
              </div>
              <Range min={min} max={max} value={state.size} onChange={(size) => onChange({ size })} className="mx-1.5 h-11" label={t('Қаріп өлшемі')} />
              <div role="group" aria-label={t('Жылдам өлшемдер')} className="grid grid-cols-5 gap-1.5">
                {quick.map((v) => (
                  <button key={v} type="button" aria-pressed={v === state.size} onClick={() => onChange({ size: v })} className={`h-11 rounded-xl text-[15px] font-medium tabular-nums ${v === state.size ? 'bg-accent text-on-accent' : 'bg-fill text-fg'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {showView && (
        <>
          <span className="hidden sm:contents">
            <Divider />
          </span>
          <div role="group" aria-label={t('Көрініс')} className="hidden shrink-0 gap-0.5 sm:flex">
            {(
              [
                ['list', 'list', 'Тізім'],
                ['grid', 'grid', 'Карточкалар'],
              ] as const
            ).map(([view, icon, label]) => (
              <button
                key={view}
                type="button"
                aria-pressed={state.view === view}
                aria-label={t(label)}
                title={t(label)}
                onClick={() => onChange({ view })}
                className={`inline-flex size-[38px] items-center justify-center rounded-[10px] transition-colors ${state.view === view ? 'bg-fill-2 text-fg' : 'text-fg-3 hover:text-fg'}`}
              >
                <Icon name={icon} size={17} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
