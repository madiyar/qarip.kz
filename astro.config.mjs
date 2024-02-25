import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import netlify from "@astrojs/netlify";

// https://astro.build/config
export default defineConfig({
  site: 'https://qarip.kz',
  output: 'hybrid',
  adapter: netlify(),
  // output: 'hybrid',
  // vite: {
  //   ssr: {
  //     noExternal: ['path-to-regexp'],
  //   },
  // },
  integrations: [tailwind(), react(), mdx()]
});
