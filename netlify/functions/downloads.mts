/**
 * Real download counter (Netlify Function + Netlify Blobs).
 *
 *   GET  /api/downloads        → { "<font slug>": count, … }
 *   POST /api/downloads/<slug> → counts one download of that font
 *
 * The site sends the POST when someone clicks a download button (src/lib/downloads.ts).
 * All counts live in one JSON blob; writes use the blob's ETag so that two downloads
 * at the same moment cannot overwrite each other. Nothing about the visitor is stored.
 */
import { getStore } from '@netlify/blobs';
import type { Config, Context } from '@netlify/functions';

type Counts = Record<string, number>;

const KEY = 'counts';
const SLUG = /^[a-z0-9][a-z0-9-]{0,99}$/;
/** Repeated clicks from one address on one font are counted once per this window (best effort, per function instance). */
const REPEAT_MS = 10 * 60 * 1000;
const recent = new Map<string, number>();
const known = new Set<string>();

const json = (body: unknown, init: ResponseInit = {}) =>
  new Response(JSON.stringify(body), { ...init, headers: { 'content-type': 'application/json; charset=utf-8', ...init.headers } });

/** Only fonts that exist on the site are counted: each has a public font.json. */
async function fontExists(slug: string, req: Request): Promise<boolean> {
  if (known.has(slug)) return true;
  const ok = await fetch(new URL(`/fonts/${slug}/font.json`, req.url), { method: 'HEAD' }).then((r) => r.ok, () => false);
  if (ok) known.add(slug);
  return ok;
}

export default async (req: Request, context: Context) => {
  const store = getStore({ name: 'downloads', consistency: 'strong' });

  if (req.method === 'GET') {
    const counts = ((await store.get(KEY, { type: 'json' })) ?? {}) as Counts;
    return json(counts, {
      headers: {
        'cache-control': 'public, max-age=60',
        'netlify-cdn-cache-control': 'public, s-maxage=60, stale-while-revalidate=600',
      },
    });
  }

  const slug = context.params.slug ?? '';
  if (!SLUG.test(slug)) return json({ error: 'invalid font' }, { status: 400 });
  if (!(await fontExists(slug, req))) return json({ error: 'unknown font' }, { status: 404 });

  const now = Date.now();
  const visitor = `${context.ip}|${slug}`;
  if (now - (recent.get(visitor) ?? 0) < REPEAT_MS) return json({ slug, counted: false });
  recent.set(visitor, now);
  if (recent.size > 5000) for (const [k, t] of recent) if (now - t >= REPEAT_MS) recent.delete(k);

  for (let attempt = 0; attempt < 10; attempt++) {
    const current = await store.getWithMetadata(KEY, { type: 'json' });
    const counts: Counts = { ...(current?.data as Counts | undefined) };
    counts[slug] = (counts[slug] ?? 0) + 1;
    // Conditional write: fails (and is retried) if another download changed the blob in between.
    // Without an ETag (the local test server sends none) it falls back to a plain write.
    const write = !current
      ? await store.setJSON(KEY, counts, { onlyIfNew: true })
      : current.etag
        ? await store.setJSON(KEY, counts, { onlyIfMatch: current.etag })
        : await store.setJSON(KEY, counts);
    if (write.modified) return json({ slug, counted: true, downloads: counts[slug] });
    await new Promise((r) => setTimeout(r, 20 + Math.random() * 80));
  }
  return json({ error: 'busy, try again' }, { status: 503 });
};

export const config: Config = {
  path: ['/api/downloads', '/api/downloads/:slug'],
  method: ['GET', 'POST'],
};
