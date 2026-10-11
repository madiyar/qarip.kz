import { type CollectionEntry, getCollection } from 'astro:content';

export type Post = CollectionEntry<'journal'>;

/** Published articles, newest first. */
export async function getPosts(): Promise<Post[]> {
  return (await getCollection('journal', (p) => !p.data.draft)).sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

/** Minutes to read at ~180 words a minute (at least 1). */
export function readingMinutes(post: Post): number {
  const words = (post.body ?? '').replace(/[#>*_`[\]()!-]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

/** "Сс" from "Сызықша түрлері": the cover glyph of an article without a cover image. */
export function postGlyph(post: Post): string {
  const c = [...post.data.title.trim()][0] ?? 'A';
  return `${c.toUpperCase()}${c.toLowerCase()}`;
}
