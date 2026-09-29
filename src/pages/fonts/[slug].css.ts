import type { APIRoute, GetStaticPaths } from 'astro';
import { getCollection } from 'astro:content';
import { publicCss } from '../../lib/fonts';

export const getStaticPaths = (async () => (await getCollection('fonts')).map((font) => ({ params: { slug: font.id }, props: { font } }))) satisfies GetStaticPaths;

/** Hosted stylesheet: <link rel="stylesheet" href="<site>/fonts/<slug>.css"> */
export const GET: APIRoute = ({ props, site }) =>
  new Response(`/* ${props.font.data.name} — ${new URL(`/fonts/${props.font.id}`, site)} */\n${publicCss(props.font, site!)}\n`, {
    headers: { 'Content-Type': 'text/css; charset=utf-8' },
  });
