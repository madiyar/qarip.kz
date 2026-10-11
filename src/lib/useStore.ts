import { useSyncExternalStore } from 'react';
import { EMPTY_STATE, readState, subscribe } from './store';

/** Favourites, download history and catalogs as React state (kept in sync across tabs). */
export function useStore() {
  return useSyncExternalStore(subscribe, readState, () => EMPTY_STATE);
}
