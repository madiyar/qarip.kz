import { useEffect, useState } from 'react';
import { loadPref, savePref } from '../../lib/store';
import type { PreviewState } from './PreviewToolbar';

const TEXT_KEY = 'preview-text';
const SIZE_KEY = 'preview-size';

/** Default sizes [phone, ≥ 768px]; they match --pv-list / --pv-detail in global.css. */
const LIST_SIZES = [18, 24] as const;
const DETAIL_SIZES = [32, 48] as const;
const wide = () => window.innerWidth >= 768;

/** Text and size are shared by every font list, on every page. */
type Shared = Pick<PreviewState, 'text' | 'size'>;
const listeners = new Set<(s: Partial<Shared>) => void>();
const broadcast = (next: Partial<Shared>) => listeners.forEach((l) => l(next));

/** Shows a list that Base.astro hid until its saved preview settings were applied. */
function unmark(key: string) {
  const root = document.documentElement;
  const left = (root.dataset.pvWait ?? '').split(' ').filter((k) => k && k !== key);
  if (left.length) root.dataset.pvWait = left.join(' ');
  else delete root.dataset.pvWait;
}

/**
 * Preview controls state.
 * - text and size: one value for the whole site, kept in sync live between the
 *   lists on a page and remembered in the browser;
 * - case and view: remembered per `key`.
 * Pass `ownSize` for a list with its own size (the font page shows styles larger).
 *
 * Samples take their size from CSS variables (--pv-list, --pv-detail), which an inline script
 * sets from the saved values before the first paint; `update` changes them. So the server markup
 * already has the right size and nothing jumps when the island hydrates.
 */
export function usePreview(key: string, initial: PreviewState, ownSize = false) {
  const [state, setState] = useState<PreviewState>(initial);
  const [ready, setReady] = useState(false);

  // Restore after hydration so server and client render the same markup first.
  useEffect(() => {
    const saved = loadPref<Partial<PreviewState>>(key, {});
    const [phone, desktop] = ownSize ? DETAIL_SIZES : LIST_SIZES;
    const fallback = wide() ? desktop : phone;
    const size = ownSize ? (saved.size ?? fallback) : loadPref<number>(SIZE_KEY, fallback);
    setState((s) => ({ ...s, textCase: saved.textCase ?? s.textCase, view: saved.view ?? s.view, size, text: loadPref<string>(TEXT_KEY, '') }));
    setReady(true);
    const onShared = (next: Partial<Shared>) => setState((s) => ({ ...s, ...(ownSize ? { text: next.text ?? s.text } : next) }));
    listeners.add(onShared);
    return () => void listeners.delete(onShared);
  }, [key]);

  // Runs after the restored state is on screen.
  useEffect(() => {
    if (ready) unmark(key);
  }, [ready, key]);

  const update = (next: Partial<PreviewState>) => {
    setState((s) => {
      const merged = { ...s, ...next };
      savePref(key, ownSize ? { textCase: merged.textCase, view: merged.view, size: merged.size } : { textCase: merged.textCase, view: merged.view });
      return merged;
    });
    if (next.size !== undefined) document.documentElement.style.setProperty(ownSize ? '--pv-detail' : '--pv-list', `${next.size}px`);
    const shared: Partial<Shared> = {};
    if (next.text !== undefined) {
      shared.text = next.text;
      savePref(TEXT_KEY, next.text);
    }
    if (next.size !== undefined && !ownSize) {
      shared.size = next.size;
      savePref(SIZE_KEY, next.size);
    }
    if (Object.keys(shared).length) broadcast(shared);
  };
  return [state, update] as const;
}
