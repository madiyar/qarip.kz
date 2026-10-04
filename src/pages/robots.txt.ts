import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /admin/',
      'Disallow: /profile/',
      'Disallow: /ru/profile/',
      'Disallow: /en/profile/',
      '',
      `Sitemap: ${new URL('/sitemap-index.xml', site)}`,
      `Host: ${site!.host}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
