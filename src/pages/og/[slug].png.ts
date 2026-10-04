import path from 'node:path';
import type { APIRoute, GetStaticPaths } from 'astro';
import { type CollectionEntry, getCollection, getEntry } from 'astro:content';
import { primaryStyle } from '../../lib/fonts';
import { renderOg } from '../../lib/og';

export const getStaticPaths = (async () => (await getCollection('fonts')).map((font) => ({ params: { slug: font.id }, props: { font } }))) satisfies GetStaticPaths;

/** Social preview for a font page: its name set in the font itself. */
export const GET: APIRoute = async ({ props, site }) => {
  const font = props.font as CollectionEntry<'fonts'>;
  const designer = await getEntry(font.data.designer);
  const png = await renderOg({
    title: font.data.name,
    titleFont: path.resolve('public', `.${decodeURIComponent(primaryStyle(font).file)}`),
    subtitle: `Қазақша шрифт · Казахский шрифт · ${designer?.data.name ?? ''}`,
    footer: site!.host,
  });
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
