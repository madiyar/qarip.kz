import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { LANGS } from '../i18n';
import { byPopularity } from '../lib/downloads';
import { categoryInfo, getFonts, toSummaries } from '../lib/fonts';

/** Data for the site search (src/components/search/SearchDialog.tsx), most popular fonts first. */
export const GET: APIRoute = async () => {
  const fonts = (await toSummaries(await getFonts())).sort(byPopularity);
  const designers = await getCollection('designers');
  const categories = await getCollection('categories');
  const body = {
    fonts: fonts.map((f) => ({ s: f.slug, n: f.name, d: f.designers.map((d) => d.name).join(', '), o: f.our, c: f.category.id })),
    designers: designers
      .map((d) => ({ s: d.id, n: d.data.name, k: fonts.filter((f) => f.designers.some((x) => x.slug === d.id)).length }))
      .filter((d) => d.k > 0),
    categories: categories.map((c) => ({ id: c.id, label: Object.fromEntries(LANGS.map((l) => [l, categoryInfo(l, c).label])) })),
  };
  return new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
