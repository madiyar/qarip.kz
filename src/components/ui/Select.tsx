import { type KeyboardEvent, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Icon from './Icon';

export interface SelectOption<V extends string | number = string> {
  value: V;
  label: ReactNode;
  /** Plain text used for type-ahead search when `label` is not a string. */
  text?: string;
  /** Second line in the list. */
  hint?: ReactNode;
}

interface Props<V extends string | number> {
  value: V;
  options: SelectOption<V>[];
  onChange: (value: V) => void;
  /** Accessible name of the control. */
  label: string;
  /** Shown on the button when no option matches `value`. */
  placeholder?: ReactNode;
  /** Classes for the button (defaults to the `chip` look). */
  className?: string;
  /** Open the list aligned to the right edge of the button. */
  alignRight?: boolean;
  /** Take the full width of the parent. */
  block?: boolean;
  disabled?: boolean;
}

/**
 * Drop-down list in the site's style (native <select> menus cannot be styled).
 * Keyboard: ↑/↓/Home/End move, Enter/Space choose, Esc closes, letters jump to an option.
 */
export default function Select<V extends string | number>({ value, options, onChange, label, placeholder, className = 'chip', alignRight = false, block = false, disabled = false }: Props<V>) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [flip, setFlip] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const index = options.findIndex((o) => o.value === value);
  const current = options[index];

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', close);
    list.current?.focus();
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  // Open to the left when the list would not fit on the right (e.g. a button near the edge on a phone).
  useLayoutEffect(() => {
    if (!open || alignRight || !list.current) return;
    if (list.current.getBoundingClientRect().right > document.documentElement.clientWidth - 8) setFlip(true);
  }, [open, alignRight]);

  const show = () => {
    setActive(Math.max(0, index));
    setFlip(false);
    setOpen(true);
  };
  const choose = (i: number) => {
    const o = options[i];
    if (o) onChange(o.value);
    setOpen(false);
    button.current?.focus();
  };
  const textOf = (o: SelectOption<V>) => (o.text ?? (typeof o.label === 'string' ? o.label : String(o.value))).toLowerCase();

  const onListKey = (e: KeyboardEvent) => {
    const last = options.length - 1;
    const moves: Record<string, number> = { ArrowDown: Math.min(last, active + 1), ArrowUp: Math.max(0, active - 1), Home: 0, End: last, PageDown: Math.min(last, active + 8), PageUp: Math.max(0, active - 8) };
    if (e.key in moves) {
      e.preventDefault();
      setActive(moves[e.key]);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(active);
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      if (e.key === 'Escape') e.preventDefault();
      setOpen(false);
      button.current?.focus();
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      const now = Date.now();
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + e.key.toLowerCase(), at: now };
      const hit = options.findIndex((o) => textOf(o).startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
    }
  };

  return (
    <div ref={root} className={`relative max-w-full ${block ? 'block' : 'inline-block'}`}>
      <button
        ref={button}
        type="button"
        className={`${className} max-w-full justify-between`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${id}-list`}
        aria-label={label}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={(e) => {
          if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
            e.preventDefault();
            show();
          }
        }}
      >
        <span className="truncate">{current ? current.label : placeholder}</span>
        <Icon name="chevronDown" size={14} className={`shrink-0 text-fg-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="pop-scrim fixed inset-0 z-[68]" onClick={() => setOpen(false)} aria-hidden="true" />}
      {open && (
        <ul
          ref={list}
          id={`${id}-list`}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${id}-${active}`}
          onKeyDown={onListKey}
          className={`pop absolute top-full z-[70] mt-2 max-h-80 w-max max-w-[min(22rem,calc(100vw-2rem))] min-w-full overflow-auto outline-none ${alignRight || flip ? 'right-0' : 'left-0'}`}
        >
          <li role="presentation" className="px-2.5 pt-1 pb-1.5 text-[17px] font-[650] sm:hidden">
            {label}
          </li>
          {options.map((o, i) => (
            <li
              key={String(o.value)}
              id={`${id}-${i}`}
              data-index={i}
              role="option"
              aria-selected={o.value === value}
              className={`pop-item cursor-pointer ${o.hint ? 'min-h-[52px]' : ''} ${i === active ? 'bg-fill' : ''}`}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(i)}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{o.label}</span>
                {o.hint && <span className="block truncate text-xs font-normal text-fg-3">{o.hint}</span>}
              </span>
              <Icon name="check" size={16} strokeWidth={2.6} className={`shrink-0 text-accent-ink ${o.value === value ? '' : 'invisible'}`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
