import { useEffect, useState } from 'react';
import { loadPref, savePref } from '../../lib/store';
import type { PreviewState } from './PreviewToolbar';

/** Preview controls state, remembered per browser under `key`. */
export function usePreview(key: string, initial: PreviewState) {
  const [state, setState] = useState<PreviewState>(initial);
  // Restore after hydration so server and client render the same markup first.
  useEffect(() => {
    setState((s) => ({ ...s, ...loadPref<Partial<PreviewState>>(key, {}) }));
  }, [key]);
  const update = (next: Partial<PreviewState>) =>
    setState((s) => {
      const merged = { ...s, ...next };
      savePref(key, merged);
      return merged;
    });
  return [state, update] as const;
}
