import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Public site URL — the only place to change the domain (e.g. back to https://qarip.kz).
 * Can also be overridden with the SITE_URL environment variable (Netlify → Environment variables).
 * Everything else reads it via Astro.site / import.meta.env.SITE.
 */
const SITE_URL = process.env.SITE_URL || 'https://qarip.netlify.app';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  trailingSlash: 'ignore',
  i18n: {
    locales: ['kk', 'ru', 'en'],
    defaultLocale: 'kk',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [react(), mdx(), sitemap({ i18n: { defaultLocale: 'kk', locales: { kk: 'kk-KZ', ru: 'ru', en: 'en' } }, filter: (page) => !/\/(profile|404)\/?$/.test(page) })],
  vite: {
    plugins: [tailwindcss()],
  },
});
