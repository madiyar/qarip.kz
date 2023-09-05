import dayjs from 'dayjs';
import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import NetlifyCMS from 'astro-netlify-cms';

// https://astro.build/config
export default defineConfig({
  integrations: [
    tailwind(),
    react(),
    mdx(),
    NetlifyCMS({
      config: {
        backend: {
          name: 'git-gateway',
          branch: 'main',
        },
        publish_mode: 'editorial_workflow',
        media_folder: "src/assets",
        public_folder: "/src/assets",
        collections: [
          // Define a blog post collection
          {
            name: 'blog',
            label: 'Мақала',
            identifier_field: 'url',
            folder: 'src/content/blog',
            create: true,
            delete: true,
            slug: '{{slug}}',
            fields: [
              { name: 'url', widget: 'string', label: 'URL' },
              { name: 'title', widget: 'string', label: 'Title' },
              { name: 'cover', widget: 'image', label: 'Постер', },
              { name: "pubDate", widget: 'hidden', label: 'Publish Date', default: `${dayjs().format('YYYY-MM-DD')}` },
              { name: 'body', widget: 'markdown', label: 'Post Body' },
            ],
          },
          // Content collections
        ],
        previewStyles: [
          'https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;500;600;700&display=swap',
          // ['* { font-family: "Geologica", sans-serif }', { raw: true }],
          // ['img { width: 100% }', { raw: true }],
        ],
      },
    }),
  ]
});
