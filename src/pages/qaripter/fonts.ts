export const prerender = false;
import queryString from 'query-string';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ request }) => {
  const { query } = queryString.parseUrl(request.url, { arrayFormat: 'comma' });

  const fonts = (await getCollection('qaripter')).sort(
    (a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf()
  ).map(({ body, ...item}) => item);

  const tags = (Array.isArray(query?.tags) ? query?.tags : [query?.tags]).filter(Boolean);

  const data = fonts.filter(font => {
    if (Array.isArray(tags) && tags.length) {
      return font.data.tags.some(tag => tags.includes(tag));
    }
    return true;
  });

  return {
    body: JSON.stringify({ query: { tags }, data }, null, 2),
  };
}
