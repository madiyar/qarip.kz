import type { APIRoute } from 'astro';
import { renderOg } from '../lib/og';

/** Default social preview image for the whole site. */
export const GET: APIRoute = async ({ site }) =>
  new Response(
    new Uint8Array(await renderOg({ title: 'Қазақша шрифттер', subtitle: 'Казахские шрифты · Kazakh fonts · тегін жүктеу', footer: site!.host })),
    { headers: { 'Content-Type': 'image/png' } },
  );
