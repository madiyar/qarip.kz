import { useSyncExternalStore } from 'react';

/**
 * Personal data lives in this browser only (localStorage): favorites,
 * download history and user catalogs. Nothing is sent to a server.
 */
export interface Catalog {
  id: string;
  name: string;
  fonts: string[];
  createdAt: string;
}
export interface DownloadRecord {
  slug: string;
  at: string;
}
interface State {
  favorites: string[];
  downloads: DownloadRecord[];
  catalogs: Catalog[];
}

const KEY = 'qarip:v2';
const EMPTY: State = { favorites: [], downloads: [], catalogs: [] };
const listeners = new Set<() => void>();
let cache: State | null = null;

function read(): State {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(next: State) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function useStore(): State {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export const store = {
  toggleFavorite(slug: string) {
    const s = read();
    const favorites = s.favorites.includes(slug) ? s.favorites.filter((x) => x !== slug) : [slug, ...s.favorites];
    write({ ...s, favorites });
  },
  recordDownload(slug: string) {
    const s = read();
    write({ ...s, downloads: [{ slug, at: new Date().toISOString() }, ...s.downloads].slice(0, 200) });
  },
  clearDownloads() {
    write({ ...read(), downloads: [] });
  },
  createCatalog(name: string, fonts: string[] = []): Catalog {
    const s = read();
    const catalog = { id: Math.random().toString(36).slice(2, 10), name, fonts, createdAt: new Date().toISOString() };
    write({ ...s, catalogs: [...s.catalogs, catalog] });
    return catalog;
  },
  renameCatalog(id: string, name: string) {
    const s = read();
    write({ ...s, catalogs: s.catalogs.map((c) => (c.id === id ? { ...c, name } : c)) });
  },
  deleteCatalog(id: string) {
    const s = read();
    write({ ...s, catalogs: s.catalogs.filter((c) => c.id !== id) });
  },
  toggleInCatalog(id: string, slug: string) {
    const s = read();
    write({
      ...s,
      catalogs: s.catalogs.map((c) =>
        c.id === id ? { ...c, fonts: c.fonts.includes(slug) ? c.fonts.filter((x) => x !== slug) : [...c.fonts, slug] } : c,
      ),
    });
  },
};

/** Small persisted UI preference (preview text, size…), per browser. */
export function loadPref<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`qarip:pref:${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
export function savePref(key: string, value: unknown) {
  try {
    localStorage.setItem(`qarip:pref:${key}`, JSON.stringify(value));
  } catch {}
}
