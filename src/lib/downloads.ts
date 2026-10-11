/**
 * Real download counts, kept by a Netlify Function (netlify/functions/downloads.mts)
 * in Netlify Blobs. The build bakes the counts into the pages (for sorting); pages then
 * fetch the live numbers once. Only the font slug is sent — nothing about the visitor.
 */
const API = '/api/downloads';

let pending: Promise<Record<string, number>> | null = null;

/** Live counts for every font, fetched once per page; empty when the API is unavailable (e.g. `astro dev`). */
export function fetchDownloads(): Promise<Record<string, number>> {
  pending ??= fetch(API, { headers: { accept: 'application/json' } })
    .then((r) => (r.ok && r.headers.get('content-type')?.includes('json') ? r.json() : {}))
    .catch(() => ({}));
  return pending;
}

/** Counts one download of a font. Fire-and-forget: it never delays or blocks the download itself. */
export function trackDownload(slug: string) {
  const url = `${API}/${encodeURIComponent(slug)}`;
  try {
    if (navigator.sendBeacon?.(url)) return;
    void fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
  } catch {}
}

/** Most downloaded first; equal counts go by quality, then by name. */
export const byPopularity = (a: { downloads: number; quality?: number; name: string }, b: { downloads: number; quality?: number; name: string }) =>
  b.downloads - a.downloads || (b.quality ?? 0) - (a.quality ?? 0) || a.name.localeCompare(b.name);
