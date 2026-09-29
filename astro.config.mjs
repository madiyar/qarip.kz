import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://qarip.kz',
  trailingSlash: 'ignore',
  i18n: {
    locales: ['kk', 'en'],
    defaultLocale: 'kk',
    routing: { prefixDefaultLocale: false },
  },
  integrations: [react(), mdx(), sitemap({ i18n: { defaultLocale: 'kk', locales: { kk: 'kk-KZ', en: 'en' } } })],
  vite: {
    plugins: [tailwindcss()],
  },
});
