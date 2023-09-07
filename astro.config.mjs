import dayjs from 'dayjs';

import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import NetlifyCMS from 'astro-netlify-cms';

// https://astro.build/config
export default defineConfig({
  site: 'https://qarip.kz',
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
              { name: 'title', widget: 'string', label: 'Title' },
              { name: 'url', widget: 'string', label: 'URL' },
              { name: "pubDate", widget: 'datetime', label: 'Publish Date', default: `${dayjs().format('YYYY-MM-DD')}` },
              { name: 'author', widget: 'string', label: 'Авторы', required: false },
              { name: 'cover', widget: 'image', label: 'Постер', },
              { name: 'body', widget: 'markdown', label: 'Post Body' },
            ],
          },
          {
            name: 'typography',
            label: 'Типография',
            folder: 'src/content/typography',
            create: false,
            delete: false,
            slug: '{{slug}}',
            extension: 'json',
            fields: [
              {
                name: 'words',
                widget: 'list',
                label: 'Сөздер',
                label_singular: 'сөз',
                fields: [
                  { name: 'title', widget: 'string', label: 'Title' },
                  { name: 'description', widget: 'text', label: 'Description' },
                ]
              },
            ],
          },
          // Content collections
        ],
        previewStyles: [
          'https://fonts.googleapis.com/css2?family=Geologica:wght@300;400;500;600;700&display=swap',
          ['* { font-family: Geologica, sans-serif }', { raw: true }],
          ['img { width: 100% }', { raw: true }],
        ],
      },
    }),
  ]
});
