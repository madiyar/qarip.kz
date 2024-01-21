export const prerender = false;
import type { APIRoute } from 'astro';
import queryString from 'query-string';
import { getCollection } from 'astro:content';

export const GET: APIRoute = async ({ params, request }) => {
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

  return new Response(
    JSON.stringify({
      body: { query: { tags }, data, query2: query, w: new URL(request.url).toString() },
      // body: JSON.stringify({}),
    })
  );
}
