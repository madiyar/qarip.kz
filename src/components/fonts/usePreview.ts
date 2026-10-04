import { useEffect, useState } from 'react';
import { loadPref, savePref } from '../../lib/store';
import type { PreviewState } from './PreviewToolbar';

const TEXT_KEY = 'preview-text';
const SIZE_KEY = 'preview-size';
const MOBILE_SIZE = 18;
const DESKTOP_SIZE = 24;

/** Preview text and size are shared by every font list, on every page. */
type Shared = Pick<PreviewState, 'text' | 'size'>;
const listeners = new Set<(s: Partial<Shared>) => void>();
const broadcast = (next: Partial<Shared>) => listeners.forEach((l) => l(next));

const defaultSize = () => (window.innerWidth < 768 ? MOBILE_SIZE : DESKTOP_SIZE);

/**
 * Preview controls state.
 * - text and size: one value for the whole site, kept in sync live between the
 *   lists on a page (e.g. the home page sections) and remembered in the browser;
 * - case and view: remembered per `key`.
 * Pass `ownSize` for a list that needs its own size (the font page shows styles larger).
 */
export function usePreview(key: string, initial: PreviewState, ownSize = false) {
  const [state, setState] = useState<PreviewState>(initial);

  // Restore after hydration so server and client render the same markup first.
  useEffect(() => {
    const saved = loadPref<Partial<PreviewState>>(key, {});
    const size = ownSize ? (saved.size ?? (window.innerWidth < 768 ? MOBILE_SIZE : initial.size)) : loadPref<number>(SIZE_KEY, defaultSize());
    setState((s) => ({ ...s, textCase: saved.textCase ?? s.textCase, view: saved.view ?? s.view, size, text: loadPref<string>(TEXT_KEY, '') }));
    const onShared = (next: Partial<Shared>) => setState((s) => ({ ...s, ...(ownSize ? { text: next.text ?? s.text } : next) }));
    listeners.add(onShared);
    return () => void listeners.delete(onShared);
  }, [key]);

  const update = (next: Partial<PreviewState>) => {
    setState((s) => {
      const merged = { ...s, ...next };
      savePref(key, ownSize ? { textCase: merged.textCase, view: merged.view, size: merged.size } : { textCase: merged.textCase, view: merged.view });
      return merged;
    });
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
